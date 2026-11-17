import { PAL } from '../config.js';
import { imgFor } from '../sprites.js';
import { txt } from './polish.js';

const SIDE = { guppy: 1, eel: 1, archer: 1, angler: 1 };
const DRAW = {
  guppy: 3.0, jelly: 3.4, eel: 3.0, squid: 3.0, archer: 3.2, starfish: 2.8,
  urchin: 2.8, mini: 2.8, turtle: 2.8, octopus: 2.8, hammerhead: 2.8,
  angler: 3.0, stingray: 2.8, kraken: 2.8,
};

function drawSprite(ctx, img, x, y, w, h, rot, alpha) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function fallback(ctx, e, size) {
  ctx.fillStyle = e.color;
  ctx.fillRect(e.x - size / 2, e.y - size / 2, size, size);
  ctx.fillStyle = e.dark;
  ctx.fillRect(e.x - size / 4, e.y - size / 4, size / 2, size / 2);
}

export function drawCrab(ctx, p, t, clawStats, spinStats) {
  const img = imgFor('crab');
  const size = p.radius * 2.4;
  const bob = Math.sin(t * 8) * 2 * (p.moving || 0);
  ctx.fillStyle = 'rgba(4,26,32,0.35)';
  ctx.fillRect(p.x - p.radius * 1.05, p.y + p.radius * 0.55, p.radius * 2.1, p.radius * 0.5);
  const blink = p.iframes > 0 && Math.floor(t * 20) % 2 === 0;
  if (img) {
    const asp = img.naturalHeight / img.naturalWidth;
    drawSprite(ctx, img, p.x, p.y + bob, size, size * asp, p.angle + Math.PI / 2, blink ? 0.45 : 1);
  } else {
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.rotate(p.angle + Math.PI / 2);
    if (blink) ctx.globalAlpha = 0.45;
    ctx.fillStyle = PAL.crab;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.fillStyle = PAL.crabDark;
    ctx.fillRect(-size / 4, -size / 4, size / 2, size / 2);
    ctx.restore();
  }
  if (p.swing > 0 && clawStats) {
    const prog = 1 - p.swing / 0.18;
    const r = clawStats.range * 0.8, arc = clawStats.arc || 1.6;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalAlpha = (1 - prog) * 0.16;
    ctx.fillStyle = PAL.gold;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(p.angle - arc) * clawStats.range, Math.sin(p.angle - arc) * clawStats.range);
    ctx.lineTo(Math.cos(p.angle) * clawStats.range, Math.sin(p.angle) * clawStats.range);
    ctx.lineTo(Math.cos(p.angle + arc) * clawStats.range, Math.sin(p.angle + arc) * clawStats.range);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = (1 - prog) * 0.85;
    ctx.fillStyle = PAL.gold;
    const lead = p.angle - arc + prog * arc * 2;
    for (let i = 0; i < 4; i += 1) {
      const a = lead - 0.5 + i * 0.22;
      ctx.fillRect(Math.cos(a) * r - 4, Math.sin(a) * r - 4, 9, 9);
    }
    ctx.restore();
  }
  if (p.spin > 0 && spinStats) {
    const prog = 1 - p.spin / 0.3;
    const half = 30 + prog * (spinStats.range - 30);
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalAlpha = (1 - prog) * 0.8;
    ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 6;
    ctx.strokeRect(-half, -half, half * 2, half * 2);
    ctx.globalAlpha = (1 - prog) * 0.2;
    ctx.fillStyle = '#7fe0c3';
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.restore();
  }
  if (p.laser > 0) {
    const a = (p.laser / 0.15) * 0.75;
    const dirs = p.laserBeams >= 2 ? [1, -1] : [1];
    ctx.save();
    for (const dir of dirs) {
      for (let d = 0; d < p.laserLen; d += 26) {
        const seg = Math.min(22, p.laserLen - d);
        const x0 = dir > 0 ? p.x + d : p.x - d - seg;
        ctx.fillStyle = `rgba(255,46,136,${a * 0.28})`;
        ctx.fillRect(x0, p.y - 8, seg, 16);
        ctx.fillStyle = `rgba(255,46,136,${a})`;
        ctx.fillRect(x0, p.y - 5, seg, 10);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x0, p.y - 1, seg, 2);
      }
    }
    ctx.restore();
  }
  if (p.flash > 0) {
    ctx.strokeStyle = `rgba(255,93,115,${p.flash * 3})`; ctx.lineWidth = 3;
    const fr = p.radius + 6;
    ctx.strokeRect(p.x - fr, p.y - fr, fr * 2, fr * 2);
  }
}

export function drawEnemy(ctx, e, t, ang) {
  const face = ang ?? 0;
  const img = imgFor(e.type);
  const k = DRAW[e.type] || 2.8;
  const size = e.r * k;
  const flash = e.flash > 0;
  let rot = 0, sx = 1, sy = 1, bobY = 0;
  if (SIDE[e.type]) {
    rot = face - Math.PI;
  } else if (e.type === 'jelly') {
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.08;
    sx = 1 / pu; sy = pu;
    bobY = Math.sin(t * 2 + e.wob) * 3;
  } else if (e.type === 'urchin') {
    rot = e.wob * 0.3;
  } else if (e.type === 'starfish' || e.type === 'mini') {
    rot = Math.sin(t * 2 + e.wob) * 0.15;
  } else if (e.type === 'squid') {
    rot = Math.sin(t * 4 + e.wob) * 0.12;
    bobY = Math.sin(t * 3 + e.wob) * 2;
  } else if (e.boss) {
    rot = Math.sin(t * 1.5 + e.wob) * 0.06;
    bobY = Math.sin(t * 1.2 + e.wob) * 3;
    if (e.atkState === 'tele' && e.atk === 'ink') { sx = 1.15; sy = 1.15; }
  }
  if (e.windup > 0) {
    const jx = Math.sin(t * 60) * 2, jy = Math.cos(t * 47) * 2;
    if (img) {
      const asp = img.naturalHeight / img.naturalWidth;
      drawSprite(ctx, img, e.x + jx, e.y + jy + bobY, size * sx, size * asp * sy, rot, flash ? 0.6 : 1);
    } else fallback(ctx, { ...e, x: e.x + jx, y: e.y + jy }, size);
  } else if (img) {
    const asp = img.naturalHeight / img.naturalWidth;
    drawSprite(ctx, img, e.x, e.y + bobY, size * sx, size * asp * sy, rot, flash ? 0.6 : 1);
  } else {
    fallback(ctx, e, size);
  }
  if (e.type === 'archer' && e.windup > 0) {
    ctx.fillStyle = 'rgba(191,232,224,0.95)';
    const wr = 3 + (0.35 - e.windup) * 12;
    ctx.fillRect(e.x + Math.cos(face) * e.r * 1.85 - wr, e.y + Math.sin(face) * e.r * 1.85 - wr, wr * 2, wr * 2);
  }
  if (e.elite) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    const er = e.r + 7;
    ctx.strokeRect(e.x - er, e.y - er, er * 2, er * 2);
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, '★', e.x, e.y - e.r - 26, '#ffd166');
  }
  if (e.hp < e.maxHp) {
    const big = e.elite || e.boss;
    const w = big ? e.r * 2 : 22, h = big ? 5 : 3;
    const y = e.y - e.r - (big ? 10 : 8);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, y, w, h);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(e.x - w / 2, y, w * (e.hp / e.maxHp), h);
  }
}
