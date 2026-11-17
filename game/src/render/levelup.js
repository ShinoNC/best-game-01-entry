import { PAL, VIEW_W } from '../config.js';
import { levelupLayout } from './layout.js';
import { txt } from './polish.js';

export function drawLevelUp(ctx, state, hover) {
  const L = levelupLayout();
  ctx.fillStyle = 'rgba(6,42,51,0.78)'; ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.font = '900 52px sans-serif';
  txt(ctx, '★ LEVEL UP! ★', VIEW_W / 2, 150, PAL.gold, 3);
  ctx.font = 'bold 22px sans-serif';
  txt(ctx, `YOU ARE NOW LEVEL ${state.level} — CHOOSE AN UPGRADE`, VIEW_W / 2, 196, PAL.text, 3);
  const choices = state.levelChoices || [];
  for (let i = 0; i < L.cards.length; i += 1) {
    const b = L.cards[i];
    const c = choices[i];
    const hov = hover && hover.x >= b.x && hover.x <= b.x + b.w && hover.y >= b.y && hover.y <= b.y + b.h;
    ctx.fillStyle = '#0b4256';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = hov ? PAL.gold : PAL.foam;
    ctx.lineWidth = hov ? 4 : 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(b.x + 2, b.y + 1, b.w - 4, 2);
    if (!c) continue;
    ctx.font = 'bold 13px sans-serif';
    txt(ctx, `[${i + 1}]`, b.x + b.w / 2, b.y + 24, PAL.dim);
    ctx.font = 'bold 44px sans-serif';
    txt(ctx, c.icon, b.x + b.w / 2, b.y + 84, PAL.xp);
    ctx.font = 'bold 20px sans-serif';
    txt(ctx, c.name, b.x + b.w / 2, b.y + 120, PAL.text);
    ctx.font = 'bold 15px sans-serif';
    txt(ctx, c.desc, b.x + b.w / 2, b.y + 148, PAL.foam);
    if (c.cur !== null && c.cur !== undefined) {
      ctx.font = 'bold 14px sans-serif';
      txt(ctx, `Lv${c.cur} → Lv${c.cur + 1}`, b.x + b.w / 2, b.y + 176, PAL.gold);
    }
  }
  ctx.font = '15px sans-serif';
  txt(ctx, 'Press 1 / 2 / 3 or click a card', VIEW_W / 2, 540, PAL.dim);
}
