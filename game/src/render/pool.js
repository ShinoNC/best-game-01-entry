// The water: full width between the HUD bars, edge to edge, NO frame —
// the sea spills to both sides. On the title/difficulty screens the water
// fills the whole screen. The WATER changes by stage band (ENVS).
import { envForStage, POOL } from '../config.js';

// Ambient particles: fixed pseudo-random tables, positions a pure function of time.
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

// The water gradient is cached per environment, rebuilt only when the band changes.
let poolGrad = null, gradEnv = '';

export function drawPool(ctx, state, t) {
  const env = envForStage(state.stage);
  // Menu screens (title, difficulty): open water edge-to-edge, no frame, no box.
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
// Light rays, clipped to the water — strong in the SHALLOWS, gone in the STORM.
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
  if (env.rays > 0) {
    for (let i = 0; i < 4; i += 1) {
      const rx = 200 + i * 260 + Math.sin(t * 0.25 + i * 1.7) * 24;
      ctx.fillStyle = `rgba(220,255,245,${0.09 * env.rays * (1 + 0.15 * Math.sin(t * 0.7 + i * 2.1))})`;
      ctx.beginPath();
      ctx.moveTo(rx, y0 - 10); ctx.lineTo(rx + 70, y0 - 10);
      ctx.lineTo(rx + 170, y0 + ph + 10); ctx.lineTo(rx + 60, y0 + ph + 10);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 2; i += 1) {
      const cx = POOL.cx + Math.sin(t * 0.11 + i * 2.4) * 260;
      const cy = POOL.cy + Math.cos(t * 0.09 + i * 1.3) * 130;
      ctx.fillStyle = `rgba(200,255,240,${0.09 * Math.max(0.15, env.rays)})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, 150, 70, 0.3 * i, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 10; i += 1) {
      const gx = POOL.cx + Math.sin(i * 13) * POOL.rx * 0.8;
      const gy = POOL.cy + Math.cos(i * 8) * POOL.ry * 0.8;
      ctx.fillStyle = `rgba(255,255,255,${(0.12 + 0.1 * Math.sin(t * 2 + i * 2)) * env.rays})`;
      ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Rain (STORM TIDE): diagonal streaks, wind-blown, falling fast.
  if (env.rain) {
    ctx.strokeStyle = 'rgba(180,210,230,0.35)'; ctx.lineWidth = 1.5;
    for (const b of rainDrops) {
      const x = x0 + b.fx * pw;
      const y = y0 + ((t * b.sp * 30 + b.fy * 600) % ph);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); ctx.stroke();
    }
  }
  // Bioluminescence (STORM TIDE): glowing plankton, twinkling in the dark.
  if (env.glow) {
    for (const b of glowDots) {
      const x = x0 + b.fx * pw, y = y0 + b.fy * ph;
      ctx.fillStyle = `rgba(120,255,220,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + b.fx * 6.28))})`;
      ctx.beginPath(); ctx.arc(x, y, b.r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Ambient bubbles rising from the sand, wobbling as they climb.
  ctx.strokeStyle = 'rgba(191,232,224,0.5)'; ctx.lineWidth = 1.5;
  for (const b of ambBubbles) {
    const x = POOL.cx + (b.fx - 0.5) * POOL.rx * 1.7 + Math.sin(t * 2 + b.fy * 10) * 4;
    const y = POOL.cy + POOL.ry - ((t * b.sp + b.fy * 500) % (POOL.ry * 2));
    ctx.beginPath(); ctx.arc(x, y, b.r, 0, Math.PI * 2); ctx.stroke();
  }
  // Drifting motes: tiny plankton dots in the current, wrapping around.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (const m of motes) {
    const mx = x0 + ((m.fx * pw + t * m.sp * 0.4) % pw);
    const my = y0 + ((m.fy * ph + t * m.sp * 0.15) % ph);
    ctx.beginPath(); ctx.arc(mx, my, m.r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Decor: rocks, weed, shells, sand dollars — placed by the seeded RNG.
  // Weed sway: visible bend, random phase per plant; the storm current is
  // faster and stronger. SHALLOWS gentle, DEEP REEF same, STORM wild.
  const swA = env.rain ? 17 : 13, swS = env.rain ? 3 : 1.8;
  for (const d of state.decor) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(4,26,32,0.28)';
    ctx.beginPath(); ctx.ellipse(3, 6, 15 * d.s, 7 * d.s, 0, 0, Math.PI * 2); ctx.fill();
    if (d.kind === 'rock') {
      ctx.fillStyle = '#5a6b66'; ctx.beginPath(); ctx.ellipse(0, 0, 16 * d.s, 11 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.ellipse(-4 * d.s, -3 * d.s, 7 * d.s, 4 * d.s, 0, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'weed') {
      // Blades bend with the current — coral pink in the DEEP REEF.
      ctx.strokeStyle = env.weed; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        const sw = Math.sin(t * swS + i * 1.3 + d.rot) * swA;
        ctx.beginPath(); ctx.moveTo(i * 6, 0);
        ctx.quadraticCurveTo(i * 8 + sw * 0.5, -16 * d.s, i * 4 + sw, -32 * d.s); ctx.stroke();
      }
      ctx.strokeStyle = env.weed2; ctx.lineWidth = 2;
      const sw2 = Math.sin(t * swS + d.rot) * swA * 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(4 + sw2 * 0.5, -20 * d.s, sw2, -38 * d.s); ctx.stroke();
    } else if (d.kind === 'shell') {
      // Pale lavender, never gold — a gold shell would read as a coin.
      ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.arc(0, 0, 7 * d.s, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#a894c4'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 4 * d.s, Math.PI, 0); ctx.stroke();
    } else {
      // A sand dollar, not a starfish (a pink decor star would read as an enemy).
      ctx.fillStyle = 'rgba(224,196,143,0.8)';
      ctx.beginPath(); ctx.arc(0, 0, 8 * d.s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(138,111,77,0.8)';
      ctx.beginPath(); ctx.arc(0, 0, 2.5 * d.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
