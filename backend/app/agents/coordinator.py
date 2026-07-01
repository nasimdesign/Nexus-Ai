"""
Coordinator agent — routes user messages to the right specialist agent
and assembles the final response.
"""
from typing import AsyncIterator
import anthropic
from app.core.config import settings


SYSTEM_PROMPT = """You are Nexus AI, a premium AI work assistant for ERPNext.

You help the user with:
- Daily work planning and prioritization
- Task management and tracking
- Timesheet generation and ERP submission
- Stand-up report generation
- Meeting notes and action items
- ERPNext queries and record creation
- Productivity analytics and insights
- Document and email drafting

The user is Nasim, a Product Designer at DXBitz who works on:
- dxPOS v3 (point-of-sale redesign)
- Nexus AI (this product)
- HR Module UI for ERPNext

Today's date: {date}

Always be concise, actionable, and professional. Use markdown formatting.
When generating timesheets or stand-ups, format them as structured tables or lists.
"""


class CoordinatorAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def stream_response(
        self, message: str, conversation_history: list[dict]
    ) -> AsyncIterator[str]:
        from datetime import date
        system = SYSTEM_PROMPT.format(date=date.today().isoformat())

        messages = conversation_history[-20:] + [{"role": "user", "content": message}]

        with self.client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield text

    async def complete(self, message: str, conversation_history: list[dict]) -> str:
        from datetime import date
        system = SYSTEM_PROMPT.format(date=date.today().isoformat())
        messages = conversation_history[-20:] + [{"role": "user", "content": message}]

        response = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        return response.content[0].text


coordinator = CoordinatorAgent()
