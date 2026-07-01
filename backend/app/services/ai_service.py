"""
AI Service — multi-provider streaming with function calling.

Priority order for provider selection:
1. User's own API key (from DB settings)
2. Global env API key
3. Pollinations free API (zero-config fallback)
"""

import json
import logging
from typing import AsyncGenerator, Any
from openai import AsyncOpenAI
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Nexus AI, a premium productivity assistant tightly integrated with ERPNext.

You help the user:
- Plan their day and prioritize tasks
- Generate timesheets from their completed work
- Write daily stand-up updates
- Summarize meetings and extract action items
- Search their knowledge base
- Manage tasks and projects in ERPNext

You have access to tools (functions) you can call to take real actions.

When the user asks you to DO something (create a task, generate a timesheet, etc.), 
ALWAYS use the appropriate tool instead of just describing what you would do.

Be concise, professional, and action-oriented. Format responses in clean Markdown.
"""

# Tool definitions for function calling
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task for the user",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Task title"},
                    "description": {"type": "string", "description": "Task description"},
                    "priority": {"type": "string", "enum": ["urgent", "high", "medium", "low"]},
                    "due_date": {"type": "string", "description": "Due date in YYYY-MM-DD format"},
                    "estimated_hours": {"type": "number"},
                    "project_name": {"type": "string", "description": "Project name to assign to"}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_pending_tasks",
            "description": "Get the user's current pending/open tasks",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_timesheet",
            "description": "Generate a timesheet for a specific date based on tasks and meetings",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format, defaults to today"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_standup",
            "description": "Generate a daily stand-up update based on yesterday and today's work",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_today_schedule",
            "description": "Get the user's meetings and tasks for today",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_knowledge",
            "description": "Search the user's knowledge base for relevant documents",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    },
]


def _build_client(user=None) -> AsyncOpenAI:
    """Build the best available OpenAI-compatible client for this user."""
    # 1. User's own Anthropic key → use Claude via Anthropic-compatible OpenAI SDK
    if user and user.anthropic_api_key:
        return AsyncOpenAI(
            api_key=user.anthropic_api_key,
            base_url="https://api.anthropic.com/v1",
        )
    # 2. User's own OpenAI key
    if user and user.openai_api_key:
        return AsyncOpenAI(api_key=user.openai_api_key)
    # 3. Global OpenAI key
    if settings.OPENAI_API_KEY:
        return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    # 4. Global Anthropic key
    if settings.ANTHROPIC_API_KEY:
        return AsyncOpenAI(
            api_key=settings.ANTHROPIC_API_KEY,
            base_url="https://api.anthropic.com/v1",
        )
    # 5. Free Pollinations fallback (no key required)
    return AsyncOpenAI(
        api_key="anonymous",
        base_url=settings.POLLINATIONS_URL,
    )


def _pick_model(user=None) -> str:
    """Pick the best model name for the selected provider."""
    if user:
        model = user.ai_model or "openai"
        # Map our internal model names to real API names
        model_map = {
            "claude-3-5-sonnet-20240620": "claude-3-5-sonnet-20240620",
            "gpt-4o": "gpt-4o",
            "gpt-4o-mini": "gpt-4o-mini",
            "gemini-1.5-pro-latest": "gemini-1.5-pro-latest",
            "openai": "openai",  # Pollinations
        }
        return model_map.get(model, "openai")
    return "openai"


async def stream_chat(
    messages: list[dict],
    user=None,
    tools: bool = True,
) -> AsyncGenerator[str, None]:
    """
    Stream a chat response token-by-token.
    Yields SSE-formatted strings: 'data: {"text": "..."}\n\n'
    """
    client = _build_client(user)
    model = _pick_model(user)

    # Prepend system message
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    try:
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": full_messages,
            "stream": True,
            "max_tokens": 4096,
        }
        # Only add tools for capable models
        if tools and not model.startswith("openai"):
            kwargs["tools"] = TOOLS
            kwargs["tool_choice"] = "auto"

        stream = await client.chat.completions.create(**kwargs)

        collected_tool_calls = {}
        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta is None:
                continue

            # Handle regular text tokens
            if delta.content:
                yield f"data: {json.dumps({'type': 'text', 'text': delta.content})}\n\n"

            # Handle tool call streaming
            if hasattr(delta, "tool_calls") and delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in collected_tool_calls:
                        collected_tool_calls[idx] = {"id": tc.id or "", "name": "", "arguments": ""}
                    if tc.function.name:
                        collected_tool_calls[idx]["name"] = tc.function.name
                    if tc.function.arguments:
                        collected_tool_calls[idx]["arguments"] += tc.function.arguments

        # Emit collected tool calls
        for tc in collected_tool_calls.values():
            yield f"data: {json.dumps({'type': 'tool_call', 'tool': tc})}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"AI stream error: {e}")
        error_msg = str(e)
        yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"
        yield "data: [DONE]\n\n"


async def generate_title(first_message: str, user=None) -> str:
    """Generate a short conversation title from the first user message."""
    client = _build_client(user)
    model = _pick_model(user)

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Generate a short, 4-6 word title summarizing this message. Return ONLY the title, no quotes or punctuation."},
                {"role": "user", "content": first_message[:500]}
            ],
            max_tokens=20,
            stream=False,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return first_message[:40] + ("..." if len(first_message) > 40 else "")


async def generate_embedding(text: str) -> list[float]:
    """Generate a text embedding for semantic search using free API or OpenAI."""
    if settings.OPENAI_API_KEY:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp = await client.embeddings.create(model="text-embedding-3-small", input=text[:8000])
        return resp.data[0].embedding
    # Fallback: use a simple hash-based pseudo-embedding (not semantic but functional)
    # In production, always set OPENAI_API_KEY for proper embeddings
    import hashlib
    h = hashlib.sha256(text.encode()).digest()
    return [b / 255.0 for b in h[:128]] * 3  # 384-dim pseudo embedding
