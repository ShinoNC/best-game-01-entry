// The HUD: two fixed bars framing the play area, boss bar, banner, hint pill, minimap, INCOMING panel.
import { CREATURE_NAMES, DIFFICULTIES, PAL, POOL, STAGES, STAGE_COUNT, VIEW_H, VIEW_W, WEAPON_MAX, WEAPON_ORDER, bossForStage, nextTypes } from '../config.js';
import { UPGRADE_DEFS } from '../upgrades.js';
import { comboMult } from '../world.js';
import { drawCoin, drawWeaponIcon } from './icons.js';

// Minimap: the whole pool in one glance — crab white, creatures coral, elite gold, boss orange. Top-right corner.
function drawMinimap(ctx, state, t) {
  const mx = 1225, my = 36;
  ctx.fillStyle = 'rgba(6,42,51,0.78)';
  ctx.fillRect(mx - 40, my - 24, 80, 48);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(mx - 40, my - 24, 80, 48);
  ctx.fillStyle = 'rgba(29,138,166,0.9)';
  ctx.fillRect(mx - 35, my - 19, 70, 38);
  const dot = (wx, wy) => [mx + ((wx - POOL.cx) / POOL.rx) * 35, my + ((wy - POOL.cy) / POOL.ry) * 19];
  for (const e of state.enemies) {
    const [dx, dy] = dot(e.x, e.y);
    if (e.boss) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.strokeStyle = `rgba(255,122,60,${0.5 + 0.5 * pulse})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(dx, dy, 4 + pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ff7a3c';
      ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();
    } else if (e.elite) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#ff5d73';
      ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  const [cx, cy] = dot(state.player.x, state.player.y);
  ctx.fillStyle = '#062a33';
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
}

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
  // Top bar: STAGE (left) + SCORE / COINS / COMBO (right). Nothing else —
  // the goal lives on the title and in HOW TO PLAY, the HP bar lives below.
  const remaining = (STAGES[state.stage - 1].budget - state.stageSpawned) + state.enemies.length;
  const diffLabel = (DIFFICULTIES[state.difficulty || 'normal'] || DIFFICULTIES.normal).label;
  ctx.fillStyle = PAL.text; ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`STAGE ${state.stage} / ${STAGE_COUNT} · ${diffLabel}`, 28, 44);
  ctx.textAlign = 'right';
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 1170, 38);
  ctx.font = 'bold 15px sans-serif';
  const coinTxt = `${state.coins} COINS · COMBO ×${comboMult(state)} · BEST ${state.best}`;
  ctx.fillText(coinTxt, 1170, 60);
  drawCoin(ctx, 1170 - ctx.measureText(coinTxt).width - 13, 55, 8);
  drawMinimap(ctx, state, t);
  const nx = state.stage + 1;
  const nextBoss = nx <= STAGE_COUNT ? bossForStage(nx) : null;
  const nextLine = nextBoss ? `NEXT: ⚠ ${nextBoss.name}`
    : nx > STAGE_COUNT ? 'NEXT: FINAL STAGE — HOLD ON'
    : `NEXT: ${nextTypes(nx).map((k) => CREATURE_NAMES[k]).join(' + ')}`;
  ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(1000, 78, 252, 38);
  ctx.textAlign = 'right';
  ctx.fillStyle = PAL.text; ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`STAGE ${state.stage} — ${remaining} LEFT`, 1240, 93);
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 12px sans-serif';
  ctx.fillText(nextLine, 1240, 110);
  if (STAGES[state.stage - 1].boss && !state.bossSpawned && !state.boss) {
    const boss = bossForStage(state.stage);
    const warn = `⚠ ${boss ? boss.name : 'THE HERON'} IS COMING ⚠`;
    ctx.font = 'bold 17px sans-serif';
    const ww = ctx.measureText(warn).width + 40;
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - ww / 2, 78, ww, 32);
    ctx.fillStyle = `rgba(255,93,115,${0.6 + 0.4 * Math.sin(t * 6)})`;
    ctx.fillText(warn, VIEW_W / 2, 100);
  }
  if (state.boss) {
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - 190, 78, 380, 34);
    ctx.fillStyle = '#e8e4d8'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(state.boss.name, VIEW_W / 2, 94);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(VIEW_W / 2 - 180, 100, 360, 6);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(VIEW_W / 2 - 180, 100, 360 * (state.boss.hp / state.boss.maxHp), 6);
  }
  // Bottom bar: weapons (left) | HP (centre) | skills (right). 7 + 7 slots,
  // all the same 44×44 size with level pips — the HP bar separates them.
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
  ctx.fillStyle = PAL.hp; ctx.fillText('♥', hx, 668);
  ctx.fillStyle = PAL.text; ctx.fillText(hpTxt, hx + ctx.measureText('♥ ').width, 668);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(490, 677, 300, 14);
  ctx.fillStyle = PAL.hp; ctx.fillRect(490, 677, 300 * (p.hp / p.maxHp), 14);
  ctx.textAlign = 'center'; ctx.fillStyle = PAL.gold; ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`SHELL ${'●'.repeat(p.shellTier + 1)}${'○'.repeat(3 - p.shellTier)}`, 640, 706);
  for (let i = 0; i < UPGRADE_DEFS.length; i += 1) {
    const d = UPGRADE_DEFS[i];
    const lv = state.ups[d.id];
    const bx = 896 + i * 52, by = 662; // 7 chips: 896–1252, mirroring the weapons (28–384)
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 44, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, 44, 2);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, by, 44, 44);
    ctx.fillStyle = lv > 0 ? '#7fe0c3' : '#9fc4bd'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.icon, bx + 22, by + 24);
    for (let j = 0; j < d.max; j += 1) {
      ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(bx + 10 + j * 6, by + 37, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(1092, 606, 160, 30);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(p.dashCd <= 0 ? 'DASH READY' : `DASH ${p.dashCd.toFixed(1)}s`, 1240, 627);
  if (state.bannerT > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, state.bannerT);
    ctx.font = 'bold 30px sans-serif';
    const bw = ctx.measureText(state.banner).width + 56;
    ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
    ctx.fillStyle = PAL.gold;
    ctx.fillText(state.banner, VIEW_W / 2, 175);
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
    ctx.fillStyle = PAL.gold; ctx.textAlign = 'center';
    ctx.fillText(hint.icon, VIEW_W / 2 - w / 2 + 24, y + 5);
    ctx.fillStyle = PAL.text;
    ctx.fillText(hint.text, VIEW_W / 2 + 15, y + 5);
    ctx.globalAlpha = 1;
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6,42,51,0.7)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.text; ctx.font = 'bold 56px sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 330);
  ctx.fillStyle = PAL.dim; ctx.font = '20px sans-serif';
  ctx.fillText('P / Esc — resume      M — mute      H — help      R — restart', VIEW_W / 2, 380);
}
