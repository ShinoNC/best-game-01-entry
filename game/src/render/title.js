// The title screens: a clean vertical menu, then a difficulty select.
// Open bright water behind both — no frame, no box — with living creatures.
import { CREATURE_ORDER, DIFFICULTIES, ENEMIES, PAL, VIEW_W } from '../config.js';
import { bestTitle } from '../meta.js';
import { drawCrab, drawEnemy } from './creatures.js';
import { difficultyLayout, titleLayout } from './layout.js';
import { bevel, logoText, rr, txt } from './polish.js';

// Ambient life: 24 creatures drifting behind the menu; positions are a pure
// function of time, so the staged screenshot is deterministic.
const AMBIENT = [];
for (let i = 0; i < 24; i += 1) {
  AMBIENT.push({ type: CREATURE_ORDER[i % CREATURE_ORDER.length],
    x: Math.random() * 1280, y: Math.random() * 720,
    vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 16, wob: Math.random() * 6.28,
    dep: 0.55 + Math.random() * 0.45 });
}

// Shared menu background: a light veil over the water, then drifting creatures.
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

// The crab strolls along the bottom, legs stepping, turning at each edge.
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
  // The logo: gradient orange + dark outline + drop shadow — a game logo, not flat text.
  ctx.letterSpacing = '3px';
  logoText(ctx, 'TIDEKEEPER', VIEW_W / 2, 112,
    '900 88px "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    '#ffb35c', '#e8590c', '#4a2408', 3);
  ctx.letterSpacing = '0px';
  // The tagline: bigger, pill-backed, "30 STAGES" emphasized — readable at
  // phone size. No flashing: a static prominent line beats a blinking one.
  const tagParts = [
    { t: '★ CLEAR ', f: 'bold 24px sans-serif' },
    { t: '30 STAGES', f: '900 30px sans-serif' },
    { t: ' — BEAT THE HERONS, WIN THE POOL ★', f: 'bold 24px sans-serif' },
  ];
  let tagW = 0;
  for (const p of tagParts) { ctx.font = p.f; tagW += ctx.measureText(p.t).width; }
  ctx.save();
  ctx.shadowColor = 'rgba(4,26,32,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = 'rgba(6,42,51,0.72)';
  rr(ctx, VIEW_W / 2 - tagW / 2 - 18, 122, tagW + 36, 44, 22); ctx.fill();
  ctx.restore();
  ctx.textAlign = 'left';
  let tx = VIEW_W / 2 - tagW / 2;
  for (const p of tagParts) {
    ctx.font = p.f;
    txt(ctx, p.t, tx, 152, PAL.gold, 3);
    tx += ctx.measureText(p.t).width;
  }
  ctx.textAlign = 'center';
  // A HARD title earned (3/10/20 hard wins) shows under the tagline — gold,
  // only when earned; no placeholder when the player has none.
  const title = bestTitle((state.meta || {}).wins || {});
  if (title) {
    ctx.font = 'bold 17px sans-serif';
    txt(ctx, `✦ ${title.toUpperCase()} ✦`, VIEW_W / 2, 182, PAL.gold);
  }
  // The vertical menu: START first (gold, taller), then four dark buttons.
  // Keyboard selection (Up/Down + Enter) gets a gold highlight ring.
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
      ctx.fillText(label, b.x + b.w / 2, ty);
    } else { // light text on dark: outlined, so it stays crisp over the water
      txt(ctx, label, b.x + b.w / 2, ty, PAL.text);
    }
  }
}

// Difficulty select: three cards (name, description, best score), a BACK button.
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
    ctx.font = 'bold 24px sans-serif';
    txt(ctx, d.label, b.x + b.w / 2, b.y + 38, sel ? PAL.gold : PAL.text);
    ctx.font = '14px sans-serif';
    txt(ctx, d.desc, b.x + b.w / 2, b.y + 62, PAL.dim);
    const best = bests[b.id] || 0;
    ctx.font = 'bold 13px sans-serif';
    txt(ctx, best > 0 ? `BEST ${best}` : 'BEST —', b.x + b.w / 2, b.y + 88, best > 0 ? PAL.gold : PAL.dim);
  }
  const bk = DL.back;
  bevel(ctx, bk.x, bk.y, bk.w, bk.h, 8, '#11566b', '#062a33', PAL.foam, 2);
  ctx.font = 'bold 17px sans-serif';
  txt(ctx, '← BACK', bk.x + bk.w / 2, bk.y + 29, PAL.text);
  ctx.font = '13px sans-serif';
  txt(ctx, '1–3 or ← → to choose · ENTER to start · ESC to go back', VIEW_W / 2, 560, PAL.dim);
}
