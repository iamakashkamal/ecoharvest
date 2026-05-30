import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

function fmtSGD(n) {
  return 'S$' + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const PLATFORMS = [
  { key: 'shopee', label: 'Shopee SG',   abbr: 'S', color: '#f05629', logoClass: 'pl-shopee', progressStyle: { background: '#f05629' } },
  { key: 'lazada', label: 'Lazada SG',   abbr: 'L', color: '#5a67f2', logoClass: 'pl-lazada', progressStyle: { background: '#5a67f2' } },
  { key: 'tiktok', label: 'TikTok Shop', abbr: 'T', color: '#69c9d0', logoClass: 'pl-tiktok', progressStyle: { background: 'linear-gradient(90deg,#ff0050,#69c9d0)' } },
];

export default function PlatformBreakdown({ orders }) {
  const totals = useMemo(() => {
    const map = { shopee: 0, lazada: 0, tiktok: 0 };
    orders.forEach(o => { map[o.platform] = (map[o.platform] || 0) + o.total; });
    return map;
  }, [orders]);

  const grandTotal = totals.shopee + totals.lazada + totals.tiktok || 1;

  const donutData = {
    labels: ['Shopee SG', 'Lazada SG', 'TikTok Shop'],
    datasets: [{
      data: [totals.shopee, totals.lazada, totals.tiktok],
      backgroundColor: ['#f05629', '#5a67f2', '#69c9d0'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const donutOptions = {
    responsive: true, cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c2230', borderColor: '#2a3241', borderWidth: 1,
        titleColor: '#e6edf3', bodyColor: '#8b949e',
        callbacks: { label: ctx => ` S$${ctx.parsed.toFixed(2)}` },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Platform Share</div>
          <div className="card-sub">Revenue distribution</div>
        </div>
      </div>
      <Doughnut data={donutData} options={donutOptions} />
      <div className="platform-list">
        {PLATFORMS.map(p => {
          const pct = ((totals[p.key] / grandTotal) * 100).toFixed(1);
          return (
            <div className="platform-row" key={p.key}>
              <div className="platform-info">
                <div className={`platform-logo ${p.logoClass}`}>{p.abbr}</div>
                <span className="platform-name">{p.label}</span>
                <span className="platform-amt">{fmtSGD(totals[p.key])}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ ...p.progressStyle, width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
