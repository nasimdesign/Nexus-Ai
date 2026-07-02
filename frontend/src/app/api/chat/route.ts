import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const SYSTEM_PROMPT = `You are Nexus AI, an advanced AI assistant built for productivity, coding, and complex reasoning tasks. You are as capable as the best AI assistants.

## Your capabilities:
- **Coding**: Write, debug, refactor, and explain code in any programming language. Provide complete, working solutions.
- **Analysis**: Analyze data, documents, images, and complex problems with depth and clarity.
- **Writing**: Create professional documents, emails, reports, and creative content.
- **Productivity**: Help with task planning, project management, time tracking, and daily workflows.
- **Reasoning**: Solve complex multi-step problems with clear logical chains.

## Response format:
- Use clean, well-structured Markdown
- Use code blocks with language tags for all code (e.g. \`\`\`python, \`\`\`typescript)
- Use tables when presenting comparative data
- Use headers (##, ###) to organize long responses
- Use bullet points for lists
- Use bold for key terms and emphasis
- Be thorough but concise — don't pad responses with unnecessary filler
- When writing code, include comments explaining non-obvious logic
- If a question is ambiguous, address the most likely interpretation first, then note alternatives`

export async function POST(req: NextRequest) {
  try {
    const { messages, model, attachments } = await req.json()

    // Build messages array with system prompt
    const apiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ]

    // Process messages, including any attachment context
    for (const msg of messages) {
      let content = msg.content
      if (msg.attachments && msg.attachments.length > 0) {
        const attachmentContext = msg.attachments
          .map((a: any) => `[Attached file: ${a.name} (${a.type})]\n${a.content || "(binary file)"}`)
          .join("\n\n")
        content = `${content}\n\n--- Attached Files ---\n${attachmentContext}`
      }
      apiMessages.push({ role: msg.role, content })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      // Fallback to Pollinations if no API key
      return handlePollinationsFallback(apiMessages)
    }

    // Use OpenRouter API for powerful AI
    const selectedModel = model || "anthropic/claude-sonnet-4"
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nexus-ai.vercel.app",
        "X-Title": "Nexus AI",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: apiMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    })

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`OpenRouter API error ${response.status}: ${errorText}`)
      // Fall back to Pollinations
      return handlePollinationsFallback(apiMessages)
    }

    // Stream the response
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    ;(async () => {
      const reader = response.body!.getReader()
      let buf = ""
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split("\n")
          buf = lines.pop() ?? ""
          for (const line of lines) {
            const t = line.trim()
            if (!t || t === "data: [DONE]") continue
            if (t.startsWith("data: ")) {
              try {
                const json = JSON.parse(t.slice(6))
                const text = json.choices?.[0]?.delta?.content
                if (text) await writer.write(encoder.encode(text))
              } catch { /* skip */ }
            }
          }
        }
      } finally {
        await writer.close()
      }
    })()

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePollinationsFallback(messages: any[]) {
  try {
    const response = await fetch("https://text.pollinations.ai/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages,
        stream: true,
        max_tokens: 2048,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Fallback API error ${response.status}`)
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    ;(async () => {
      const reader = response.body!.getReader()
      let buf = ""
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split("\n")
          buf = lines.pop() ?? ""
          for (const line of lines) {
            const t = line.trim()
            if (!t || t === "data: [DONE]") continue
            if (t.startsWith("data: ")) {
              try {
                const json = JSON.parse(t.slice(6))
                const text = json.choices?.[0]?.delta?.content
                if (text) await writer.write(encoder.encode(text))
              } catch { /* skip */ }
            }
          }
        }
      } finally {
        await writer.close()
      }
    })()

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
