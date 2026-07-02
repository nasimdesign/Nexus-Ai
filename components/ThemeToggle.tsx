// Simple theme toggle component
import React from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') || 'system' : 'system'));

  React.useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ fontSize: 12 }}>Theme</label>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
