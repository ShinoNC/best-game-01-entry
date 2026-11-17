export function rr(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.closePath();
}

export function bevel(ctx, x, y, w, h, r, top, bottom, border, bw = 2) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = border; ctx.lineWidth = bw;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 2, y + 1, w - 4, Math.min(8, h / 4));
}

export function logoText(ctx, text, x, y, font, top, bottom, outline, lw = 3) {
  ctx.save();
  ctx.font = font; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(4,26,32,0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  const g = ctx.createLinearGradient(0, y - 62, 0, y + 8);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = outline; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.restore();
}

export function txt(ctx, text, x, y, fill, lw = 2) {
  ctx.save();
  ctx.strokeStyle = 'rgba(4,26,32,0.8)'; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}

export function lift(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(6,42,51,0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x + 2, y + 1, w - 4, 2);
}
