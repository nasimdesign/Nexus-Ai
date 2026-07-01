"""
Chat API — streaming, history, rename, delete, pin.
Uses SSE (Server-Sent Events) for real-time token streaming.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import Conversation, ChatMessage
from app.services.ai_service import stream_chat, generate_title
from app.services.tool_service import execute_tool

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    conversation_id: str | None = None
    content: str
    model: str | None = None


class RenameRequest(BaseModel):
    title: str


# ─── Conversations ────────────────────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(and_(Conversation.user_id == current_user.id, Conversation.is_deleted == False))
        .order_by(Conversation.updated_at.desc())
    )
    convs = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "pinned": c.pinned,
            "model": c.model,
            "message_count": 0,  # could add a count subquery
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        }
        for c in convs
    ]


@router.get("/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conv_id,
                Conversation.user_id == current_user.id,
                Conversation.is_deleted == False,
            )
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv_id)
        .order_by(ChatMessage.created_at)
    )
    messages = msg_result.scalars().all()

    return {
        "conversation": {
            "id": conv.id,
            "title": conv.title,
            "pinned": conv.pinned,
            "model": conv.model,
        },
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
            if m.role in ("user", "assistant")
        ],
    }


@router.patch("/conversations/{conv_id}")
async def update_conversation(
    conv_id: str,
    data: RenameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(Conversation.id == conv_id, Conversation.user_id == current_user.id)
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    conv.title = data.title
    await db.commit()
    return {"id": conv.id, "title": conv.title}


@router.patch("/conversations/{conv_id}/pin")
async def pin_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(Conversation.id == conv_id, Conversation.user_id == current_user.id)
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    conv.pinned = not conv.pinned
    await db.commit()
    return {"id": conv.id, "pinned": conv.pinned}


@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(Conversation.id == conv_id, Conversation.user_id == current_user.id)
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    conv.is_deleted = True
    await db.commit()
    return {"deleted": True}


# ─── Streaming Chat ───────────────────────────────────────────────────────────

@router.post("/send")
async def send_message(
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message and stream the AI response via SSE.
    
    Response format (per line):
      data: {"type": "meta", "conversation_id": "...", "message_id": "..."}
      data: {"type": "text", "text": "token"}
      data: {"type": "tool_call", "tool": {...}}
      data: {"type": "tool_result", "result": {...}}
      data: [DONE]
    """
    # Get or create conversation
    if data.conversation_id:
        conv_result = await db.execute(
            select(Conversation).where(
                and_(
                    Conversation.id == data.conversation_id,
                    Conversation.user_id == current_user.id,
                    Conversation.is_deleted == False,
                )
            )
        )
        conv = conv_result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = Conversation(
            user_id=current_user.id,
            title=data.content[:50] + ("..." if len(data.content) > 50 else ""),
            model=data.model or current_user.ai_model,
        )
        db.add(conv)
        await db.flush()

    # Override model if specified in request
    if data.model:
        current_user.ai_model = data.model

    # Save user message
    user_msg = ChatMessage(
        conversation_id=conv.id,
        role="user",
        content=data.content,
    )
    db.add(user_msg)
    await db.commit()

    # Build message history for AI
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at)
        .limit(40)  # last 40 messages for context
    )
    history = history_result.scalars().all()

    ai_messages = [
        {"role": m.role, "content": m.content}
        for m in history
        if m.role in ("user", "assistant")
    ]

    # Create placeholder assistant message
    assistant_msg = ChatMessage(
        conversation_id=conv.id,
        role="assistant",
        content="",
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    conv_id = conv.id
    msg_id = assistant_msg.id
    full_content = []

    async def event_stream():
        nonlocal full_content

        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conv_id, 'message_id': msg_id})}\n\n"

        async for chunk in stream_chat(ai_messages, user=current_user):
            # Handle tool calls
            if '"type": "tool_call"' in chunk:
                try:
                    payload = json.loads(chunk.replace("data: ", "").strip())
                    tool_info = payload.get("tool", {})
                    tool_name = tool_info.get("name")
                    tool_args = tool_info.get("arguments", "{}")

                    if tool_name:
                        yield f"data: {json.dumps({'type': 'tool_call', 'tool_name': tool_name})}\n\n"

                        # Execute the tool
                        tool_result = await execute_tool(tool_name, tool_args, current_user.id, db)
                        result_data = json.loads(tool_result)

                        yield f"data: {json.dumps({'type': 'tool_result', 'tool_name': tool_name, 'result': result_data})}\n\n"

                        # Add tool result as a followup text
                        message_text = result_data.get("message", "")
                        if message_text:
                            full_content.append(message_text)
                            yield f"data: {json.dumps({'type': 'text', 'text': message_text})}\n\n"
                except Exception as e:
                    logger.error(f"Tool execution error: {e}")
            elif chunk == "data: [DONE]\n\n":
                yield chunk
            else:
                # Regular text chunk
                if chunk.startswith("data: "):
                    try:
                        payload = json.loads(chunk[6:].strip())
                        if payload.get("type") == "text":
                            full_content.append(payload["text"])
                    except Exception:
                        pass
                yield chunk

        # Save the full response to DB
        final_content = "".join(full_content)
        if final_content:
            async with db.begin_nested() if False else db.begin():
                await db.execute(
                    update(ChatMessage)
                    .where(ChatMessage.id == msg_id)
                    .values(content=final_content)
                )

        # Auto-generate title after first message
        if len(ai_messages) <= 2:
            title = await generate_title(data.content, user=current_user)
            await db.execute(
                update(Conversation)
                .where(Conversation.id == conv_id)
                .values(title=title)
            )
            await db.commit()
            yield f"data: {json.dumps({'type': 'title', 'title': title, 'conversation_id': conv_id})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
