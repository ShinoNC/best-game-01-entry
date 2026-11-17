// The rockpool itself: layered sand, the water gradient, light rays and
// caustics, sun glints, ambient bubbles, and the decor (rocks, weed,
// shells, sand dollars) the seeded RNG scattered for this run. Every run
// reshuffles the decor — the pool never looks the same twice.
import { PAL, POOL } from '../config.js';

// Ambient bubbles: a fixed pseudo-random table, positions a pure function of
// time — deterministic bubbles, rising forever.
const ambBubbles = [];
{ let s = 1234567; for (let i = 0; i < 14; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; ambBubbles.push({ fx: (s % 1000) / 1000, fy: ((s >> 9) % 1000) / 1000, r: 2 + ((s >> 5) % 4), sp: 14 + ((s >> 7) % 22) }); } }

// The pool's water gradient is constant (logical coordinates), so it is
// created once and reused — creating a gradient every frame is pure waste.
let poolGrad = null;

export function drawPool(ctx, state, t) {
  // Layered sand: a wide beach ellipse under the water, darker at the
  // edges — the pool must read as water on a beach, not a dark hole.
  ctx.fillStyle = '#8a6f4d';
  ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 88, POOL.ry + 70, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL.sand;
  ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 58, POOL.ry + 44, 0, 0, Math.PI * 2); ctx.fill();
  // Water gradient + sandy rim + foam ring: the arena reads as a rockpool.
  if (!poolGrad) {
    poolGrad = ctx.createRadialGradient(POOL.cx, POOL.cy, 60, POOL.cx, POOL.cy, POOL.rx);
    poolGrad.addColorStop(0, PAL.water2); poolGrad.addColorStop(1, PAL.water);
  }
  ctx.fillStyle = poolGrad;
  ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PAL.sand; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 4, POOL.ry + 4, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = `rgba(191,232,224,${0.35 + 0.15 * Math.sin(t * 1.4)})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx - 8, POOL.ry - 8, 0, 0, Math.PI * 2); ctx.stroke();
  // Ripples: concentric rings breathing slowly inside the pool.
  ctx.strokeStyle = 'rgba(191,232,224,0.16)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const rr = 0.35 + i * 0.28 + Math.sin(t * 0.5 + i * 2) * 0.02;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx * rr, POOL.ry * rr, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Light rays from the surface, clipped to the pool, swaying gently.
  ctx.save();
  ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 4; i += 1) {
    const x0 = 200 + i * 260 + Math.sin(t * 0.25 + i * 1.7) * 24;
    ctx.fillStyle = 'rgba(220,255,245,0.09)';
    ctx.beginPath();
    ctx.moveTo(x0, POOL.cy - POOL.ry - 10); ctx.lineTo(x0 + 70, POOL.cy - POOL.ry - 10);
    ctx.lineTo(x0 + 170, POOL.cy + POOL.ry + 10); ctx.lineTo(x0 + 60, POOL.cy + POOL.ry + 10);
    ctx.closePath(); ctx.fill();
  }
  // Drifting caustic light patches.
  for (let i = 0; i < 2; i += 1) {
    const cx = POOL.cx + Math.sin(t * 0.11 + i * 2.4) * 260;
    const cy = POOL.cy + Math.cos(t * 0.09 + i * 1.3) * 130;
    ctx.fillStyle = 'rgba(200,255,240,0.09)';
    ctx.beginPath(); ctx.ellipse(cx, cy, 150, 70, 0.3 * i, 0, Math.PI * 2); ctx.fill();
  }
  // Sun glints: white sparkles twinkling on the surface.
  for (let i = 0; i < 10; i += 1) {
    const gx = POOL.cx + Math.sin(i * 13) * POOL.rx * 0.8;
    const gy = POOL.cy + Math.cos(i * 8) * POOL.ry * 0.8;
    ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.1 * Math.sin(t * 2 + i * 2)})`;
    ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2); ctx.fill();
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
