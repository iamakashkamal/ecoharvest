import { useEffect } from 'react';
import { PLATFORM_META, STATUS_META } from '../data/orders';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Timeline({ status, date }) {
  const steps = [
    { label: 'Order Placed',      icon: '📋' },
    { label: 'Payment Confirmed', icon: '💳' },
    { label: 'Shipped Out',       icon: '📦' },
    { label: 'Delivered',         icon: '✅' },
  ];
  const order = ['Pending','Processing','Shipped','Delivered'];
  const idx   = order.indexOf(status);

  if (status === 'Cancelled' || status === 'Returned') {
    return (
      <div className="timeline">
        <h4 className="section-label">ORDER TIMELINE</h4>
        <div className="timeline-item">
          <div className="tl-dot done">✓</div>
          <div className="tl-content"><div className="tl-title">📋 Order Placed</div><div className="tl-time">{fmtDate(date)}</div></div>
        </div>
        <div className="timeline-item">
          <div className="tl-dot cancelled">✕</div>
          <div className="tl-content">
            <div className="tl-title">{status === 'Cancelled' ? '❌ Order Cancelled' : '↩️ Order Returned'}</div>
            <div className="tl-time">{fmtDate(date)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      <h4 className="section-label">ORDER TIMELINE</h4>
      {steps.map((s, i) => {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        const done   = i <= idx - 1;
        const active = i === idx || (status === 'Delivered' && i === 3);
        return (
          <div className="timeline-item" key={s.label}>
            <div className={`tl-dot ${done || active ? 'done' : ''}`}>{done || active ? '✓' : i + 1}</div>
            <div className="tl-content">
              <div className="tl-title">{s.icon} {s.label}</div>
              <div className="tl-time">{done || active ? fmtDate(d) : 'Pending'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderModal({ order, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!order) return null;

  const pm = PLATFORM_META[order.platform] || {};
  const sm = STATUS_META[order.status]     || {};

  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="card-title">Order {order.orderId}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`platform-pill ${pm.pillClass}`}>{pm.label}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            {[
              ['Customer',     order.customer],
              ['Order Date',   fmtDate(order.date)],
              ['Status',       null],
              ['Total Amount', `S$${order.total.toFixed(2)}`],
              ['Platform',     pm.label],
              ['Order ID',     order.orderId],
            ].map(([label, val]) => (
              <div className="detail-item" key={label}>
                <label>{label.toUpperCase()}</label>
                {label === 'Status' ? (
                  <span className={`status-badge ${sm.cls}`}><span className="status-dot" />{order.status}</span>
                ) : label === 'Order ID' ? (
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{val}</span>
                ) : (
                  <span>{val}</span>
                )}
              </div>
            ))}
          </div>

          <div className="detail-products">
            <h4 className="section-label">ITEMS ORDERED</h4>
            {(order.items || []).map((item, i) => (
              <div className="detail-product-row" key={i}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                  : <div className="product-thumb" style={{ fontSize: 22 }}>📦</div>
                }
                <div style={{ flex: 1 }}>
                  <div className="product-name">{item.name}</div>
                  <div className="product-sku">{item.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="amount">S${(item.price * item.qty).toFixed(2)}</div>
                  <div className="product-sku">Qty: {item.qty} × S${item.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
            <div className="detail-product-row" style={{ justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total</div>
                <div className="amount" style={{ fontSize: 18 }}>S${order.total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <Timeline status={order.status} date={order.date} />
        </div>
      </div>
    </div>
  );
}
