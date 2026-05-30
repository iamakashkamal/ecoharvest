import { useState } from 'react';
import { PLATFORM_META, STATUS_META } from '../data/orders';

const PAGE_SIZE = 15;

function fmtDate(d) {
  return d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdersTable({ orders, status, setStatus, search, setSearch, onSelectOrder }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = orders.slice(start, start + PAGE_SIZE);

  function goPage(p) {
    if (p >= 1 && p <= pages) setPage(p);
  }

  // Reset to page 1 when filters change
  if (page > pages && pages > 0) setPage(1);

  const pageNums = [...new Set([1, safePage - 1, safePage, safePage + 1, pages])]
    .filter(p => p >= 1 && p <= pages)
    .sort((a, b) => a - b);

  return (
    <div className="card orders-card">
      <div className="card-header">
        <div>
          <div className="card-title">Recent Orders</div>
          <div className="card-sub">
            Showing {Math.min(start + 1, orders.length)}–{Math.min(start + PAGE_SIZE, orders.length)} of {orders.length} orders
          </div>
        </div>
        <select
          className="status-select"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {['Pending','Processing','Shipped','Delivered','Cancelled','Returned'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search order ID, product, customer…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Platform</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {slice.map(o => {
              const pm = PLATFORM_META[o.platform];
              const sm = STATUS_META[o.status] || {};
              return (
                <tr key={o.orderId} onClick={() => onSelectOrder(o)}>
                  <td><span className="order-id">{o.orderId}</span></td>
                  <td><span className={`platform-pill ${pm.pillClass}`}>{pm.label}</span></td>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">{o.product.emoji}</div>
                      <div>
                        <div className="product-name">{o.product.name}</div>
                        <div className="product-sku">{o.product.sku} · Qty {o.qty}</div>
                      </div>
                    </div>
                  </td>
                  <td>{o.customer}</td>
                  <td>{fmtDate(o.date)}</td>
                  <td><span className="amount">S${o.total.toFixed(2)}</span></td>
                  <td>
                    <span className={`status-badge ${sm.cls}`}>
                      <span className="status-dot" />
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={e => { e.stopPropagation(); onSelectOrder(o); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="page-info">
          Showing {Math.min(start + 1, orders.length)}–{Math.min(start + PAGE_SIZE, orders.length)} of {orders.length} orders
        </div>
        <div className="page-btns">
          <button className="page-btn" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}>‹</button>
          {pageNums.map((p, i) => (
            <>
              {i > 0 && pageNums[i] - pageNums[i - 1] > 1 && (
                <button key={`dot-${p}`} className="page-btn" disabled>…</button>
              )}
              <button
                key={p}
                className={`page-btn ${p === safePage ? 'active' : ''}`}
                onClick={() => goPage(p)}
              >
                {p}
              </button>
            </>
          ))}
          <button className="page-btn" onClick={() => goPage(safePage + 1)} disabled={safePage === pages}>›</button>
        </div>
      </div>
    </div>
  );
}
