// The title screens: a clean vertical menu, then a difficulty select.
// Open bright water behind both — no frame, no box — with living creatures.
import { CREATURE_ORDER, DIFFICULTIES, ENEMIES, PAL, VIEW_W } from '../config.js';
import { drawCrab, drawEnemy } from './creatures.js';
import { difficultyLayout, titleLayout } from './layout.js';
import { bevel, logoText } from './polish.js';

// Ambient life: 24 creatures, all 7 types, drifting slowly across the whole
// screen behind the menu. Random mix per page load; positions are a pure
// function of time, so the staged screenshot is deterministic. Depth varies:
// near creatures are bigger and brighter, far ones smaller and dimmer.
const AMBIENT = [];
for (let i = 0; i < 24; i += 1) {
  AMBIENT.push({ type: CREATURE_ORDER[i % CREATURE_ORDER.length],
    x: Math.random() * 1280, y: Math.random() * 720,
    vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 16, wob: Math.random() * 6.28,
    dep: 0.55 + Math.random() * 0.45 });
}

// Shared menu background: a light veil over the bright water (the menu reads,
// the sea still shines), then the drifting creatures, clearly visible.
function drawAmbient(ctx, state) {
  ctx.fillStyle = 'rgba(6,42,51,0.28)'; ctx.fillRect(0, 0, VIEW_W, 720);
  const tt = state.shotMode ? 2.5 : performance.now() / 1000;
  for (const a of AMBIENT) {
    const def = ENEMIES[a.type];
    const ax = ((a.x + a.vx * tt) % 1280 + 1280) % 1280;
    const ay = ((a.y + a.vy * tt) % 720 + 720) % 720;
    ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * a.dep;
    drawEnemy(ctx, { type: a.type, x: ax, y: ay, r: def.r * 0.8 * a.dep, color: def.color, dark: def.dark,
      hp: 1, maxHp: 1, flash: 0, wob: a.wob + tt * 0.5, elite: false }, tt, Math.atan2(a.vy, a.vx));
    ctx.restore();
  }
  return tt;
}

// The crab strolls along the bottom, fully visible, legs stepping, turning
// at each edge. Slow and relaxed — a crab on a walk, not a rush.
function drawPatrolCrab(ctx, state, tt) {
  const span = 1280 - 2 * 90, cyc = (tt * 50) % (span * 2);
  const cx = 90 + (cyc < span ? cyc : span * 2 - cyc);
  drawCrab(ctx, { ...state.player, x: cx, y: 652, radius: 38,
    angle: cyc < span ? 0 : Math.PI, moving: 1,
    iframes: 0, flash: 0, swing: 0, spin: 0 }, tt, null, null);
}

export function drawTitle(ctx, state) {
  const tt = drawAmbient(ctx, state);
  drawPatrolCrab(ctx, state, tt); // behind the menu, along the bottom
  ctx.textAlign = 'center';
  // The logo: gradient orange + dark outline + drop shadow — a game logo,
  // not flat text. A bolder stack + letter-spacing for presence.
  ctx.letterSpacing = '3px';
  logoText(ctx, 'TIDEKEEPER', VIEW_W / 2, 112,
    '900 88px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    '#ffb35c', '#e8590c', '#4a2408', 3);
  ctx.letterSpacing = '0px';
  ctx.save();
  ctx.shadowColor = 'rgba(4,26,32,0.8)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 21px sans-serif';
  ctx.fillText('★ CLEAR 30 STAGES — BEAT THE HERONS, WIN THE POOL ★', VIEW_W / 2, 152);
  ctx.restore();
  // The vertical menu: START first (gold, taller), then four dark buttons.
  // Beveled: gradient + top highlight + shadow. Keyboard selection
  // (Up/Down + Enter) gets a gold highlight ring.
  const TL = titleLayout();
  const items = [['start', 'START GAME'], ['help', 'HOW TO PLAY  ?'], ['feats', 'ACHIEVEMENTS'],
    ['history', 'HISTORY'], ['settings', 'SETTINGS']];
  for (let i = 0; i < items.length; i += 1) {
    const [key, label] = items[i];
    const b = TL[key];
    const sel = state.menuSel === i;
    const isStart = key === 'start';
    if (isStart) bevel(ctx, b.x, b.y, b.w, b.h, 10, '#ffe08a', '#f0b23e', PAL.gold, 2);
    else bevel(ctx, b.x, b.y, b.w, b.h, 10, '#11566b', '#062a33', sel ? PAL.gold : PAL.foam, sel ? 3 : 2);
    if (sel && !isStart) { // a selected dark button gets a gold glow outline
      ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 2;
      ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    }
    const ty = b.y + (isStart ? 41 : 30);
    ctx.font = isStart ? 'bold 24px sans-serif' : 'bold 18px sans-serif';
    if (isStart) { // dark text on gold: a light highlight above sells the bevel
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(label, b.x + b.w / 2, ty - 1);
      ctx.fillStyle = '#062a33';
    } else { // light text on dark: a dark shadow below gives depth
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
      ctx.fillStyle = PAL.text;
      ctx.fillText(label, b.x + b.w / 2, ty);
      ctx.restore();
      continue;
    }
    ctx.fillText(label, b.x + b.w / 2, ty);
  }
}

// Difficulty select: three cards in a row (name, description, best score for
// that difficulty), a BACK button, and the keys. Enter starts the highlight.
export function drawDifficulty(ctx, state) {
  const tt = drawAmbient(ctx, state);
  drawPatrolCrab(ctx, state, tt); // the crab keeps strolling here too
  ctx.textAlign = 'center';
  logoText(ctx, 'CHOOSE YOUR TIDE', VIEW_W / 2, 180,
    '900 40px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    '#ffe08a', '#f0b23e', '#4a2408', 2);
  const DL = difficultyLayout();
  const bests = (state.meta || {}).bests || {};
  for (const b of DL.diffs) {
    const d = DIFFICULTIES[b.id];
    const sel = state.difficulty === b.id;
    bevel(ctx, b.x, b.y, b.w, b.h, 10,
      sel ? '#16607a' : '#11566b', sel ? '#0a3d4d' : '#062a33',
      sel ? PAL.gold : PAL.foam, sel ? 3 : 2);
    ctx.fillStyle = sel ? PAL.gold : PAL.text; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(d.label, b.x + b.w / 2, b.y + 38);
    ctx.fillStyle = PAL.dim; ctx.font = '14px sans-serif';
    ctx.fillText(d.desc, b.x + b.w / 2, b.y + 62);
    const best = bests[b.id] || 0;
    ctx.fillStyle = best > 0 ? PAL.gold : PAL.dim; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(best > 0 ? `BEST ${best}` : 'BEST —', b.x + b.w / 2, b.y + 88);
  }
  const bk = DL.back;
  bevel(ctx, bk.x, bk.y, bk.w, bk.h, 8, '#11566b', '#062a33', PAL.foam, 2);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 17px sans-serif';
  ctx.fillText('← BACK', bk.x + bk.w / 2, bk.y + 29);
  ctx.fillStyle = PAL.dim; ctx.font = '13px sans-serif';
  ctx.fillText('1–3 or ← → to choose · ENTER to start · ESC to go back', VIEW_W / 2, 560);
}
