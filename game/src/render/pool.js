import { envForStage, POOL } from '../config.js';
import { imgFor } from '../sprites.js';
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
const motes = table(36, 24680);
function patternFor(ctx, name, cache) {
  const img = imgFor(name);
  if (!img) return null;
  if (cache.img === img && cache.pat) return cache.pat;
  const pat = ctx.createPattern(img, 'repeat');
  cache.img = img; cache.pat = pat;
  return pat;
}
const waterCache = {}, sandCache = {};
function drawSandCorner(ctx, x0, y0, pw, ph, corner) {
  const c = corner || 'bl';
  const sx = c[1] === 'r' ? x0 + pw : x0, sy = c[0] === 'b' ? y0 + ph : y0;
  const dx = c[1] === 'r' ? -1 : 1, dy = c[0] === 'b' ? -1 : 1;
  const w = Math.min(400, pw), h = Math.min(250, ph);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sx, sy + dy * h);
  for (let i = 0; i < 12; i += 1) {
    ctx.lineTo(sx + dx * w * (i + 1) / 12, sy + dy * h * (1 - i / 12));
    ctx.lineTo(sx + dx * w * (i + 1) / 12, sy + dy * h * (1 - (i + 1) / 12));
  }
  ctx.lineTo(sx, sy);
  ctx.closePath();
  ctx.clip();
  const pat = patternFor(ctx, 'sand-tile', sandCache);
  ctx.fillStyle = pat || '#e0c48f';
  ctx.fillRect(sx + Math.min(0, dx * w), sy + Math.min(0, dy * h), w, h);
  ctx.restore();
}
function pxRect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
export function drawPool(ctx, state, t) {
  const env = envForStage(state.stage, state.envs);
  const menu = state.phase === 'title';
  const x0 = 0, y0 = menu ? 0 : POOL.y0;
  const pw = POOL.x1, ph = menu ? 720 : POOL.y1 - POOL.y0;
  const wpat = patternFor(ctx, 'water-tile', waterCache);
  if (wpat) {
    ctx.fillStyle = wpat;
    ctx.fillRect(x0, y0, pw, ph);
  } else {
    ctx.fillStyle = env.water;
    ctx.fillRect(x0, y0, pw, ph);
  }
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = env.water;
  ctx.fillRect(x0, y0, pw, ph);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
  drawSandCorner(ctx, x0, y0, pw, ph, state.sandCorner);
  if (env.rays > 0) {
    for (let i = 0; i < 4; i += 1) {
      const rx = pw * (0.12 + i * 0.24) + Math.sin(t * 0.25 + i * 1.7) * 24;
      ctx.fillStyle = `rgba(230,255,250,${0.13 * env.rays * (1 + 0.15 * Math.sin(t * 0.7 + i * 2.1))})`;
      ctx.beginPath();
      ctx.moveTo(rx, y0 - 10); ctx.lineTo(rx + 70, y0 - 10);
      ctx.lineTo(rx + 170, y0 + ph + 10); ctx.lineTo(rx + 60, y0 + ph + 10);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 10; i += 1) {
      const gx = POOL.cx + Math.sin(i * 13) * POOL.rx * 0.8;
      const gy = POOL.cy + Math.cos(i * 8) * POOL.ry * 0.8;
      ctx.fillStyle = `rgba(255,255,255,${(0.12 + 0.1 * Math.sin(t * 2 + i * 2)) * env.rays})`;
      ctx.fillRect(gx - 2, gy - 2, 4, 4);
    }
  }
  if (env.rain) {
    ctx.strokeStyle = 'rgba(180,210,230,0.35)'; ctx.lineWidth = 1.5;
    for (const b of rainDrops) {
      const x = x0 + b.fx * pw;
      const y = y0 + ((t * b.sp * 30 + b.fy * 600) % ph);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); ctx.stroke();
    }
  }
  if (env.glow) {
    for (const b of glowDots) {
      const x = x0 + b.fx * pw, y = y0 + b.fy * ph;
      ctx.fillStyle = `rgba(120,255,220,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + b.fx * 6.28))})`;
      ctx.fillRect(x - b.r * 0.5, y - b.r * 0.5, b.r, b.r);
    }
  }
  ctx.strokeStyle = 'rgba(191,232,224,0.5)'; ctx.lineWidth = 1.5;
  for (const b of ambBubbles) {
    const x = POOL.cx + (b.fx - 0.5) * POOL.rx * 1.7 + Math.sin(t * 2 + b.fy * 10) * 4;
    const y = POOL.cy + POOL.ry - ((t * b.sp + b.fy * 500) % (POOL.ry * 2));
    ctx.strokeRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (const m of motes) {
    const mx = x0 + ((m.fx * pw + t * m.sp * 0.4) % pw);
    const my = y0 + ((m.fy * ph + t * m.sp * 0.15) % ph);
    ctx.fillRect(mx - 1, my - 1, 2, 2);
  }
  ctx.restore();
  const swA = env.rain ? 17 : 13, swS = env.rain ? 3 : 1.8;
  const coralImg = imgFor('coral');
  for (const d of state.decor) {
    if (d.kind === 'weed') {
      ctx.save(); ctx.translate(d.x, d.y); ctx.globalAlpha = 0.9;
      const n = 3 + Math.floor((d.rot * 10) % 3);
      for (let i = 0; i < n; i += 1) {
        const off = (i - (n - 1) / 2) * 6 * d.s;
        const h = Math.min((44 + ((i * 17 + Math.floor(d.rot * 100)) % 36)) * d.s, d.y - POOL.y0 - 6);
        const sw = Math.sin(t * swS + i * 1.3 + d.rot) * swA;
        pxRect(ctx, off - 2 * d.s, -h, 4 * d.s, h, i % 2 ? env.weed2 : env.weed);
        pxRect(ctx, off - 2 * d.s + sw * 0.3, -h, 4 * d.s, h * 0.3, i % 2 ? env.weed : env.weed2);
      }
      ctx.restore();
      continue;
    }
    ctx.save(); ctx.translate(d.x, d.y); ctx.globalAlpha = 0.9;
    if (d.kind === 'rock') {
      pxRect(ctx, -14 * d.s, -8 * d.s, 28 * d.s, 14 * d.s, '#5a6b66');
      pxRect(ctx, -10 * d.s, -12 * d.s, 16 * d.s, 6 * d.s, '#6a7b76');
      pxRect(ctx, -14 * d.s, -8 * d.s, 28 * d.s, 3 * d.s, 'rgba(255,255,255,0.14)');
    } else if (d.kind === 'shell') {
      pxRect(ctx, -6 * d.s, -6 * d.s, 12 * d.s, 12 * d.s, '#d8cfe8');
      pxRect(ctx, -3 * d.s, -3 * d.s, 6 * d.s, 6 * d.s, '#a894c4');
      pxRect(ctx, -6 * d.s, -6 * d.s, 12 * d.s, 3 * d.s, '#f0f0e8');
    } else if (d.kind === 'coral') {
      if (coralImg) {
        const s = 46 * d.s;
        ctx.drawImage(coralImg, -s / 2, -s, s, s);
      } else {
        pxRect(ctx, -2 * d.s, -16 * d.s, 4 * d.s, 16 * d.s, '#ff8a7a');
        pxRect(ctx, -10 * d.s, -10 * d.s, 4 * d.s, 10 * d.s, '#ff8a7a');
        pxRect(ctx, 6 * d.s, -10 * d.s, 4 * d.s, 10 * d.s, '#ff8a7a');
        pxRect(ctx, -4 * d.s, -20 * d.s, 8 * d.s, 5 * d.s, '#ff9a5c');
      }
    } else {
      pxRect(ctx, -7 * d.s, -7 * d.s, 14 * d.s, 14 * d.s, 'rgba(224,196,143,0.8)');
      pxRect(ctx, -2 * d.s, -2 * d.s, 4 * d.s, 4 * d.s, 'rgba(138,111,77,0.8)');
    }
    ctx.restore();
  }
}
