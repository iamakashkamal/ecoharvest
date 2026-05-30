import { useMemo } from 'react';

function fmtSGD(n) {
  return 'S$' + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function StatCard({ accent, icon, iconBg, value, label, change, changeType }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <span className={`stat-change ${changeType}`}>{change}</span>
    </div>
  );
}

export default function StatCards({ orders }) {
  const stats = useMemo(() => {
    const total     = orders.length;
    const revenue   = orders.reduce((s, o) => s + o.total, 0);
    const aov       = total ? revenue / total : 0;
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const pending   = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    const returns   = orders.filter(o => o.status === 'Cancelled' || o.status === 'Returned').length;
    return { total, revenue, aov, delivered, pending, returns };
  }, [orders]);

  return (
    <div className="stats-grid">
      <StatCard accent="var(--blue)"   icon="📦" iconBg="rgba(88,166,255,.1)"  value={stats.total.toLocaleString()} label="Total Orders"         change="↑ 12.4%" changeType="up" />
      <StatCard accent="var(--green)"  icon="💰" iconBg="rgba(63,185,80,.1)"   value={fmtSGD(stats.revenue)}        label="Total Revenue"         change="↑ 18.7%" changeType="up" />
      <StatCard accent="var(--purple)" icon="🛍" iconBg="rgba(163,113,247,.1)" value={'S$' + stats.aov.toFixed(2)}  label="Avg Order Value"       change="↑ 5.2%"  changeType="up" />
      <StatCard accent="var(--green)"  icon="✅" iconBg="rgba(63,185,80,.1)"   value={stats.delivered.toLocaleString()} label="Delivered"          change="↑ 3.1%"  changeType="up" />
      <StatCard accent="var(--yellow)" icon="⏳" iconBg="rgba(210,153,34,.1)"  value={stats.pending.toLocaleString()}   label="Pending / Processing" change="↓ 2.8%" changeType="down" />
      <StatCard accent="var(--red)"    icon="↩️" iconBg="rgba(248,81,73,.1)"   value={stats.returns.toLocaleString()}   label="Returns / Cancelled" change="↓ 1.2%"  changeType="down" />
    </div>
  );
}
