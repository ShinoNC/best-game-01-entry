// The HUD: two bars framing the play area, boss bar, banner, hint pill.
// No minimap: the whole pool is on one screen, and spawn ripples mark entries.
import { CREATURE_NAMES, DIFFICULTIES, PAL, STAGES, STAGE_COUNT, VIEW_H, VIEW_W, WEAPON_MAX, WEAPON_ORDER, bossForStage, nextTypes } from '../config.js';
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
  // A light edge lifts each bar off the water.
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(0, 70, VIEW_W, 2);
  ctx.fillRect(0, VIEW_H - 72, VIEW_W, 2);
  // Top bar: STAGE + left/next (left, two lines) + SCORE / COINS / COMBO (right).
  const remaining = (STAGES[state.stage - 1].budget - state.stageSpawned) + state.enemies.length;
  const diffLabel = (DIFFICULTIES[state.difficulty || 'normal'] || DIFFICULTIES.normal).label;
  const nx = state.stage + 1;
  const nextBoss = nx <= STAGE_COUNT ? bossForStage(nx) : null;
  const nextBit = nextBoss ? `⚠ ${nextBoss.name}`
    : nx > STAGE_COUNT ? 'FINAL STAGE'
    : nextTypes(nx).map((k) => CREATURE_NAMES[k]).join(' + ');
  ctx.font = 'bold 22px sans-serif';
  txt(ctx, `STAGE ${state.stage} / ${STAGE_COUNT} · ${diffLabel}`, 28, 34, PAL.text);
  ctx.font = 'bold 13px sans-serif';
  txt(ctx, `${remaining} LEFT · NEXT: ${nextBit}`, 28, 58, PAL.dim);
  ctx.textAlign = 'right';
  ctx.font = 'bold 30px sans-serif';
  txt(ctx, `SCORE ${state.score}`, 1252, 38, PAL.gold);
  ctx.font = 'bold 15px sans-serif';
  const coinTxt = `${state.coins} COINS · COMBO ×${comboMult(state)} · BEST ${state.best}`;
  txt(ctx, coinTxt, 1252, 60, PAL.gold);
  drawCoin(ctx, 1252 - ctx.measureText(coinTxt).width - 13, 55, 8);
  if (STAGES[state.stage - 1].boss && !state.bossSpawned && !state.boss) {
    const boss = bossForStage(state.stage);
    const warn = `⚠ ${boss ? boss.name : 'THE HERON'} IS COMING ⚠`;
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
  // Bottom bar: weapons (left) | HP (centre) | skills (right). 7 + 7 slots,
  // all 44×44 with level pips.
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const id = WEAPON_ORDER[i];
    const lv = state.weapons[id];
    const bx = 28 + i * 52, by = 662;
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 44, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, 44, 2);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, by, 44, 44);
    drawWeaponIcon(ctx, id, bx + 22, by + 18, 30, lv > 0);
    for (let j = 0; j < WEAPON_MAX; j += 1) {
      ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(bx + 10 + j * 6, by + 37, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  // HP in the middle: heart + numbers, the bar, the shell tier below.
  ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif';
  const hpTxt = `${Math.ceil(p.hp)} / ${p.maxHp} HP`;
  const hx = 640 - ctx.measureText(`♥ ${hpTxt}`).width / 2;
  txt(ctx, '♥', hx, 668, PAL.hp);
  txt(ctx, hpTxt, hx + ctx.measureText('♥ ').width, 668, PAL.text);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(490, 677, 300, 14);
  ctx.fillStyle = PAL.hp; ctx.fillRect(490, 677, 300 * (p.hp / p.maxHp), 14);
  // The shell line: explicit text, not dots — Lv<N> · +<X> HP. Hidden at
  // Lv0 (nothing bought, nothing to show). The crab's shell COLOUR still
  // follows shellTier (creatures.js) — that is separate.
  if (state.ups.shell > 0) {
    ctx.textAlign = 'center'; ctx.font = 'bold 12px sans-serif';
    txt(ctx, `SHELL Lv${state.ups.shell} · +${state.ups.shell * 15} HP`, 640, 706, PAL.gold);
  }
  for (let i = 0; i < UPGRADE_DEFS.length; i += 1) {
    const d = UPGRADE_DEFS[i];
    const lv = state.ups[d.id];
    const bx = 896 + i * 52, by = 662; // 7 chips: 896–1252, mirroring the weapons (28–384)
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 44, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, 44, 2);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, by, 44, 44);
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, d.icon, bx + 22, by + 24, lv > 0 ? '#7fe0c3' : '#9fc4bd');
    for (let j = 0; j < d.max; j += 1) {
      ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(bx + 10 + j * 6, by + 37, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(1092, 606, 160, 30);
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, p.dashCd <= 0 ? 'DASH READY' : `DASH ${p.dashCd.toFixed(1)}s`, 1240, 627, PAL.text);
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
    const w = tw + 44 + 30; // text + padding + icon slot
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
