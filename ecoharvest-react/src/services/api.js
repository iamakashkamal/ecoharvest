const BASE = '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function fetchPlatformStatus() {
  const [shopee, lazada, tiktok] = await Promise.all([
    get('/shopee/status').catch(() => ({ connected: false })),
    get('/lazada/status').catch(() => ({ connected: false })),
    get('/tiktok/status').catch(() => ({ connected: false })),
  ]);
  return { shopee: shopee.connected, lazada: lazada.connected, tiktok: tiktok.connected };
}

export async function fetchAllOrders(days = 30) {
  return get(`/orders?days=${days}`);
}

export async function fetchPlatformOrders(platform, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return get(`/${platform}/orders${qs ? '?' + qs : ''}`);
}
