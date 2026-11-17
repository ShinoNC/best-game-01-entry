// The title screen: goal, difficulty select, bestiary, feats, run history,
// arsenal. The bestiary header names this run's pool theme (every run reshuffles it).
import { BOSSES, CREATURE_NAMES, CREATURE_ORDER, DIFFICULTIES, DIFF_ORDER, ENEMIES, FEATS, PAL, VIEW_H, VIEW_W, WEAPON_ORDER } from '../config.js';
import { drawCrab, drawEnemy } from './creatures.js';
import { drawWeaponIcon } from './icons.js';
import { titleLayout } from './layout.js';

export function drawTitle(ctx, state) {
  const meta = state.meta || { bests: {}, feats: [], runs: [] };
  ctx.fillStyle = 'rgba(6,42,51,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.crab; ctx.font = 'bold 72px sans-serif';
  ctx.fillText('TIDEKEEPER', VIEW_W / 2, 104);
  // Goal first, in gold: a new player reads the goal + controls in under 5 s.
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 21px sans-serif';
  ctx.fillText('★ CLEAR 30 STAGES — BEAT THE HERONS, WIN THE POOL ★', VIEW_W / 2, 146);
  // Scope line: what the game contains, in numbers (the top titles all list theirs).
  ctx.fillStyle = PAL.foam; ctx.font = '15px sans-serif';
  ctx.fillText('30 stages · 6 boss herons · 6 weapons · grab & throw · 5-card shop · 8 skills · 3 difficulties', VIEW_W / 2, 174);
  // Difficulty select: three real tunings, best score per difficulty. The
  // selected button is gold-filled (the one primary choice on the screen);
  // 1–3 or a click selects, Enter/click elsewhere starts the run.
  const TL = titleLayout();
  for (const b of TL.diffs) {
    const d = DIFFICULTIES[b.id];
    const sel = state.difficulty === b.id;
    const best = (meta.bests && meta.bests[b.id]) || 0;
    ctx.fillStyle = sel ? PAL.gold : 'rgba(6,42,51,0.85)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = sel ? PAL.gold : PAL.foam; ctx.lineWidth = sel ? 3 : 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = sel ? '#062a33' : PAL.text; ctx.font = 'bold 20px sans-serif';
    ctx.fillText(d.label, b.x + b.w / 2, b.y + 26);
    ctx.fillStyle = sel ? '#062a33' : PAL.dim; ctx.font = '13px sans-serif';
    ctx.fillText(`${d.desc} · BEST ${best > 0 ? best : '—'}`, b.x + b.w / 2, b.y + 48);
  }
  // The four controls as chips, side by side.
  const chips = ['WASD — MOVE', 'WEAPONS — ALL AUTO-FIRE', 'SPACE — DASH', '1–3 — DIFFICULTY · P — PAUSE · M — MUTE'];
  ctx.font = 'bold 14px sans-serif';
  const widths = chips.map((c) => ctx.measureText(c).width + 32);
  const gap = 12;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
  let x = VIEW_W / 2 - total / 2;
  for (let i = 0; i < chips.length; i += 1) {
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(x, 276, widths[i], 32);
    ctx.strokeStyle = PAL.foam; ctx.lineWidth = 1; ctx.strokeRect(x, 276, widths[i], 32);
    ctx.fillStyle = PAL.text; ctx.fillText(chips[i], x + widths[i] / 2, 297);
    x += widths[i] + gap;
  }
  // Left panel: the bestiary, named (top titles all list theirs). Solid
  // plates — the animated pool showing through lowered the contrast.
  ctx.fillStyle = '#062a33'; ctx.fillRect(40, 324, 580, 232);
  ctx.strokeStyle = 'rgba(159,196,189,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(40, 324, 580, 232);
  ctx.textAlign = 'left';
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`THE POOL — ${(state.theme || 'rocky').toUpperCase()} · 7 CREATURES · 6 HERONS`, 64, 350);
  for (let i = 0; i < CREATURE_ORDER.length; i += 1) {
    const type = CREATURE_ORDER[i];
    const cx = 84 + i * 80;
    const def = ENEMIES[type];
    drawEnemy(ctx, { type, x: cx, y: 388, r: 15, color: def.color, dark: def.dark, hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI / 2);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(CREATURE_NAMES[type], cx, 420);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = PAL.dim; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('HERONS — ONE EVERY 5 STAGES:', 64, 448);
  for (let i = 0; i < BOSSES.length; i += 1) {
    const col = i % 2, row = Math.floor(i / 2);
    const hx = 64 + col * 290, hy = 472 + row * 22;
    ctx.fillStyle = BOSSES[i].color;
    ctx.beginPath(); ctx.arc(hx + 5, hy - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.text; ctx.font = '13px sans-serif';
    ctx.fillText(`${BOSSES[i].name} · ${BOSSES[i].stage} · ${BOSSES[i].hp} HP`, hx + 16, hy);
  }
  ctx.fillStyle = PAL.dim; ctx.font = '13px sans-serif';
  ctx.fillText('All your weapons attack on their own — dodge, position, and buy better gear.', 64, 540);
  // Right panel: feats earned so far + the last three runs — the game
  // remembers, so a return visit is a continuation, not a reset.
  ctx.fillStyle = '#062a33'; ctx.fillRect(660, 324, 580, 232);
  ctx.strokeStyle = 'rgba(159,196,189,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(660, 324, 580, 232);
  const unlocked = new Set(meta.feats || []);
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`FEATS ${unlocked.size}/${FEATS.length}`, 684, 350);
  for (let i = 0; i < FEATS.length; i += 1) {
    const col = i % 2, row = Math.floor(i / 2);
    const fx0 = 684 + col * 268, fy = 374 + row * 22;
    const got = unlocked.has(FEATS[i].id);
    ctx.fillStyle = got ? PAL.gold : PAL.dim; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${got ? '★' : '☆'} ${FEATS[i].name}`, fx0, fy);
  }
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
  ctx.fillText('LAST RUNS', 684, 486);
  const runs = meta.runs || [];
  if (runs.length === 0) {
    ctx.fillStyle = PAL.dim; ctx.font = '13px sans-serif';
    ctx.fillText('No runs yet — the pool waits.', 684, 510);
  } else {
    runs.forEach((r, i) => {
      const mins = Math.floor((r.time || 0) / 60), secs = Math.floor((r.time || 0) % 60);
      ctx.fillStyle = r.won ? '#7fe0c3' : '#ff8fa0'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${r.won ? 'WON ' : 'LOST'} · ${(DIFFICULTIES[r.diff] || DIFFICULTIES.normal).label} · ${r.stage}/30 · ${r.score} · ${mins}:${String(secs).padStart(2, '0')}`, 684, 510 + i * 20);
    });
  }
  // The arsenal at a glance: all six weapons as drawn icons under the
  // panels, so the title shows the game's depth before a single stage.
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const bx = VIEW_W / 2 - 162 + i * 56;
    ctx.fillStyle = 'rgba(127,224,195,0.22)'; ctx.fillRect(bx, 580, 44, 40);
    ctx.strokeStyle = 'rgba(127,224,195,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(bx, 580, 44, 40);
    drawWeaponIcon(ctx, WEAPON_ORDER[i], bx + 22, 600, 30, true);
  }
  const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) {
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CLICK  or  PRESS ENTER  to begin', VIEW_W / 2, 656);
  }
  const bestAll = Math.max(0, ...DIFF_ORDER.map((d) => (meta.bests && meta.bests[d]) || 0), state.best || 0);
  ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(bestAll > 0 ? `BEST SCORE ${bestAll}` : 'No best score yet — be the first crab to hold the pool.', VIEW_W / 2, 686);
  // A crab and a jellyfish flank the bottom — the title shows the game.
  drawCrab(ctx, { ...state.player, x: 120, y: 640, angle: 0.3, iframes: 0, flash: 0, swing: 0, spin: 0 }, 0, null, null);
  drawEnemy(ctx, { type: 'jelly', x: 1160, y: 640, r: 26, color: '#ff8fb0', dark: '#c94f78', hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI);
}
