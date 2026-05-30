import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const BASE_URL = 'https://api.lazada.com.sg/rest';

function sign(path, params) {
  const appSecret = process.env.LAZADA_APP_SECRET;
  const sorted    = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  const str       = `${path}${sorted}`;
  return crypto.createHmac('sha256', appSecret).update(str).digest('hex').toUpperCase();
}

function isConfigured() {
  return !!(process.env.LAZADA_APP_KEY && process.env.LAZADA_APP_SECRET && process.env.LAZADA_ACCESS_TOKEN);
}

// GET /api/lazada/status
router.get('/status', (req, res) => {
  res.json({ connected: isConfigured() });
});

// GET /api/lazada/orders?created_after=&created_before=&offset=&limit=
router.get('/orders', async (req, res) => {
  if (!isConfigured()) {
    return res.status(401).json({ error: 'Lazada credentials not configured' });
  }

  const path      = '/orders/get';
  const timestamp = new Date().toISOString();
  const limit     = parseInt(req.query.limit)  || 50;
  const offset    = parseInt(req.query.offset) || 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const createdAfter  = req.query.created_after  || thirtyDaysAgo;
  const createdBefore = req.query.created_before || new Date().toISOString();

  const params = {
    app_key:      process.env.LAZADA_APP_KEY,
    timestamp,
    sign_method:  'sha256',
    access_token: process.env.LAZADA_ACCESS_TOKEN,
    created_after:  createdAfter,
    created_before: createdBefore,
    limit,
    offset,
    sort_by:    'created_at',
    sort_direction: 'DESC',
  };
  params.sign = sign(path, params);

  try {
    const { data } = await axios.get(`${BASE_URL}${path}`, { params });

    if (data.code !== '0') {
      return res.status(400).json({ error: data.message, code: data.code });
    }

    const orders = (data.data?.orders || []).map(o => ({
      orderId:  String(o.order_id),
      platform: 'lazada',
      customer: o.address_billing?.first_name
        ? `${o.address_billing.first_name} ${o.address_billing.last_name || ''}`.trim()
        : 'Lazada Buyer',
      status:   mapLazadaStatus(o.statuses?.[0] || o.status || ''),
      total:    parseFloat(o.price || 0),
      currency: 'SGD',
      date:     new Date(o.created_at).toISOString(),
      items:    (o.items || []).map(i => ({
        name:  i.name,
        sku:   i.sku,
        qty:   parseInt(i.units || 1),
        price: parseFloat(i.item_price || 0),
        image: i.product_main_image || '',
      })),
    }));

    res.json({ orders, total: data.data?.count_total || orders.length });
  } catch (err) {
    console.error('Lazada API error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch from Lazada', details: err.response?.data });
  }
});

function mapLazadaStatus(s) {
  const map = {
    unpaid: 'Pending', pending: 'Pending',
    processing: 'Processing', packed: 'Processing', ready_to_ship: 'Processing',
    shipped: 'Shipped', delivered: 'Delivered', completed: 'Delivered',
    canceled: 'Cancelled', returned: 'Returned', failed: 'Cancelled',
  };
  return map[s.toLowerCase()] || s;
}

export default router;
