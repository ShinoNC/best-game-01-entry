// The end screen: a run-summary dashboard — 6 stat tiles, feats, last runs,
// arsenal, next goal, one big gold PLAY AGAIN button.
import { DIFFICULTIES, FEATS, PAL, STAGE_COUNT, VIEW_H, VIEW_W, WEAPON_MAX, WEAPON_ORDER } from '../config.js';
import { comboMultFor } from '../world.js';
import { drawCoin, drawWeaponIcon } from './icons.js';

export function drawOver(ctx, state) {
  const won = state.result === 'won';
  const diff = state.difficulty || 'normal';
  const diffLabel = (DIFFICULTIES[diff] || DIFFICULTIES.normal).label;
  let nextGoal;
  if (won) {
    nextGoal = diff === 'hard' ? 'NEXT GOAL: beat your best score'
      : diff === 'easy' ? 'NEXT GOAL: win on NORMAL' : 'NEXT GOAL: win on HARD';
  } else if (state.stage >= 15) { nextGoal = 'NEXT GOAL: clear stage 30 to win'; }
  else { nextGoal = 'NEXT GOAL: reach stage 15'; }
  const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
  const meta = state.meta || { feats: [], runs: [] };
  ctx.fillStyle = 'rgba(6,42,51,0.86)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PAL.gold : PAL.hp; ctx.font = 'bold 64px sans-serif';
  ctx.fillText(won ? 'HIGH TIDE!' : 'THE TIDE TOOK YOU', VIEW_W / 2, 96);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 22px sans-serif';
  ctx.fillText(won ? 'You held the rockpool. The crab keeps its shell.' : 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 132);
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, 186);
  // Six stat tiles, 3 x 2: big number + small label, solid dark plates.
  const tiles = [
    [`${state.kills}`, 'SLAIN'], [`${state.coinsEarned}`, 'COINS'],
    [`×${comboMultFor(state.stats.bestCombo || 0)}`, 'BEST COMBO'],
    [`${state.stats.damage}`, 'DAMAGE DEALT'],
    [`${mins}:${String(secs).padStart(2, '0')}`, 'TIME'],
    [`${state.stage}/${STAGE_COUNT}`, 'STAGE'],
  ];
  for (let i = 0; i < tiles.length; i += 1) {
    const tx = 343 + (i % 3) * 202, ty = 210 + Math.floor(i / 3) * 66;
    ctx.fillStyle = '#0a3d4a'; ctx.fillRect(tx, ty, 190, 58);
    ctx.strokeStyle = 'rgba(159,196,189,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(tx, ty, 190, 58);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 24px sans-serif';
    if (i === 1) { // the COINS tile gets a drawn coin left of its number
      const vw = ctx.measureText(tiles[i][0]).width;
      drawCoin(ctx, tx + 95 - vw / 2 - 15, ty + 22, 10);
      ctx.fillText(tiles[i][0], tx + 103, ty + 30);
    } else ctx.fillText(tiles[i][0], tx + 95, ty + 30);
    ctx.fillStyle = PAL.dim; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(tiles[i][1], tx + 95, ty + 50);
  }
  // Feats panel (left): every feat with a checkmark, plus this run's new ones.
  // The displayed set is the union — staged frames compute featsEarned without
  // writing, so the new feat would otherwise show as still locked.
  const earned = state.featsEarned || [];
  const unlocked = new Set([...(meta.feats || []), ...earned]);
  ctx.fillStyle = '#062a33'; ctx.fillRect(40, 350, 580, 150);
  ctx.strokeStyle = 'rgba(159,196,189,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(40, 350, 580, 150);
  ctx.textAlign = 'left';
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
  const newNames = earned.map((id) => (FEATS.find((f) => f.id === id) || {}).name || id).join(' · ');
  ctx.fillText(`FEATS ${unlocked.size}/${FEATS.length}${earned.length ? `  ★ NEW: ${newNames}` : ''}`, 64, 376);
  for (let i = 0; i < FEATS.length; i += 1) {
    const col = i % 2, row = Math.floor(i / 2);
    const got = unlocked.has(FEATS[i].id);
    ctx.fillStyle = got ? PAL.gold : PAL.dim; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${got ? '★' : '☆'} ${FEATS[i].name}`, 64 + col * 268, 400 + row * 22);
  }
  // Last runs panel (right): the last three runs, same language as the title.
  ctx.fillStyle = '#062a33'; ctx.fillRect(660, 350, 580, 150);
  ctx.strokeStyle = 'rgba(159,196,189,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(660, 350, 580, 150);
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
  ctx.fillText('LAST RUNS', 684, 376);
  const runs = meta.runs || [];
  if (runs.length === 0) {
    ctx.fillStyle = PAL.dim; ctx.font = '13px sans-serif';
    ctx.fillText('No runs yet — the pool waits.', 684, 400);
  } else {
    runs.slice(0, 3).forEach((r, i) => {
      const rm = Math.floor((r.time || 0) / 60), rs = Math.floor((r.time || 0) % 60);
      ctx.fillStyle = r.won ? '#7fe0c3' : '#ff8fa0'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${r.won ? 'WON ' : 'LOST'} · ${(DIFFICULTIES[r.diff] || DIFFICULTIES.normal).label} · ${r.stage}/30 · ${r.score} · ${rm}:${String(rs).padStart(2, '0')}`, 684, 400 + i * 22);
    });
  }
  // Weapons recap: the arsenal as drawn icons with level pips, centred.
  const totalW = WEAPON_ORDER.length * 44 - 4;
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const id = WEAPON_ORDER[i];
    const lv = state.weapons[id];
    const bx = VIEW_W / 2 - totalW / 2 + i * 44;
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, 520, 40, 44);
    drawWeaponIcon(ctx, id, bx + 20, 537, 28, lv > 0);
    for (let j = 0; j < WEAPON_MAX; j += 1) {
      ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(bx + 8 + j * 6, 558, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.xp; ctx.font = 'bold 19px sans-serif';
  ctx.fillText(nextGoal, VIEW_W / 2, 592);
  const isBest = state.score >= state.best && state.score > 0;
  ctx.fillStyle = isBest ? PAL.gold : PAL.dim; ctx.font = 'bold 22px sans-serif';
  ctx.fillText(isBest ? '★ NEW BEST SCORE ★' : `BEST ${state.best}`, VIEW_W / 2, 618);
  // The one CTA: a big gold PLAY AGAIN button (R or click anywhere restarts).
  ctx.fillStyle = PAL.gold; ctx.fillRect(VIEW_W / 2 - 150, 632, 300, 52);
  ctx.fillStyle = '#062a33'; ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PLAY AGAIN — R / CLICK', VIEW_W / 2, 665);
}
