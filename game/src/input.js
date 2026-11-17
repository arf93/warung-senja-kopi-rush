// Keyboard and pointer input. Held keys cycle the selected customer; one-shot
// presses (start, restart, pause, serve, mute) are queued as bit flags and
// taken once by the loop, so a press between two frames is never lost and
// never counted twice. Pointer clicks are reported with logical coordinates.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);
const SERVE_KEYS = { Digit1: 'kopi', Digit2: 'teh', Digit3: 'goreng', Digit4: 'nasi', Numpad1: 'kopi', Numpad2: 'teh', Numpad3: 'goreng', Numpad4: 'nasi' };

export function createInput(canvas, toLogical) {
  let actions = 0;
  let serveItem = null;
  let cycle = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (SERVE_KEYS[event.code]) {
      if (!event.repeat) serveItem = SERVE_KEYS[event.code];
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      if (!event.repeat) cycle = -1;
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      if (!event.repeat) cycle = 1;
    } else if (event.code === 'Tab') {
      if (!event.repeat) cycle = 1;
      event.preventDefault();
      return;
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const p = toLogical(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
    click = p;
    actions |= ACTION_CONFIRM;
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeServe() {
      const item = serveItem;
      serveItem = null;
      return item;
    },
    takeCycle() {
      const c = cycle;
      cycle = 0;
      return c;
    },
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
  };
}
