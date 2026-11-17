// The end screen: minimal — title, big SCORE, one stage/time line, NEXT GOAL,
// PLAY AGAIN + MENU buttons. Stats, feats and history live in the menus now.
import { PAL, STAGE_COUNT, VIEW_H, VIEW_W } from '../config.js';
import { overLayout } from './layout.js';
import { bevel, logoText } from './polish.js';

export function drawOver(ctx, state) {
  const won = state.result === 'won';
  const diff = state.difficulty || 'normal';
  let nextGoal;
  if (won) {
    nextGoal = diff === 'hard' ? 'NEXT GOAL: beat your best score'
      : diff === 'easy' ? 'NEXT GOAL: win on NORMAL' : 'NEXT GOAL: win on HARD';
  } else if (state.stage >= 15) { nextGoal = 'NEXT GOAL: clear stage 30 to win'; }
  else { nextGoal = 'NEXT GOAL: reach stage 15'; }
  const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
  // A lighter veil than before — the living water shows through the empty space.
  ctx.fillStyle = 'rgba(6,42,51,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (won) {
    logoText(ctx, 'HIGH TIDE!', VIEW_W / 2, 120,
      '900 64px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
      '#ffe08a', '#f0b23e', '#4a2408', 3);
  } else {
    logoText(ctx, 'THE TIDE TOOK YOU', VIEW_W / 2, 120,
      '900 64px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
      '#ff8fa0', '#e8354f', '#3a0a12', 3);
  }
  ctx.fillStyle = PAL.text; ctx.font = 'bold 22px sans-serif';
  ctx.fillText(won ? 'You held the rockpool. The crab keeps its shell.' : 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 160);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 48px sans-serif';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, 280);
  ctx.restore();
  ctx.fillStyle = PAL.dim; ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`STAGE ${state.stage}/${STAGE_COUNT} · ${mins}:${String(secs).padStart(2, '0')}`, VIEW_W / 2, 326);
  ctx.fillStyle = PAL.xp; ctx.font = 'bold 19px sans-serif';
  ctx.fillText(nextGoal, VIEW_W / 2, 380);
  const L = overLayout();
  bevel(ctx, L.playAgain.x, L.playAgain.y, L.playAgain.w, L.playAgain.h, 10, '#ffe08a', '#f0b23e', PAL.gold, 2);
  ctx.fillStyle = '#062a33'; ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PLAY AGAIN', VIEW_W / 2, L.playAgain.y + 37);
  bevel(ctx, L.menu.x, L.menu.y, L.menu.w, L.menu.h, 8, '#11566b', '#062a33', PAL.foam, 2);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 17px sans-serif';
  ctx.fillText('MENU', VIEW_W / 2, L.menu.y + 29);
}
