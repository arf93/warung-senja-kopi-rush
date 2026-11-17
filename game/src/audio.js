// Sound only: WebAudio oscillators, no audio files and no network. Every
// sound is a short envelope over one or two oscillator notes, plus a gentle
// pentatonic pluck loop while a shift is running. Created lazily on the first
// user gesture so browsers allow it; muted with M.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let ambientTimer = 0;
  let ambientOn = false;
  const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
  let ambientStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    const ac = ensure();
    if (!ac || muted) return;
    if (ac.state === 'suspended') ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ac.currentTime + (start || 0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function unlock() {
    ensure();
  }

  function click() { tone(660, 0, 0.07, 'triangle', 0.08); }
  function serve() { tone(523.25, 0, 0.12, 'triangle', 0.14); tone(783.99, 0.08, 0.16, 'triangle', 0.12); }
  function coin() { tone(1046.5, 0, 0.1, 'square', 0.05); tone(1318.5, 0.07, 0.14, 'square', 0.05); }
  function wrong() { tone(160, 0, 0.18, 'sawtooth', 0.08); tone(120, 0.1, 0.2, 'sawtooth', 0.07); }
  function walkout() { tone(392, 0, 0.2, 'triangle', 0.1); tone(311, 0.16, 0.22, 'triangle', 0.1); tone(233, 0.32, 0.3, 'triangle', 0.09); }
  function arrive() { tone(880, 0, 0.08, 'sine', 0.05); }
  function dayWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.22, 'triangle', 0.13));
  }
  function gameWin() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => tone(f, i * 0.12, 0.26, 'triangle', 0.13));
  }
  function gameLose() {
    [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, i * 0.16, 0.26, 'triangle', 0.11));
  }

  function tick(dt) {
    if (!ambientOn || muted) return;
    ambientTimer -= dt;
    if (ambientTimer > 0) return;
    ambientTimer = 1.9;
    ambientStep = (ambientStep + 1) % SCALE.length;
    const note = SCALE[(ambientStep * 3 + 1) % SCALE.length];
    tone(note, 0, 0.5, 'sine', 0.035);
    if (ambientStep % 4 === 0) tone(note / 2, 0.05, 0.6, 'sine', 0.03);
  }

  return {
    unlock,
    click,
    serve,
    coin,
    wrong,
    walkout,
    arrive,
    dayWin,
    gameWin,
    gameLose,
    tick,
    startAmbient() { ambientOn = true; ambientTimer = 0.4; },
    stopAmbient() { ambientOn = false; },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
  };
}
