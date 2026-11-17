// End screen: minimal — title, big SCORE, one stage/time line,
// PLAY AGAIN + MENU buttons.
import { PAL, STAGE_COUNT, VIEW_H, VIEW_W } from '../config.js';
import { overLayout } from './layout.js';
import { bevel, logoText, txt } from './polish.js';

export function drawOver(ctx, state) {
  const won = state.result === 'won';
  const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
  // A light veil — the living water shows through.
  ctx.fillStyle = 'rgba(6,42,51,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (won) {
    logoText(ctx, 'HIGH TIDE!', VIEW_W / 2, 140,
      '900 64px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
      '#ffe08a', '#f0b23e', '#4a2408', 3);
  } else {
    logoText(ctx, 'THE TIDE TOOK YOU', VIEW_W / 2, 140,
      '900 64px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
      '#ff8fa0', '#e8354f', '#3a0a12', 3);
  }
  ctx.font = 'bold 22px sans-serif';
  txt(ctx, won ? 'You held the rockpool. The crab keeps its shell.' : 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 180, PAL.text);
  ctx.font = 'bold 48px sans-serif';
  txt(ctx, `SCORE ${state.score}`, VIEW_W / 2, 300, PAL.gold, 3);
  // Stage/time line: big and bright.
  ctx.font = 'bold 26px sans-serif';
  txt(ctx, `STAGE ${state.stage}/${STAGE_COUNT} · ${mins}:${String(secs).padStart(2, '0')}`, VIEW_W / 2, 348, PAL.text, 3);
  // A win at 3/10/20 clears earns an award.
  // gold line, only on that win.
  if (won && state.awardEarned) {
    ctx.font = 'bold 20px sans-serif';
    txt(ctx, `NEW AWARD: ${state.awardEarned}!`, VIEW_W / 2, 382, PAL.gold, 3);
  }
  const L = overLayout();
  bevel(ctx, L.playAgain.x, L.playAgain.y, L.playAgain.w, L.playAgain.h, 10, '#ffe08a', '#f0b23e', PAL.gold, 2);
  ctx.font = 'bold 22px sans-serif';
  txt(ctx, 'PLAY AGAIN', VIEW_W / 2, L.playAgain.y + 37, '#062a33');
  bevel(ctx, L.menu.x, L.menu.y, L.menu.w, L.menu.h, 8, '#11566b', '#062a33', PAL.foam, 2);
  ctx.font = 'bold 17px sans-serif';
  txt(ctx, 'MENU', VIEW_W / 2, L.menu.y + 29, PAL.text);
}
