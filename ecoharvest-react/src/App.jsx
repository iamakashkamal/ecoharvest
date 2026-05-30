import { useState, useCallback } from 'react';
import Sidebar           from './components/Sidebar';
import Topbar            from './components/Topbar';
import FilterBar         from './components/FilterBar';
import StatCards         from './components/StatCards';
import RevenueChart      from './components/RevenueChart';
import PlatformBreakdown from './components/PlatformBreakdown';
import OrdersTable       from './components/OrdersTable';
import OrderModal        from './components/OrderModal';
import TopProducts       from './components/TopProducts';
import FulfilmentFunnel  from './components/FulfilmentFunnel';
import ToastContainer    from './components/ToastContainer';
import ConnectBanner     from './components/ConnectBanner';
import SettingsPage      from './components/SettingsPage';
import { useOrders }     from './hooks/useOrders';
import { useFilters }    from './hooks/useFilters';
import { useToasts }     from './hooks/useToasts';
import { PLATFORM_META } from './data/orders';

function exportCSV(orders) {
  const rows = [['Order ID','Platform','Customer','Date','Items','Total','Status']];
  orders.forEach(o => {
    const d     = new Date(o.date).toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' });
    const items = (o.items || []).map(i => `${i.name} x${i.qty}`).join('; ');
    rows.push([o.orderId, PLATFORM_META[o.platform]?.label || o.platform, o.customer, d, items, o.total.toFixed(2), o.status]);
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
  const [days,        setDays]        = useState(30);

  const { orders, status: platformStatus, loading, errors, lastSync, reload } = useOrders(days);
  const { platform, setPlatform, status, setStatus, search, setSearch, filtered } = useFilters(orders);
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

  const handleSync = useCallback(async () => {
    await reload();
    push('Sync Complete', 'All platforms updated successfully.', 'system');
  }, [reload, push]);

  const handleExport = useCallback(() => {
    exportCSV(filtered);
    push('Export Ready', `${filtered.length} orders exported as CSV.`, 'system');
  }, [filtered, push]);

  return (
    <>
      <Sidebar activePage={activePage} onNav={handleNav} open={sidebarOpen} platformStatus={platformStatus} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="main">
        {activePage === 'settings' ? (
          <SettingsPage onBack={() => setActivePage('dashboard')} />
        ) : (<>
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onSync={handleSync}
          onExport={handleExport}
          lastSync={lastSync}
          loading={loading}
        />

        <div className="content">
          <ConnectBanner platformStatus={platformStatus} apiErrors={errors} onOpenSettings={() => setActivePage('settings')} />

          <FilterBar
            platform={platform} setPlatform={setPlatform}
            days={days}         setDays={setDays}
          />

          <StatCards orders={filtered} loading={loading} />

          <div className="charts-row">
            <RevenueChart orders={filtered} days={days} />
            <PlatformBreakdown orders={filtered} />
          </div>

          <OrdersTable
            orders={filtered}
            status={status}   setStatus={setStatus}
            search={search}   setSearch={setSearch}
            onSelectOrder={setSelected}
            loading={loading}
          />

          <div className="bottom-row">
            <TopProducts      orders={filtered} />
            <FulfilmentFunnel orders={filtered} />
          </div>
        </div>
        </>)}
      </div>

      <OrderModal order={selected} onClose={() => setSelected(null)} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
