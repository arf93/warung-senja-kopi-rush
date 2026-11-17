// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. All art is drawn with Canvas 2D shapes:
// a Yogyakarta sunset, the warung counter, and the customers themselves.
import { FIELD, FONT, MENU, MENU_ORDER, PALETTE, SEATS, SHIFT_SKIES, UPGRADES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_SHOP = 'shop';
export const SCREEN_OVER = 'over';

export const TRAY_Y = 596;
export const TRAY_H = 88;
export const PAUSE_RECT = { x: 1180, y: 10, w: 44, h: 44 };
export const MUTE_RECT = { x: 1128, y: 10, w: 44, h: 44 };

/** The shop's three upgrade cards and the continue button, in field coords. */
export function shopCardRects() {
  const w = 300;
  const h = 210;
  const y = 190;
  return UPGRADES.map((u, i) => ({ id: u.id, x: 140 + i * 330, y, w, h }));
}
export function shopNextRect() {
  return { x: 440, y: 440, w: 400, h: 64 };
}

export function trayRects() {
  const w = 208;
  const gap = 10;
  const total = w * 5 + gap * 4;
  const x0 = (FIELD.width - total) / 2;
  return MENU_ORDER.map((id, i) => ({ id, x: x0 + i * (w + gap), y: TRAY_Y, w, h: TRAY_H }));
}

export function seatAt(x, y) {
  for (let i = 0; i < SEATS.length; i += 1) {
    const s = SEATS[i];
    if (Math.abs(x - s.x) < 78 && y > s.y - 150 && y < s.y + 90) return i;
  }
  return -1;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = size + (weight || '');
    if (!fonts.has(key)) fonts.set(key, (weight ? weight + ' ' : '') + size + 'px ' + FONT);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function drawSunset(t, day) {
    const sky = SHIFT_SKIES[day] || SHIFT_SKIES[0];
    const g = context.createLinearGradient(0, 0, 0, 460);
    g.addColorStop(0, sky.top);
    g.addColorStop(0.55, sky.mid);
    g.addColorStop(1, sky.low);
    context.fillStyle = g;
    context.fillRect(0, 0, FIELD.width, 470);
    // Sun low over the rooftops — a pale moon, high up, on the night shift.
    const glow = context.createRadialGradient(640, sky.sunY, 10, 640, sky.sunY, 150);
    glow.addColorStop(0, sky.stars ? 'rgba(255, 233, 168, 0.55)' : 'rgba(255, 215, 110, 0.9)');
    glow.addColorStop(1, 'rgba(255, 215, 110, 0)');
    context.fillStyle = glow;
    context.fillRect(440, sky.sunY - 200, 400, 400);
    context.fillStyle = sky.sun;
    context.beginPath();
    context.arc(640, sky.sunY, sky.sunR, 0, Math.PI * 2);
    context.fill();
    if (sky.stars) {
      // Moon craters.
      context.fillStyle = 'rgba(200, 180, 140, 0.5)';
      context.beginPath();
      context.arc(628, sky.sunY - 8, 6, 0, Math.PI * 2);
      context.arc(652, sky.sunY + 10, 4, 0, Math.PI * 2);
      context.fill();
      // Twinkling stars, placed by index so they never jump around.
      for (let i = 0; i < 46; i += 1) {
        const sx = (i * 173 + 41) % 1280;
        const sy = (i * 97 + 23) % 210 + 12;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + i * 1.3));
        context.fillStyle = 'rgba(255, 244, 200, ' + tw.toFixed(2) + ')';
        context.beginPath();
        context.arc(sx, sy, i % 5 === 0 ? 2.6 : 1.6, 0, Math.PI * 2);
        context.fill();
      }
    } else {
      // Birds crossing the dusk sky, wings flapping.
      context.strokeStyle = 'rgba(40, 20, 40, 0.7)';
      context.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const bx = ((t * 26 + i * 480) % 1420) - 70;
        const by = 90 + i * 46;
        const flap = Math.sin(t * 6 + i * 2) * 4;
        context.beginPath();
        context.moveTo(bx - 12, by);
        context.quadraticCurveTo(bx - 5, by - 6 - flap, bx, by);
        context.quadraticCurveTo(bx + 5, by - 6 - flap, bx + 12, by);
        context.stroke();
      }
    }
    // Drifting clouds, dimmer once night falls.
    context.fillStyle = sky.stars ? 'rgba(200, 170, 200, 0.18)' : 'rgba(255, 190, 160, 0.35)';
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 340 + t * 12) % 1500) - 120;
      const cy = 70 + i * 42;
      context.beginPath();
      context.ellipse(cx, cy, 90, 20, 0, 0, Math.PI * 2);
      context.ellipse(cx + 60, cy + 8, 60, 16, 0, 0, Math.PI * 2);
      context.fill();
    }
    // Merapi silhouette on the left, Tugu Jogja on the right.
    context.fillStyle = PALETTE.mountain;
    context.beginPath();
    context.moveTo(0, 470);
    context.lineTo(120, 300);
    context.lineTo(210, 360);
    context.lineTo(300, 470);
    context.closePath();
    context.fill();
    // Tugu Jogja: stepped base, column, ring and spire with a ball on top.
    context.fillStyle = PALETTE.tugu;
    context.fillRect(1128, 452, 58, 8);
    context.fillRect(1134, 440, 46, 12);
    context.fillRect(1140, 452, 34, 10);
    context.fillRect(1148, 330, 18, 112);
    context.fillRect(1142, 322, 30, 10);
    context.beginPath();
    context.moveTo(1157, 268);
    context.lineTo(1166, 322);
    context.lineTo(1148, 322);
    context.closePath();
    context.fill();
    context.beginPath();
    context.arc(1157, 262, 7, 0, Math.PI * 2);
    context.fill();
    // Rooftops with warm string lights.
    context.fillStyle = PALETTE.roof;
    context.fillRect(0, 420, FIELD.width, 50);
    for (let i = 0; i < 14; i += 1) {
      const x = i * 96 + 20;
      context.beginPath();
      context.moveTo(x, 420);
      context.lineTo(x + 48, 392);
      context.lineTo(x + 96, 420);
      context.closePath();
      context.fill();
    }
    for (let i = 0; i < 26; i += 1) {
      const x = 30 + i * 48;
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
      context.fillStyle = 'rgba(255, 215, 110, ' + tw.toFixed(2) + ')';
      context.beginPath();
      context.arc(x, 432 + (i % 3) * 6, 3.5, 0, Math.PI * 2);
      context.fill();
    }
    // Street.
    context.fillStyle = PALETTE.ground;
    context.fillRect(0, 470, FIELD.width, 126);
  }

  function drawItemIcon(id, x, y, s, t) {
    const m = MENU[id];
    if (id === 'kopi') {
      context.fillStyle = m.cup;
      roundRect(x - s * 0.42, y - s * 0.3, s * 0.84, s * 0.62, 5);
      context.fill();
      context.fillStyle = '#3a2410';
      context.fillRect(x - s * 0.42, y - s * 0.3, s * 0.84, s * 0.12);
      context.strokeStyle = m.cup;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x + s * 0.5, y, s * 0.18, -Math.PI / 2, Math.PI / 2);
      context.stroke();
    } else if (id === 'teh') {
      context.fillStyle = 'rgba(232, 176, 75, 0.9)';
      roundRect(x - s * 0.34, y - s * 0.42, s * 0.68, s * 0.84, 4);
      context.fill();
      context.fillStyle = '#fff3e0';
      context.fillRect(x - s * 0.3, y - s * 0.42, s * 0.6, s * 0.08);
      context.strokeStyle = '#c98d4b';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x + s * 0.2, y - s * 0.42);
      context.lineTo(x + s * 0.42, y - s * 0.62);
      context.stroke();
    } else if (id === 'goreng') {
      context.fillStyle = '#f5f0e0';
      context.beginPath();
      context.ellipse(x, y + s * 0.2, s * 0.5, s * 0.16, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = m.color;
      for (let i = -1; i <= 1; i += 1) {
        context.beginPath();
        context.arc(x + i * s * 0.26, y - s * 0.05, s * 0.2, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = '#8a5a1a';
      context.beginPath();
      context.arc(x - s * 0.26, y - s * 0.12, s * 0.05, 0, Math.PI * 2);
      context.arc(x + s * 0.26, y - s * 0.12, s * 0.05, 0, Math.PI * 2);
      context.fill();
    } else if (id === 'nasi') {
      // Nasi kucing: banana-leaf packet.
      context.fillStyle = m.color;
      context.beginPath();
      context.moveTo(x - s * 0.5, y);
      context.lineTo(x, y - s * 0.42);
      context.lineTo(x + s * 0.5, y);
      context.lineTo(x, y + s * 0.42);
      context.closePath();
      context.fill();
      context.strokeStyle = '#3f5a26';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x - s * 0.5, y);
      context.lineTo(x + s * 0.5, y);
      context.stroke();
      context.fillStyle = '#fff3e0';
      context.beginPath();
      context.ellipse(x, y - s * 0.05, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
      context.fill();
    } else {
      // Es teh: tall glass, amber tea, ice cubes, red straw.
      context.fillStyle = 'rgba(126, 200, 227, 0.92)';
      roundRect(x - s * 0.3, y - s * 0.42, s * 0.6, s * 0.84, 4);
      context.fill();
      context.fillStyle = '#c97e1f';
      context.fillRect(x - s * 0.26, y - s * 0.1, s * 0.52, s * 0.48);
      context.fillStyle = 'rgba(255, 255, 255, 0.85)';
      context.fillRect(x - s * 0.16, y - s * 0.05, s * 0.2, s * 0.2);
      context.fillRect(x + s * 0.02, y + s * 0.12, s * 0.18, s * 0.18);
      context.strokeStyle = '#c94f4f';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(x + s * 0.1, y - s * 0.42);
      context.lineTo(x + s * 0.28, y - s * 0.66);
      context.stroke();
    }
    // Hot drinks steam: two wisps curling up, swaying with time.
    if ((id === 'kopi' || id === 'teh') && t !== undefined) {
      context.strokeStyle = 'rgba(255, 243, 224, 0.75)';
      context.lineWidth = 2.5;
      for (let i = 0; i < 2; i += 1) {
        const sx = x - s * 0.14 + i * s * 0.28;
        const sway = Math.sin(t * 2.4 + i * 1.8 + x * 0.05) * 4;
        context.beginPath();
        context.moveTo(sx, y - s * 0.42);
        context.quadraticCurveTo(sx + sway, y - s * 0.62, sx - sway * 0.5, y - s * 0.8);
        context.stroke();
      }
    }
  }

  function drawCustomer(c, selected, t) {
    const s = SEATS[c.seat];
    const bob = Math.sin(c.bob) * 3;
    const x = s.x;
    const y = s.y + bob;
    // Stool.
    context.fillStyle = '#4a2b1a';
    context.fillRect(x - 34, y + 62, 68, 10);
    context.fillRect(x - 26, y + 72, 8, 34);
    context.fillRect(x + 18, y + 72, 8, 34);
    // Body.
    context.fillStyle = c.shirt;
    roundRect(x - 42, y - 18, 84, 78, 18);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(x - 42, y - 18, 84, 12);
    // Arms reaching toward the counter.
    context.fillStyle = c.shirt;
    context.beginPath();
    context.arc(x - 44, y + 30, 13, 0, Math.PI * 2);
    context.arc(x + 44, y + 30, 13, 0, Math.PI * 2);
    context.fill();
    // Hijab cloth first, so the face sits inside it.
    if (c.accessory === 'hijab') {
      context.fillStyle = c.hijab;
      context.beginPath();
      context.arc(x, y - 48, 35, 0, Math.PI * 2);
      context.fill();
      context.fillRect(x - 35, y - 48, 70, 34);
    }
    // Head.
    context.fillStyle = c.skin;
    context.beginPath();
    context.arc(x, y - 48, 30, 0, Math.PI * 2);
    context.fill();
    // Hair (covered by a hijab).
    if (c.accessory !== 'hijab') {
      context.fillStyle = c.hair;
      context.beginPath();
      context.arc(x, y - 58, 29, Math.PI, Math.PI * 2);
      context.fill();
      context.fillRect(x - 29, y - 62, 58, 10);
    }
    // Peci: a black cap on top of the hair.
    if (c.accessory === 'peci') {
      context.fillStyle = '#111111';
      context.beginPath();
      context.arc(x, y - 66, 26, Math.PI, 0);
      context.fill();
      context.fillRect(x - 26, y - 70, 52, 8);
    }
    // Face by mood.
    context.fillStyle = '#221a12';
    const eyeY = y - 52;
    if (c.mood === 'angry') {
      context.fillRect(x - 18, eyeY - 4, 12, 3);
      context.fillRect(x + 6, eyeY - 4, 12, 3);
      context.save();
      context.translate(x - 12, eyeY - 5);
      context.rotate(0.35);
      context.fillRect(-6, -1.5, 12, 3);
      context.restore();
      context.save();
      context.translate(x + 12, eyeY - 5);
      context.rotate(-0.35);
      context.fillRect(-6, -1.5, 12, 3);
      context.restore();
    } else {
      context.beginPath();
      context.arc(x - 12, eyeY, 3.5, 0, Math.PI * 2);
      context.arc(x + 12, eyeY, 3.5, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = '#7a3a20';
    context.lineWidth = 3;
    context.beginPath();
    if (c.mood === 'happy') {
      context.arc(x, y - 38, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (c.mood === 'worried') {
      context.arc(x, y - 28, 8, 1.15 * Math.PI, 1.85 * Math.PI);
    } else {
      context.moveTo(x - 9, y - 30);
      context.lineTo(x + 9, y - 30);
    }
    context.stroke();
    // Blush when happy.
    if (c.mood === 'happy') {
      context.fillStyle = 'rgba(255, 120, 120, 0.45)';
      context.beginPath();
      context.arc(x - 20, y - 38, 5, 0, Math.PI * 2);
      context.arc(x + 20, y - 38, 5, 0, Math.PI * 2);
      context.fill();
    }
    // Glasses.
    if (c.accessory === 'glasses') {
      context.strokeStyle = '#221a12';
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(x - 12, eyeY, 8, 0, Math.PI * 2);
      context.arc(x + 12, eyeY, 8, 0, Math.PI * 2);
      context.moveTo(x - 4, eyeY);
      context.lineTo(x + 4, eyeY);
      context.stroke();
    }
    // Moustache.
    if (c.accessory === 'moustache') {
      context.fillStyle = '#221a12';
      context.beginPath();
      context.ellipse(x, y - 33, 10, 3.5, 0, 0, Math.PI * 2);
      context.fill();
    }
    // VIP: a gold outline so the high payer stands out.
    if (c.vip) {
      context.strokeStyle = '#ffd76e';
      context.lineWidth = 5;
      context.beginPath();
      context.ellipse(x, y + 8, 66, 82, 0, 0, Math.PI * 2);
      context.stroke();
    }
    // Selected ring and name.
    if (selected) {
      context.strokeStyle = PALETTE.selected;
      context.lineWidth = 4;
      context.setLineDash([10, 6]);
      context.beginPath();
      context.ellipse(x, y + 8, 62, 78, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = PALETTE.selected;
      context.beginPath();
      context.moveTo(x, y - 108);
      context.lineTo(x - 10, y - 122);
      context.lineTo(x + 10, y - 122);
      context.closePath();
      context.fill();
    }
    text((c.vip ? '★ ' : '') + c.name, x, y + 128, 17, c.vip ? '#ffd76e' : PALETTE.text, 'center', '600');
    // Order bubble.
    if (c.order.length > 0) {
      const bw = 46 + c.order.length * 52;
      const bx = x - bw / 2;
      const by = y - 208;
      context.fillStyle = 'rgba(255, 243, 224, 0.97)';
      roundRect(bx, by, bw, 64, 14);
      context.fill();
      context.beginPath();
      context.moveTo(x - 10, by + 64);
      context.lineTo(x + 10, by + 64);
      context.lineTo(x, by + 78);
      context.closePath();
      context.fill();
      c.order.forEach((id, i) => {
        drawItemIcon(id, bx + 34 + i * 52, by + 32, 40, t);
      });
    }
    // Patience bar.
    const pw = 96;
    const px = x - pw / 2;
    const py = y + 138;
    context.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(px - 2, py - 2, pw + 4, 12, 6);
    context.fill();
    context.fillStyle = c.patience > 0.55 ? PALETTE.patienceGood : c.patience > 0.28 ? PALETTE.patienceMid : PALETTE.patienceBad;
    roundRect(px, py, Math.max(0, pw * c.patience), 8, 4);
    context.fill();
  }

  function drawCounter(day, upgrades, t) {
    const sky = SHIFT_SKIES[day] || SHIFT_SKIES[0];
    // Hanging lamps from the roofline, between the seats: dim at dusk,
    // glowing warm at night.
    for (const lx of [225, 645, 1065]) {
      const flicker = 0.85 + 0.15 * Math.sin(performance.now() / 300 + lx);
      const glowA = sky.lampGlow * flicker;
      if (glowA > 0.05) {
        const lg = context.createRadialGradient(lx, 462, 4, lx, 462, 70);
        lg.addColorStop(0, 'rgba(255, 205, 110, ' + (0.75 * glowA).toFixed(2) + ')');
        lg.addColorStop(1, 'rgba(255, 205, 110, 0)');
        context.fillStyle = lg;
        context.fillRect(lx - 70, 392, 140, 140);
      }
      context.strokeStyle = '#2e1a33';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(lx, 420);
      context.lineTo(lx, 452);
      context.stroke();
      context.fillStyle = '#3a2b1a';
      context.beginPath();
      context.moveTo(lx - 14, 452);
      context.lineTo(lx + 14, 452);
      context.lineTo(lx + 8, 440);
      context.lineTo(lx - 8, 440);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(255, 220, 130, ' + (0.35 + 0.65 * glowA).toFixed(2) + ')';
      context.beginPath();
      context.arc(lx, 460, 8, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = PALETTE.counterFront;
    context.fillRect(0, 500, FIELD.width, 96);
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(0, 500, FIELD.width, 16);
    context.fillStyle = PALETTE.counterTrim;
    context.fillRect(0, 516, FIELD.width, 4);
    // Jars along the counter, a kettle steaming at the far right.
    for (let i = 0; i < 7; i += 1) {
      const x = 20 + i * 40;
      context.fillStyle = i % 2 ? '#c9a24f' : '#8a5a2b';
      roundRect(x, 462, 30, 38, 6);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.25)';
      context.fillRect(x + 4, 466, 6, 30);
    }
    // Kettle with a wisp of steam.
    context.fillStyle = '#3a3a3a';
    context.beginPath();
    context.arc(1240, 482, 18, 0, Math.PI * 2);
    context.fill();
    context.fillRect(1256, 472, 20, 8);
    context.strokeStyle = 'rgba(255, 243, 224, 0.6)';
    context.lineWidth = 2.5;
    const ksway = Math.sin(t * 2 + 1) * 4;
    context.beginPath();
    context.moveTo(1240, 462);
    context.quadraticCurveTo(1240 + ksway, 448, 1240 - ksway * 0.5, 436);
    context.stroke();
    // Kompor Baru: a little stove with a flame, once the player buys it.
    if (upgrades && upgrades.stove) {
      context.fillStyle = '#2e2e2e';
      context.fillRect(1000, 478, 56, 22);
      context.fillStyle = '#8a5a2b';
      context.beginPath();
      context.arc(1028, 476, 18, 0, Math.PI * 2);
      context.fill();
      const fl = 0.7 + 0.3 * Math.sin(t * 9);
      context.fillStyle = 'rgba(255, 150, 50, ' + fl.toFixed(2) + ')';
      context.beginPath();
      context.moveTo(1028, 458);
      context.quadraticCurveTo(1040, 470, 1028, 478);
      context.quadraticCurveTo(1016, 470, 1028, 458);
      context.fill();
    }
    // Kipas Angin: a ceiling fan hanging over the middle of the counter.
    if (upgrades && upgrades.fan) {
      const fx = 640;
      const fa = t * 5;
      context.strokeStyle = '#2e1a33';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(fx, 420);
      context.lineTo(fx, 440);
      context.stroke();
      context.fillStyle = '#4a3a2a';
      for (let i = 0; i < 3; i += 1) {
        const a = fa + (i * Math.PI * 2) / 3;
        context.beginPath();
        context.ellipse(fx + Math.cos(a) * 22, 446 + Math.sin(a) * 5, 20, 5, a, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = '#6b4a2a';
      context.beginPath();
      context.arc(fx, 446, 7, 0, Math.PI * 2);
      context.fill();
    }
    // The warung cat, asleep on the counter between the first two stools.
    context.fillStyle = '#d98a4a';
    context.beginPath();
    context.ellipse(215, 492, 26, 12, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(192, 486, 10, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(186, 478);
    context.lineTo(188, 470);
    context.lineTo(192, 478);
    context.closePath();
    context.moveTo(196, 478);
    context.lineTo(198, 470);
    context.lineTo(200, 478);
    context.closePath();
    context.fill();
    context.strokeStyle = '#d98a4a';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(238, 492);
    context.quadraticCurveTo(252, 482, 246, 472);
    context.stroke();
    // String lights along the counter front.
    for (let i = 0; i < 24; i += 1) {
      const x = 26 + i * 53;
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
      context.fillStyle = 'rgba(255, 215, 110, ' + tw.toFixed(2) + ')';
      context.beginPath();
      context.arc(x, 530 + (i % 2) * 5, 3.5, 0, Math.PI * 2);
      context.fill();
    }
    // Hanging sign, low on the counter front so seated customers never
    // hide it.
    context.fillStyle = '#3a1f16';
    roundRect(480, 548, 320, 30, 8);
    context.fill();
    text('WARUNG SENJA  •  SEJAK 1998', 640, 569, 16, PALETTE.coin, 'center', '700');
  }

  /** The sixth stool, covered with a cloth until the player buys it. */
  function drawLockedSeat() {
    const s = SEATS[5];
    const x = s.x;
    const y = s.y;
    context.fillStyle = '#4a2b1a';
    context.fillRect(x - 34, y + 62, 68, 10);
    context.fillRect(x - 26, y + 72, 8, 34);
    context.fillRect(x + 18, y + 72, 8, 34);
    context.fillStyle = '#7a6a9a';
    roundRect(x - 42, y - 18, 84, 78, 18);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.15)';
    context.fillRect(x - 42, y - 18, 84, 12);
    text('🔒', x, y + 20, 26, '#fff3e0', 'center');
    text('Kursi Baru', x, y + 128, 15, PALETTE.muted, 'center', '600');
    text('beli di toko', x, y + 148, 13, PALETTE.muted, 'center');
  }

  function drawHud(state, muted) {
    context.fillStyle = 'rgba(20, 12, 24, 0.82)';
    roundRect(12, 10, 1096, 52, 12);
    context.fill();
    text('🪙 ' + state.coins + ' / ' + state.target, 30, 46, 26, PALETTE.coin, 'left', '800');
    const barX = 260;
    context.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(barX, 26, 220, 20, 10);
    context.fill();
    context.fillStyle = PALETTE.coin;
    roundRect(barX, 26, Math.min(220, 220 * state.coins / Math.max(1, state.target)), 20, 10);
    context.fill();
    text('HARI ' + (state.day + 1) + '/3', 520, 46, 24, PALETTE.text, 'left', '800');
    const mm = Math.floor(Math.max(0, state.timeLeft) / 60);
    const ss = Math.floor(Math.max(0, state.timeLeft) % 60);
    text('⏱ ' + mm + ':' + String(ss).padStart(2, '0'), 640, 46, 24, state.timeLeft < 15 ? PALETTE.heart : PALETTE.text, 'left', '800');
    let hx = 790;
    for (let i = 0; i < 5; i += 1) {
      context.fillStyle = i < 5 - state.walkouts ? PALETTE.heart : PALETTE.heartEmpty;
      context.beginPath();
      context.arc(hx + i * 30, 36, 11, 0, Math.PI * 2);
      context.fill();
      text('♥', hx + i * 30, 44, 18, i < 5 - state.walkouts ? '#fff' : '#8a5a6a', 'center', '800');
    }
    if (state.combo >= 2) {
      text('🔥 x' + (state.combo >= 9 ? 3 : state.combo >= 4 ? 2 : 1) + ' · ' + state.combo, 958, 46, 21, '#ff9a4d', 'left', '800');
    }
    // Mute and pause buttons.
    context.fillStyle = 'rgba(20,12,24,0.82)';
    roundRect(MUTE_RECT.x, MUTE_RECT.y, MUTE_RECT.w, MUTE_RECT.h, 10);
    context.fill();
    roundRect(PAUSE_RECT.x, PAUSE_RECT.y, PAUSE_RECT.w, PAUSE_RECT.h, 10);
    context.fill();
    text(muted ? '🔇' : '🔊', MUTE_RECT.x + 22, MUTE_RECT.y + 31, 22, PALETTE.text, 'center');
    text('II', PAUSE_RECT.x + 22, PAUSE_RECT.y + 31, 20, PALETTE.text, 'center', '800');
  }

  function drawTray(state, t) {
    context.fillStyle = PALETTE.tray;
    context.fillRect(0, TRAY_Y - 8, FIELD.width, TRAY_H + 16);
    context.fillStyle = PALETTE.trayEdge;
    context.fillRect(0, TRAY_Y - 8, FIELD.width, 3);
    const rects = trayRects();
    rects.forEach((r) => {
      const selected = false;
      context.fillStyle = '#3a2430';
      roundRect(r.x, r.y, r.w, r.h, 14);
      context.fill();
      context.strokeStyle = '#6b4256';
      context.lineWidth = 2;
      roundRect(r.x, r.y, r.w, r.h, 14);
      context.stroke();
      drawItemIcon(r.id, r.x + 38, r.y + 52, 48, t);
      text(MENU[r.id].name, r.x + 74, r.y + 38, 19, PALETTE.text, 'left', '700');
      text('🪙 ' + MENU[r.id].price + '   •   tombol ' + MENU[r.id].key, r.x + 74, r.y + 68, 16, PALETTE.muted, 'left');
      void selected;
    });
    // Hint line sits in the clear strip below the tray panel (panel ends at
    // TRAY_Y + TRAY_H + 8 = 692; glyphs span ~699-714, inside the 720 field).
    text('Klik pelanggan, lalu klik menu — atau pilih dengan ← → dan sajikan dengan 1-5  •  Antar shift: beli upgrade di toko', FIELD.width / 2, TRAY_Y + TRAY_H + 26, 15, PALETTE.muted, 'center');
  }

  /** Rush Hour banner: a flashing strip under the HUD while it runs. */
  function drawRushBanner(state, t) {
    if (!state.rushActive) return;
    const pulse = 0.75 + 0.25 * Math.sin(t * 8);
    context.fillStyle = 'rgba(200, 40, 20, ' + (0.85 * pulse).toFixed(2) + ')';
    roundRect(340, 68, 600, 40, 12);
    context.fill();
    context.strokeStyle = '#ffd76e';
    context.lineWidth = 2;
    roundRect(340, 68, 600, 40, 12);
    context.stroke();
    text('🔥 RUSH HOUR! Koin 1,5x — layani sebanyak-banyaknya! 🔥', FIELD.width / 2, 95, 20, '#fff3e0', 'center', '800');
  }

  /** The shop between shifts: three upgrade cards and a continue button. */
  function drawShop(state) {
    context.fillStyle = 'rgba(10, 6, 14, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('🛒  TOKO WARUNG  —  Shift ' + (state.day + 1) + ' selesai!', FIELD.width / 2, 96, 38, PALETTE.text, 'center', '800');
    text('Target ' + state.target + ' koin tercapai: ' + state.coins + ' koin.  •  🪙 ' + state.totalCoins + ' koin di tangan', FIELD.width / 2, 134, 20, PALETTE.coin, 'center', '700');
    text('Beli upgrade sebanyak yang kamu mampu — efeknya permanen sampai permainan selesai.', FIELD.width / 2, 162, 17, PALETTE.muted, 'center');
    const rects = shopCardRects();
    rects.forEach((r, i) => {
      const u = UPGRADES[i];
      const owned = state.upgrades[u.id];
      const afford = state.totalCoins >= u.price;
      context.fillStyle = owned ? '#2e3a2e' : '#241722';
      roundRect(r.x, r.y, r.w, r.h, 16);
      context.fill();
      context.strokeStyle = owned ? '#7ddc6a' : afford ? '#ff9a4d' : '#5a3340';
      context.lineWidth = 3;
      roundRect(r.x, r.y, r.w, r.h, 16);
      context.stroke();
      text(u.icon, r.x + r.w / 2, r.y + 56, 40, PALETTE.text, 'center');
      text(u.name, r.x + r.w / 2, r.y + 96, 22, PALETTE.text, 'center', '800');
      text(u.desc, r.x + r.w / 2, r.y + 128, 16, PALETTE.muted, 'center');
      text(u.desc2, r.x + r.w / 2, r.y + 150, 16, PALETTE.muted, 'center');
      if (owned) {
        text('✓ DIBELI', r.x + r.w / 2, r.y + 188, 20, '#7ddc6a', 'center', '800');
      } else {
        text('🪙 ' + u.price + '  •  tombol ' + (i + 1), r.x + r.w / 2, r.y + 188, 19, afford ? PALETTE.coin : '#8a5a6a', 'center', '700');
      }
    });
    const next = shopNextRect();
    context.fillStyle = PALETTE.button;
    roundRect(next.x, next.y, next.w, next.h, 14);
    context.fill();
    context.strokeStyle = '#ffd76e';
    context.lineWidth = 2;
    roundRect(next.x, next.y, next.w, next.h, 14);
    context.stroke();
    text('▶  MULAI SHIFT ' + (state.day + 2), next.x + next.w / 2, next.y + 42, 24, '#fff3e0', 'center', '800');
    // A dark pill behind the hint so it stays readable over the scene.
    context.fillStyle = 'rgba(10, 6, 14, 0.85)';
    roundRect(FIELD.width / 2 - 350, 528, 700, 32, 16);
    context.fill();
    text('Klik kartu untuk membeli  •  1/2/3 beli upgrade  •  Spasi untuk lanjut', FIELD.width / 2, 550, 17, PALETTE.muted, 'center');
  }

  function drawFloaters(state) {
    for (const f of state.floaters) {
      if (!f.active) continue;
      context.globalAlpha = Math.min(1, f.life);
      text(f.text, f.x, f.y, f.size || 24, f.color, 'center', '800');
      context.globalAlpha = 1;
    }
    for (const p of state.particles) {
      if (!p.active) continue;
      context.globalAlpha = Math.min(1, p.life * 2);
      context.fillStyle = p.color;
      context.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      context.globalAlpha = 1;
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    const w = 720;
    const h = 150 + lines.length * 36;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = 'rgba(10, 6, 14, 0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, w, h, 20);
    context.fill();
    context.strokeStyle = accent || PALETTE.panelEdge;
    context.lineWidth = 3;
    roundRect(x, y, w, h, 20);
    context.stroke();
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 72, 46, PALETTE.text, 'center', '800');
    lines.forEach((line, i) => {
      text(line, FIELD.width / 2, y + 122 + i * 36, 22, PALETTE.muted, 'center');
    });
    text(prompt, FIELD.width / 2, y + h - 36, 24, PALETTE.coin, 'center', '700');
  }

  function draw(state, screen, best, opts) {
    const t = (opts && opts.t) || 0;
    const muted = opts && opts.muted;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawSunset(t, state.day);
    drawCounter(state.day, state.upgrades, t);
    if (!state.upgrades.seat) drawLockedSeat();
    for (const c of state.customers) {
      if (c.active) drawCustomer(c, c.seat === state.selected && screen === SCREEN_PLAY, t);
    }
    drawFloaters(state);
    if (screen === SCREEN_TITLE) {
      drawHud({ coins: 0, target: DAYS0Target(), day: 0, timeLeft: 75, walkouts: 0, combo: 0 }, muted);
      drawPanel('WARUNG SENJA', ['Kopi Rush — layani pelanggan sebelum senja habis.', 'Klik pelanggan, sajikan pesanan yang benar, jaga kombo.', 'Kopi 30  •  Teh 20  •  Gorengan 25  •  Nasi Kucing 35  •  Es Teh 25', 'VIP Pak Lurah bayar 2x  •  RUSH HOUR tiap shift: koin 1,5x!', 'Antar shift: beli upgrade di toko — kompor, kursi, kipas.', '3 shift: senja, jingga pekat, lalu malam. 5 pelanggan pergi = tutup.'], 'Tekan Spasi atau klik untuk mulai', PALETTE.panelEdge);
      text('Skor terbaik: ' + best + ' koin', FIELD.width / 2, 640, 20, PALETTE.muted, 'center');
      return;
    }
    drawHud(state, muted);
    drawTray(state, t);
    drawRushBanner(state, t);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Warungnya menunggu. Pelanggan sabar dulu.'], 'Tekan P untuk lanjut  •  R untuk mulai ulang');
    } else if (screen === SCREEN_SHOP) {
      drawShop(state);
    } else if (screen === SCREEN_OVER) {
      const won = state.status === 'won';
      const bought = UPGRADES.filter((u) => state.upgrades[u.id]).map((u) => u.name);
      const upLine = 'Upgrade dibeli: ' + (bought.length > 0 ? bought.join(', ') : 'tidak ada');
      const lines = won
        ? ['Warung Senja jadi langganan se-Yogyakarta!', 'Total koin: ' + state.totalCoins + '  •  Pelanggan dilayani: ' + state.served + '  •  Kombo terbaik: ' + state.bestCombo, 'VIP dilayani: ' + state.servedVip + '  •  Sajian saat Rush Hour: ' + state.rushServed, upLine, 'Skor terbaik: ' + Math.max(best, state.totalCoins) + ' koin']
        : [state.loseReason || 'Warung tutup.', 'Total koin: ' + state.totalCoins + '  •  Pelanggan dilayani: ' + state.served, upLine, 'Skor terbaik: ' + Math.max(best, state.totalCoins) + ' koin'];
      drawPanel(won ? 'MENANG! 🎉' : 'Warung Tutup', lines, 'Tekan Spasi atau klik untuk main lagi  •  R untuk restart');
    }
  }

  function DAYS0Target() { return 650; }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical(x, y, rectW, rectH) {
    return { x: (x / rectW) * FIELD.width, y: (y / rectH) * FIELD.height };
  } };
}
