export const PXF = '"Press Start 2P", monospace';
export const VTF = '"VT323", monospace';
export function px(n) { return `${n}px ${PXF}`; }
export function vt(n) { return `${n}px ${VTF}`; }
export function rr(ctx, x, y, w, h) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.closePath();
}

// Stepped-corner silhouette (cross + corner step blocks).
export function stepFill(ctx, x, y, w, h) {
  ctx.fillRect(x + 4, y, w - 8, h);
  ctx.fillRect(x, y + 4, w, h - 8);
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + w - 4, y + 2, 2, 2);
  ctx.fillRect(x + 2, y + h - 4, 2, 2);
  ctx.fillRect(x + w - 4, y + h - 4, 2, 2);
}

// Stepped border ring only (3px edges + 2px step blocks).
export function pxFrame(ctx, x, y, w, h, c, t = 3) {
  ctx.fillStyle = c;
  ctx.fillRect(x + 4, y, w - 8, t);
  ctx.fillRect(x + 4, y + h - t, w - 8, t);
  ctx.fillRect(x, y + 4, t, h - 8);
  ctx.fillRect(x + w - t, y + 4, t, h - 8);
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + w - 4, y + 2, 2, 2);
  ctx.fillRect(x + 2, y + h - 4, 2, 2);
  ctx.fillRect(x + w - 4, y + h - 4, 2, 2);
}

// 4x4 dither pattern cache (base + dark, 2x2 dots).
const _pat = new Map();
export function dither(ctx, base, dark) {
  const key = base + '|' + dark;
  let p = _pat.get(key);
  if (p) return p;
  if (typeof document === 'undefined') return base;
  const c = document.createElement('canvas');
  c.width = 4; c.height = 4;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 4, 4);
  g.fillStyle = dark;
  g.fillRect(0, 0, 2, 2); g.fillRect(2, 2, 2, 2);
  p = ctx.createPattern(c, 'repeat');
  _pat.set(key, p);
  return p;
}

export function dither4(ctx, base, dark) {
  const key = 'b4|' + base + '|' + dark;
  let p = _pat.get(key);
  if (p) return p;
  if (typeof document === 'undefined') return base;
  const c = document.createElement('canvas');
  c.width = 8; c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 8, 8);
  g.fillStyle = dark;
  g.fillRect(0, 0, 4, 4); g.fillRect(4, 4, 4, 4);
  p = ctx.createPattern(c, 'repeat');
  _pat.set(key, p);
  return p;
}

export function pxPanel(ctx, x, y, w, h, fill, dark, border, light) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x + 4, y + 5, w, h);
  ctx.fillStyle = border;
  stepFill(ctx, x, y, w, h);
  ctx.fillStyle = dither(ctx, fill, dark);
  stepFill(ctx, x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = light || 'rgba(255,255,255,0.30)';
  ctx.fillRect(x + 5, y + 5, w - 10, 2);
  ctx.fillRect(x + 5, y + 5, 2, h - 10);
}

export function bevel(ctx, x, y, w, h, r, top, bottom, border, bw = 2) {
  pxPanel(ctx, x, y, w, h, top, bottom, border);
}

export function logoText(ctx, text, x, y, font, top, bottom, outline, lw = 3) {
  ctx.save();
  ctx.font = font; ctx.textAlign = 'center';
  ctx.fillStyle = outline;
  ctx.fillText(text, x + 4, y + 5);
  ctx.fillStyle = top;
  ctx.fillText(text, x, y);
  ctx.strokeStyle = outline; ctx.lineWidth = lw; ctx.lineJoin = 'miter';
  ctx.strokeText(text, x, y);
  ctx.restore();
}

export function txt(ctx, text, x, y, fill, lw = 2, sh = 2) {
  ctx.save();
  if (sh) {
    ctx.fillStyle = 'rgba(2,16,20,0.9)';
    ctx.fillText(text, x + sh, y + sh);
  }
  if (lw) {
    ctx.strokeStyle = 'rgba(4,26,32,0.8)'; ctx.lineWidth = lw; ctx.lineJoin = 'miter';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}

export function lift(ctx, x, y, w, h) {
  pxPanel(ctx, x, y, w, h, 'rgba(6,42,51,0.94)', 'rgba(4,26,32,0.94)', '#ffd166');
}

// Darken a #rrggbb color by ~40%.
function shade(hex) {
  if (!hex || hex[0] !== '#' || hex.length !== 7) return 'rgba(0,0,0,0.35)';
  const n = parseInt(hex.slice(1), 16);
  const r = Math.floor(((n >> 16) & 255) * 0.6);
  const g = Math.floor(((n >> 8) & 255) * 0.6);
  const b = Math.floor((n & 255) * 0.6);
  return `rgb(${r},${g},${b})`;
}

export function pxBar(ctx, x, y, w, h, frac, fill, segs, dark) {
  const n = segs || 10;
  const gap = 3;
  const sw = (w - gap * (n - 1)) / n;
  pxFrame(ctx, x - 3, y - 3, w + 6, h + 6, '#101820', 3);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);
  const dk = dark || shade(fill);
  for (let i = 0; i < n; i += 1) {
    const sx = x + i * (sw + gap);
    const f = Math.max(0, Math.min(1, frac * n - i));
    ctx.fillStyle = dither4(ctx, 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.25)');
    ctx.fillRect(sx, y, sw, h);
    if (f > 0) {
      ctx.fillStyle = dither4(ctx, fill, dk);
      ctx.fillRect(sx, y, sw * f, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(sx, y, sw * f, 2);
    }
  }
}
