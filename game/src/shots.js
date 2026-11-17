// The screenshot scenes behind ?shot=start|play|combo|end. Each one plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (serve the most impatient customer's order),
// so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { STEP } from './config.js';
import { EVENT_LOSE, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 34;
const COMBO_SECONDS = 60;
const END_LIMIT_SECONDS = 900;

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

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'combo' && name !== 'end') {
    world.startGame();
    // Title backdrop: run in harmless mode by stepping the world while its
    // status is playing but freezing the clock via a fresh reset + idle steps.
    world.reset();
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.startGame();
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'combo' ? COMBO_SECONDS : PLAY_SECONDS;
  let events = 0;
  let cooldown = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    if (cooldown > 0) cooldown -= 1;
    else {
      autopilot(world);
      cooldown = 55;
    }
    events = world.step(STEP, false);
    if (name === 'combo' && world.state.combo >= 5) break;
    if (events & (EVENT_WIN | EVENT_LOSE)) break;
    if (world.state.status === 'dayclear') {
      // Let the day-clear pause elapse so the next shift starts.
      for (let j = 0; j < 3.2 / STEP; j += 1) world.step(STEP, false);
    }
  }
  const over = world.state.status === 'won' || world.state.status === 'lost';
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.totalCoins };
}
