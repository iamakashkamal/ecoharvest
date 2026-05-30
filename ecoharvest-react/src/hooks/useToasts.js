import { useState, useCallback, useEffect, useRef } from 'react';
import { PRODUCTS, CUSTOMERS, PLATFORM_META } from '../data/orders';

let _id = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((title, body, platform = 'system') => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, title, body, platform }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Simulate live orders arriving
  const pushRef = useRef(push);
  pushRef.current = push;

  useEffect(() => {
    const platforms = ['shopee', 'lazada', 'tiktok'];
    let timer;
    const schedule = () => {
      const delay = 18000 + Math.random() * 12000;
      timer = setTimeout(() => {
        const p = platforms[Math.floor(Math.random() * platforms.length)];
        const product  = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
        const meta = PLATFORM_META[p];
        pushRef.current(`New ${meta.label} Order`, `${customer} ordered ${product.name}`, p);
        schedule();
      }, delay);
    };
    const welcome = setTimeout(() => pushRef.current('Dashboard Ready', 'Showing live data from 3 platforms.', 'system'), 1200);
    schedule();
    return () => { clearTimeout(timer); clearTimeout(welcome); };
  }, []);

  return { toasts, push, dismiss };
}
