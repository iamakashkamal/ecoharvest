import { useState, useMemo } from 'react';

export function useFilters(orders) {
  const [platform, setPlatform] = useState('all');
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      if (platform !== 'all' && o.platform !== platform) return false;
      if (status && o.status !== status) return false;
      if (q && !o.orderId.toLowerCase().includes(q) &&
               !(o.items?.[0]?.name || '').toLowerCase().includes(q) &&
               !o.customer.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, platform, status, search]);

  return { platform, setPlatform, status, setStatus, search, setSearch, filtered };
}
