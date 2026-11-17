import { CREATURE_NAMES, PAL, POOL, STAGES, VIEW_H, WEAPON_ORDER, bossForStage, clusterMod, clusterOf, contentStage, nextTypes } from '../config.js';
import { UPGRADE_DEFS } from '../upgrades.js';
import { comboMult } from '../world.js';
import { drawCoin, drawPotion, drawSkillIcon, drawWeaponIcon, heart } from './icons.js';
import { POTION_BOX } from './layout.js';
import {dither, pxBar, pxFrame, pxPanel, txt, px, vt} from './polish.js';

export function drawHud(ctx, state, t) {
  const p = state.player;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // Top/bottom strips: high-contrast dither.
  ctx.fillStyle = dither(ctx, 'rgba(13,74,92,0.95)', 'rgba(4,26,32,0.95)');
  ctx.fillRect(0, 0, POOL.x1, 72);
  ctx.fillRect(0, VIEW_H - 72, POOL.x1, 72);
  // Pixel divider: alternating gold / dark blocks.
  for (let x = 0; x < POOL.x1; x += 16) {
    ctx.fillStyle = (x / 16) % 2 === 0 ? 'rgba(255,209,102,0.75)' : 'rgba(4,26,32,0.95)';
    ctx.fillRect(x, 69, 16, 4);
    ctx.fillRect(x, VIEW_H - 76, 16, 4);
  }
  const remaining = (STAGES[contentStage(state) - 1].budget - state.stageSpawned) + state.enemies.length;
  const nx = state.stage + 1;
  const nextBoss = bossForStage(nx, state.bossOrder);
  const nextBit = nextBoss ? `⚠ ${nextBoss.name}`
    : nextTypes(nx, state.stageMix).map((k) => CREATURE_NAMES[k]).join(' + ');
  ctx.font = px(14);
  txt(ctx, `STAGE ${state.stage}`, 28, 28, PAL.text);
  ctx.font = px(8);
  txt(ctx, `${remaining} LEFT · NEXT: ${nextBit}`, 28, 46, PAL.dim);
  const mod = clusterMod(state, state.stage);
  const c0 = clusterOf(state.stage) * 5 + 1, c1 = c0 + 4;
  ctx.font = px(8);
  txt(ctx, `EFFECT (STAGES ${c0}–${c1}): ${mod.n}`, 28, 64, PAL.gold);
  ctx.textAlign = 'right';
  ctx.font = px(19);
  txt(ctx, `SCORE ${state.score}`, POOL.x1 - 28, 38, PAL.gold);
  ctx.font = px(9);
  const coinTxt = `${state.coins} COINS`;
  txt(ctx, coinTxt, POOL.x1 - 28, 60, PAL.gold);
  drawCoin(ctx, POOL.x1 - 28 - ctx.measureText(coinTxt).width - 13, 55, 8);
  const cm = comboMult(state);
  ctx.textAlign = 'center'; ctx.font = px(13);
  txt(ctx, `COMBO ×${cm}`, POOL.cx, 40, cm > 1 ? PAL.gold : PAL.dim);
  if (STAGES[contentStage(state) - 1].boss && !state.bossSpawned && !state.boss) {
    const boss = bossForStage(state.stage, state.bossOrder);
    const warn = `⚠ ${boss ? boss.name : 'THE BEAST'} IS COMING ⚠`;
    ctx.font = px(11);
    const ww = ctx.measureText(warn).width + 40;
    pxPanel(ctx, POOL.cx - ww / 2, 78, ww, 32, 'rgba(6,42,51,0.85)', 'rgba(4,26,32,0.85)', '#ff5d73');
    ctx.textAlign = 'center';
    txt(ctx, warn, POOL.cx, 100, `rgba(255,93,115,${0.6 + 0.4 * Math.sin(t * 6)})`);
  }
  if (state.boss) {
    pxPanel(ctx, POOL.cx - 190, 78, 380, 34, 'rgba(6,42,51,0.85)', 'rgba(4,26,32,0.85)', '#ff5d73');
    ctx.textAlign = 'center'; ctx.font = px(9);
    txt(ctx, state.boss.name, POOL.cx, 94, '#e8e4d8');
    pxBar(ctx, POOL.cx - 180, 100, 360, 6, state.boss.hp / state.boss.maxHp, '#ff5d73', 12);
  }
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const id = WEAPON_ORDER[i];
    const lv = state.weapons[id];
    const bx = 28 + i * 56, by = 658;
    pxFrame(ctx, bx - 2, by - 2, 56, 56, lv > 0 ? '#7fe0c3' : 'rgba(255,255,255,0.25)', 2);
    ctx.fillStyle = dither(ctx, lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)',
      'rgba(0,0,0,0.25)');
    ctx.fillRect(bx, by, 52, 52);
    drawWeaponIcon(ctx, id, bx + 26, by + 16, 34, lv > 0);
    if (lv > 0) {
      ctx.font = vt(15); ctx.textAlign = 'center';
      txt(ctx, `Lv${lv}`, bx + 26, by + 47, PAL.text, 1);
    }
  }
  ctx.font = px(9); ctx.textAlign = 'left';
  heart(ctx, POOL.cx - 142, 663, 8, PAL.hp);
  txt(ctx, `${Math.ceil(p.hp)}/${p.maxHp}`, POOL.cx - 130, 670, PAL.text, 3);
  if (state.ups.shell > 0) {
    ctx.textAlign = 'right';
    txt(ctx, `Lv${state.ups.shell}`, POOL.cx + 150, 670, PAL.gold, 3);
  }
  pxBar(ctx, POOL.cx - 150, 677, 300, 14, p.hp / p.maxHp, PAL.hp, 12);
  ctx.font = px(8); ctx.textAlign = 'left';
  txt(ctx, `Lv${state.level}`, POOL.cx - 150, 706, PAL.xp, 3);
  pxBar(ctx, POOL.cx - 110, 697, 260, 8, Math.min(1, state.xp / state.xpNext), PAL.xp, 10);
  if (p.armor > 0) {
    ctx.font = px(9);
    const num = `${p.armor}`;
    const x0 = POOL.cx - (ctx.measureText(num).width + 16) / 2;
    ctx.fillStyle = PAL.armor;
    ctx.fillRect(x0, 657, 12, 10);
    ctx.fillRect(x0 + 2, 667, 8, 4);
    ctx.fillRect(x0 + 4, 671, 4, 3);
    ctx.textAlign = 'left';
    txt(ctx, num, x0 + 16, 670, PAL.armor, 3);
  }
  // Potion box: flask icon + count, click or E to drink (+25 HP).
  const nPot = state.potions || 0;
  pxFrame(ctx, POTION_BOX.x - 2, POTION_BOX.y - 2, 60, 60, nPot > 0 ? '#ff5d73' : 'rgba(255,255,255,0.25)', 2);
  ctx.fillStyle = dither(ctx, nPot > 0 ? 'rgba(255,93,115,0.22)' : 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.25)');
  ctx.fillRect(POTION_BOX.x, POTION_BOX.y, 56, 56);
  ctx.save();
  if (!nPot) ctx.globalAlpha = 0.35;
  drawPotion(ctx, POTION_BOX.x + 28, POTION_BOX.y + 22, 30);
  ctx.restore();
  ctx.font = vt(15); ctx.textAlign = 'center';
  txt(ctx, nPot > 0 ? `×${nPot} [E]` : '[E]', POTION_BOX.x + 28, POTION_BOX.y + 49, nPot > 0 ? PAL.text : PAL.dim, 1);
  for (let i = 0; i < UPGRADE_DEFS.length; i += 1) {
    const d = UPGRADE_DEFS[i];
    const lv = state.ups[d.id];
    const bx = POOL.x1 - 80 - (UPGRADE_DEFS.length - 1 - i) * 56, by = 658;
    pxFrame(ctx, bx - 2, by - 2, 56, 56, lv > 0 ? '#7fe0c3' : 'rgba(255,255,255,0.25)', 2);
    ctx.fillStyle = dither(ctx, lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)',
      'rgba(0,0,0,0.25)');
    ctx.fillRect(bx, by, 52, 52);
    drawSkillIcon(ctx, d.id, bx + 26, by + 20, 30, lv > 0);
    if (lv > 0) {
      ctx.font = vt(15); ctx.textAlign = 'center';
      txt(ctx, `Lv${lv}`, bx + 26, by + 47, PAL.text, 1);
    }
  }
  ctx.textAlign = 'right';
  ctx.font = px(9);
  txt(ctx, p.dashCd <= 0 ? 'DASH READY' : `DASH ${p.dashCd.toFixed(1)}s`, POOL.x1 - 40, 627, PAL.text, 3);
  if (state.bannerT > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, state.bannerT);
    ctx.font = px(19);
    const bw = ctx.measureText(state.banner).width + 56;
    pxPanel(ctx, POOL.cx - bw / 2, 146, bw, 40, 'rgba(6,42,51,0.88)', 'rgba(4,26,32,0.88)', PAL.gold);
    txt(ctx, state.banner, POOL.cx, 175, PAL.gold);
    ctx.globalAlpha = 1;
  }
  const hint = state.phase === 'play' && state.hints && state.hints.cur;
  if (hint) {
    const remain = state.hints.t;
    const alpha = Math.min(1, remain / 0.5) * Math.min(1, (hint.show - remain) / 0.25);
    ctx.font = px(12);
    const tw = ctx.measureText(hint.text).width;
    const w = tw + 44 + 30;
    const y = 105;
    ctx.globalAlpha = alpha;
    pxPanel(ctx, POOL.cx - w / 2, y - 24, w, 44, 'rgba(6,42,51,0.88)', 'rgba(4,26,32,0.88)', PAL.gold);
    // Pixel diamond marker.
    const dx = POOL.cx - w / 2 + 24, dy = y - 3;
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(dx - 2, dy - 8, 4, 4); ctx.fillRect(dx - 6, dy - 4, 12, 4);
    ctx.fillRect(dx - 2, dy, 4, 4); ctx.fillRect(dx - 6, dy - 4, 4, 4); ctx.fillRect(dx + 2, dy - 4, 4, 4);
    ctx.textAlign = 'center';
    txt(ctx, hint.text, POOL.cx + 15, y + 5, PAL.text);
    ctx.globalAlpha = 1;
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6,42,51,0.7)'; ctx.fillRect(0, 0, POOL.x1, VIEW_H);
  ctx.textAlign = 'center';
  ctx.font = px(35);
  txt(ctx, 'PAUSED', POOL.cx, 330, PAL.text, 3);
  ctx.font = vt(27);
  txt(ctx, 'P / Esc — resume      M — mute      H — help      R — restart', POOL.cx, 380, PAL.dim);
}
