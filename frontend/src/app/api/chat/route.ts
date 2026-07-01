import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are Nexus AI, a smart productivity assistant. Answer concisely in clean Markdown. Use bullet points, bold, headers. Be direct and helpful.`

export async function POST(req: NextRequest) {
  try {
    const { messages, modelId } = await req.json()

    const allMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ]

    // Use Pollinations simple text endpoint — much faster than the chat/completions path
    const lastMsg = messages[messages.length - 1]?.content ?? ""
    const context = messages.slice(-6) // only last 6 messages for speed

    const response = await fetch("https://text.pollinations.ai/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...context],
        stream: true,
        max_tokens: 600,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`API error ${response.status}`)
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
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
