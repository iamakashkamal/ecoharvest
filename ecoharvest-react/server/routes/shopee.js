import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const BASE_URL = 'https://partner.shopeemobile.com';

function sign(path, timestamp) {
  const partnerId  = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const shopId     = process.env.SHOPEE_SHOP_ID;
  const base = `${partnerId}${path}${timestamp}${process.env.SHOPEE_ACCESS_TOKEN}${shopId}`;
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex');
}

function isConfigured() {
  return !!(process.env.SHOPEE_PARTNER_ID && process.env.SHOPEE_PARTNER_KEY &&
            process.env.SHOPEE_SHOP_ID    && process.env.SHOPEE_ACCESS_TOKEN);
}

// GET /api/shopee/status
router.get('/status', (req, res) => {
  res.json({ connected: isConfigured() });
});

// GET /api/shopee/orders?time_from=&time_to=&page_size=&cursor=
router.get('/orders', async (req, res) => {
  if (!isConfigured()) {
    return res.status(401).json({ error: 'Shopee credentials not configured' });
  }

  const path      = '/api/v2/order/get_order_list';
  const timestamp = Math.floor(Date.now() / 1000);
  const shopId    = parseInt(process.env.SHOPEE_SHOP_ID);
  const signature = sign(path, timestamp);

  const timeFrom = parseInt(req.query.time_from) || Math.floor(Date.now() / 1000) - 30 * 86400;
  const timeTo   = parseInt(req.query.time_to)   || Math.floor(Date.now() / 1000);
  const pageSize = parseInt(req.query.page_size) || 50;
  const cursor   = req.query.cursor || '';

  try {
    const { data } = await axios.get(`${BASE_URL}${path}`, {
      params: {
        partner_id:    parseInt(process.env.SHOPEE_PARTNER_ID),
        shop_id:       shopId,
        access_token:  process.env.SHOPEE_ACCESS_TOKEN,
        timestamp,
        sign:          signature,
        time_range_field: 'create_time',
        time_from:     timeFrom,
        time_to:       timeTo,
        page_size:     pageSize,
        cursor,
        order_status:  'ALL',
        response_optional_fields: 'order_status',
      },
    });

    if (data.error) {
      return res.status(400).json({ error: data.message, code: data.error });
    }

    // Fetch order details for each order_sn
    const orderSns = (data.response?.order_list || []).map(o => o.order_sn);
    if (!orderSns.length) {
      return res.json({ orders: [], more: false, cursor: '' });
    }

    const detailPath      = '/api/v2/order/get_order_detail';
    const detailTimestamp = Math.floor(Date.now() / 1000);
    const detailSign      = sign(detailPath, detailTimestamp);

    const { data: detailData } = await axios.get(`${BASE_URL}${detailPath}`, {
      params: {
        partner_id:    parseInt(process.env.SHOPEE_PARTNER_ID),
        shop_id:       shopId,
        access_token:  process.env.SHOPEE_ACCESS_TOKEN,
        timestamp:     detailTimestamp,
        sign:          detailSign,
        order_sn_list: orderSns.join(','),
        response_optional_fields: 'buyer_user_id,buyer_username,total_amount,item_list,order_status,create_time,update_time,ship_by_date,shipping_carrier',
      },
    });

    const orders = (detailData.response?.order_list || []).map(o => ({
      orderId:   o.order_sn,
      platform:  'shopee',
      customer:  o.buyer_username || 'Shopee Buyer',
      status:    mapShopeeStatus(o.order_status),
      total:     parseFloat(o.total_amount || 0),
      currency:  'SGD',
      date:      new Date(o.create_time * 1000).toISOString(),
      items:     (o.item_list || []).map(i => ({
        name:      i.item_name,
        sku:       i.item_sku || i.item_id,
        qty:       i.model_quantity_purchased,
        price:     parseFloat(i.model_discounted_price || i.model_original_price || 0),
        image:     i.image_info?.image_url || '',
      })),
    }));

    res.json({ orders, more: data.response?.more || false, cursor: data.response?.next_cursor || '' });
  } catch (err) {
    console.error('Shopee API error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch from Shopee', details: err.response?.data });
  }
});

function mapShopeeStatus(s) {
  const map = {
    UNPAID: 'Pending', READY_TO_SHIP: 'Processing', PROCESSED: 'Processing',
    SHIPPED: 'Shipped', IN_CANCEL: 'Cancelled', CANCELLED: 'Cancelled',
    TO_CONFIRM_RECEIVE: 'Shipped', COMPLETED: 'Delivered',
  };
  return map[s] || s;
}

export default router;
