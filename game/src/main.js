// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens: title,
// play, paused, day-clear and game over.
//
// ?seed=N fixes the customer pattern. ?shot=start|play|combo|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ARRIVE, EVENT_COIN, EVENT_DAYCLEAR, EVENT_DAYSTART, EVENT_LOSE, EVENT_MILESTONE, EVENT_SERVE, EVENT_VIP, EVENT_WALKOUT, EVENT_WIN, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { MUTE_RECT, PAUSE_RECT, SCREEN_DAYCLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer, seatAt, trayRects } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas, (x, y, w, h) => renderer.toLogical(x, y, w, h));

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { t: 12, muted: false });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let clock = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    audio.click();
    world.startGame();
    audio.startAmbient();
    screen = SCREEN_PLAY;
    announce('Shift 1. Target ' + world.state.target + ' koin. Layani pelanggan!');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.stopAmbient();
    if (world.state.totalCoins > best) {
      best = world.state.totalCoins;
      saveBest(best);
    }
    announce(world.state.status === 'won'
      ? 'Menang! Total ' + world.state.totalCoins + ' koin. Terbaik ' + best + '.'
      : 'Warung tutup. Total ' + world.state.totalCoins + ' koin. Terbaik ' + best + '.');
  }

  function playEvents(events) {
    if (events & EVENT_SERVE) audio.serve();
    if (events & EVENT_COIN) audio.coin();
    if (events & EVENT_MILESTONE) audio.milestone();
    if (events & EVENT_VIP) audio.vip();
    if (events & EVENT_WRONG) audio.wrong();
    if (events & EVENT_WALKOUT) audio.walkout();
    if (events & EVENT_ARRIVE) audio.arrive();
    if (events & EVENT_DAYCLEAR) audio.dayWin();
    if (events & EVENT_WIN) { audio.gameWin(); }
    if (events & EVENT_LOSE) { audio.gameLose(); }
    if (events & EVENT_DAYSTART) announce('Shift ' + (world.state.day + 1) + '. Target ' + world.state.target + ' koin.');
  }

  function serveItem(itemId) {
    if (screen !== SCREEN_PLAY) return;
    const events = world.serve(itemId);
    playEvents(events);
    if (events & EVENT_WIN || events & EVENT_LOSE) endGame();
  }

  /** Handle one click; returns true when the click did something specific. */
  function handleClick(p) {
    if (inRect(p, MUTE_RECT)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati.' : 'Suara hidup.');
      return true;
    }
    if (screen === SCREEN_PLAY) {
      if (inRect(p, PAUSE_RECT)) {
        screen = SCREEN_PAUSED;
        announce('Jeda.');
        return true;
      }
      for (const r of trayRects()) {
        if (inRect(p, r)) {
          audio.unlock();
          serveItem(r.id);
          return true;
        }
      }
      const seat = seatAt(p.x, p.y);
      if (seat >= 0) {
        world.selectSeat(seat);
        audio.click();
        return true;
      }
      return false;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Lanjut.');
      return true;
    }
    return false;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    clock += dt;

    const click = input.takeClick();
    const actions = input.takeActions();
    const serve = input.takeServe();
    const cycle = input.takeCycle();
    let clickHandled = false;
    if (click) {
      audio.unlock();
      clickHandled = handleClick(click);
      if (!clickHandled && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
        startGame();
        clickHandled = true;
      }
    }
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) startGame();
    else if (actions & ACTION_CONFIRM && !clickHandled && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Lanjut.');
    }
    if (cycle !== 0 && screen === SCREEN_PLAY) world.cycleSelection(cycle);
    if (serve) serveItem(serve);

    if (screen === SCREEN_TITLE) {
      world.step(STEP, true);
    } else if (screen === SCREEN_PLAY) {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= STEP && guard < 12) {
        const events = world.step(STEP, false);
        accumulator -= STEP;
        guard += 1;
        playEvents(events);
        if (world.state.status === 'dayclear') {
          screen = SCREEN_DAYCLEAR;
          announce('Shift selesai! Target tercapai.');
          break;
        }
        if (world.state.status === 'won' || world.state.status === 'lost') {
          endGame();
          break;
        }
      }
      if (world.state.status === 'playing' && screen === SCREEN_DAYCLEAR) screen = SCREEN_PLAY;
      audio.tick(dt);
    } else if (screen === SCREEN_DAYCLEAR) {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= STEP && guard < 12) {
        const events = world.step(STEP, false);
        accumulator -= STEP;
        guard += 1;
        playEvents(events);
        if (world.state.status === 'playing') {
          screen = SCREEN_PLAY;
          break;
        }
        if (world.state.status === 'won' || world.state.status === 'lost') {
          endGame();
          break;
        }
      }
    }

    renderer.draw(world.state, screen, best, { t: clock, muted: audio.isMuted() });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Warung Senja Kopi Rush. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
