export default function Topbar({ onToggleSidebar, onSync, onExport, lastSync, loading }) {
  const updatedAt = lastSync
    ? lastSync.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <header className="topbar">
      <button className="hamburger" onClick={onToggleSidebar}>☰</button>
      <div className="topbar-heading">
        <div className="topbar-title">Orders Overview</div>
        <div className="topbar-sub">Last synced: {loading ? 'syncing…' : updatedAt}</div>
      </div>
      <div className="topbar-actions">
        <div className="live-badge">
          <div className={loading ? 'pulse-loading' : 'pulse'} />
          {loading ? 'Syncing' : 'Live'}
        </div>
        <button className="btn btn-ghost" onClick={onExport}>⬇ Export</button>
        <button className="btn btn-primary" onClick={onSync} disabled={loading}>
          {loading ? '↻ Syncing…' : '↻ Sync Now'}
        </button>
      </div>
    </header>
  );
}
