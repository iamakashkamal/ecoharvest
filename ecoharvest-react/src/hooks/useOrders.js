import { useState, useEffect, useCallback } from 'react';
import { fetchAllOrders, fetchPlatformStatus } from '../services/api';

export function useOrders(days) {
  const [orders,   setOrders]   = useState([]);
  const [status,   setStatus]   = useState({ shopee: false, lazada: false, tiktok: false });
  const [loading,  setLoading]  = useState(true);
  const [errors,   setErrors]   = useState({});
  const [lastSync, setLastSync] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ orders: all, errors: errs }, platformStatus] = await Promise.all([
        fetchAllOrders(days),
        fetchPlatformStatus(),
      ]);
      // Normalise date strings to Date objects
      const normalised = all.map(o => ({ ...o, date: new Date(o.date) }));
      setOrders(normalised);
      setErrors(errs || {});
      setStatus(platformStatus);
      setLastSync(new Date());
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  }, [days]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  return { orders, status, loading, errors, lastSync, reload: load };
}
