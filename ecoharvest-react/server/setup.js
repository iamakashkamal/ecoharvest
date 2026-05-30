/**
 * Self-contained setup wizard served at http://localhost:3001/setup
 * Handles TikTok shop discovery and Lazada OAuth automatically.
 * Writes values to .env on success — no manual editing needed.
 */
import express from 'express';
import crypto  from 'crypto';
import axios   from 'axios';
import fs      from 'fs';
import path    from 'path';
import { fileURLToPath } from 'url';

const router  = express.Router();
const __dir   = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dir, '../.env');

// ── .env helpers ─────────────────────────────────────────────────

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  const map   = {};
  for (const line of lines) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)/);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

function writeEnvKey(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, content, 'utf8');
}

// ── TikTok: GET /setup/tiktok/discover ───────────────────────────
router.get('/tiktok/discover', async (req, res) => {
  const env       = readEnv();
  const APP_KEY    = env.TIKTOK_APP_KEY    || process.env.TIKTOK_APP_KEY;
  const APP_SECRET = env.TIKTOK_APP_SECRET || process.env.TIKTOK_APP_SECRET;
  const TOKEN      = env.TIKTOK_ACCESS_TOKEN || process.env.TIKTOK_ACCESS_TOKEN;

  if (!APP_KEY || !APP_SECRET || !TOKEN) {
    return res.status(400).json({ error: 'TIKTOK_APP_KEY, TIKTOK_APP_SECRET and TIKTOK_ACCESS_TOKEN must be set in .env first.' });
  }

  const endpoint  = '/authorization/202309/shops';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params    = { app_key: APP_KEY, timestamp };
  const paramStr  = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  const sign      = crypto.createHmac('sha256', APP_SECRET)
                          .update(`${APP_SECRET}${endpoint}${paramStr}${APP_SECRET}`)
                          .digest('hex');

  try {
    const { data } = await axios.get(`https://open-api.tiktokglobalshop.com${endpoint}`, {
      params: { ...params, sign },
      headers: { 'x-tts-access-token': TOKEN },
      timeout: 10000,
    });

    if (data.code !== 0) {
      return res.status(400).json({ error: data.message, code: data.code, raw: data });
    }

    const shops = data.data?.shops || [];
    if (!shops.length) {
      return res.status(404).json({ error: 'No TikTok shops found for this access token.' });
    }

    // Use the first shop (most sellers have one); save it
    const shop = shops[0];
    writeEnvKey('TIKTOK_SHOP_ID', shop.id);
    // Reload process env so server picks it up without restart
    process.env.TIKTOK_SHOP_ID = shop.id;

    res.json({ success: true, shop_id: shop.id, shop_name: shop.name, all_shops: shops });
  } catch (err) {
    res.status(502).json({ error: err.response?.data || err.message });
  }
});

// ── Lazada: GET /setup/lazada/connect ────────────────────────────
// Redirects user to Lazada OAuth with the tunnel URL as callback.
router.get('/lazada/connect', (req, res) => {
  const env     = readEnv();
  const APP_KEY = env.LAZADA_APP_KEY || process.env.LAZADA_APP_KEY;
  if (!APP_KEY) return res.status(400).send('LAZADA_APP_KEY not set in .env');

  const tunnelUrl   = (env.TUNNEL_URL || process.env.TUNNEL_URL || '').trim();
  const callbackUrl = tunnelUrl
    ? `${tunnelUrl}/setup/lazada/callback`
    : `http://localhost:${process.env.PORT || 3001}/setup/lazada/callback`;
  const authUrl = `https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(callbackUrl)}&client_id=${APP_KEY}&country=sg`;
  res.redirect(authUrl);
});

// ── Lazada: POST /setup/lazada/exchange — manual code entry ──────
router.post('/lazada/exchange', express.json(), async (req, res) => {
  const code = req.body.code || req.query.code;
  if (!code) return res.status(400).json({ error: 'No code provided.' });
  await exchangeLazadaCode(code, res);
});

// ── Shared: exchange Lazada auth code for token ───────────────────
async function exchangeLazadaCode(code, res) {
  const env        = readEnv();
  const APP_KEY    = env.LAZADA_APP_KEY    || process.env.LAZADA_APP_KEY;
  const APP_SECRET = env.LAZADA_APP_SECRET || process.env.LAZADA_APP_SECRET;

  if (!APP_KEY || !APP_SECRET) {
    return res.status(400).json({ error: 'LAZADA_APP_KEY and LAZADA_APP_SECRET must be set in .env.' });
  }

  const path      = '/auth/token/create';
  const timestamp = new Date().toISOString();
  const params    = { app_key: APP_KEY, timestamp, sign_method: 'sha256', code };
  const sorted    = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  params.sign     = crypto.createHmac('sha256', APP_SECRET).update(`${path}${sorted}`).digest('hex').toUpperCase();

  try {
    const { data } = await axios.get('https://auth.lazada.com/rest/auth/token/create', { params, timeout: 10000 });

    if (data.code !== '0') {
      return res.status(400).json({ error: `Lazada token error: ${data.message} (${data.code})` });
    }

    writeEnvKey('LAZADA_ACCESS_TOKEN',  data.access_token);
    writeEnvKey('LAZADA_REFRESH_TOKEN', data.refresh_token);
    process.env.LAZADA_ACCESS_TOKEN = data.access_token;
    return res.json({ success: true, message: 'Lazada connected! Token saved to .env.' });
  } catch (err) {
    return res.status(502).json({ error: err.response?.data?.message || err.message });
  }
}

// ── Lazada: GET /setup/lazada/callback ───────────────────────────
router.get('/lazada/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No authorization code received from Lazada.');
  }

  const env        = readEnv();
  const APP_KEY    = env.LAZADA_APP_KEY    || process.env.LAZADA_APP_KEY;
  const APP_SECRET = env.LAZADA_APP_SECRET || process.env.LAZADA_APP_SECRET;

  if (!APP_KEY || !APP_SECRET) {
    return res.status(400).send('LAZADA_APP_KEY and LAZADA_APP_SECRET must be set in .env.');
  }

  const path      = '/auth/token/create';
  const timestamp = new Date().toISOString();
  const params    = { app_key: APP_KEY, timestamp, sign_method: 'sha256', code };
  const sorted    = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  params.sign     = crypto.createHmac('sha256', APP_SECRET).update(`${path}${sorted}`).digest('hex').toUpperCase();

  try {
    const { data } = await axios.get('https://auth.lazada.com/rest/auth/token/create', { params, timeout: 10000 });

    if (data.code !== '0') {
      return res.status(400).send(`Lazada token error: ${data.message} (${data.code})`);
    }

    const accessToken  = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn    = data.expires_in;

    writeEnvKey('LAZADA_ACCESS_TOKEN',  accessToken);
    writeEnvKey('LAZADA_REFRESH_TOKEN', refreshToken);
    process.env.LAZADA_ACCESS_TOKEN = accessToken;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lazada Connected</title>
          <style>
            body { font-family: sans-serif; background: #0d1117; color: #e6edf3; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
            .box { background:#161b22; border:1px solid #2a3241; border-radius:12px; padding:40px; text-align:center; max-width:400px; }
            h2 { color:#3fb950; margin-bottom:12px; }
            p  { color:#8b949e; font-size:14px; }
            .token { font-family:monospace; font-size:11px; background:#1c2230; padding:8px 12px; border-radius:6px; word-break:break-all; margin:12px 0; color:#58a6ff; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>✅ Lazada Connected!</h2>
            <p>Access token saved to <code>.env</code> automatically.</p>
            <div class="token">${accessToken.slice(0, 40)}…</div>
            <p>Expires in ${Math.round(expiresIn / 3600)} hours.<br/>You can close this tab and return to the dashboard.</p>
          </div>
          <script>setTimeout(() => window.close(), 4000);</script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(502).send(`Token exchange failed: ${err.response?.data?.message || err.message}`);
  }
});

// ── Lazada: GET /setup/lazada/refresh ────────────────────────────
// Refreshes expired Lazada token using saved refresh token.
router.get('/lazada/refresh', async (req, res) => {
  const env          = readEnv();
  const APP_KEY      = env.LAZADA_APP_KEY      || process.env.LAZADA_APP_KEY;
  const APP_SECRET   = env.LAZADA_APP_SECRET   || process.env.LAZADA_APP_SECRET;
  const REFRESH_TOKEN = env.LAZADA_REFRESH_TOKEN || process.env.LAZADA_REFRESH_TOKEN;

  if (!REFRESH_TOKEN) {
    return res.status(400).json({ error: 'No refresh token found. Please connect Lazada first.' });
  }

  const path      = '/auth/token/refresh';
  const timestamp = new Date().toISOString();
  const params    = { app_key: APP_KEY, timestamp, sign_method: 'sha256', refresh_token: REFRESH_TOKEN };
  const sorted    = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  params.sign     = crypto.createHmac('sha256', APP_SECRET).update(`${path}${sorted}`).digest('hex').toUpperCase();

  try {
    const { data } = await axios.get('https://auth.lazada.com/rest/auth/token/refresh', { params, timeout: 10000 });
    if (data.code !== '0') return res.status(400).json({ error: data.message });
    writeEnvKey('LAZADA_ACCESS_TOKEN',  data.access_token);
    writeEnvKey('LAZADA_REFRESH_TOKEN', data.refresh_token);
    process.env.LAZADA_ACCESS_TOKEN = data.access_token;
    res.json({ success: true, message: 'Lazada token refreshed.' });
  } catch (err) {
    res.status(502).json({ error: err.response?.data || err.message });
  }
});

// ── Setup Wizard HTML: GET /setup ────────────────────────────────
router.get('/', (req, res) => {
  const env    = readEnv();
  const hasTT  = !!(env.TIKTOK_SHOP_ID && env.TIKTOK_SHOP_ID !== '202309' && env.TIKTOK_SHOP_ID.trim());
  const hasLaz = !!(env.LAZADA_ACCESS_TOKEN && env.LAZADA_ACCESS_TOKEN.trim());

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>EcoHarvest — Platform Setup</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .wrap{max-width:600px;width:100%}
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
    .logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#3fb950,#58a6ff);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
    .logo-text{font-size:20px;font-weight:800}
    .logo-sub{font-size:12px;color:#8b949e}
    h1{font-size:22px;font-weight:800;margin-bottom:6px}
    .subtitle{color:#8b949e;font-size:14px;margin-bottom:28px}
    .card{background:#161b22;border:1px solid #2a3241;border-radius:12px;padding:24px;margin-bottom:16px}
    .card-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}
    .plat-logo{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0}
    .pl-tiktok{background:#111;color:#69c9d0;border:1px solid #69c9d0}
    .pl-lazada{background:#5a67f2;color:#fff}
    .card-title{font-size:16px;font-weight:700}
    .card-sub{font-size:12px;color:#8b949e;margin-top:2px}
    .status-ok  {display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(63,185,80,.12);color:#3fb950;margin-left:auto}
    .status-na  {display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(248,81,73,.12);color:#f85149;margin-left:auto}
    .steps{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
    .step{display:flex;gap:12px;font-size:13px;color:#8b949e}
    .step-num{width:22px;height:22px;border-radius:50%;background:#1c2230;border:1px solid #2a3241;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#58a6ff;flex-shrink:0}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:opacity .15s;text-decoration:none}
    .btn-tiktok{background:#69c9d0;color:#000}
    .btn-lazada{background:#5a67f2;color:#fff}
    .btn:hover{opacity:.85}
    .btn:disabled{opacity:.45;cursor:not-allowed}
    #tt-result,#laz-note{margin-top:14px;padding:12px 16px;border-radius:8px;font-size:13px;display:none}
    .result-ok  {background:rgba(63,185,80,.1);border:1px solid rgba(63,185,80,.3);color:#3fb950}
    .result-err {background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);color:#f85149}
    .note-box{background:rgba(88,166,255,.08);border:1px solid rgba(88,166,255,.2);border-radius:8px;padding:14px;font-size:13px;color:#8b949e;margin-top:14px}
    .note-box a{color:#58a6ff}
    code{background:#1c2230;padding:2px 6px;border-radius:4px;font-size:12px}
    .done-banner{background:rgba(63,185,80,.08);border:1px solid rgba(63,185,80,.25);border-radius:8px;padding:14px 18px;text-align:center;color:#3fb950;font-size:14px;font-weight:600;margin-bottom:24px;display:none}
    .back-link{display:block;text-align:center;margin-top:24px;color:#58a6ff;font-size:13px;text-decoration:none}
  </style>
</head>
<body>
<div class="wrap">
  <div class="logo">
    <div class="logo-icon">🌿</div>
    <div><div class="logo-text">EcoHarvest</div><div class="logo-sub">Platform Setup Wizard</div></div>
  </div>

  <h1>Connect your platforms</h1>
  <p class="subtitle">Follow the steps below to finish connecting TikTok Shop and Lazada SG. Credentials are saved automatically to your <code>.env</code> file.</p>

  <div class="done-banner" id="all-done">🎉 All platforms connected! You can close this tab and refresh the dashboard.</div>

  <!-- TikTok Card -->
  <div class="card">
    <div class="card-header">
      <div class="plat-logo pl-tiktok">T</div>
      <div>
        <div class="card-title">TikTok Shop</div>
        <div class="card-sub">Discover your Shop ID automatically</div>
      </div>
      ${hasTT
        ? '<span class="status-ok">✓ Connected</span>'
        : '<span class="status-na">● Needs Shop ID</span>'
      }
    </div>
    ${hasTT
      ? `<p style="font-size:13px;color:#8b949e">Shop ID <code>${env.TIKTOK_SHOP_ID}</code> already saved.</p>`
      : `<div class="steps">
          <div class="step"><div class="step-num">1</div><span>Click the button — we call the TikTok API using your existing access token</span></div>
          <div class="step"><div class="step-num">2</div><span>Your Shop ID is discovered and saved to <code>.env</code> automatically</span></div>
        </div>
        <button class="btn btn-tiktok" id="tt-btn" onclick="discoverTikTok()">🎵 Discover Shop ID</button>
        <div id="tt-result"></div>`
    }
  </div>

  <!-- Lazada Card -->
  <div class="card">
    <div class="card-header">
      <div class="plat-logo pl-lazada">L</div>
      <div>
        <div class="card-title">Lazada SG</div>
        <div class="card-sub">Authorise via OAuth — one click, done automatically</div>
      </div>
      ${hasLaz
        ? '<span class="status-ok">✓ Connected</span>'
        : '<span class="status-na">● Needs OAuth token</span>'
      }
    </div>
    ${hasLaz
      ? `<p style="font-size:13px;color:#8b949e">Access token already saved.</p>`
      : `<div class="steps">
          <div class="step"><div class="step-num">1</div><span>Click "Connect Lazada" — Lazada login page opens</span></div>
          <div class="step"><div class="step-num">2</div><span>Log in and click <strong>Authorise</strong></span></div>
          <div class="step"><div class="step-num">3</div><span>Copy the full URL you are redirected to and paste it below</span></div>
          <div class="step"><div class="step-num">4</div><span>Click <strong>Submit</strong> — token saved automatically</span></div>
        </div>
        <a class="btn btn-lazada" href="/setup/lazada/connect" target="_blank">🏪 Connect Lazada</a>
        <br/><br/>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="laz-url" type="text" placeholder="Paste the full redirect URL here…"
            style="flex:1;background:#1c2230;border:1px solid #2a3241;color:#e6edf3;padding:10px 12px;border-radius:8px;font-size:13px;outline:none"/>
          <button class="btn btn-lazada" onclick="submitLazadaUrl()">Submit</button>
        </div>
        <div id="laz-note" style="margin-top:12px;display:none"></div>`
    }
  </div>

  <a class="back-link" href="http://localhost:5173">← Back to dashboard</a>
</div>

<script>
async function discoverTikTok() {
  const btn = document.getElementById('tt-btn');
  const out = document.getElementById('tt-result');
  btn.disabled = true;
  btn.textContent = 'Discovering…';
  out.style.display = 'none';

  try {
    const res  = await fetch('/setup/tiktok/discover');
    const data = await res.json();

    if (data.success) {
      out.className = 'result-ok';
      out.innerHTML = '✅ Shop ID <code>' + data.shop_id + '</code> (' + data.shop_name + ') saved to .env!';
      btn.style.display = 'none';
      checkAllDone();
    } else {
      out.className = 'result-err';
      out.textContent = '❌ ' + (data.error || 'Unknown error');
      btn.disabled = false;
      btn.textContent = '🎵 Retry';
    }
  } catch(e) {
    out.className = 'result-err';
    out.textContent = '❌ Request failed — is the server running?';
    btn.disabled = false;
    btn.textContent = '🎵 Retry';
  }
  out.style.display = 'block';
}

async function submitLazadaUrl() {
  const input = document.getElementById('laz-url');
  const out   = document.getElementById('laz-note');
  const raw   = input.value.trim();
  if (!raw) { alert('Please paste the redirect URL first.'); return; }

  // Extract code from URL
  let code;
  try {
    const url = new URL(raw);
    code = url.searchParams.get('code');
  } catch(e) {
    // Maybe they pasted just the code
    code = raw;
  }

  if (!code) { alert('Could not find a code in that URL. Please paste the full redirect URL.'); return; }

  out.style.display = 'block';
  out.style.cssText = 'margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px;background:rgba(88,166,255,.08);border:1px solid rgba(88,166,255,.2);color:#8b949e;display:block';
  out.textContent = 'Exchanging code for token…';

  try {
    const res  = await fetch('/setup/lazada/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.success) {
      out.style.cssText = 'margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px;background:rgba(63,185,80,.1);border:1px solid rgba(63,185,80,.3);color:#3fb950;display:block';
      out.textContent = '✅ Lazada connected! Token saved to .env.';
      checkAllDone();
    } else {
      out.style.cssText = 'margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px;background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);color:#f85149;display:block';
      out.textContent = '❌ ' + (data.error || 'Unknown error');
    }
  } catch(e) {
    out.style.cssText = 'margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px;background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);color:#f85149;display:block';
    out.textContent = '❌ Request failed.';
  }
}

function checkAllDone() {
  const cards = document.querySelectorAll('.status-na');
  const results = document.querySelectorAll('.result-ok');
  if (cards.length === results.length) {
    document.getElementById('all-done').style.display = 'block';
  }
}
</script>
</body>
</html>`);
});

export default router;
