/**
 * POST /api/settings/credentials  — save credentials to .env
 * GET  /api/settings/status       — connection status for all platforms
 */
import express from 'express';
import fs      from 'fs';
import path    from 'path';
import { fileURLToPath } from 'url';

const router   = express.Router();
const __dir    = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dir, '../.env');

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const map = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
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

const PLATFORM_KEYS = {
  shopee: ['SHOPEE_PARTNER_ID', 'SHOPEE_PARTNER_KEY', 'SHOPEE_SHOP_ID', 'SHOPEE_ACCESS_TOKEN'],
  lazada: ['LAZADA_APP_KEY', 'LAZADA_APP_SECRET', 'LAZADA_ACCESS_TOKEN'],
  tiktok: ['TIKTOK_APP_KEY', 'TIKTOK_APP_SECRET', 'TIKTOK_SHOP_ID', 'TIKTOK_ACCESS_TOKEN'],
};

// GET /api/settings/status
router.get('/status', (req, res) => {
  const env = readEnv();
  const status = {};
  for (const [platform, keys] of Object.entries(PLATFORM_KEYS)) {
    status[platform] = keys.every(k => !!(env[k] || process.env[k]));
  }
  res.json(status);
});

// GET /api/settings/credentials/:platform — returns masked values
router.get('/credentials/:platform', (req, res) => {
  const { platform } = req.params;
  const keys = PLATFORM_KEYS[platform];
  if (!keys) return res.status(404).json({ error: 'Unknown platform' });

  const env    = readEnv();
  const result = {};
  for (const k of keys) {
    const val = env[k] || process.env[k] || '';
    // Mask middle of value for display
    result[k] = val.length > 8
      ? val.slice(0, 4) + '•'.repeat(Math.min(val.length - 8, 20)) + val.slice(-4)
      : val ? '••••••••' : '';
  }
  res.json(result);
});

// POST /api/settings/credentials — save one or more keys
router.post('/credentials', (req, res) => {
  const updates = req.body; // { KEY: value, ... }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const allowedKeys = Object.values(PLATFORM_KEYS).flat();
  const saved = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) continue;
    writeEnvKey(key, value);
    process.env[key] = value; // hot-reload without restart
    saved.push(key);
  }

  res.json({ success: true, saved });
});

export default router;
