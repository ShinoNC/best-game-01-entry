import { POOL, PAL } from '../config.js';
import { drawSkillIcon } from './icons.js';
import { levelupLayout } from './layout.js';
import {pxPanel, txt, px, vt} from './polish.js';
export function drawLevelUp(ctx, state, hover) {
  const L = levelupLayout();
  ctx.fillStyle = 'rgba(6,42,51,0.78)'; ctx.fillRect(0, 0, POOL.x1, 720);
  ctx.textAlign = 'center';
  ctx.font = px(32);
  txt(ctx, '★ LEVEL UP! ★', POOL.cx, 150, PAL.gold, 3);
  ctx.font = px(14);
  txt(ctx, `YOU ARE NOW LEVEL ${state.level} — CHOOSE AN UPGRADE`, POOL.cx, 196, PAL.text, 3);
  ctx.font = px(12);
  txt(ctx, '+5 MAX HP', POOL.cx, 228, PAL.hp, 3);
  const choices = state.levelChoices || [];
  for (let i = 0; i < L.cards.length; i += 1) {
    const b = L.cards[i];
    const c = choices[i];
    const hov = hover && hover.x >= b.x && hover.x <= b.x + b.w && hover.y >= b.y && hover.y <= b.y + b.h;
    pxPanel(ctx, b.x, b.y, b.w, b.h, '#0b4256', '#082f3d', hov ? PAL.gold : PAL.foam);
    if (!c) continue;
    ctx.font = px(8);
    txt(ctx, `[${i + 1}]`, b.x + b.w / 2, b.y + 24, PAL.dim);
    drawSkillIcon(ctx, c.id, b.x + b.w / 2, b.y + 62, 44, true);
    ctx.font = px(12);
    txt(ctx, c.name, b.x + b.w / 2, b.y + 120, PAL.text);
    ctx.font = px(9);
    txt(ctx, c.desc, b.x + b.w / 2, b.y + 148, PAL.foam);
    if (c.cur !== null && c.cur !== undefined) {
      ctx.font = px(9);
      txt(ctx, `Lv${c.cur} → Lv${c.cur + 1}`, b.x + b.w / 2, b.y + 176, PAL.gold);
    }
  }
  ctx.font = vt(20);
  txt(ctx, 'Press 1 / 2 / 3 or click a card', POOL.cx, 540, PAL.dim);
}
