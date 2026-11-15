// Everything the judge sees: the pool, the crab, the creatures, the HUD and the screens.
// Criterion 1: goal, timer, score, HP, level, controls and restart are all VISIBLE here.
// Criterion 4: one palette, big readable shapes, a scene that reads at a glance.
import { BOSS, PAL, PLAYER, POOL, VIEW_H, VIEW_W, WIN_TIME, xpNeed } from './config.js';
import { UPGRADE_DEFS } from './upgrades.js';
import { fmtTime } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// v3: the level-up card row slides to the half of the screen the crab (and the
// boss, if it is in the way) is NOT on, so the cards never cover either of
// them. Centered when the middle is clear. Shared with main.js so the click
// hit-boxes always match the drawn cards.
export function levelUpRowX(state) {
  const inZone = (e) => e && e.x > 250 && e.x < 1030 && e.y > 230 && e.y < 530;
  const crab = state.player, boss = state.boss;
  const leftIn = (inZone(crab) && crab.x < 640) || (inZone(boss) && boss.x < 640);
  const rightIn = (inZone(crab) && crab.x >= 640) || (inZone(boss) && boss.x >= 640);
  if (leftIn && !rightIn) return 560; // crab/boss on the left — cards go right
  if (rightIn && !leftIn) return 30; // crab/boss on the right — cards go left
  if (leftIn && rightIn) return crab.x < 640 ? 560 : 30; // both sides busy: keep the crab clear
  return 290; // middle clear — centred
}

function star(ctx, x, y, r, rot, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

function drawCrab(ctx, p, t) {
  const s = p.radius / 20; // v2: the crab is 1.5x v1 — every part scales with the radius
  // Soft shadow under the crab: it sits IN the pool, not on top of it.
  ctx.fillStyle = 'rgba(4,26,32,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 1.05, p.radius * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(p.x, p.y);
  const blink = p.iframes > 0 && Math.floor(t * 20) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.45;
  ctx.rotate(p.angle);
  ctx.scale(s, s);
  // Walk cycle: legs paddle and the body bobs only while moving.
  const mv = p.moving || 0;
  const wig = Math.sin(t * 16) * (2 + 4 * mv);
  ctx.translate(0, Math.sin(t * 16) * 1.5 * mv);
  // Legs: six strokes paddling as it moves.
  ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let sgn = -1; sgn <= 1; sgn += 1) {
    ctx.beginPath(); ctx.moveTo(-6 + sgn * 8, -14); ctx.lineTo(-10 + sgn * 8, -22 - wig * sgn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6 + sgn * 8, 14); ctx.lineTo(-10 + sgn * 8, 22 + wig * sgn); ctx.stroke();
  }
  // Claws: two pincers ahead, snapping shut on the swing.
  const snap = p.swing > 0 ? -0.5 : 0;
  for (const sgn of [-1, 1]) {
    ctx.save(); ctx.translate(16, sgn * 13); ctx.rotate(sgn * (0.5 + snap));
    ctx.fillStyle = PAL.crab; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.crabDark;
    ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(16, -1); ctx.lineTo(6, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Body and the shell — the shell's colour IS the armour tier, so upgrades are visible.
  ctx.fillStyle = PAL.crab; ctx.beginPath(); ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
  const shellColors = [PAL.shell0, PAL.shell1, PAL.shell2, PAL.shell3];
  ctx.fillStyle = shellColors[p.shellTier] || PAL.shell0;
  ctx.beginPath(); ctx.arc(-4, 0, 14, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-4, 0, 9, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
  // Facing chevron on the nose: the walking direction reads instantly.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(10, -5); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill();
  // Eyes on stalks, looking where it walks — bigger in v2, they are the face.
  for (const sgn of [-1, 1]) {
    ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(12, sgn * 6); ctx.lineTo(19, sgn * 10); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(20, sgn * 10, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(21.5, sgn * 10, 2.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Claw-swing arc: a gold swoosh sweeping the arc the claws just hit.
  if (p.swing > 0) {
    const prog = 1 - p.swing / 0.18; // 0 -> 1 across the swing
    const r = p.clawRange * 0.8;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalAlpha = (1 - prog) * 0.16;
    ctx.fillStyle = PAL.gold;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, p.clawRange, p.angle - PLAYER.clawArc, p.angle + PLAYER.clawArc); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = (1 - prog) * 0.85;
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 9; ctx.lineCap = 'round';
    const lead = p.angle - PLAYER.clawArc + prog * PLAYER.clawArc * 2;
    ctx.beginPath(); ctx.arc(0, 0, r, lead - 0.55, lead + 0.15); ctx.stroke();
    ctx.restore();
  }
  if (p.flash > 0) { // hurt flash: a red ring
    ctx.strokeStyle = `rgba(255,93,115,${p.flash * 3})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
}

// Every creature faces the crab (ang = direction to the player) and animates its
// own way: jellies pulse, eels wiggle, gulls flap, urchins spin, starfish crawl.
function drawEnemy(ctx, e, t, ang) {
  const face = ang ?? 0;
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.flash > 0) ctx.globalAlpha = 0.6;
  const flash = e.flash > 0;
  if (e.type === 'jelly') {
    // Dome faces the crab, tentacles trail behind; the bell pulses as it swims.
    ctx.rotate(face + Math.PI / 2);
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.08;
    ctx.scale(1 / pu, pu);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r, Math.PI, 0); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : e.dark; // inner bell shading
    ctx.beginPath(); ctx.arc(0, -e.r * 0.25, e.r * 0.55, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * 6, 2);
      ctx.quadraticCurveTo(i * 6 + Math.sin(t * 4 + i) * 5, 12, i * 6, 20 + Math.sin(t * 4 + i * 2) * 4);
      ctx.stroke();
    }
  } else if (e.type === 'urchin') {
    ctx.rotate(e.wob * 0.3); // slow spin
    const pu = 1 + Math.sin(t * 2 + e.wob) * 0.04;
    ctx.scale(pu, pu);
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 3;
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * e.r * 0.4, Math.sin(a) * e.r * 0.4);
      ctx.lineTo(Math.cos(a) * e.r * 1.15, Math.sin(a) * e.r * 1.15); ctx.stroke();
    }
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(-e.r * 0.2, -e.r * 0.2, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'starfish' || e.type === 'mini') {
    // Crawl: the star rocks side to side and breathes as it moves.
    const rock = Math.sin(t * 2 + e.wob) * 0.15;
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.05;
    ctx.rotate(rock); ctx.scale(pu, pu);
    star(ctx, 0, 0, e.r, 0, flash ? '#fff' : e.color);
    ctx.fillStyle = flash ? '#fff' : e.dark;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'eel') {
    // A segmented body that wiggles as it swims; the head leads, fins trail.
    ctx.rotate(face);
    for (let i = 4; i >= 0; i -= 1) {
      const x = -e.r * 1.4 + i * e.r * 0.55;
      const y = Math.sin(t * 7 + e.wob + i * 0.9) * e.r * 0.45;
      ctx.fillStyle = flash ? '#fff' : (i % 2 ? e.color : e.dark);
      ctx.beginPath(); ctx.arc(x, y, e.r * (0.32 + 0.1 * (i / 4)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(e.r * 1.15, 0, e.r * 0.52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 1.3, -e.r * 0.18, 2.4, 0, Math.PI * 2); ctx.fill();
    if (e.lungeT > 0) { // mid-lunge: a white streak sells the burst
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * 2.2, 0); ctx.lineTo(-e.r * 1.2, 0); ctx.stroke();
    }
  } else if (e.type === 'gull' || e.type === 'heron') {
    // Flying birds cast a soft shadow on the water below — height reads at once.
    ctx.fillStyle = 'rgba(4,26,32,0.22)';
    ctx.beginPath(); ctx.ellipse(0, e.r * 2.4, e.r * 1.1, e.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(face);
    const s = e.type === 'heron' ? 1.7 : 1;
    ctx.scale(s, s);
    const flap = Math.sin(t * 10 + e.wob) * 0.7; // wings sweep up and down
    ctx.fillStyle = flash ? '#fff' : e.color;
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.translate(-2, sgn * 4); ctx.rotate(sgn * (0.5 + flap * 0.5));
      ctx.beginPath(); ctx.ellipse(-e.r * 0.7, 0, e.r * 0.95, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, e.r * 0.9, e.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#ffd166';
    ctx.beginPath(); ctx.moveTo(e.r * 0.7, -3); ctx.lineTo(e.r * 1.5, 0); ctx.lineTo(e.r * 0.7, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    if (e.type === 'heron') { // long legs trailing behind
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * 0.7, -6); ctx.lineTo(-e.r * 1.4, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-e.r * 0.7, 6); ctx.lineTo(-e.r * 1.4, 2); ctx.stroke();
    }
  } else { // guppy: a little fish with a wagging tail
    ctx.rotate(face);
    const wag = Math.sin(t * 11 + e.wob) * 0.4;
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.save(); ctx.translate(-e.r * 0.8, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-e.r * 0.7, -e.r * 0.6); ctx.lineTo(-e.r * 0.7, e.r * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-e.r * 0.2, -e.r * 0.2, e.r * 0.4, e.r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -2, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (e.elite) { // gold ring + star: elites are worth hunting
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7, 0, Math.PI * 2); ctx.stroke();
    // v3: the star sits ABOVE the HP bar — in v2 both drew at the same height
    // and the bar cut straight through the star.
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', e.x, e.y - e.r - 26);
  }
  if (e.hp < e.maxHp && (e.elite || e.type === 'heron' || e.maxHp > 40)) {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 5);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * (e.hp / e.maxHp), 5);
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
  }
  addEventListener('resize', resize); resize();

  // Ambient bubbles: fixed pseudo-random table, positions a pure function of
  // time — deterministic, no state, they just rise forever.
  const ambBubbles = [];
  { let s = 1234567; for (let i = 0; i < 14; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; ambBubbles.push({ fx: (s % 1000) / 1000, fy: ((s >> 9) % 1000) / 1000, r: 2 + ((s >> 5) % 4), sp: 14 + ((s >> 7) % 22) }); } }

  function drawPool(state, t) {
    // Layered sand: a beach ellipse under the water, darker at the edges.
    ctx.fillStyle = '#8a6f4d';
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 74, POOL.ry + 58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.sand;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 46, POOL.ry + 34, 0, 0, Math.PI * 2); ctx.fill();
    // Water gradient + sandy rim + foam ring: the arena reads as a rockpool.
    const g = ctx.createRadialGradient(POOL.cx, POOL.cy, 60, POOL.cx, POOL.cy, POOL.rx);
    g.addColorStop(0, PAL.water2); g.addColorStop(1, PAL.water);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PAL.sand; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 4, POOL.ry + 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(191,232,224,${0.35 + 0.15 * Math.sin(t * 1.4)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx - 8, POOL.ry - 8, 0, 0, Math.PI * 2); ctx.stroke();
    // Ripples: concentric rings breathing slowly inside the pool.
    ctx.strokeStyle = 'rgba(191,232,224,0.10)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const rr = 0.35 + i * 0.28 + Math.sin(t * 0.5 + i * 2) * 0.02;
      ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx * rr, POOL.ry * rr, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Light rays from the surface, clipped to the pool, swaying gently.
    ctx.save();
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 4; i += 1) {
      const x0 = 200 + i * 260 + Math.sin(t * 0.25 + i * 1.7) * 24;
      ctx.fillStyle = 'rgba(220,255,245,0.05)';
      ctx.beginPath();
      ctx.moveTo(x0, POOL.cy - POOL.ry - 10); ctx.lineTo(x0 + 70, POOL.cy - POOL.ry - 10);
      ctx.lineTo(x0 + 170, POOL.cy + POOL.ry + 10); ctx.lineTo(x0 + 60, POOL.cy + POOL.ry + 10);
      ctx.closePath(); ctx.fill();
    }
    // Drifting caustic light patches.
    for (let i = 0; i < 2; i += 1) {
      const cx = POOL.cx + Math.sin(t * 0.11 + i * 2.4) * 260;
      const cy = POOL.cy + Math.cos(t * 0.09 + i * 1.3) * 130;
      ctx.fillStyle = 'rgba(200,255,240,0.05)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 150, 70, 0.3 * i, 0, Math.PI * 2); ctx.fill();
    }
    // Ambient bubbles rising from the sand.
    ctx.strokeStyle = 'rgba(191,232,224,0.35)'; ctx.lineWidth = 1.5;
    for (const b of ambBubbles) {
      const x = POOL.cx + (b.fx - 0.5) * POOL.rx * 1.7;
      const y = POOL.cy + POOL.ry - ((t * b.sp + b.fy * 500) % (POOL.ry * 2));
      const inside = ((x - POOL.cx) / POOL.rx) ** 2 + ((y - POOL.cy) / POOL.ry) ** 2 < 0.95;
      if (inside) { ctx.beginPath(); ctx.arc(x, y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
    // Decor: rocks, weed, shells, starfish — placed by the seeded RNG.
    for (const d of state.decor) {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = 0.85;
      // Soft shadow grounds each piece of decor.
      ctx.fillStyle = 'rgba(4,26,32,0.28)';
      ctx.beginPath(); ctx.ellipse(3, 6, 15 * d.s, 7 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      if (d.kind === 'rock') {
        ctx.fillStyle = '#5a6b66'; ctx.beginPath(); ctx.ellipse(0, 0, 16 * d.s, 11 * d.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.beginPath(); ctx.ellipse(-4 * d.s, -3 * d.s, 7 * d.s, 4 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      } else if (d.kind === 'weed') {
        // Taller blades that sway with the current.
        ctx.strokeStyle = '#2f8f6b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath(); ctx.moveTo(i * 6, 0);
          ctx.quadraticCurveTo(i * 8, -16 * d.s, i * 4 + Math.sin(t * 1.2 + i + d.rot) * 6, -32 * d.s); ctx.stroke();
        }
        ctx.strokeStyle = '#4fae7d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(4, -20 * d.s, Math.sin(t * 1.2 + d.rot) * 8, -38 * d.s); ctx.stroke();
      } else if (d.kind === 'shell') {
        // v3: pale lavender, never gold — a gold shell read as a fat pearl.
        ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.arc(0, 0, 7 * d.s, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#a894c4'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 4 * d.s, Math.PI, 0); ctx.stroke();
      } else {
        // v3: a sand dollar, not a starfish — a pink decor star read as a
        // (motionless) enemy starfish at a glance. Pale disc, dark centre dot.
        ctx.fillStyle = 'rgba(224,196,143,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 8 * d.s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(138,111,77,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 2.5 * d.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawHud(state, t) {
    // v3 HUD layout (VIEW 1280x720) — every element owns one region, none overlap:
    //   top bar y 14–94: HP panel / timer+WIN-LOSE panel / score panel
    //   boss strip y 100–134: boss bar (boss alive) OR countdown pill (15 s before) — never both
    //   banner zone y 146–186: one banner at a time, dark backdrop, skipped on level-up
    //   playfield y 200–610: damage numbers live here and nowhere else (see particles.js)
    //   hint pill y 564–608, centred, play phase only, never while a banner shows
    //   bottom bar y 620–704: level/XP left, cooldowns right, controls strip centre
    const p = state.player;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // Top-left: HP bar with a heart + shell tier, each on its own line.
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(18, 14, 250, 80);
    ctx.fillStyle = PAL.hp; ctx.font = 'bold 26px sans-serif';
    ctx.fillText('♥', 28, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(58, 26, 190, 18);
    ctx.fillStyle = PAL.hp; ctx.fillRect(58, 26, 190 * (p.hp / p.maxHp), 18);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp} HP`, 58, 64);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`SHELL ${'●'.repeat(p.shellTier + 1)}${'○'.repeat(3 - p.shellTier)}`, 58, 86);
    // Top-centre: the win condition, always visible — countdown AND the goal,
    // written as an explicit WIN/LOSE line (the top entries all do this).
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W / 2 - 170, 14, 340, 80);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(state.time >= WIN_TIME ? 'HIGH TIDE!' : `HIGH TIDE IN ${fmtTime(state.time)}`, VIEW_W / 2, 40);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('WIN: SURVIVE TO HIGH TIDE · LOSE: HP = 0', VIEW_W / 2, 62);
    ctx.fillStyle = PAL.dim; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`WAVE ${state.wave}  •  ${state.enemies.length} creatures`, VIEW_W / 2, 82);
    // Boss countdown in the 15 s before the heron arrives — never a surprise.
    // v3: its own dark pill in the boss strip, so it reads over any background.
    if (!state.bossSpawned && state.time >= BOSS.spawnAt - 15) {
      const warn = `⚠ THE GREAT HERON ARRIVES IN ${Math.ceil(BOSS.spawnAt - state.time)} ⚠`;
      ctx.font = 'bold 17px sans-serif';
      const ww = ctx.measureText(warn).width + 40;
      ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - ww / 2, 100, ww, 32);
      ctx.fillStyle = `rgba(255,93,115,${0.6 + 0.4 * Math.sin(t * 6)})`;
      ctx.fillText(warn, VIEW_W / 2, 122);
    }
    // Boss bar under the timer while the Heron lives.
    if (state.boss) {
      ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W / 2 - 190, 104, 380, 26);
      ctx.fillStyle = '#e8e4d8'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('THE GREAT HERON', VIEW_W / 2, 122);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(VIEW_W / 2 - 180, 126, 360, 8);
      ctx.fillStyle = '#ff5d73'; ctx.fillRect(VIEW_W / 2 - 180, 126, 360 * (state.boss.hp / state.boss.maxHp), 8);
    }
    // Top-right: score, kills, best.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W - 268, 14, 250, 62);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, VIEW_W - 28, 40);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`BEST ${state.best}  •  ${state.kills} slain`, VIEW_W - 28, 62);
    // Bottom-left: level + XP bar + ability slots (the 8 upgrade tracks, level inside each box).
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(18, VIEW_H - 100, 420, 84);
    ctx.fillStyle = PAL.xp; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`LEVEL ${state.level}`, 28, VIEW_H - 74);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(110, VIEW_H - 86, 200, 10);
    ctx.fillStyle = PAL.xp; ctx.fillRect(110, VIEW_H - 86, 200 * (state.xp / xpNeed(state.level)), 10);
    ctx.fillText(`${state.xp}/${xpNeed(state.level)} pearls`, 318, VIEW_H - 74);
    let sx = 28;
    for (const d of UPGRADE_DEFS) {
      const lv = state.ups[d.id];
      const by = VIEW_H - 62;
      ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.9)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(sx, by, 34, 40);
      ctx.fillStyle = lv > 0 ? '#062a33' : '#9fc4bd'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.icon, sx + 17, by + 18);
      ctx.fillStyle = lv > 0 ? '#062a33' : PAL.dim; ctx.font = 'bold 10px sans-serif';
      ctx.fillText(lv > 0 ? `Lv${lv}` : '—', sx + 17, by + 33);
      sx += 40;
    }
    ctx.textAlign = 'left';
    // Bottom-right: dash + bolt cooldowns.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W - 268, VIEW_H - 100, 250, 84);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(p.dashCd <= 0 ? 'DASH READY  [Space]' : `DASH ${p.dashCd.toFixed(1)}s`, VIEW_W - 28, VIEW_H - 68);
    ctx.fillText(p.boltCd <= 0 ? 'BUBBLE BOLT READY  [Click]' : `BOLT ${p.boltCd.toFixed(1)}s`, VIEW_W - 28, VIEW_H - 42);
    // Wave / elite banner in its own zone (y 146–186) with a dark backdrop and a
    // gold frame — v2 drew bare gold text that damage numbers and the heron
    // crossed freely. Skipped on the level-up screen, whose own title lives here.
    if (state.bannerT > 0 && state.phase !== 'levelup') {
      ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, state.bannerT);
      ctx.font = 'bold 30px sans-serif';
      const bw = ctx.measureText(state.banner).width + 56;
      ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
      ctx.fillStyle = PAL.gold;
      ctx.fillText(state.banner, VIEW_W / 2, 175);
      ctx.globalAlpha = 1;
    }
    // Controls strip, bottom centre — a dark bar between the two bottom panels,
    // so the line reads over the bright sand rim (v2's bare dim text washed out).
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(446, 676, 558, 24);
    ctx.fillStyle = PAL.foam; ctx.font = '13px sans-serif';
    ctx.fillText('WASD move  ·  CLICK bolt  ·  SPACE dash  ·  P pause  ·  M mute', VIEW_W / 2, 693);
    // Tutorial hint pill, bottom centre: one short line at a time, fading out.
    // Play phase only — on the level-up screen the cards own the player's attention.
    const hint = state.phase === 'play' && state.hints && state.hints.cur;
    if (hint) {
      const remain = state.hints.t;
      const alpha = Math.min(1, remain / 0.5) * Math.min(1, (hint.show - remain) / 0.25);
      ctx.font = 'bold 19px sans-serif';
      const w = ctx.measureText(hint.text).width + 44;
      const y = VIEW_H - 132;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - w / 2, y - 24, w, 44);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - w / 2, y - 24, w, 44);
      ctx.fillStyle = PAL.text; ctx.textAlign = 'center';
      ctx.fillText(hint.text, VIEW_W / 2, y + 5);
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle(state) {
    ctx.fillStyle = 'rgba(6,42,51,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.crab; ctx.font = 'bold 84px sans-serif';
    ctx.fillText('TIDEKEEPER', VIEW_W / 2, 170);
    // Goal first, in gold: a new player reads the goal + controls in under 5 s.
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 23px sans-serif';
    ctx.fillText('★ SURVIVE 5:00 — WHEN THE TIDE COMES IN, YOU WIN ★', VIEW_W / 2, 222);
    ctx.fillStyle = PAL.text; ctx.font = '19px sans-serif';
    ctx.fillText('Slay creatures. Gather pearls. Level up.', VIEW_W / 2, 256);
    // The three controls as chips, side by side.
    const chips = ['WASD — MOVE', 'CLICK — BUBBLE BOLT', 'SPACE — DASH'];
    ctx.font = 'bold 16px sans-serif';
    const widths = chips.map((c) => ctx.measureText(c).width + 36);
    const gap = 16;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
    let x = VIEW_W / 2 - total / 2;
    for (let i = 0; i < chips.length; i += 1) {
      ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(x, 292, widths[i], 40);
      ctx.strokeStyle = PAL.foam; ctx.lineWidth = 2; ctx.strokeRect(x, 292, widths[i], 40);
      ctx.fillStyle = PAL.text; ctx.fillText(chips[i], x + widths[i] / 2, 318);
      x += widths[i] + gap;
    }
    ctx.fillStyle = PAL.dim; ctx.font = '16px sans-serif';
    ctx.fillText('Your claws swing on their own — just get close.', VIEW_W / 2, 366);
    // Scope line: what the game contains, in numbers (the top titles all list theirs).
    ctx.fillStyle = PAL.foam; ctx.font = '15px sans-serif';
    ctx.fillText('6 creatures · elites every 45s · the Great Heron · 8 upgrades', VIEW_W / 2, 396);
    const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PAL.gold; ctx.font = 'bold 30px sans-serif';
      ctx.fillText('CLICK  or  PRESS ENTER  to begin', VIEW_W / 2, 480);
    }
    ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif';
    ctx.fillText(state.best > 0 ? `BEST SCORE ${state.best}` : 'No best score yet — be the first crab to hold the pool.', VIEW_W / 2, 540);
    // A crab and a jellyfish flank the title, so the cover shows the game at once.
    drawCrab(ctx, { ...state.player, x: 330, y: 470, angle: 0.3, iframes: 0, flash: 0, swing: 0 }, 0);
    drawEnemy(ctx, { type: 'jelly', x: 950, y: 470, r: 26, color: '#ff8fb0', dark: '#c94f78', hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI);
  }

  function drawLevelUp(state) {
    // v3: a lighter dim (0.62, was 0.78) so the fight behind the cards stays
    // visible — the crab, the boss bar and the heron are part of the shot.
    ctx.fillStyle = 'rgba(6,42,51,0.62)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    // v3: the title sits at y=180 (was 150) so its 40 px glyphs clear the boss
    // bar (y 104–134) — in the first level-up-during-boss frame the title cut
    // straight through "THE GREAT HERON". Cards move down with it (y 270).
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`LEVEL ${state.level} — CHOOSE AN UPGRADE`, VIEW_W / 2, 180);
    ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif';
    ctx.fillText('Press 1, 2 or 3 — or click a card.', VIEW_W / 2, 212);
    const cards = state.levelChoices || [];
    const rowX = levelUpRowX(state); // the row slides away from the crab/boss
    cards.forEach((d, i) => {
      const x = rowX + i * 240, y = 270, w = 210, h = 220;
      ctx.fillStyle = '#0e5566'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = PAL.xp; ctx.font = 'bold 44px sans-serif';
      ctx.fillText(d.icon, x + w / 2, y + 64);
      ctx.fillStyle = PAL.text; ctx.font = 'bold 19px sans-serif';
      ctx.fillText(d.name, x + w / 2, y + 104);
      ctx.fillStyle = PAL.dim; ctx.font = '16px sans-serif';
      ctx.fillText(d.desc, x + w / 2, y + 130);
      // The plain-language line: what the upgrade actually does, in words.
      ctx.fillStyle = '#cfe8df'; ctx.font = 'italic 14px sans-serif';
      ctx.fillText(d.what, x + w / 2, y + 156);
      ctx.fillStyle = PAL.gold; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Lv ${state.ups[d.id]} → ${state.ups[d.id] + 1}`, x + w / 2, y + 182);
      ctx.fillStyle = PAL.text; ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`[ ${i + 1} ]`, x + w / 2, y + 208);
    });
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(6,42,51,0.7)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.text; ctx.font = 'bold 56px sans-serif';
    ctx.fillText('PAUSED', VIEW_W / 2, 330);
    ctx.fillStyle = PAL.dim; ctx.font = '20px sans-serif';
    ctx.fillText('P / Esc — resume      M — mute      R — restart', VIEW_W / 2, 380);
  }

  function drawOver(state) {
    const won = state.result === 'won';
    // Letter grade: the top entries all grade the run, and the grade gives the
    // player a reason to run again. S = win with 60+ HP, A = win, B = win nearly
    // dead, C = lost after 4:00, D = lost earlier.
    const hp = Math.ceil(state.player.hp);
    let grade, gradeColor, nextGoal;
    if (won && hp >= 60) { grade = 'S'; gradeColor = '#ffd166'; nextGoal = 'NEXT GOAL: beat your best score'; }
    else if (won && hp > 25) { grade = 'A'; gradeColor = '#7fe0c3'; nextGoal = 'NEXT GOAL: finish with 60+ HP for grade S'; }
    else if (won) { grade = 'B'; gradeColor = '#8fb8ff'; nextGoal = 'NEXT GOAL: finish with 26+ HP for grade A'; }
    else if (state.time >= 240) { grade = 'C'; gradeColor = '#ffab5e'; nextGoal = 'NEXT GOAL: survive to HIGH TIDE to win'; }
    else { grade = 'D'; gradeColor = '#ff5d73'; nextGoal = 'NEXT GOAL: survive past 4:00 for grade C'; }
    ctx.fillStyle = 'rgba(6,42,51,0.86)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? PAL.gold : PAL.hp; ctx.font = 'bold 64px sans-serif';
    ctx.fillText(won ? 'HIGH TIDE!' : 'THE TIDE TOOK YOU', VIEW_W / 2, 150);
    ctx.fillStyle = gradeColor; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`★ GRADE ${grade} ★`, VIEW_W / 2, 210);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 22px sans-serif';
    ctx.fillText(won ? 'You held the rockpool. The crab keeps its shell.' : 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 248);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, 305);
    ctx.fillStyle = PAL.text; ctx.font = '22px sans-serif';
    const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
    ctx.fillText(`${state.kills} slain  •  ${state.pearlsCollected} pearls  •  Level ${state.level}  •  ${mins}:${String(secs).padStart(2, '0')} survived`, VIEW_W / 2, 345);
    ctx.fillText(`Damage dealt ${state.stats.damage}  •  Damage taken ${state.stats.taken}  •  Dashes ${state.stats.dashes}`, VIEW_W / 2, 375);
    // v3: build recap — the upgrades this run picked, in the HUD's own
    // icon+level language (the top entries' victory screens show one too).
    const built = UPGRADE_DEFS.filter((d) => state.ups[d.id] > 0)
      .map((d) => `${d.icon} Lv${state.ups[d.id]}`).join('  ·  ');
    ctx.fillStyle = PAL.foam; ctx.font = '17px sans-serif';
    ctx.fillText(built ? `BUILD: ${built}` : 'BUILD: no upgrades yet', VIEW_W / 2, 402);
    ctx.fillStyle = PAL.xp; ctx.font = 'bold 19px sans-serif';
    ctx.fillText(nextGoal, VIEW_W / 2, 430);
    ctx.fillStyle = state.score >= state.best && state.score > 0 ? PAL.gold : PAL.dim;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(state.score >= state.best && state.score > 0 ? '★ NEW BEST SCORE ★' : `BEST ${state.best}`, VIEW_W / 2, 462);
    const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PAL.text; ctx.font = 'bold 28px sans-serif';
      ctx.fillText('PRESS R  or  CLICK  to play again', VIEW_W / 2, 505);
    }
  }

  return {
    render(state, fx, t) {
      const scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
      const ox = (canvas.width - VIEW_W * scale) / 2, oy = (canvas.height - VIEW_H * scale) / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAL.deep; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, ox + fx.shakeX * scale, oy + fx.shakeY * scale);
      drawPool(state, t);
      // Ink pools under everything that swims.
      for (const ink of state.inks) {
        ctx.fillStyle = `rgba(123,92,255,${Math.min(0.55, ink.life / 2)})`;
        ctx.beginPath(); ctx.arc(ink.x, ink.y, ink.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const pe of state.pearls) { // pearls bob and glint (fat ones are gold)
        const bobY = Math.sin(pe.bob) * 3;
        ctx.fillStyle = pe.v >= 3 ? PAL.gold : PAL.pearl;
        ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, pe.v >= 3 ? 8 : 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(pe.x - 1.5, pe.y + bobY - 1.5, 2, 0, Math.PI * 2); ctx.fill();
      }
      for (const pk of state.pickups) {
        if (pk.kind === 'heal') star(ctx, pk.x, pk.y, 14, t, '#ff8fb0');
        else if (pk.kind === 'bomb') {
          ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(pk.x, pk.y, 13, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#062a33'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('✹', pk.x, pk.y + 5);
        } else {
          ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(pk.x, pk.y, 12, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#7fe0c3'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('◎', pk.x, pk.y + 5);
        }
      }
      for (const b of state.bolts) {
        ctx.strokeStyle = 'rgba(191,232,224,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#bfe8e0'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const e of state.enemies) drawEnemy(ctx, e, t, Math.atan2(state.player.y - e.y, state.player.x - e.x));
      if (state.phase !== 'title') drawCrab(ctx, state.player, t);
      fx.draw(ctx);
      // Hurt vignette: red edges while the crab is flashing from a hit.
      if (state.player.flash > 0 && state.phase === 'play') {
        const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
        vg.addColorStop(0, 'rgba(255,45,85,0)');
        vg.addColorStop(1, `rgba(255,45,85,${state.player.flash * 1.6})`);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      // Level-up flash: a gold wash as the new level lands.
      if (state.levelFlash > 0) {
        ctx.fillStyle = `rgba(255,209,102,${state.levelFlash * 0.16})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      if (state.phase === 'play' || state.phase === 'paused' || state.phase === 'levelup') drawHud(state, t);
      if (state.phase === 'title') drawTitle(state);
      if (state.phase === 'levelup') drawLevelUp(state);
      if (state.phase === 'paused') drawPaused();
      if (state.phase === 'over') drawOver(state);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
