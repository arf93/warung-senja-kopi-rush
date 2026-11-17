// WARUNG SENJA - Kopi Rush: every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Six stools along the warung counter, left to right. Seat 5 (the sixth)
 *  starts locked behind a cloth: it opens only once the player buys the
 *  "Kursi Tambahan" upgrade in the shop between shifts. */
export const SEATS = [
  { x: 120, y: 400 },
  { x: 330, y: 400 },
  { x: 540, y: 400 },
  { x: 750, y: 400 },
  { x: 960, y: 400 },
  { x: 1170, y: 400 },
];

export const MENU = {
  kopi: { id: 'kopi', name: 'Kopi Tubruk', short: 'KOPI', price: 30, key: '1', color: '#6b3f1d', cup: '#8a5a2b' },
  teh: { id: 'teh', name: 'Teh Manis', short: 'TEH', price: 20, key: '2', color: '#d98a1f', cup: '#e8b04b' },
  goreng: { id: 'goreng', name: 'Gorengan', short: 'GORENGAN', price: 25, key: '3', color: '#e8a93c', cup: '#c97e1f' },
  nasi: { id: 'nasi', name: 'Nasi Kucing', short: 'NASI KUCING', price: 35, key: '4', color: '#7da05a', cup: '#5d7f3e' },
  esteh: { id: 'esteh', name: 'Es Teh', short: 'ES TEH', price: 25, key: '5', color: '#3a7d9e', cup: '#7ec8e3' },
};
export const MENU_ORDER = ['kopi', 'teh', 'goreng', 'nasi', 'esteh'];

/** One shift per day: target coins, shift length, spawn gap, patience seconds.
 *  v3 targets are ~18% above v2 (550/800/1100): Rush Hour pays 1.5x for
 *  15 s of every shift, the sixth seat and the fan lift throughput, so the
 *  challenge stays the same. Shop prices are paid from total coins. */
export const DAYS = [
  { target: 650, duration: 75, spawn: 3.2, patience: 26, itemsMax: 1 },
  { target: 950, duration: 70, spawn: 2.7, patience: 22, itemsMax: 2 },
  { target: 1300, duration: 65, spawn: 2.3, patience: 19, itemsMax: 2 },
];

/** The shop between shifts: one-time upgrades, bought with total coins.
 *  Each one changes the game visibly (stove flame, sixth stool, ceiling
 *  fan) and mechanically, so the choice is real, not decoration. */
export const UPGRADES = [
  { id: 'stove', name: 'Kompor Baru', icon: '🔥', price: 150, desc: 'Sajian 25% lebih cepat:', desc2: 'pelanggan pulang lebih cepat,' },
  { id: 'seat', name: 'Kursi Tambahan', icon: '🪑', price: 200, desc: 'Kursi ke-6 terbuka:', desc2: 'satu pelanggan lagi duduk.' },
  { id: 'fan', name: 'Kipas Angin', icon: '🌀', price: 150, desc: 'Kesabaran pelanggan', desc2: 'berkurang 20% lebih lambat.' },
];
/** Rush Hour: once per shift, at 40% through it, customers arrive twice
 *  as fast for 15 seconds and every coin pays 1.5x. */
export const RUSH = { startFrac: 0.4, duration: 15, coinMult: 1.5, spawnMult: 0.5 };

export const MAX_WALKOUTS = 5;

/** VIP: "Pak Lurah" drops by now and then — gold outline, short patience,
 *  pays double. High risk, high reward: serve him first. */
export const VIP_NAME = 'Pak Lurah';
export const VIP_CHANCE = 0.12;
export const VIP_PATIENCE = 0.7;
export const VIP_PAY = 2;

export const CUSTOMER_NAMES = ['Budi', 'Sari', 'Agus', 'Dewi', 'Joko', 'Rina', 'Slamet', 'Putri', 'Bambang', 'Lestari', 'Wawan', 'Ayu'];
export const SHIRTS = ['#c94f4f', '#4f7ec9', '#4fae62', '#c9a24f', '#8a5fc9', '#c96ba0', '#4fb3ae', '#d2691e', '#e06a8a', '#5a8a4f', '#9a6bc9', '#c95f3c'];
export const SKINS = ['#f2c79b', '#e8b184', '#d99e6f', '#c98d5f', '#f7d3a8', '#c07a4e'];
export const HAIRS = ['#221a12', '#3a2a1a', '#111111', '#5a4632', '#7a7a7a', '#8a6a3a'];
export const HIJAB_COLORS = ['#c96ba0', '#4f7ec9', '#7da05a', '#8a5fc9', '#d2691e'];

export const PALETTE = {
  backdrop: '#1a1026',
  skyTop: '#2b1b4d',
  skyMid: '#b34a5e',
  skyLow: '#ff9a4d',
  sun: '#ffd76e',
  sunGlow: '#ffcf5e',
  mountain: '#4a2b52',
  roof: '#2e1a33',
  tugu: '#e8c98a',
  ground: '#3a2430',
  counterTop: '#8a5a2b',
  counterFront: '#5d3a1a',
  counterTrim: '#c98d4b',
  tray: '#241722',
  trayEdge: '#4a2b3a',
  panel: '#241722',
  panelEdge: '#ff9a4d',
  text: '#fff3e0',
  muted: '#d9b8a3',
  coin: '#f2c94c',
  heart: '#ff5e6e',
  heartEmpty: '#5a3340',
  patienceGood: '#7ddc6a',
  patienceMid: '#f2c94c',
  patienceBad: '#ff5e6e',
  selected: '#ffd76e',
  button: '#ff7a3c',
  buttonDark: '#c94f1e',
};

/** One sky per shift: golden dusk, deep orange, then night with stars,
 *  a pale moon and the warung lamps fully lit. lampGlow is the lamps'
 *  brightness, 0 (off) to 1 (full). */
export const SHIFT_SKIES = [
  { top: '#2b1b4d', mid: '#b34a5e', low: '#ff9a4d', sun: '#ffd76e', sunY: 330, sunR: 52, stars: false, lampGlow: 0.35 },
  { top: '#241040', mid: '#8e2f52', low: '#ff7a2e', sun: '#ffb347', sunY: 352, sunR: 58, stars: false, lampGlow: 0.6 },
  { top: '#0d0a24', mid: '#3a1c4d', low: '#c65a6e', sun: '#ffe9a8', sunY: 170, sunR: 38, stars: true, lampGlow: 1 },
];

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best coins total is kept between visits (this browser only). */
export const BEST_KEY = 'warung-senja.best-coins';
