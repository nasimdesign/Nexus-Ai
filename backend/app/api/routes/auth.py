"""
Auth API routes — login, signup, refresh, logout, me.
Now includes enhanced email verification, password reset, and Google OAuth integration.
"""
import logging
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from app.models.user import User
from app.services.email_service import (
    send_verification_email,
    send_password_reset_email,
    send_notification,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    token: str  # Google ID token from frontend


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    ai_model: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
    erpnext_url: str | None = None
    erpnext_api_key: str | None = None
    erpnext_api_secret: str | None = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,   # set True in production (HTTPS)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "is_verified": user.is_verified,
        "ai_model": user.ai_model,
        "has_openai_key": bool(user.openai_api_key),
        "has_anthropic_key": bool(user.anthropic_api_key),
        "has_google_key": bool(user.google_api_key),
        "has_erpnext": bool(user.erpnext_url),
        "created_at": user.created_at.isoformat(),
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
async def signup(data: SignupRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Register a new user with email and password.
    Sends verification email if email service is configured.
    """
    # Check duplicate
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send verification email
    try:
        await send_verification_email(user.email, user.id)
        logger.info(f"Verification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    _set_refresh_cookie(response, refresh_token)

    return AuthResponse(access_token=access_token, user=_user_dict(user))


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user with email and password.
    """
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    _set_refresh_cookie(response, refresh_token)

    return AuthResponse(access_token=access_token, user=_user_dict(user))


@router.post("/google", response_model=AuthResponse)
async def google_login(
    data: GoogleLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate or register user via Google OAuth.
    Verifies Google ID token and creates/updates user record.
    """
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        raise HTTPException(status_code=500, detail="Google auth libraries not installed")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            data.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        email = idinfo.get("email")
        name = idinfo.get("name") or email.split("@")[0]
        avatar_url = idinfo.get("picture")

        if not email:
            raise ValueError("No email in token")

    except Exception as e:
        logger.error(f"Invalid Google token: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Create new user from Google
        user = User(
            email=email,
            name=name,
            hashed_password=hash_password(uuid.uuid4().hex),  # No password for OAuth users
            avatar_url=avatar_url,
            is_verified=True,  # Google verified emails are pre-verified
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"New user created from Google OAuth: {email}")
    else:
        # Update avatar if changed
        if avatar_url:
            user.avatar_url = avatar_url
        user.is_verified = True
        await db.commit()

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    _set_refresh_cookie(response, refresh_token)

    return AuthResponse(access_token=access_token, user=_user_dict(user))


@router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Refresh access token using refresh token from cookie.
    """
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": user.id})
    new_refresh = create_refresh_token({"sub": user.id})
    _set_refresh_cookie(response, new_refresh)

    return {"access_token": access_token, "user": _user_dict(user)}


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing refresh token cookie.
    """
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    """
    return _user_dict(current_user)


@router.patch("/me")
async def update_me(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user's profile.
    """
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return _user_dict(current_user)


# ─── Email Verification ──────────────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify user email with verification token.
    """
    try:
        payload = decode_token(data.token)
        if payload.get("type") != "email_verification":
            raise ValueError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token")

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.is_verified:
            return {"message": "Email already verified"}

        user.is_verified = True
        user.updated_at = datetime.now(timezone.utc)
        await db.commit()

        logger.info(f"Email verified for user {user.email}")

        return {"message": "Email verified successfully"}

    except Exception as e:
        logger.error(f"Email verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")


@router.post("/resend-verification")
async def resend_verification(
    email: EmailStr,
    db: AsyncSession = Depends(get_db),
):
    """
    Resend verification email to user.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, verification email has been sent"}

    if user.is_verified:
        return {"message": "Email already verified"}

    try:
        await send_verification_email(user.email, user.id)
        logger.info(f"Verification email resent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")

    return {"message": "Verification email sent"}


# ─── Password Management ──────────────────────────────────────────────────────

@router.post("/password/reset-request")
async def request_password_reset(
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a password reset by email.
    Sends reset link to user's email (if exists).
    """
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    # Always return success to avoid email enumeration
    if user:
        try:
            await send_password_reset_email(user.email, user.id)
            logger.info(f"Password reset email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")

    return {"message": "If email exists, password reset link has been sent"}


@router.post("/password/reset-confirm")
async def confirm_password_reset(
    data: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm password reset with token and new password.
    """
    try:
        payload = decode_token(data.token)
        if payload.get("type") != "password_reset":
            raise ValueError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token")

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update password
        user.hashed_password = hash_password(data.new_password)
        user.updated_at = datetime.now(timezone.utc)
        await db.commit()

        logger.info(f"Password reset for user {user.email}")

        # Send confirmation email
        try:
            await send_notification(
                user.email,
                "Password Reset Successful",
                "Your password has been successfully reset. If you didn't make this change, please contact support.",
            )
        except Exception as e:
            logger.error(f"Failed to send password reset confirmation: {e}")

        return {"message": "Password reset successfully"}

    except Exception as e:
        logger.error(f"Password reset failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")


@router.post("/password/change")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change password for authenticated user.
    Requires current password for verification.
    """
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(data.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(f"Password changed for user {current_user.email}")

    # Send confirmation email
    try:
        await send_notification(
            current_user.email,
            "Password Changed",
            "Your password has been successfully changed.",
        )
    except Exception as e:
        logger.error(f"Failed to send password change confirmation: {e}")

    return {"message": "Password changed successfully"}
