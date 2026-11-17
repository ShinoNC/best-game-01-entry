import { WEAPON_MAX } from '../config.js';

// Pixel heart from a 7x6 bitmap, drawn with flat rects only.
const HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
export function heart(ctx, x, y, r, c) {
  const cell = (r * 2) / 7;
  ctx.fillStyle = c;
  for (let row = 0; row < HEART_ROWS.length; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      if (HEART_ROWS[row][col] === 'X') {
        ctx.fillRect(x - r + col * cell, y - r + row * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
}

function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// Pixel-art weapon icons: chunky rects on a 40x40 grid, no curves.
export function drawWeaponIcon(ctx, id, x, y, s, owned) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  if (!owned) ctx.globalAlpha = 0.35;
  if (id === 'claw') {
    R(ctx, -16, -10, 10, 20, '#ff7a3c'); R(ctx, -10, -14, 6, 6, '#ff7a3c'); R(ctx, -10, 8, 6, 6, '#ff7a3c');
    R(ctx, 6, -10, 10, 20, '#ff7a3c'); R(ctx, 4, -14, 6, 6, '#ff7a3c'); R(ctx, 4, 8, 6, 6, '#ff7a3c');
    R(ctx, -4, -6, 8, 12, '#d94f1e');
  } else if (id === 'bow') {
    R(ctx, -16, -12, 5, 6, '#ffd166'); R(ctx, -18, -6, 5, 12, '#ffd166'); R(ctx, -16, 6, 5, 6, '#ffd166');
    R(ctx, -11, -16, 5, 5, '#ffd166'); R(ctx, -11, 11, 5, 5, '#ffd166');
    R(ctx, 0, -14, 2, 28, '#f4f9ff');
    R(ctx, -6, -2, 18, 4, '#bfe8e0'); R(ctx, 12, -4, 6, 8, '#e8fffa');
  } else if (id === 'blaster') {
    R(ctx, -14, -14, 12, 12, '#7b5cff'); R(ctx, 2, -8, 12, 12, '#7b5cff'); R(ctx, -14, 2, 12, 12, '#7b5cff');
    R(ctx, -11, -11, 4, 4, '#a78bff'); R(ctx, 5, -5, 4, 4, '#a78bff');
    R(ctx, -18, -4, 8, 8, '#3a2d5e');
  } else if (id === 'shell') {
    ctx.strokeStyle = '#d8cfe8'; ctx.lineWidth = 3;
    ctx.strokeRect(-14, -14, 28, 28); ctx.strokeRect(-8, -8, 16, 16);
    R(ctx, -3, -3, 6, 6, '#a894c4');
  } else if (id === 'laser') {
    R(ctx, -18, -6, 12, 12, '#3a2d5e'); R(ctx, -6, -2, 8, 4, '#8a7fb8');
    R(ctx, 2, -4, 16, 8, '#ff2e88'); R(ctx, 2, -1, 16, 2, '#ffffff');
    R(ctx, 18, -3, 4, 6, '#ff2e88');
  } else if (id === 'trident') {
    R(ctx, -18, -2, 22, 4, '#c8d8e0');
    R(ctx, 4, -12, 4, 24, '#e8f4ff');
    R(ctx, 8, -14, 8, 4, '#e8f4ff'); R(ctx, 8, -2, 8, 4, '#e8f4ff'); R(ctx, 8, 10, 8, 4, '#e8f4ff');
    R(ctx, 16, -4, 4, 8, '#e8f4ff');
  } else {
    R(ctx, -16, -4, 12, 8, '#7fe0c3'); R(ctx, -4, -16, 8, 12, '#7fe0c3');
    R(ctx, 4, -4, 12, 8, '#7fe0c3'); R(ctx, -4, 4, 8, 12, '#7fe0c3');
    R(ctx, -4, -4, 8, 8, '#c8f5e6');
  }
  ctx.restore();
}

// Pixel-art skill icons for the HUD skill slots, level-up cards and shop.
export function drawSkillIcon(ctx, id, x, y, s, owned) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  if (!owned) ctx.globalAlpha = 0.4;
  if (id === 'claws') {
    R(ctx, -16, -8, 9, 16, '#ff7a3c'); R(ctx, -9, -12, 6, 6, '#ff7a3c'); R(ctx, -9, 6, 6, 6, '#ff7a3c');
    R(ctx, 7, -8, 9, 16, '#ff7a3c'); R(ctx, 3, -12, 6, 6, '#ff7a3c'); R(ctx, 3, 6, 6, 6, '#ff7a3c');
    R(ctx, -3, -5, 6, 10, '#d94f1e');
  } else if (id === 'tempo') {
    R(ctx, -14, -10, 6, 6, '#7fe0c3'); R(ctx, -8, -4, 6, 8, '#7fe0c3'); R(ctx, -14, 4, 6, 6, '#7fe0c3');
    R(ctx, -2, -10, 6, 6, '#7fe0c3'); R(ctx, 4, -4, 6, 8, '#7fe0c3'); R(ctx, -2, 4, 6, 6, '#7fe0c3');
  } else if (id === 'reach') {
    R(ctx, -14, -2, 28, 4, '#ffd166');
    R(ctx, -18, -5, 6, 10, '#ffd166'); R(ctx, 12, -5, 6, 10, '#ffd166');
    R(ctx, -16, -8, 3, 3, '#ffe08a'); R(ctx, 13, -8, 3, 3, '#ffe08a');
  } else if (id === 'shell') {
    ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 3;
    ctx.strokeRect(-12, -12, 24, 24); ctx.strokeRect(-6, -6, 12, 12);
    R(ctx, -2, -2, 4, 4, '#c8f5e6');
  } else if (id === 'legs') {
    R(ctx, -16, -10, 24, 4, '#bfe8e0'); R(ctx, -16, -1, 18, 4, '#bfe8e0'); R(ctx, -16, 8, 28, 4, '#bfe8e0');
    R(ctx, 10, -10, 5, 4, '#ffffff');
  } else if (id === 'bubbles') {
    R(ctx, -14, -12, 10, 10, '#a8e6ff'); R(ctx, 2, -14, 12, 12, '#a8e6ff'); R(ctx, -6, 2, 14, 14, '#7fd4ff');
    R(ctx, -11, -9, 4, 4, '#ffffff'); R(ctx, 5, -11, 4, 4, '#ffffff'); R(ctx, -2, 6, 5, 5, '#ffffff');
  } else if (id === 'magnet') {
    R(ctx, -12, -12, 8, 22, '#ff5d73'); R(ctx, 4, -12, 8, 22, '#ff5d73');
    R(ctx, -12, 4, 24, 8, '#ff5d73');
    R(ctx, -12, -12, 8, 8, '#ffffff'); R(ctx, 4, -12, 8, 8, '#ffffff');
  } else {
    heart(ctx, 0, 0, 14, '#ff5d73');
  }
  ctx.restore();
}

export function drawCoin(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#c9962e';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
  ctx.fillStyle = '#c9962e'; ctx.font = `bold ${Math.round(r * 1.15)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', x, y + r * 0.08);
  ctx.restore();
}

export function drawPips(ctx, cx, y, lv, next) {
  for (let i = 0; i < WEAPON_MAX; i += 1) {
    ctx.fillStyle = i < lv ? '#7fe0c3' : (next && i === lv ? '#ffd166' : 'rgba(255,255,255,0.25)');
    ctx.fillRect(cx - 26 + i * 12, y - 4, 8, 8);
  }
}
