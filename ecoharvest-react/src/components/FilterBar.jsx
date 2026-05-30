export default function FilterBar({ platform, setPlatform, days, setDays }) {
  const chips = [
    { key: 'all',    label: 'All Platforms', dot: null },
    { key: 'shopee', label: 'Shopee SG',     dot: '#f05629' },
    { key: 'lazada', label: 'Lazada SG',     dot: '#5a67f2' },
    { key: 'tiktok', label: 'TikTok Shop',   dot: '#69c9d0' },
  ];

  return (
    <div className="filter-row">
      <span className="filter-label">Platform:</span>
      {chips.map(c => (
        <button
          key={c.key}
          className={`chip ${c.key} ${platform === c.key ? 'active' : ''}`}
          onClick={() => setPlatform(c.key)}
        >
          {c.dot && <span className="chip-dot" style={{ background: c.dot }} />}
          {c.label}
        </button>
      ))}
      <div className="date-range">
        <select value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>This year</option>
        </select>
      </div>
    </div>
  );
}
