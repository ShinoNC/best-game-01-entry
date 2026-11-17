// gradient logo text, lifted panels.
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function bevel(ctx, x, y, w, h, r, top, bottom, border, bw = 2) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = border; ctx.lineWidth = bw;
  rr(ctx, x, y, w, h, r); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  rr(ctx, x + 2, y + 1, w - 4, Math.min(10, h / 3), r - 1); ctx.fill();
}

// Reads as a game logo, not flat text.
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

// over bright shallows and dark storm alike.
export function txt(ctx, text, x, y, fill, lw = 2) {
  ctx.save();
  ctx.strokeStyle = 'rgba(4,26,32,0.8)'; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}

export function lift(ctx, x, y, w, h, r = 4) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(6,42,51,0.94)';
  rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x + 2, y + 1, w - 4, 2);
}
