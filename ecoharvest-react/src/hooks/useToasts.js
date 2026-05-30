import { useState, useCallback } from 'react';

let _id = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((title, body, platform = 'system') => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, title, body, platform }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return { toasts, push, dismiss };
}
