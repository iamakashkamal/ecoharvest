import { useState, useMemo } from 'react';
import { ALL_ORDERS, BASE_NOW } from '../data/orders';

export function useFilters() {
  const [platform, setPlatform] = useState('all');
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');
  const [days,     setDays]     = useState(30);

  const filtered = useMemo(() => {
    const cutoff = new Date(BASE_NOW);
    cutoff.setDate(cutoff.getDate() - days);
    const q = search.toLowerCase();
    return ALL_ORDERS.filter(o => {
      if (platform !== 'all' && o.platform !== platform) return false;
      if (status && o.status !== status) return false;
      if (o.date < cutoff) return false;
      if (q && !o.orderId.toLowerCase().includes(q) &&
               !o.product.name.toLowerCase().includes(q) &&
               !o.customer.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [platform, status, search, days]);

  return { platform, setPlatform, status, setStatus, search, setSearch, days, setDays, filtered };
}
