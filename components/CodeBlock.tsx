import React from 'react';

export default function CodeBlock({ code }: { code: string }) {
  // Simple parser to extract fenced code blocks or show text
  const fenceMatch = code.match(/```(\w+)?\n([\s\S]*?)```/);
  const language = fenceMatch?.[1] || 'text';
  const inner = fenceMatch?.[2] || code;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inner);
      alert('Copied');
    } catch (e) {
      alert('Copy failed');
    }
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="lang">{language}</span>
        <button onClick={copy}>Copy</button>
      </div>
      <pre>
        <code>{inner}</code>
      </pre>
    </div>
  );
}
