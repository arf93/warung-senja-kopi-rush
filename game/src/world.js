// The game's rules and state, with no drawing and no browser in it: the
// warung's five stools, customers with orders and patience, serving, combo
// and coins, three shifts with rising targets, and the win and lose rules.
// step() advances one fixed step and returns what happened as bit flags, so
// the caller can react (and play sounds) without the world knowing about
// screens or sound. Nothing here allocates after createWorld returns.
import { CUSTOMER_NAMES, DAYS, HAIRS, MAX_WALKOUTS, MENU, MENU_ORDER, SEATS, SHIRTS, SKINS } from './config.js';

export const EVENT_SERVE = 1;
export const EVENT_COIN = 2;
export const EVENT_WRONG = 4;
export const EVENT_WALKOUT = 8;
export const EVENT_ARRIVE = 16;
export const EVENT_DAYCLEAR = 32;
export const EVENT_WIN = 64;
export const EVENT_LOSE = 128;
export const EVENT_DAYSTART = 256;

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function comboMultiplier(combo) {
  if (combo >= 9) return 3;
  if (combo >= 4) return 2;
  return 1;
}

export function createWorld(random) {
  const customers = [];
  for (let i = 0; i < SEATS.length; i += 1) {
    customers.push({
      active: false, seat: i, name: '', shirt: '#888', skin: '#f2c79b', hair: '#221a12',
      order: [], patience: 1, patienceMax: 30, mood: 'happy', bob: 0, leaveTimer: 0, leaving: false,
    });
  }
  const floaters = [];
  for (let i = 0; i < 24; i += 1) floaters.push({ active: false, x: 0, y: 0, text: '', color: '#fff', life: 0 });
  const particles = [];
  for (let i = 0; i < 80; i += 1) particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff', size: 3 });

  const state = {
    customers, floaters, particles,
    status: 'idle', // idle | playing | dayclear | won | lost
    loseReason: '',
    day: 0, coins: 0, totalCoins: 0, target: DAYS[0].target, timeLeft: DAYS[0].duration,
    walkouts: 0, combo: 0, bestCombo: 0, served: 0, servedWrong: 0,
    selected: -1, spawnTimer: 1.2, elapsed: 0, dayClearTimer: 0,
  };

  function addFloater(x, y, text, color) {
    for (const f of floaters) {
      if (f.active) continue;
      f.active = true; f.x = x; f.y = y; f.text = text; f.color = color; f.life = 1.1;
      return;
    }
  }

  function burst(x, y, color, n) {
    let made = 0;
    for (const p of particles) {
      if (p.active) continue;
      p.active = true;
      p.x = x; p.y = y;
      p.vx = (random() - 0.5) * 260; p.vy = -random() * 220 - 40;
      p.life = 0.55 + random() * 0.35; p.color = color; p.size = 2 + random() * 4;
      made += 1;
      if (made >= n) return;
    }
  }

  function makeOrder(dayCfg) {
    const count = dayCfg.itemsMax > 1 && random() < 0.45 ? 2 : 1;
    const items = [];
    const pool = MENU_ORDER.slice();
    for (let i = 0; i < count; i += 1) {
      const idx = Math.floor(random() * pool.length);
      items.push(pool.splice(idx, 1)[0]);
    }
    return items;
  }

  function spawnCustomer() {
    const free = customers.filter((c) => !c.active);
    if (free.length === 0) return false;
    const c = free[Math.floor(random() * free.length)];
    const dayCfg = DAYS[state.day];
    c.active = true;
    c.leaving = false;
    c.leaveTimer = 0;
    const used = new Set(customers.filter((o) => o.active).map((o) => o.name));
    const freeNames = CUSTOMER_NAMES.filter((n) => !used.has(n));
    c.name = freeNames.length > 0 ? pick(random, freeNames) : pick(random, CUSTOMER_NAMES);
    c.shirt = pick(random, SHIRTS);
    c.skin = pick(random, SKINS);
    c.hair = pick(random, HAIRS);
    c.order = makeOrder(dayCfg);
    c.patienceMax = dayCfg.patience * (0.9 + random() * 0.25);
    c.patience = 1;
    c.mood = 'happy';
    c.bob = random() * Math.PI * 2;
    if (state.selected < 0) state.selected = c.seat;
    return true;
  }

  function reset() {
    for (const c of customers) { c.active = false; c.leaving = false; c.order = []; }
    for (const f of floaters) f.active = false;
    for (const p of particles) p.active = false;
    state.status = 'idle';
    state.loseReason = '';
    state.day = 0;
    state.coins = 0;
    state.totalCoins = 0;
    state.target = DAYS[0].target;
    state.timeLeft = DAYS[0].duration;
    state.walkouts = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.servedWrong = 0;
    state.selected = -1;
    state.spawnTimer = 1.0;
    state.elapsed = 0;
    state.dayClearTimer = 0;
  }

  function startDay(day) {
    state.day = day;
    state.coins = 0;
    state.target = DAYS[day].target;
    state.timeLeft = DAYS[day].duration;
    state.spawnTimer = 0.8;
    state.combo = 0;
    state.status = 'playing';
    for (const c of customers) { c.active = false; c.leaving = false; c.order = []; }
    state.selected = -1;
    spawnCustomer();
    spawnCustomer();
  }

  function startGame() {
    reset();
    startDay(0);
  }

  function selectSeat(seat) {
    const c = customers[seat];
    if (c && c.active && !c.leaving) state.selected = seat;
  }

  function cycleSelection(dir) {
    const active = customers.filter((c) => c.active && !c.leaving).map((c) => c.seat);
    if (active.length === 0) return;
    const cur = active.indexOf(state.selected);
    const next = cur < 0 ? 0 : (cur + dir + active.length) % active.length;
    state.selected = active[next];
  }

  /** Serve one menu item to the selected customer. Returns an event flag. */
  function serve(itemId) {
    if (state.status !== 'playing') return 0;
    const c = customers[state.selected];
    if (!c || !c.active || c.leaving) return 0;
    const idx = c.order.indexOf(itemId);
    const seat = SEATS[c.seat];
    if (idx < 0) {
      state.combo = 0;
      state.servedWrong += 1;
      c.patience = Math.max(0, c.patience - 0.12);
      addFloater(seat.x, seat.y - 130, 'Salah!', '#ff5e6e');
      return EVENT_WRONG;
    }
    c.order.splice(idx, 1);
    state.combo += 1;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    const mult = comboMultiplier(state.combo);
    const earned = MENU[itemId].price * mult;
    state.coins += earned;
    state.totalCoins += earned;
    state.served += 1;
    addFloater(seat.x, seat.y - 130, '+' + earned + (mult > 1 ? ' x' + mult : ''), '#f2c94c');
    burst(seat.x, seat.y - 60, '#ffd76e', 8);
    if (c.order.length === 0) {
      c.leaving = true;
      c.leaveTimer = 0.45;
      addFloater(seat.x, seat.y - 165, 'Terima kasih!', '#7ddc6a');
      if (state.selected === c.seat) {
        const rest = customers.filter((o) => o.active && !o.leaving && o.seat !== c.seat);
        state.selected = rest.length > 0 ? rest[0].seat : -1;
      }
    }
    return EVENT_SERVE | EVENT_COIN;
  }

  function step(dt, harmless) {
    let events = 0;
    state.elapsed += dt;
    for (const f of floaters) {
      if (!f.active) continue;
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) f.active = false;
    }
    for (const p of particles) {
      if (!p.active) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 480 * dt;
      if (p.life <= 0) p.active = false;
    }
    for (const c of customers) c.bob += dt * 2.2;

    if (state.status === 'dayclear') {
      state.dayClearTimer -= dt;
      if (state.dayClearTimer <= 0) {
        startDay(state.day + 1);
        events |= EVENT_DAYSTART;
      }
      return events;
    }
    if (state.status !== 'playing' && !harmless) return events;

    // Title backdrop: customers drift in, patience frozen, no timer, no walkouts.
    if (harmless) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        if (spawnCustomer()) events |= EVENT_ARRIVE;
        state.spawnTimer = 2.2;
      }
      return events;
    }

    state.timeLeft -= dt;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (spawnCustomer()) events |= EVENT_ARRIVE;
      state.spawnTimer = DAYS[state.day].spawn * (0.85 + random() * 0.3);
    }

    for (const c of customers) {
      if (!c.active) continue;
      if (c.leaving) {
        c.leaveTimer -= dt;
        if (c.leaveTimer <= 0) c.active = false;
        continue;
      }
      c.patience -= dt / c.patienceMax;
      c.mood = c.patience > 0.55 ? 'happy' : c.patience > 0.28 ? 'worried' : 'angry';
      if (c.patience <= 0) {
        c.active = false;
        state.walkouts += 1;
        state.combo = 0;
        events |= EVENT_WALKOUT;
        addFloater(SEATS[c.seat].x, SEATS[c.seat].y - 130, 'Pergi marah!', '#ff5e6e');
        if (state.selected === c.seat) {
          const rest = customers.filter((o) => o.active && !o.leaving);
          state.selected = rest.length > 0 ? rest[0].seat : -1;
        }
        if (state.walkouts >= MAX_WALKOUTS) {
          state.status = 'lost';
          state.loseReason = '5 pelanggan pergi marah. Warung sepi...';
          events |= EVENT_LOSE;
          return events;
        }
      }
    }

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      if (state.coins >= state.target) {
        if (state.day >= DAYS.length - 1) {
          state.status = 'won';
          events |= EVENT_WIN;
        } else {
          state.status = 'dayclear';
          state.dayClearTimer = 2.6;
          events |= EVENT_DAYCLEAR;
        }
      } else {
        state.status = 'lost';
        state.loseReason = 'Target hari ' + (state.day + 1) + ' tidak tercapai.';
        events |= EVENT_LOSE;
      }
    }
    return events;
  }

  reset();
  return { state, reset, startGame, startDay, step, serve, selectSeat, cycleSelection, spawnCustomer };
}
