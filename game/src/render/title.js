import { POOL, CREATURE_ORDER, ENEMIES, PAL } from '../config.js';
import { drawCrab, drawEnemy } from './creatures.js';
import { MENU_ITEMS, titleLayout } from './layout.js';
import {bevel, logoText, pxPanel, txt, px, vt} from './polish.js';
const AMBIENT = [];
for (let i = 0; i < 24; i += 1) {
  AMBIENT.push({ type: CREATURE_ORDER[i % CREATURE_ORDER.length],
    x: Math.random() * 1280, y: Math.random() * 720,
    vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 16, wob: Math.random() * 6.28,
    dep: 0.55 + Math.random() * 0.45 });
}
function drawAmbient(ctx, state) {
  ctx.fillStyle = 'rgba(6,42,51,0.28)'; ctx.fillRect(0, 0, POOL.x1, 720);
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
function drawPatrolCrab(ctx, state, tt) {
  const span = 1280 - 2 * 90, cyc = (tt * 50) % (span * 2);
  const cx = 90 + (cyc < span ? cyc : span * 2 - cyc);
  drawCrab(ctx, { ...state.player, x: cx, y: 652, radius: 38,
    angle: cyc < span ? 0 : Math.PI, moving: 1,
    iframes: 0, flash: 0, swing: 0, spin: 0 }, tt, null, null);
}
export function drawTitle(ctx, state) {
  const tt = drawAmbient(ctx, state);
  drawPatrolCrab(ctx, state, tt);
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  logoText(ctx, 'TIDEKEEPER', POOL.cx, 112,
    px(56),
    '#ffb35c', '#e8590c', '#4a2408', 3);
  ctx.letterSpacing = '0px';
  const tagParts = [
    { t: '★ ENDLESS STAGES', f: px(19) },
    { t: ' — DEFEND THE REEF, KEEP THE TIDE ★', f: px(15) },
  ];
  let tagW = 0;
  for (const p of tagParts) { ctx.font = p.f; tagW += ctx.measureText(p.t).width; }
  pxPanel(ctx, POOL.cx - tagW / 2 - 18, 142, tagW + 36, 44,
    'rgba(6,42,51,0.72)', 'rgba(4,26,32,0.72)', PAL.gold);
  ctx.textAlign = 'left';
  let tx = POOL.cx - tagW / 2;
  for (const p of tagParts) {
    ctx.font = p.f;
    txt(ctx, p.t, tx, 172, PAL.gold, 3);
    tx += ctx.measureText(p.t).width;
  }
  ctx.textAlign = 'center';
  const TL = titleLayout();
  const labels = { play: 'PLAY',
    help: 'HOW TO PLAY  ?', feats: 'ACHIEVEMENTS', settings: 'SETTINGS' };
  const items = MENU_ITEMS;
  for (let i = 0; i < items.length; i += 1) {
    const key = items[i];
    const label = labels[key];
    const b = TL[key];
    const sel = state.menuSel === i;
    const isPlay = key === 'play';
    if (isPlay) bevel(ctx, b.x, b.y, b.w, b.h, 10, '#ffe08a', '#f0b23e', PAL.gold, 2);
    else bevel(ctx, b.x, b.y, b.w, b.h, 10, '#11566b', '#062a33', sel ? PAL.gold : PAL.foam, sel ? 3 : 2);
    if (sel && !isPlay) {
      ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 2;
      ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    }
    const ty = b.y + (isPlay ? 41 : 30);
    ctx.font = isPlay ? px(15) : px(11);
    if (isPlay) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(label, b.x + b.w / 2, ty - 1);
      ctx.fillStyle = '#062a33';
      ctx.fillText(label, b.x + b.w / 2, ty);
    } else {
      txt(ctx, label, b.x + b.w / 2, ty, PAL.text);
    }
  }
  const bs = (state.meta || {}).bestScore || 0, s = TL.settings, y = s.y + s.h + 16;
  bevel(ctx, s.x, y, s.w, s.h, 10, '#11566b', '#062a33', PAL.foam, 2);
  txt(ctx, `★ TOP SCORE ${bs.toLocaleString('en-US')}`, POOL.cx, y + 30, PAL.gold);
  ctx.textAlign = 'right';
  ctx.font = px(10);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('v1.1', POOL.x1 - 12, 708);
}
