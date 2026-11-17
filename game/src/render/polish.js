export function rr(ctx, x, y, w, h) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.closePath();
}

// Chunky pixel panel: hard offset shadow (flat rect, no blur), flat fill,
// stepped border. `bottom` kept for call-site compatibility (unused).
export function bevel(ctx, x, y, w, h, r, top, bottom, border, bw = 2) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x + 4, y + 5, w, h);
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border; ctx.lineWidth = bw;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 2, y + 1, w - 4, Math.min(8, h / 4));
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

export function txt(ctx, text, x, y, fill, lw = 2) {
  ctx.save();
  ctx.strokeStyle = 'rgba(4,26,32,0.8)'; ctx.lineWidth = lw; ctx.lineJoin = 'miter';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}

export function lift(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x + 5, y + 6, w, h);
  ctx.fillStyle = 'rgba(6,42,51,0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x + 2, y + 1, w - 4, 2);
}

// Segmented pixel bar: chunky segments with gaps, flat colors, dark frame.
export function pxBar(ctx, x, y, w, h, frac, fill, segs) {
  const n = segs || 10;
  const gap = 2;
  const sw = (w - gap * (n - 1)) / n;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  for (let i = 0; i < n; i += 1) {
    const sx = x + i * (sw + gap);
    const f = Math.max(0, Math.min(1, frac * n - i));
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(sx, y, sw, h);
    if (f > 0) { ctx.fillStyle = fill; ctx.fillRect(sx, y, sw * f, h); }
  }
}
