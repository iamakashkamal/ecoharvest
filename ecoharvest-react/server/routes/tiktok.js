import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const BASE_URL = 'https://open-api.tiktokglobalshop.com';

function sign(path, params, body = '') {
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const keys      = Object.keys(params).filter(k => k !== 'sign' && k !== 'access_token').sort();
  const paramStr  = keys.map(k => `${k}${params[k]}`).join('');
  const str       = `${appSecret}${path}${paramStr}${body}${appSecret}`;
  return crypto.createHmac('sha256', appSecret).update(str).digest('hex');
}

function isConfigured() {
  return !!(process.env.TIKTOK_APP_KEY && process.env.TIKTOK_APP_SECRET &&
            process.env.TIKTOK_SHOP_ID && process.env.TIKTOK_ACCESS_TOKEN);
}

// GET /api/tiktok/status
router.get('/status', (req, res) => {
  res.json({ connected: isConfigured() });
});

// GET /api/tiktok/orders?create_time_ge=&create_time_lt=&page_size=&sort_field=&page_token=
router.get('/orders', async (req, res) => {
  if (!isConfigured()) {
    return res.status(401).json({ error: 'TikTok credentials not configured' });
  }

  const path      = '/order/202309/orders/search';
  const timestamp = Math.floor(Date.now() / 1000);
  const pageSize  = parseInt(req.query.page_size) || 50;

  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
  const createTimeGe  = parseInt(req.query.create_time_ge)  || thirtyDaysAgo;
  const createTimeLt  = parseInt(req.query.create_time_lt)  || Math.floor(Date.now() / 1000);
  const pageToken     = req.query.page_token || '';

  const queryParams = {
    app_key:      process.env.TIKTOK_APP_KEY,
    shop_id:      process.env.TIKTOK_SHOP_ID,
    timestamp:    String(timestamp),
    version:      '202309',
    access_token: process.env.TIKTOK_ACCESS_TOKEN,
  };

  const body = JSON.stringify({
    create_time_ge: createTimeGe,
    create_time_lt: createTimeLt,
    page_size:      pageSize,
    sort_field:     'CREATE_TIME',
    sort_order:     'DESC',
    ...(pageToken ? { page_token: pageToken } : {}),
  });

  queryParams.sign = sign(path, queryParams, body);

  try {
    const { data } = await axios.post(`${BASE_URL}${path}`, body, {
      params: queryParams,
      headers: { 'Content-Type': 'application/json', 'x-tts-access-token': process.env.TIKTOK_ACCESS_TOKEN },
    });

    if (data.code !== 0) {
      return res.status(400).json({ error: data.message, code: data.code });
    }

    const orders = (data.data?.order_list || []).map(o => ({
      orderId:  o.id,
      platform: 'tiktok',
      customer: o.recipient_address?.name || 'TikTok Buyer',
      status:   mapTikTokStatus(o.status),
      total:    parseFloat(o.payment?.total_amount || 0),
      currency: o.payment?.currency || 'SGD',
      date:     new Date(o.create_time * 1000).toISOString(),
      items:    (o.line_items || []).map(i => ({
        name:  i.product_name,
        sku:   i.seller_sku || i.product_id,
        qty:   parseInt(i.quantity || 1),
        price: parseFloat(i.sale_price || 0),
        image: i.sku_image || '',
      })),
    }));

    res.json({
      orders,
      nextPageToken: data.data?.next_page_token || '',
      total:         data.data?.total_count || orders.length,
    });
  } catch (err) {
    console.error('TikTok API error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch from TikTok', details: err.response?.data });
  }
});

function mapTikTokStatus(s) {
  const map = {
    UNPAID: 'Pending', ON_HOLD: 'Pending', AWAITING_SHIPMENT: 'Processing',
    AWAITING_COLLECTION: 'Processing', IN_TRANSIT: 'Shipped', DELIVERED: 'Delivered',
    COMPLETED: 'Delivered', CANCELLED: 'Cancelled', PARTIALLY_RETURNING: 'Returned',
    FULLY_RETURNING: 'Returned',
  };
  return map[s] || s;
}

export default router;
