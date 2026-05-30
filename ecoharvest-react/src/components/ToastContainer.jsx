const ICONS   = { shopee: '🛒', lazada: '🏪', tiktok: '🎵', system: '🔔' };
const COLORS  = { shopee: '#f05629', lazada: '#5a67f2', tiktok: '#69c9d0', system: '#58a6ff' };

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div id="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast"
          style={{ borderLeftColor: COLORS[t.platform] || COLORS.system }}
        >
          <div className="toast-icon">{ICONS[t.platform] || ICONS.system}</div>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            <div className="toast-body">{t.body}</div>
          </div>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
