import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import NewConversationButton from './NewConversationButton';
import CodeBlock from './CodeBlock';

export default function ChatUI() {
  const { data: session } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function createConversation() {
    if (!session?.user?.id) return alert('Please sign in');
    const res = await fetch('/api/conversations/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id }) });
    if (!res.ok) {
      const err = await res.json();
      return alert(err?.error || 'Could not create conversation');
    }
    const data = await res.json();
    setConversationId(data.id);
    setMessages([]);
  }

  async function send() {
    if (!input.trim() || loading) return;
    if (!session?.user?.id) return alert('Please sign in');
    setLoading(true);
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, conversationId, messages: [...messages, userMsg] }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Chat error');
      }
      const data = await res.json();
      const ai = { role: 'assistant', content: data.message };
      setMessages((m) => [...m, ai]);
    } catch (e) {
      alert(String(e));
    } finally {
      setLoading(false);
      setInput('');
    }
  }

  return (
    <div className="chat-ui container">
      <div className="chat-controls">
        <NewConversationButton onCreate={createConversation} />
        <div className="spacer" />
      </div>
      <div className="messages">
        {messages.length === 0 && <div className="empty">No messages yet — start the conversation</div>}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.role === 'assistant' && <div className="avatar">AI</div>}
            <div className="bubble">
              {m.content.includes('```') ? <CodeBlock code={m.content} /> : <div>{m.content}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="composer">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Nexus anything..." />
        <button onClick={send} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  );
}
