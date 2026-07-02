import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([] as any[]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/projects?userId=${session.user.id}`).then((r) => r.json()).then(setProjects);
  }, [session]);

  async function create() {
    if (!session?.user?.id) return alert('Please sign in');
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id, title, description: desc }) });
    if (res.ok) {
      setTitle('');
      setDesc('');
      const p = await res.json();
      setProjects((s) => [p, ...s]);
    } else {
      alert('Failed to create');
    }
  }

  return (
    <div className="projects container">
      <h1>Projects</h1>
      <div className="new-project">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
        <button onClick={create}>Create</button>
      </div>
      <div className="list">
        {projects.map((p) => (
          <div key={p.id} className="project-item">
            <h3>{p.title}</h3>
            <p>{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
