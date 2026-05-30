import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { ALL_ORDERS, BASE_NOW } from '../data/orders';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RevenueChart() {
  const { labels, shopeeData, lazadaData, tiktokData } = useMemo(() => {
    const labels = [], shopeeData = [], lazadaData = [], tiktokData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(BASE_NOW);
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      labels.push(d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' }));
      const day = ALL_ORDERS.filter(o => o.date.toDateString() === ds);
      shopeeData.push(+day.filter(o => o.platform === 'shopee').reduce((s, o) => s + o.total, 0).toFixed(2));
      lazadaData.push(+day.filter(o => o.platform === 'lazada').reduce((s, o) => s + o.total, 0).toFixed(2));
      tiktokData.push(+day.filter(o => o.platform === 'tiktok').reduce((s, o) => s + o.total, 0).toFixed(2));
    }
    return { labels, shopeeData, lazadaData, tiktokData };
  }, []);

  const data = {
    labels,
    datasets: [
      { label: 'Shopee', data: shopeeData, borderColor: '#f05629', backgroundColor: 'rgba(240,86,41,.08)',   tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true },
      { label: 'Lazada', data: lazadaData, borderColor: '#5a67f2', backgroundColor: 'rgba(90,103,242,.08)',  tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true },
      { label: 'TikTok', data: tiktokData, borderColor: '#69c9d0', backgroundColor: 'rgba(105,201,208,.05)', tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c2230', borderColor: '#2a3241', borderWidth: 1,
        titleColor: '#e6edf3', bodyColor: '#8b949e',
        callbacks: { label: ctx => ` S$${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(42,50,65,.5)' }, ticks: { color: '#8b949e', font: { size: 11 }, maxTicksLimit: 8 } },
      y: { grid: { color: 'rgba(42,50,65,.5)' }, ticks: { color: '#8b949e', font: { size: 11 }, callback: v => 'S$' + v } },
    },
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Revenue Over Time</div>
          <div className="card-sub">Daily revenue by platform (SGD)</div>
        </div>
        <div className="chart-legend">
          {[['#f05629','Shopee'],['#5a67f2','Lazada'],['#69c9d0','TikTok']].map(([color, label]) => (
            <span key={label} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <Line data={data} options={options} />
    </div>
  );
}
