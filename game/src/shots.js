// The screenshot scenes behind ?shot=start|play|combo|end|shop. Each one
// plays the real rules forward from a fresh world for a fixed number of
// steps, steered by a simple autopilot (serve the most impatient customer's
// order), so the frame is what a short game really looks like and the same
// seed always gives the same frame.
import { STEP, UPGRADES } from './config.js';
import { EVENT_LOSE, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 40;
const COMBO_SECONDS = 60;
const END_LIMIT_SECONDS = 900;
const SHOP_LIMIT_SECONDS = 200;

/**
 * Serve the most impatient seated customer, one correct item per call, and
 * only once the customer has waited a little: the scene stays busy with
 * seated customers, order bubbles and draining patience bars instead of
 * emptying the warung the instant anyone sits down.
 */
function autopilot(world) {
  const s = world.state;
  let best = null;
  for (const c of s.customers) {
    if (!c.active || c.leaving || c.order.length === 0) continue;
    if (!best || c.patience < best.patience) best = c;
  }
  if (!best || best.patience > 0.82) return;
  world.selectSeat(best.seat);
  world.serve(best.order[0]);
}

/** In the shop, the autopilot buys the first upgrade it can afford, then
 *  moves on to the next shift — the same choices a player makes. */
function autopilotShop(world) {
  const s = world.state;
  if (s.status !== 'shop') return;
  for (const u of UPGRADES) {
    if (!s.upgrades[u.id] && s.totalCoins >= u.price) {
      world.buyUpgrade(u.id);
      break;
    }
  }
  world.nextDay();
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'combo' && name !== 'end' && name !== 'shop') {
    world.startGame();
    // Title backdrop: run in harmless mode by stepping the world while its
    // status is playing but freezing the clock via a fresh reset + idle steps.
    world.reset();
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.startGame();
  if (name === 'shop') {
    // Play until the first shift ends and the shop opens, then stop there.
    for (let i = 0; i < SHOP_LIMIT_SECONDS / STEP; i += 1) {
      autopilot(world);
      world.step(STEP, false);
      if (world.state.status === 'shop') break;
      if (world.state.status === 'won' || world.state.status === 'lost') break;
    }
    return { screen: SCREEN_SHOP, best: world.state.totalCoins };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'combo' ? COMBO_SECONDS : PLAY_SECONDS;
  let events = 0;
  let cooldown = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    if (cooldown > 0) cooldown -= 1;
    else {
      autopilot(world);
      cooldown = 55;
    }
    if (world.state.status === 'shop') autopilotShop(world);
    events = world.step(STEP, false);
    // Combo shot: only stop on a good combo well into the Rush Hour crowd
    // (rush runs 30–45 s), so the frame is busy and distinct from the
    // 40 s play shot, not an early quiet moment.
    if (name === 'combo' && world.state.combo >= 5 && i * STEP >= 50) break;
    if (events & (EVENT_WIN | EVENT_LOSE)) break;
  }
  const over = world.state.status === 'won' || world.state.status === 'lost';
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.totalCoins };
}
