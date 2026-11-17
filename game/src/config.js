// WARUNG SENJA - Kopi Rush: every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Five stools along the warung counter, left to right. */
export const SEATS = [
  { x: 170, y: 400 },
  { x: 395, y: 400 },
  { x: 620, y: 400 },
  { x: 845, y: 400 },
  { x: 1070, y: 400 },
];

export const MENU = {
  kopi: { id: 'kopi', name: 'Kopi Tubruk', short: 'KOPI', price: 30, key: '1', color: '#6b3f1d', cup: '#8a5a2b' },
  teh: { id: 'teh', name: 'Teh Manis', short: 'TEH', price: 20, key: '2', color: '#d98a1f', cup: '#e8b04b' },
  goreng: { id: 'goreng', name: 'Gorengan', short: 'GORENGAN', price: 25, key: '3', color: '#e8a93c', cup: '#c97e1f' },
  nasi: { id: 'nasi', name: 'Nasi Kucing', short: 'NASI KUCING', price: 35, key: '4', color: '#7da05a', cup: '#5d7f3e' },
};
export const MENU_ORDER = ['kopi', 'teh', 'goreng', 'nasi'];

/** One shift per day: target coins, shift length, spawn gap, patience seconds. */
export const DAYS = [
  { target: 500, duration: 75, spawn: 3.2, patience: 26, itemsMax: 1 },
  { target: 750, duration: 70, spawn: 2.7, patience: 22, itemsMax: 2 },
  { target: 1000, duration: 65, spawn: 2.3, patience: 19, itemsMax: 2 },
];

export const MAX_WALKOUTS = 5;
export const CUSTOMER_NAMES = ['Budi', 'Sari', 'Agus', 'Dewi', 'Joko', 'Rina', 'Slamet', 'Putri', 'Bambang', 'Lestari', 'Wawan', 'Ayu'];
export const SHIRTS = ['#c94f4f', '#4f7ec9', '#4fae62', '#c9a24f', '#8a5fc9', '#c96ba0', '#4fb3ae', '#d2691e'];
export const SKINS = ['#f2c79b', '#e8b184', '#d99e6f', '#c98d5f'];
export const HAIRS = ['#221a12', '#3a2a1a', '#111111', '#5a4632', '#7a7a7a'];

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

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best coins total is kept between visits (this browser only). */
export const BEST_KEY = 'warung-senja.best-coins';
