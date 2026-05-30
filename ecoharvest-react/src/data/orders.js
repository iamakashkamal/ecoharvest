export const PRODUCTS = [
  { id: 'EH-001', name: 'Organic Greens Blend',      emoji: '🥬', sku: 'SKU-001' },
  { id: 'EH-002', name: 'Wild Berry Superfood Mix',   emoji: '🫐', sku: 'SKU-002' },
  { id: 'EH-003', name: 'Matcha Ceremonial Grade',    emoji: '🍵', sku: 'SKU-003' },
  { id: 'EH-004', name: 'Spirulina Powder 500g',      emoji: '💚', sku: 'SKU-004' },
  { id: 'EH-005', name: 'Moringa Leaf Capsules',      emoji: '🌿', sku: 'SKU-005' },
  { id: 'EH-006', name: 'Ashwagandha Root Extract',   emoji: '🌱', sku: 'SKU-006' },
  { id: 'EH-007', name: 'Turmeric Golden Latte',      emoji: '✨', sku: 'SKU-007' },
  { id: 'EH-008', name: 'Collagen Peptides Boost',    emoji: '💊', sku: 'SKU-008' },
  { id: 'EH-009', name: 'Chlorella Detox Tablets',    emoji: '🔵', sku: 'SKU-009' },
  { id: 'EH-010', name: "Lion's Mane Mushroom",       emoji: '🍄', sku: 'SKU-010' },
];

export const CUSTOMERS = [
  'Sarah Tan','Wei Ming','Priya Nair','Ahmad Bin','Kelly Lim','James Ong',
  'Nurul Huda','Chen Wei','Raj Kumar','Mei Ling','David Ho','Farah Binte',
  'Marcus Lee','Siti Rohani','Kevin Goh','Aisha Begum','Terrence Wee','Yi Lin',
  'Brendan Chua','Lakshmi Devi','Hiroshi Tanaka','Emma Poh','Ryan Ng','Zara Ali',
];

export const PLATFORMS = ['shopee', 'lazada', 'tiktok'];
export const STATUSES  = ['Pending','Processing','Shipped','Delivered','Delivered','Delivered','Cancelled','Returned'];

// Seeded PRNG for reproducible data
function makePrng(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
const rng = makePrng(42);
const rndInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const rndEl  = (arr) => arr[Math.floor(rng() * arr.length)];

const BASE_DATE = new Date('2026-05-30');

export const ALL_ORDERS = Array.from({ length: 120 }, (_, i) => {
  const daysAgo = rndInt(0, 89);
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() - daysAgo);
  const platform = rndEl(PLATFORMS);
  const product  = rndEl(PRODUCTS);
  const qty      = rndInt(1, 5);
  const price    = parseFloat((rndInt(18, 120) + rng()).toFixed(2));
  const status   = rndEl(STATUSES);
  const prefix   = platform === 'shopee' ? 'SPE' : platform === 'lazada' ? 'LZD' : 'TTK';
  return {
    orderId:  `${prefix}-${String(i + 1001).padStart(5, '0')}`,
    platform, product, qty, price,
    total:    +(price * qty).toFixed(2),
    status,
    customer: rndEl(CUSTOMERS),
    date:     d,
  };
}).sort((a, b) => b.date - a.date);

export const PLATFORM_META = {
  shopee: { label: 'Shopee SG',   color: '#f05629', abbr: 'S', pillClass: 'pp-shopee' },
  lazada: { label: 'Lazada SG',   color: '#5a67f2', abbr: 'L', pillClass: 'pp-lazada' },
  tiktok: { label: 'TikTok Shop', color: '#69c9d0', abbr: 'T', pillClass: 'pp-tiktok' },
};

export const STATUS_META = {
  Pending:    { cls: 's-pending',    color: '#d29922' },
  Processing: { cls: 's-processing', color: '#58a6ff' },
  Shipped:    { cls: 's-shipped',    color: '#a371f7' },
  Delivered:  { cls: 's-delivered',  color: '#3fb950' },
  Cancelled:  { cls: 's-cancelled',  color: '#f85149' },
  Returned:   { cls: 's-returned',   color: '#8b949e' },
};

export const BASE_NOW = BASE_DATE;
