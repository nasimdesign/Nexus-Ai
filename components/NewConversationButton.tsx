import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function NewConversationButton({ onCreate }: { onCreate?: () => void }) {
  const { data: session } = useSession();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!session?.user?.id) return alert('Please sign in');
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/conversations/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id }) });
      if (!res.ok) {
        const err = await res.json();
        alert(err?.error || 'Could not create conversation');
      } else {
        const data = await res.json();
        onCreate?.();
        // Optionally navigate or set state
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <button className="btn-new-convo" onClick={handleCreate} disabled={creating}>
      {creating ? 'Creating...' : '+ New Chat'}
    </button>
  );
}
