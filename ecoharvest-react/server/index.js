import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import https   from 'https';
import http    from 'http';
import fs      from 'fs';
import path    from 'path';
import { fileURLToPath } from 'url';
import shopeeRouter from './routes/shopee.js';
import lazadaRouter from './routes/lazada.js';
import tiktokRouter from './routes/tiktok.js';
import setupRouter  from './setup.js';

const __dir    = path.dirname(fileURLToPath(import.meta.url));
const PORT     = parseInt(process.env.PORT || 3001);
const SSL_PORT = parseInt(process.env.SSL_PORT || 3443);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/shopee', shopeeRouter);
app.use('/api/lazada', lazadaRouter);
app.use('/api/tiktok', tiktokRouter);
app.use('/setup',      setupRouter);

// Aggregate: GET /api/orders?days=30
app.get('/api/orders', async (req, res) => {
  const days      = parseInt(req.query.days) || 30;
  const timeFrom  = Math.floor(Date.now() / 1000) - days * 86400;
  const timeTo    = Math.floor(Date.now() / 1000);
  const isoAfter  = new Date((timeTo - days * 86400) * 1000).toISOString();
  const isoBefore = new Date(timeTo * 1000).toISOString();

  const results = await Promise.allSettled([
    fetchLocal(`/api/shopee/orders?time_from=${timeFrom}&time_to=${timeTo}&page_size=50`),
    fetchLocal(`/api/lazada/orders?created_after=${isoAfter}&created_before=${isoBefore}&limit=50`),
    fetchLocal(`/api/tiktok/orders?create_time_ge=${timeFrom}&create_time_lt=${timeTo}&page_size=50`),
  ]);

  const all      = [];
  const errors   = {};
  const platforms = ['shopee', 'lazada', 'tiktok'];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.orders) {
      all.push(...r.value.orders);
    } else {
      errors[platforms[i]] = r.reason?.message || r.value?.error || 'Unknown error';
    }
  });

  all.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ orders: all, errors });
});

async function fetchLocal(path) {
  const { default: axios } = await import('axios');
  const { data } = await axios.get(`http://localhost:${PORT}${path}`).catch(e => {
    return { data: e.response?.data || { error: e.message } };
  });
  return data;
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Start HTTP server (always)
http.createServer(app).listen(PORT, () => {
  console.log(`EcoHarvest API server running on http://localhost:${PORT}`);
});

// Start HTTPS server if certificates exist
const certPath = path.join(__dir, 'cert.pem');
const keyPath  = path.join(__dir, 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const sslOptions = {
    cert: fs.readFileSync(certPath),
    key:  fs.readFileSync(keyPath),
  };
  https.createServer(sslOptions, app).listen(SSL_PORT, () => {
    console.log(`EcoHarvest HTTPS server running on https://localhost:${SSL_PORT}`);
    console.log(`Lazada redirect URI → https://localhost:${SSL_PORT}/setup/lazada/callback`);
  });
}
