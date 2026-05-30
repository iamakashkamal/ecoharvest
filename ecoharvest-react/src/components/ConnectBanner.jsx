const SETUP = {
  shopee: {
    color:   '#f05629',
    name:    'Shopee SG',
    abbr:    'S',
    logo:    'pl-shopee',
    vars:    ['SHOPEE_PARTNER_ID', 'SHOPEE_PARTNER_KEY', 'SHOPEE_SHOP_ID', 'SHOPEE_ACCESS_TOKEN'],
    docsUrl: 'https://open.shopee.com/documents',
  },
  lazada: {
    color:   '#5a67f2',
    name:    'Lazada SG',
    abbr:    'L',
    logo:    'pl-lazada',
    vars:    ['LAZADA_APP_KEY', 'LAZADA_APP_SECRET', 'LAZADA_ACCESS_TOKEN'],
    docsUrl: 'https://open.lazada.com/apps/doc/doc.htm',
  },
  tiktok: {
    color:   '#69c9d0',
    name:    'TikTok Shop',
    abbr:    'T',
    logo:    'pl-tiktok',
    vars:    ['TIKTOK_APP_KEY', 'TIKTOK_APP_SECRET', 'TIKTOK_SHOP_ID', 'TIKTOK_ACCESS_TOKEN'],
    docsUrl: 'https://partner.tiktokshop.com/docv2/page/63fb572d46fbd603108d2ca3',
  },
};

export default function ConnectBanner({ platformStatus, apiErrors }) {
  const disconnected = Object.entries(platformStatus).filter(([, v]) => !v);
  if (!disconnected.length && !Object.keys(apiErrors).length) return null;

  return (
    <div className="connect-banner">
      {disconnected.length > 0 && (
        <div className="connect-section">
          <div className="connect-heading">
            <span className="connect-icon">🔌</span>
            <div>
              <div className="connect-title">Connect your platforms</div>
              <div className="connect-sub">
                Add credentials to your <code>.env</code> file and restart the server to pull live orders.
              </div>
            </div>
          </div>
          <div className="connect-cards">
            {disconnected.map(([key]) => {
              const s = SETUP[key];
              return (
                <div className="connect-card" key={key} style={{ '--platform-color': s.color }}>
                  <div className="connect-card-header">
                    <div className={`platform-logo ${s.logo}`}>{s.abbr}</div>
                    <div>
                      <div className="connect-card-name">{s.name}</div>
                      <div className="connect-card-status">Not connected</div>
                    </div>
                    <a className="connect-docs-link" href={s.docsUrl} target="_blank" rel="noreferrer">Docs ↗</a>
                  </div>
                  <div className="connect-vars">
                    {s.vars.map(v => (
                      <code key={v} className="connect-var">{v}</code>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.entries(apiErrors).length > 0 && (
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
