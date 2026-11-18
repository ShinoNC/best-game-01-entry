import { POOL, PAL, VIEW_H } from '../config.js';
import { overLayout } from './layout.js';
import {bevel, logoText, txt, px} from './polish.js';
import { loadSlot } from '../save.js';
export function drawOver(ctx, state) {
  const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
  ctx.fillStyle = 'rgba(6,42,51,0.72)'; ctx.fillRect(0, 0, POOL.x1, VIEW_H);
  ctx.textAlign = 'center';
  logoText(ctx, 'THE TIDE TOOK YOU', POOL.cx, 140,
    px(40),
    '#ff8fa0', '#e8354f', '#3a0a12', 3);
  ctx.font = px(14);
  txt(ctx, 'The creatures feast tonight. Try again, little crab.', POOL.cx, 180, PAL.text);
  ctx.font = px(30);
  txt(ctx, `SCORE ${state.score}`, POOL.cx, 300, PAL.gold, 3);
  ctx.font = px(16);
  txt(ctx, `STAGE ${state.stage} · LEVEL ${state.level} · ${mins}:${String(secs).padStart(2, '0')}`, POOL.cx, 348, PAL.text, 3);
  const save = state.slot != null ? loadSlot(state.slot) : null;
  const L = overLayout();
  if (save) {
    bevel(ctx, L.cont.x, L.cont.y, L.cont.w, L.cont.h, 10, '#7fe0c3', '#2f8f6b', PAL.gold, 2);
    ctx.font = px(14);
    txt(ctx, `RETRY · STAGE ${save.stage}`, POOL.cx, L.cont.y + 37, '#fff');
  } else {
    bevel(ctx, L.cont.x, L.cont.y, L.cont.w, L.cont.h, 10, '#2a4a52', '#16282e', 'rgba(255,255,255,0.25)', 2);
    ctx.font = px(14);
    txt(ctx, 'RETRY', POOL.cx, L.cont.y + 37, PAL.dim);
  }
  bevel(ctx, L.menu.x, L.menu.y, L.menu.w, L.menu.h, 10, '#11566b', '#062a33', PAL.foam, 2);
  ctx.font = px(14);
  txt(ctx, 'MENU', POOL.cx, L.menu.y + 37, PAL.text);
}
