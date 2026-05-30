const SETUP = {
  shopee: {
    color:  '#f05629', name: 'Shopee SG',   abbr: 'S', logo: 'pl-shopee',
    issue:  null, // fully configured
  },
  lazada: {
    color:  '#5a67f2', name: 'Lazada SG',   abbr: 'L', logo: 'pl-lazada',
    issue:  'Needs OAuth token',
  },
  tiktok: {
    color:  '#69c9d0', name: 'TikTok Shop', abbr: 'T', logo: 'pl-tiktok',
    issue:  'Needs Shop ID',
  },
};

export default function ConnectBanner({ platformStatus, apiErrors, onOpenSettings }) {
  const disconnected = Object.entries(platformStatus).filter(([, v]) => !v);
  const hasErrors    = Object.keys(apiErrors).length > 0;

  if (!disconnected.length && !hasErrors) return null;

  return (
    <div className="connect-banner">
      {disconnected.length > 0 && (
        <div className="connect-section">
          <div className="connect-heading">
            <span className="connect-icon">🔌</span>
            <div>
              <div className="connect-title">
                {disconnected.length} platform{disconnected.length > 1 ? 's' : ''} not connected
              </div>
              <div className="connect-sub">
                Open <strong>Platform Settings</strong> to enter your API credentials and connect each marketplace.
              </div>
            </div>
            <button className="btn btn-primary setup-btn" onClick={onOpenSettings}>
              ⚙ Platform Settings
            </button>
          </div>

          <div className="connect-cards">
            {disconnected.map(([key]) => {
              const s = SETUP[key];
              if (!s) return null;
              return (
                <div className="connect-card" key={key} style={{ '--platform-color': s.color }}>
                  <div className="connect-card-header">
                    <div className={`platform-logo ${s.logo}`}>{s.abbr}</div>
                    <div>
                      <div className="connect-card-name">{s.name}</div>
                      <div className="connect-card-status">{s.issue || 'Not connected'}</div>
                    </div>
                  </div>
                  <p className="connect-card-hint">
                    {key === 'tiktok' && 'The wizard will call the TikTok API to discover your Shop ID automatically.'}
                    {key === 'lazada' && 'The wizard will walk you through a one-click OAuth login to get your access token.'}
                    {key === 'shopee' && 'Check that all four Shopee credentials are set in your .env file.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasErrors && (
        <div className="api-errors">
          {Object.entries(apiErrors).map(([platform, msg]) => (
            <div className="api-error-row" key={platform}>
              <span className="api-error-platform">{SETUP[platform]?.name || platform}</span>
              <span className="api-error-msg">{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
