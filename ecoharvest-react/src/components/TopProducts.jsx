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
      if (!map[o.product.id]) map[o.product.id] = { ...o.product, revenue: 0, units: 0 };
      map[o.product.id].revenue += o.total;
      map[o.product.id].units   += o.qty;
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Top Products</div>
          <div className="card-sub">By revenue across all platforms</div>
        </div>
      </div>
      {products.map((p, i) => (
        <div className="top-product-row" key={p.id}>
          <div className={`rank ${RANKS[i]?.cls || ''}`}>#{i + 1}</div>
          <div className="tp-emoji">{p.emoji}</div>
          <div className="tp-info">
            <div className="tp-name">{p.name}</div>
            <div className="tp-meta">{p.sku}</div>
          </div>
          <div>
            <div className="tp-amt">
              S${p.revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </div>
            <div className="tp-units">{p.units} units</div>
          </div>
        </div>
      ))}
    </div>
  );
}
