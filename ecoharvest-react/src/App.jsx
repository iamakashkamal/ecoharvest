import { useState, useCallback } from 'react';
import Sidebar          from './components/Sidebar';
import Topbar           from './components/Topbar';
import FilterBar        from './components/FilterBar';
import StatCards        from './components/StatCards';
import RevenueChart     from './components/RevenueChart';
import PlatformBreakdown from './components/PlatformBreakdown';
import OrdersTable      from './components/OrdersTable';
import OrderModal       from './components/OrderModal';
import TopProducts      from './components/TopProducts';
import FulfilmentFunnel from './components/FulfilmentFunnel';
import ToastContainer   from './components/ToastContainer';
import { useFilters }   from './hooks/useFilters';
import { useToasts }    from './hooks/useToasts';
import { PLATFORM_META } from './data/orders';

function exportCSV(orders) {
  const rows = [['Order ID','Platform','Product','Customer','Date','Qty','Unit Price','Total','Status']];
  orders.forEach(o => {
    const d = o.date.toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' });
    rows.push([o.orderId, PLATFORM_META[o.platform].label, o.product.name, o.customer, d, o.qty, o.price.toFixed(2), o.total.toFixed(2), o.status]);
  });
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'ecoharvest_orders.csv';
  a.click();
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage,  setActivePage]  = useState('dashboard');
  const [selected,    setSelected]    = useState(null);

  const { platform, setPlatform, status, setStatus, search, setSearch, days, setDays, filtered } = useFilters();
  const { toasts, push, dismiss } = useToasts();

  const handleNav = useCallback((key) => {
    if (['shopee','lazada','tiktok'].includes(key)) {
      setPlatform(key);
      setActivePage('dashboard');
    } else {
      setActivePage(key);
    }
    setSidebarOpen(false);
  }, [setPlatform]);

  const handleSync = useCallback(() => {
    push('Sync Complete', 'All platforms updated successfully.', 'system');
  }, [push]);

  const handleExport = useCallback(() => {
    exportCSV(filtered);
    push('Export Ready', `${filtered.length} orders exported as CSV.`, 'system');
  }, [filtered, push]);

  return (
    <>
      <Sidebar activePage={activePage} onNav={handleNav} open={sidebarOpen} />

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onSync={handleSync}
          onExport={handleExport}
        />

        <div className="content">
          <FilterBar
            platform={platform} setPlatform={p => { setPlatform(p); }}
            days={days} setDays={setDays}
          />

          <StatCards orders={filtered} />

          <div className="charts-row">
            <RevenueChart />
            <PlatformBreakdown orders={filtered} />
          </div>

          <OrdersTable
            orders={filtered}
            status={status}   setStatus={setStatus}
            search={search}   setSearch={setSearch}
            onSelectOrder={setSelected}
          />

          <div className="bottom-row">
            <TopProducts      orders={filtered} />
            <FulfilmentFunnel orders={filtered} />
          </div>
        </div>
      </div>

      <OrderModal order={selected} onClose={() => setSelected(null)} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
