import { useState, useEffect, useCallback } from 'react';

const PLATFORMS = [
  {
    key:   'shopee',
    name:  'Shopee SG',
    abbr:  'S',
    logo:  'pl-shopee',
    color: '#f05629',
    docsUrl: 'https://open.shopee.com/documents',
    fields: [
      { key: 'SHOPEE_PARTNER_ID',  label: 'Partner ID',    type: 'text',     hint: 'Found in Shopee Open Platform → My Apps' },
      { key: 'SHOPEE_PARTNER_KEY', label: 'Partner Key',   type: 'password', hint: 'Secret key from Shopee Open Platform' },
      { key: 'SHOPEE_SHOP_ID',     label: 'Shop ID',       type: 'text',     hint: 'Your Shopee shop ID' },
      { key: 'SHOPEE_ACCESS_TOKEN',label: 'Access Token',  type: 'password', hint: 'OAuth access token' },
    ],
    oauthUrl: null,
  },
  {
    key:   'lazada',
    name:  'Lazada SG',
    abbr:  'L',
    logo:  'pl-lazada',
    color: '#5a67f2',
    docsUrl: 'https://open.lazada.com/apps/doc/doc.htm',
    fields: [
      { key: 'LAZADA_APP_KEY',      label: 'App Key',      type: 'text',     hint: 'From Lazada Open Platform → My Apps' },
      { key: 'LAZADA_APP_SECRET',   label: 'App Secret',   type: 'password', hint: 'Secret key from Lazada Open Platform' },
      { key: 'LAZADA_ACCESS_TOKEN', label: 'Access Token', type: 'password', hint: 'Click "Connect via OAuth" to get this automatically' },
    ],
    oauthUrl: '/setup/lazada/connect',
  },
  {
    key:   'tiktok',
    name:  'TikTok Shop',
    abbr:  'T',
    logo:  'pl-tiktok',
    color: '#69c9d0',
    docsUrl: 'https://partner.tiktokshop.com/docv2/page/63fb572d46fbd603108d2ca3',
    fields: [
      { key: 'TIKTOK_APP_KEY',      label: 'App Key',      type: 'text',     hint: 'From TikTok Partner Center → My Apps' },
      { key: 'TIKTOK_APP_SECRET',   label: 'App Secret',   type: 'password', hint: 'Secret key from TikTok Partner Center' },
      { key: 'TIKTOK_SHOP_ID',      label: 'Shop ID',      type: 'text',     hint: 'Click "Discover Shop ID" to get this automatically' },
      { key: 'TIKTOK_ACCESS_TOKEN', label: 'Access Token', type: 'password', hint: 'OAuth access token from TikTok' },
    ],
    oauthUrl: null,
  },
];

function PlatformCard({ platform, connected, onSaved }) {
  const [values,  setValues]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState(null);
  const [discovering, setDiscovering] = useState(false);

  const handleChange = (key, val) => setValues(v => ({ ...v, [key]: val }));

  const handleSave = async () => {
    const payload = {};
    for (const [k, v] of Object.entries(values)) {
      if (v && v.trim()) payload[k] = v.trim();
    }
    if (!Object.keys(payload).length) {
      setMessage({ type: 'error', text: 'Enter at least one value to save.' });
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'ok', text: `Saved: ${data.saved.join(', ')}` });
        setValues({});
        onSaved?.();
      } else {
        setMessage({ type: 'error', text: data.error || 'Save failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setMessage(null);
    try {
      const res  = await fetch('/setup/tiktok/discover');
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'ok', text: `Shop ID ${data.shop_id} (${data.shop_name}) saved!` });
        onSaved?.();
      } else {
        setMessage({ type: 'error', text: data.error || 'Discovery failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleOAuth = () => {
    window.open(platform.oauthUrl, '_blank', 'width=600,height=700');
  };

  return (
    <div className={`settings-card ${connected ? 'settings-card--connected' : ''}`}
         style={{ '--platform-color': platform.color }}>
      <div className="settings-card-header">
        <div className={`platform-logo ${platform.logo}`}>{platform.abbr}</div>
        <div className="settings-card-title">
          <div className="card-title">{platform.name}</div>
          <div className="card-sub">
            {connected
              ? <span className="conn-ok">✓ Connected</span>
              : <span className="conn-na">● Not connected</span>
            }
          </div>
        </div>
        <a href={platform.docsUrl} target="_blank" rel="noreferrer" className="settings-docs-link">
          Docs ↗
        </a>
      </div>

      <div className="settings-fields">
        {platform.fields.map(f => (
          <div className="settings-field" key={f.key}>
            <label>{f.label}</label>
            <input
              type={f.type}
              placeholder={f.hint}
              value={values[f.key] || ''}
              onChange={e => handleChange(f.key, e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Credentials'}
        </button>

        {platform.oauthUrl && (
          <button className="btn btn-ghost" onClick={handleOAuth}>
            🔐 Connect via OAuth
          </button>
        )}

        {platform.key === 'tiktok' && (
          <button className="btn btn-ghost" onClick={handleDiscover} disabled={discovering}>
            {discovering ? 'Discovering…' : '🔍 Discover Shop ID'}
          </button>
        )}
      </div>

      {message && (
        <div className={`settings-msg ${message.type === 'ok' ? 'settings-msg--ok' : 'settings-msg--err'}`}>
          {message.type === 'ok' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Lazada OAuth paste-URL section */}
      {platform.key === 'lazada' && (
        <div className="lazada-oauth-section">
          <div className="card-sub" style={{ marginBottom: 8 }}>
            After clicking "Connect via OAuth", authorise in the browser then paste the full redirect URL below:
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="lazada-redirect-url"
              type="text"
              placeholder="Paste full redirect URL here…"
              className="lazada-url-input"
              autoComplete="off"
            />
            <button className="btn btn-primary" onClick={async () => {
              const url  = document.getElementById('lazada-redirect-url').value.trim();
              if (!url) return;
              let code;
              try { code = new URL(url).searchParams.get('code'); } catch { code = url; }
              if (!code) { alert('No code found in URL.'); return; }
              const res  = await fetch('/setup/lazada/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              });
              const data = await res.json();
              if (data.success) {
                setMessage({ type: 'ok', text: 'Lazada connected! Token saved.' });
                onSaved?.();
              } else {
                setMessage({ type: 'error', text: data.error || 'Token exchange failed.' });
              }
            }}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage({ onBack }) {
  const [status,   setStatus]   = useState({ shopee: false, lazada: false, tiktok: false });
  const [loading,  setLoading]  = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/settings/status');
      const data = await res.json();
      setStatus(data);
    } catch { /* fetch failed — leave status at defaults */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div>
          <div className="topbar-title">Platform Connections</div>
          <div className="topbar-sub">Enter your API credentials to connect each marketplace</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div className="settings-cards">
          {PLATFORMS.map(p => (
            <PlatformCard
              key={p.key}
              platform={p}
              connected={status[p.key]}
              onSaved={fetchStatus}
            />
          ))}
        </div>
      )}

      <div className="settings-note">
        <span>🔒</span>
        <span>Credentials are stored only in your local <code>.env</code> file and never sent to any third party.</span>
      </div>
    </div>
  );
}
