import { CREATURE_NAMES, DIFFICULTIES, PAL, STAGES, STAGE_COUNT, VIEW_H, VIEW_W, WEAPON_ORDER, bossForStage, contentStage, nextTypes } from '../config.js';
import { UPGRADE_DEFS } from '../upgrades.js';
import { comboMult } from '../world.js';
import { drawCoin, drawWeaponIcon } from './icons.js';
import { txt } from './polish.js';

export function drawHud(ctx, state, t) {
  const p = state.player;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(6,42,51,0.92)';
  ctx.fillRect(0, 0, VIEW_W, 72);
  ctx.fillRect(0, VIEW_H - 72, VIEW_W, 72);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(0, 70, VIEW_W, 2);
  ctx.fillRect(0, VIEW_H - 72, VIEW_W, 2);
  const remaining = (STAGES[contentStage(state) - 1].budget - state.stageSpawned) + state.enemies.length;
  const diffLabel = (DIFFICULTIES[state.difficulty || 'normal'] || DIFFICULTIES.normal).label;
  const nx = state.stage + 1;
  const nextBoss = nx <= STAGE_COUNT ? bossForStage(nx, state.bossOrder) : null;
  const nextBit = nextBoss ? `⚠ ${nextBoss.name}`
    : nx > STAGE_COUNT ? 'FINAL STAGE'
    : nextTypes(contentStage(state, nx)).map((k) => CREATURE_NAMES[k]).join(' + ');
  ctx.font = 'bold 22px sans-serif';
  txt(ctx, `STAGE ${state.stage} / ${STAGE_COUNT} · ${diffLabel}`, 28, 28, PAL.text);
  ctx.font = 'bold 13px sans-serif';
  txt(ctx, `${remaining} LEFT · NEXT: ${nextBit}`, 28, 46, PAL.dim);
  if (state.modifier) {
    ctx.font = 'bold 13px sans-serif';
    txt(ctx, `EFFECT: ${state.modifier.n}`, 28, 64, PAL.gold);
  }
  ctx.textAlign = 'right';
  ctx.font = 'bold 30px sans-serif';
  txt(ctx, `SCORE ${state.score}`, 1252, 38, PAL.gold);
  ctx.font = 'bold 15px sans-serif';
  const coinTxt = `${state.coins} COINS · COMBO ×${comboMult(state)} · BEST ${state.best}`;
  txt(ctx, coinTxt, 1252, 60, PAL.gold);
  drawCoin(ctx, 1252 - ctx.measureText(coinTxt).width - 13, 55, 8);
  if (STAGES[state.stage - 1].boss && !state.bossSpawned && !state.boss) {
    const boss = bossForStage(state.stage, state.bossOrder);
    const warn = `⚠ ${boss ? boss.name : 'THE BEAST'} IS COMING ⚠`;
    ctx.font = 'bold 17px sans-serif';
    const ww = ctx.measureText(warn).width + 40;
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - ww / 2, 78, ww, 32);
    ctx.textAlign = 'center';
    txt(ctx, warn, VIEW_W / 2, 100, `rgba(255,93,115,${0.6 + 0.4 * Math.sin(t * 6)})`);
  }
  if (state.boss) {
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - 190, 78, 380, 34);
    ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif';
    txt(ctx, state.boss.name, VIEW_W / 2, 94, '#e8e4d8');
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(VIEW_W / 2 - 180, 100, 360, 6);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(VIEW_W / 2 - 180, 100, 360 * (state.boss.hp / state.boss.maxHp), 6);
  }
  const WABBR = { claw: 'CL', bow: 'BW', blaster: 'BL', shell: 'SH', spin: 'SP', laser: 'LZ', trident: 'TR' };
  const SABBR = { claws: 'DM', tempo: 'FR', reach: 'RG', shell: 'EN', legs: 'SW', bubbles: 'BB', magnet: 'MG' };
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const id = WEAPON_ORDER[i];
    const lv = state.weapons[id];
    const bx = 28 + i * 56, by = 658;
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 52, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, 52, 2);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, by, 52, 52);
    drawWeaponIcon(ctx, id, bx + 26, by + 16, 34, lv > 0);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, lv > 0 ? WABBR[id] + lv : WABBR[id], bx + 26, by + 47, lv > 0 ? PAL.text : PAL.dim, 1);
  }
  ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
  txt(ctx, '♥', 490, 670, PAL.hp, 3);
  txt(ctx, ` ${Math.ceil(p.hp)}/${p.maxHp}`, 490 + ctx.measureText('♥ ').width, 670, PAL.text, 3);
  if (state.ups.shell > 0) {
    ctx.textAlign = 'right';
    txt(ctx, `Lv${state.ups.shell}`, 790, 670, PAL.gold, 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(490, 677, 300, 14);
  ctx.fillStyle = PAL.hp; ctx.fillRect(490, 677, 300 * (p.hp / p.maxHp), 14);
  if (p.armor > 0) {
    ctx.font = 'bold 14px sans-serif';
    const num = `${p.armor}`;
    const x0 = 640 - (ctx.measureText(num).width + 16) / 2;
    ctx.fillStyle = PAL.armor;
    ctx.beginPath();
    ctx.moveTo(x0, 657); ctx.lineTo(x0 + 12, 657); ctx.lineTo(x0 + 12, 665);
    ctx.quadraticCurveTo(x0 + 12, 671, x0 + 6, 674); ctx.quadraticCurveTo(x0, 671, x0, 665);
    ctx.closePath(); ctx.fill();
    ctx.textAlign = 'left';
    txt(ctx, num, x0 + 16, 670, PAL.armor, 3);
  }
  for (let i = 0; i < UPGRADE_DEFS.length; i += 1) {
    const d = UPGRADE_DEFS[i];
    const lv = state.ups[d.id];
    const bx = 864 + i * 56, by = 658;
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 52, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, 52, 2);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, by, 52, 52);
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, d.icon, bx + 26, by + 27, lv > 0 ? '#7fe0c3' : '#9fc4bd');
    ctx.font = 'bold 11px sans-serif';
    txt(ctx, lv > 0 ? SABBR[d.id] + lv : SABBR[d.id], bx + 26, by + 47, lv > 0 ? PAL.text : PAL.dim, 1);
  }
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, p.dashCd <= 0 ? 'DASH READY' : `DASH ${p.dashCd.toFixed(1)}s`, 1240, 627, PAL.text, 3);
  if (state.bannerT > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, state.bannerT);
    ctx.font = 'bold 30px sans-serif';
    const bw = ctx.measureText(state.banner).width + 56;
    ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
    txt(ctx, state.banner, VIEW_W / 2, 175, PAL.gold);
    ctx.globalAlpha = 1;
  }
  const hint = state.phase === 'play' && state.hints && state.hints.cur;
  if (hint) {
    const remain = state.hints.t;
    const alpha = Math.min(1, remain / 0.5) * Math.min(1, (hint.show - remain) / 0.25);
    ctx.font = 'bold 19px sans-serif';
    const tw = ctx.measureText(hint.text).width;
    const w = tw + 44 + 30;
    const y = VIEW_H - 132;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - w / 2, y - 24, w, 44);
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - w / 2, y - 24, w, 44);
    ctx.textAlign = 'center';
    txt(ctx, hint.icon, VIEW_W / 2 - w / 2 + 24, y + 5, PAL.gold);
    txt(ctx, hint.text, VIEW_W / 2 + 15, y + 5, PAL.text);
    ctx.globalAlpha = 1;
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6,42,51,0.7)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px sans-serif';
  txt(ctx, 'PAUSED', VIEW_W / 2, 330, PAL.text, 3);
  ctx.font = '20px sans-serif';
  txt(ctx, 'P / Esc — resume      M — mute      H — help      R — restart', VIEW_W / 2, 380, PAL.dim);
}
