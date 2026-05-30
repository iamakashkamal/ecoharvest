import React from 'react';

const NAV = [
  { icon: '📊', label: 'Dashboard',    key: 'dashboard',  section: 'Overview' },
  { icon: '📈', label: 'Analytics',    key: 'analytics',  section: null },
  { icon: '🛒', label: 'Shopee SG',    key: 'shopee',     section: 'Platforms', platform: 'shopee', dot: '#f05629' },
  { icon: '🏪', label: 'Lazada SG',    key: 'lazada',     section: null,        platform: 'lazada', dot: '#5a67f2' },
  { icon: '🎵', label: 'TikTok Shop',  key: 'tiktok',     section: null,        platform: 'tiktok', dot: '#69c9d0' },
  { icon: '⚙️', label: 'Settings',    key: 'settings',   section: 'Management' },
];

export default function Sidebar({ activePage, onNav, open, platformStatus = {} }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo">
        <div className="logo-icon">🌿</div>
        <div>
          <div className="logo-text">EcoHarvest</div>
          <div className="logo-sub">Seller Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <React.Fragment key={item.key}>
            {item.section && <div className="nav-section">{item.section}</div>}
            <button
              className={`nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={() => onNav(item.key)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.dot && (
                <span
                  className="platform-badge"
                  style={{
                    background: item.dot,
                    boxShadow: platformStatus[item.platform]
                      ? `0 0 6px ${item.dot}`
                      : 'none',
                    opacity: platformStatus[item.platform] ? 1 : 0.35,
                  }}
                />
              )}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">EH</div>
        <div className="user-info">
          <div className="user-name">EcoHarvest SG</div>
          <div className="user-role">Admin · Pro Plan</div>
        </div>
      </div>
    </aside>
  );
}
