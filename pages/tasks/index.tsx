import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TasksPage() {
  const { data: session } = useSession();
  const [projectId, setProjectId] = useState('');
  const [tasks, setTasks] = useState([] as any[]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  async function load() {
    if (!projectId) return;
    const res = await fetch(`/api/tasks?projectId=${projectId}`);
    if (res.ok) setTasks(await res.json());
  }

  async function create() {
    if (!projectId) return alert('Set projectId');
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, title, description: desc }) });
    if (res.ok) {
      setTitle('');
      setDesc('');
      const t = await res.json();
      setTasks((s) => [t, ...s]);
    } else alert('Failed');
  }

  return (
    <div className="tasks container">
      <h1>Tasks</h1>
      <div className="controls">
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project ID (for now)" />
        <button onClick={load}>Load</button>
      </div>
      <div className="new-task">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
        <button onClick={create}>Create task</button>
      </div>
      <div className="list">
        {tasks.map((t) => (
          <div key={t.id} className="task-item">
            <h3>{t.title}</h3>
            <p>{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
