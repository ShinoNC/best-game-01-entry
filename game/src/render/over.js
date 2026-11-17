import { PAL, VIEW_H, VIEW_W } from '../config.js';
import { overLayout } from './layout.js';
import { bevel, logoText, txt } from './polish.js';
import { loadSlot } from '../save.js';

export function drawOver(ctx, state) {
  const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
  ctx.fillStyle = 'rgba(6,42,51,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  logoText(ctx, 'THE TIDE TOOK YOU', VIEW_W / 2, 140,
    '900 64px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    '#ff8fa0', '#e8354f', '#3a0a12', 3);
  ctx.font = 'bold 22px sans-serif';
  txt(ctx, 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 180, PAL.text);
  ctx.font = 'bold 48px sans-serif';
  txt(ctx, `SCORE ${state.score}`, VIEW_W / 2, 300, PAL.gold, 3);
  ctx.font = 'bold 26px sans-serif';
  txt(ctx, `STAGE ${state.stage} · LEVEL ${state.level} · ${mins}:${String(secs).padStart(2, '0')}`, VIEW_W / 2, 348, PAL.text, 3);
  const bestStage = Math.max((state.meta || {}).bestStage || 0, state.stage);
  const bestLevel = Math.max((state.meta || {}).bestLevel || 0, state.level);
  ctx.font = 'bold 18px sans-serif';
  txt(ctx, `BEST STAGE ${bestStage} · BEST LEVEL ${bestLevel}`, VIEW_W / 2, 382, PAL.gold, 3);
  const save = state.slot != null ? loadSlot(state.slot) : null;
  const L = overLayout();
  if (save) {
    bevel(ctx, L.cont.x, L.cont.y, L.cont.w, L.cont.h, 10, '#7fe0c3', '#2f8f6b', PAL.gold, 2);
    ctx.font = 'bold 22px sans-serif';
    txt(ctx, `CONTINUE · STAGE ${save.stage}`, VIEW_W / 2, L.cont.y + 37, '#062a33');
  } else {
    bevel(ctx, L.cont.x, L.cont.y, L.cont.w, L.cont.h, 10, '#2a4a52', '#16282e', 'rgba(255,255,255,0.25)', 2);
    ctx.font = 'bold 22px sans-serif';
    txt(ctx, 'CONTINUE', VIEW_W / 2, L.cont.y + 37, PAL.dim);
  }
  bevel(ctx, L.menu.x, L.menu.y, L.menu.w, L.menu.h, 8, '#11566b', '#062a33', PAL.foam, 2);
  ctx.font = 'bold 17px sans-serif';
  txt(ctx, 'MENU', VIEW_W / 2, L.menu.y + 29, PAL.text);
}
