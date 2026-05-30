import { useState, useEffect } from 'react';

export default function Topbar({ onToggleSidebar, onSync, onExport }) {
  const [syncing, setSyncing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('just now');

  useEffect(() => {
    const id = setInterval(() => {
      setUpdatedAt(new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setUpdatedAt('just now');
      onSync?.();
    }, 1800);
  }

  return (
    <header className="topbar">
      <button className="hamburger" onClick={onToggleSidebar}>☰</button>
      <div className="topbar-heading">
        <div className="topbar-title">Orders Overview</div>
        <div className="topbar-sub">Last updated: {updatedAt}</div>
      </div>
      <div className="topbar-actions">
        <div className="live-badge">
          <div className="pulse" />
          Live
        </div>
        <button className="btn btn-ghost" onClick={onExport}>⬇ Export</button>
        <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
          {syncing ? '↻ Syncing…' : '↻ Sync Now'}
        </button>
      </div>
    </header>
  );
}
