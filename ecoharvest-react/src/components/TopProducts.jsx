import { useMemo } from 'react';

const RANKS = [
  { cls: 'gold',   label: '#1' },
  { cls: 'silver', label: '#2' },
  { cls: 'bronze', label: '#3' },
];

export default function TopProducts({ orders }) {
  const products = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const key = item.sku || item.name;
        if (!map[key]) map[key] = { name: item.name, sku: item.sku, image: item.image, revenue: 0, units: 0 };
        map[key].revenue += item.price * item.qty;
        map[key].units   += item.qty;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  if (!products.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Top Products</div><div className="card-sub">By revenue across all platforms</div></div>
        </div>
        <div className="empty-state">No product data available</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Top Products</div>
          <div className="card-sub">By revenue across all platforms</div>
        </div>
      </div>
      {products.map((p, i) => (
        <div className="top-product-row" key={p.sku || p.name}>
          <div className={`rank ${RANKS[i]?.cls || ''}`}>#{i + 1}</div>
          {p.image
            ? <img src={p.image} alt={p.name} className="tp-img" />
            : <div className="tp-emoji">📦</div>
          }
          <div className="tp-info">
            <div className="tp-name">{p.name}</div>
            <div className="tp-meta">{p.sku}</div>
          </div>
          <div>
            <div className="tp-amt">S${p.revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
            <div className="tp-units">{p.units} units</div>
          </div>
        </div>
      ))}
    </div>
  );
}
