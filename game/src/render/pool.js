// The water: full width, edge to edge, NO frame. Colour by band.
import { envForStage, POOL } from '../config.js';

// Ambient particles: fixed tables, positions a function of time.
function table(n, seed) {
  const a = []; let s = seed;
  for (let i = 0; i < n; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    a.push({ fx: (s % 1000) / 1000, fy: ((s >> 9) % 1000) / 1000, r: 2 + ((s >> 5) % 4), sp: 14 + ((s >> 7) % 22) });
  }
  return a;
}
const ambBubbles = table(14, 1234567);
const rainDrops = table(60, 7654321);
const glowDots = table(24, 987654);
const motes = table(36, 24680); // drifting plankton dots

// Standing seaweed: tapered vertical strands, swaying.
function drawWeed(ctx, d, env, t, swA, swS) {
  ctx.save(); ctx.translate(d.x, d.y); ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(4,26,32,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 3, 14 * d.s, 5 * d.s, 0, 0, Math.PI * 2); ctx.fill();
  const n = 3 + Math.floor((d.rot * 10) % 3); // 3–5 strands, seeded by rot
  for (let i = 0; i < n; i += 1) {
    const off = (i - (n - 1) / 2) * 6 * d.s;
    const h = Math.min((44 + ((i * 17 + Math.floor(d.rot * 100)) % 36)) * d.s, d.y - POOL.y0 - 6);
    const sw = Math.sin(t * swS + i * 1.3 + d.rot) * swA;
    ctx.fillStyle = i % 2 ? env.weed2 : env.weed;
    ctx.beginPath();
    ctx.moveTo(off - 3 * d.s, 0);
    ctx.quadraticCurveTo(off + sw * 0.3 - 2 * d.s, -h * 0.6, off + sw, -h);
    ctx.quadraticCurveTo(off + sw * 0.3 + 2 * d.s, -h * 0.6, off + 3 * d.s, 0);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// Water gradient cached per environment.
let poolGrad = null, gradEnv = '';

export function drawPool(ctx, state, t) {
  const env = envForStage(state.stage);
  // Menu screens: open water, no frame.
  const menu = state.phase === 'title' || state.phase === 'difficulty';
  const x0 = menu ? 0 : POOL.x0, y0 = menu ? 0 : POOL.y0;
  const pw = menu ? 1280 : POOL.x1 - POOL.x0, ph = menu ? 720 : POOL.y1 - POOL.y0;
  const key = `${env.name}|${menu ? 'menu' : 'play'}`;
  if (!poolGrad || gradEnv !== key) {
    poolGrad = ctx.createLinearGradient(0, y0, 0, y0 + ph);
    poolGrad.addColorStop(0, env.water2); poolGrad.addColorStop(1, env.water);
    gradEnv = key;
  }
  ctx.fillStyle = poolGrad; ctx.fillRect(x0, y0, pw, ph);
// Light rays: strong in SHALLOWS, gone in STORM.
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
  if (env.rays > 0) {
    for (let i = 0; i < 4; i += 1) {
      const rx = 200 + i * 260 + Math.sin(t * 0.25 + i * 1.7) * 24;
      ctx.fillStyle = `rgba(230,255,250,${0.13 * env.rays * (1 + 0.15 * Math.sin(t * 0.7 + i * 2.1))})`;
      ctx.beginPath();
      ctx.moveTo(rx, y0 - 10); ctx.lineTo(rx + 70, y0 - 10);
      ctx.lineTo(rx + 170, y0 + ph + 10); ctx.lineTo(rx + 60, y0 + ph + 10);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 2; i += 1) {
      const cx = POOL.cx + Math.sin(t * 0.11 + i * 2.4) * 260;
      const cy = POOL.cy + Math.cos(t * 0.09 + i * 1.3) * 130;
      ctx.fillStyle = `rgba(210,255,245,${0.12 * Math.max(0.15, env.rays)})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, 150, 70, 0.3 * i, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 10; i += 1) {
      const gx = POOL.cx + Math.sin(i * 13) * POOL.rx * 0.8;
      const gy = POOL.cy + Math.cos(i * 8) * POOL.ry * 0.8;
      ctx.fillStyle = `rgba(255,255,255,${(0.12 + 0.1 * Math.sin(t * 2 + i * 2)) * env.rays})`;
      ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Rain (STORM TIDE): diagonal streaks.
  if (env.rain) {
    ctx.strokeStyle = 'rgba(180,210,230,0.35)'; ctx.lineWidth = 1.5;
    for (const b of rainDrops) {
      const x = x0 + b.fx * pw;
      const y = y0 + ((t * b.sp * 30 + b.fy * 600) % ph);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); ctx.stroke();
    }
  }
  // Bioluminescence (STORM TIDE): twinkling plankton.
  if (env.glow) {
    for (const b of glowDots) {
      const x = x0 + b.fx * pw, y = y0 + b.fy * ph;
      ctx.fillStyle = `rgba(120,255,220,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + b.fx * 6.28))})`;
      ctx.beginPath(); ctx.arc(x, y, b.r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Ambient bubbles rising, wobbling.
  ctx.strokeStyle = 'rgba(191,232,224,0.5)'; ctx.lineWidth = 1.5;
  for (const b of ambBubbles) {
    const x = POOL.cx + (b.fx - 0.5) * POOL.rx * 1.7 + Math.sin(t * 2 + b.fy * 10) * 4;
    const y = POOL.cy + POOL.ry - ((t * b.sp + b.fy * 500) % (POOL.ry * 2));
    ctx.beginPath(); ctx.arc(x, y, b.r, 0, Math.PI * 2); ctx.stroke();
  }
  // Drifting motes: tiny plankton dots.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (const m of motes) {
    const mx = x0 + ((m.fx * pw + t * m.sp * 0.4) % pw);
    const my = y0 + ((m.fy * ph + t * m.sp * 0.15) % ph);
    ctx.beginPath(); ctx.arc(mx, my, m.r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Seeded decor: rocks, weed, shells, sand dollars. Weed sways.
  const swA = env.rain ? 17 : 13, swS = env.rain ? 3 : 1.8;
  for (const d of state.decor) {
    if (d.kind === 'weed') { drawWeed(ctx, d, env, t, swA, swS); continue; }
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(4,26,32,0.28)';
    ctx.beginPath(); ctx.ellipse(3, 6, 15 * d.s, 7 * d.s, 0, 0, Math.PI * 2); ctx.fill();
    if (d.kind === 'rock') {
      ctx.fillStyle = '#5a6b66'; ctx.beginPath(); ctx.ellipse(0, 0, 16 * d.s, 11 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.ellipse(-4 * d.s, -3 * d.s, 7 * d.s, 4 * d.s, 0, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'shell') {
      // Pale lavender — gold would read as a coin.
      ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.arc(0, 0, 7 * d.s, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#a894c4'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 4 * d.s, Math.PI, 0); ctx.stroke();
    } else {
      // A sand dollar, not a starfish (pink reads as an enemy).
      ctx.fillStyle = 'rgba(224,196,143,0.8)';
      ctx.beginPath(); ctx.arc(0, 0, 8 * d.s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(138,111,77,0.8)';
      ctx.beginPath(); ctx.arc(0, 0, 2.5 * d.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
