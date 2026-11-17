import { WEAPON_MAX } from '../config.js';

export function star(ctx, x, y, r, rot, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}


export function heart(ctx, x, y, r, c) {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(x, y + r * 0.85);
  ctx.bezierCurveTo(x - r * 1.25, y, x - r * 0.6, y - r, x, y - r * 0.3);
  ctx.bezierCurveTo(x + r * 0.6, y - r, x + r * 1.25, y, x, y + r * 0.85);
  ctx.closePath(); ctx.fill();
}

export function drawWeaponIcon(ctx, id, x, y, s, owned) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  if (!owned) ctx.globalAlpha = 0.35;
  if (id === 'claw') {
    ctx.fillStyle = '#ff7a3c'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#062a33';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, -7); ctx.lineTo(15, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d94f1e'; ctx.beginPath(); ctx.arc(-4, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bow') {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-6, 0, 16, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = '#f4f9ff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(2, -15); ctx.lineTo(2, 15); ctx.stroke();
    ctx.strokeStyle = '#bfe8e0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(14, 0); ctx.stroke();
    ctx.fillStyle = '#e8fffa'; ctx.beginPath(); ctx.arc(15, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'blaster') {
    ctx.fillStyle = '#7b5cff';
    for (const [bx, by, br] of [[-6, -9, 6], [4, -2, 7], [-6, 9, 6]]) {
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#3a2d5e'; ctx.fillRect(-18, -4, 9, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(2, -4, 2, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'shell') {
    ctx.strokeStyle = '#d8cfe8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const r of [14, 10, 6]) { ctx.beginPath(); ctx.arc(0, 0, r, 0.4, Math.PI * 1.8); ctx.stroke(); }
    ctx.fillStyle = '#a894c4'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'laser') {
    ctx.fillStyle = '#3a2d5e'; ctx.fillRect(-18, -5, 14, 10);
    ctx.fillStyle = '#8a7fb8'; ctx.fillRect(-6, -2, 10, 4);
    ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.fillStyle = '#ff2e88'; ctx.beginPath(); ctx.arc(19, 0, 3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'trident') {
    ctx.strokeStyle = '#c8d8e0'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 3;
    for (const dy of [-12, 0, 12]) {
      ctx.beginPath(); ctx.moveTo(10, dy); ctx.lineTo(17, dy); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(10, -12); ctx.lineTo(10, 12); ctx.stroke();
    ctx.fillStyle = '#e8f4ff';
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(14, -4); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
  } else {
    ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0.4, 4.8); ctx.stroke();
    ctx.fillStyle = '#7fe0c3';
    ctx.beginPath(); ctx.moveTo(13, -6); ctx.lineTo(18, 2); ctx.lineTo(9, 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(127,224,195,0.6)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 6.5, 2.2, 5.6); ctx.stroke();
  }
  ctx.restore();
}

export function drawAwardIcon(ctx, kind, x, y, s, color, locked) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  const c = locked ? '#5a6a6a' : color;
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (kind === 'MEDAL') {
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 6, -16); ctx.lineTo(sgn * 1, -5); ctx.lineTo(sgn * 11, -5);
      ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 4, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-4, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'CUP') {
    ctx.beginPath(); ctx.moveTo(-11, -15); ctx.lineTo(11, -15); ctx.lineTo(8, 1); ctx.lineTo(-8, 1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-12, -9, 5, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, -9, 5, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
    ctx.fillRect(-2, 1, 4, 9); ctx.fillRect(-8, 10, 16, 4);
  } else {
    ctx.beginPath();
    ctx.moveTo(-14, 8); ctx.lineTo(-14, -3); ctx.lineTo(-7, 3); ctx.lineTo(0, -11);
    ctx.lineTo(7, 3); ctx.lineTo(14, -3); ctx.lineTo(14, 8); ctx.closePath(); ctx.fill();
    ctx.fillRect(-14, 8, 28, 5);
  }
  ctx.restore();
}

export function drawCoin(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#c9962e';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9962e'; ctx.font = `bold ${Math.round(r * 1.15)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', x, y + r * 0.08);
  ctx.restore();
}

export function drawPips(ctx, cx, y, lv, next) {
  for (let i = 0; i < WEAPON_MAX; i += 1) {
    ctx.fillStyle = i < lv ? '#7fe0c3' : (next && i === lv ? '#ffd166' : 'rgba(255,255,255,0.25)');
    ctx.beginPath(); ctx.arc(cx - 24 + i * 12, y, 4, 0, Math.PI * 2); ctx.fill();
  }
}
