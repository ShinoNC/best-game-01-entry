// The title screen: a clean menu — goal, difficulty, START, four menu buttons. Creatures drift behind it.
import { CREATURE_ORDER, DIFFICULTIES, ENEMIES, PAL, VIEW_W } from '../config.js';
import { drawCrab, drawEnemy } from './creatures.js';
import { titleLayout } from './layout.js';

// Ambient life: 16 small creatures, 2–3 of each type, drifting slowly across
// the pool behind the menu. Random mix per page load; positions are a pure
// function of time, so the staged screenshot is deterministic.
const AMBIENT = [];
for (let i = 0; i < 16; i += 1) {
  AMBIENT.push({ type: CREATURE_ORDER[i % CREATURE_ORDER.length],
    x: Math.random() * 1280, y: 74 + Math.random() * 572,
    vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 16, wob: Math.random() * 6.28 });
}

export function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(6,42,51,0.82)'; ctx.fillRect(0, 0, VIEW_W, 720);
  // The living pool behind the menu: slow, small, dimmed — ambiance, not clutter.
  const tt = state.shotMode ? 2.5 : performance.now() / 1000;
  ctx.save(); ctx.globalAlpha = 0.7;
  for (const a of AMBIENT) {
    const def = ENEMIES[a.type];
    const ax = ((a.x + a.vx * tt - 4) % 1272 + 1272) % 1272 + 4;
    const ay = 74 + (((a.y - 74 + a.vy * tt) % 572) + 572) % 572;
    drawEnemy(ctx, { type: a.type, x: ax, y: ay, r: def.r * 0.6, color: def.color, dark: def.dark,
      hp: 1, maxHp: 1, flash: 0, wob: a.wob + tt * 0.5, elite: false }, tt, Math.atan2(a.vy, a.vx));
  }
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.crab; ctx.font = 'bold 72px sans-serif';
  ctx.fillText('TIDEKEEPER', VIEW_W / 2, 100);
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 21px sans-serif';
  ctx.fillText('★ CLEAR 30 STAGES — BEAT THE HERONS, WIN THE POOL ★', VIEW_W / 2, 140);
  // Difficulty select: three real tunings. The selected button is gold-filled;
  // 1–3 or a click selects, START begins. Best scores live in HISTORY now.
  const TL = titleLayout();
  for (const b of TL.diffs) {
    const d = DIFFICULTIES[b.id];
    const sel = state.difficulty === b.id;
    ctx.fillStyle = sel ? PAL.gold : 'rgba(6,42,51,0.85)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = sel ? PAL.gold : PAL.foam; ctx.lineWidth = sel ? 3 : 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = sel ? '#062a33' : PAL.text; ctx.font = 'bold 20px sans-serif';
    ctx.fillText(d.label, b.x + b.w / 2, b.y + 26);
    ctx.fillStyle = sel ? '#062a33' : PAL.dim; ctx.font = '13px sans-serif';
    ctx.fillText(d.desc, b.x + b.w / 2, b.y + 48);
  }
  // The one primary action: a big gold START button.
  ctx.fillStyle = PAL.gold; ctx.fillRect(TL.start.x, TL.start.y, TL.start.w, TL.start.h);
  ctx.fillStyle = '#062a33'; ctx.font = 'bold 24px sans-serif';
  ctx.fillText('START GAME  [Enter]', VIEW_W / 2, TL.start.y + 37);
  // Four menu buttons in one row: guide, feats, history, settings.
  const menus = [[TL.help, 'HOW TO PLAY  ?'], [TL.feats, 'ACHIEVEMENTS'], [TL.history, 'HISTORY'], [TL.settings, 'SETTINGS']];
  for (const [b, label] of menus) {
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = PAL.foam; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 18px sans-serif';
    ctx.fillText(label, b.x + b.w / 2, b.y + 29);
  }
  // A crab and a jellyfish flank the bottom — the title shows the game.
  drawCrab(ctx, { ...state.player, x: 120, y: 640, angle: 0.3, iframes: 0, flash: 0, swing: 0, spin: 0 }, 0, null, null);
  drawEnemy(ctx, { type: 'jelly', x: 1160, y: 640, r: 26, color: '#ff8fb0', dark: '#c94f78', hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI);
}
