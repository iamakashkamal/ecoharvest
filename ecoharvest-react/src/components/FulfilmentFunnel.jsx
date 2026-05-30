import { useMemo } from 'react';

const STATUSES = [
  { label: 'Pending',    color: 'var(--yellow)' },
  { label: 'Processing', color: 'var(--blue)'   },
  { label: 'Shipped',    color: 'var(--purple)'  },
  { label: 'Delivered',  color: 'var(--green)'   },
  { label: 'Cancelled',  color: 'var(--red)'     },
  { label: 'Returned',   color: 'var(--muted)'   },
];

export default function FulfilmentFunnel({ orders }) {
  const counts = useMemo(() => {
    const map = {};
    STATUSES.forEach(s => { map[s.label] = 0; });
    orders.forEach(o => { if (map[o.status] !== undefined) map[o.status]++; });
    return map;
  }, [orders]);

  const total = orders.length || 1;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Order Fulfilment</div>
          <div className="card-sub">Status breakdown</div>
        </div>
      </div>
      {STATUSES.map(s => {
        const count = counts[s.label];
        const pct   = (count / total * 100).toFixed(1);
        return (
          <div className="funnel-row" key={s.label}>
            <div className="funnel-label">{s.label}</div>
            <div className="funnel-bar-wrap">
              <div className="funnel-bar" style={{ width: `${pct}%`, background: s.color }} />
            </div>
            <div className="funnel-count">{count}</div>
            <div className="funnel-pct">{Math.round(+pct)}%</div>
          </div>
        );
      })}
    </div>
  );
}
