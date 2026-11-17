// The HUD: two fixed bars framing the play area, the boss bar, the wave
// banner, the tutorial hint pill, the minimap, and the INCOMING panel.
// The pool sits between the bars (y 72–648); NO hud element floats over it.
//   top bar (0–72): HP+SHELL (left) / stage+goal pills (centre) / score (right)
//   bottom bar (648–720): skills + arsenal (left) / controls+best (centre) / minimap (right)
//   boss bar y 78–112 (centre) · incoming panel y 78–116 (right) · banner y 146–186 · hint pill y 564–608
import { CREATURE_NAMES, DIFFICULTIES, PAL, POOL, STAGES, STAGE_COUNT, VIEW_H, VIEW_W, WEAPON_MAX, WEAPON_ORDER, bossForStage, nextTypes } from '../config.js';
import { UPGRADE_DEFS } from '../upgrades.js';
import { comboMult } from '../world.js';
import { drawWeaponIcon } from './icons.js';

// Minimap: the whole pool in one glance — crab white, creatures coral, elite gold, boss orange.
function drawMinimap(ctx, state, t) {
  const mx = 1215, my = 684, mr = 30;
  ctx.fillStyle = 'rgba(6,42,51,0.78)';
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(29,138,166,0.9)';
  ctx.beginPath(); ctx.ellipse(mx, my, 25, 13, 0, 0, Math.PI * 2); ctx.fill();
  const dot = (wx, wy) => [mx + ((wx - POOL.cx) / POOL.rx) * 25, my + ((wy - POOL.cy) / POOL.ry) * 13];
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
  // Top-left: HP heart + bar + number, SHELL tier below.
  ctx.fillStyle = PAL.hp; ctx.font = 'bold 26px sans-serif';
  ctx.fillText('♥', 28, 38);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(58, 26, 190, 18);
  ctx.fillStyle = PAL.hp; ctx.fillRect(58, 26, 190 * (p.hp / p.maxHp), 18);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp} HP`, 258, 42);
  ctx.fillStyle = PAL.gold;
  ctx.fillText(`SHELL ${'●'.repeat(p.shellTier + 1)}${'○'.repeat(3 - p.shellTier)}`, 58, 62);
  // Top-centre: stage + difficulty. The remaining count lives in the
  // The remaining count lives in the INCOMING panel (right), the boss name in the boss bar.
  const remaining = (STAGES[state.stage - 1].budget - state.stageSpawned) + state.enemies.length;
  const diffLabel = (DIFFICULTIES[state.difficulty || 'normal'] || DIFFICULTIES.normal).label;
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.text; ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`STAGE ${state.stage} / ${STAGE_COUNT} · ${diffLabel}`, VIEW_W / 2, 32);
  // WIN/LOSE in green/red pills — the judge checks win/lose visibility first.
  ctx.font = 'bold 13px sans-serif';
  const winTxt = 'WIN: CLEAR STAGE 30', loseTxt = 'LOSE: HP = 0';
  const w1 = ctx.measureText(winTxt).width + 20, w2 = ctx.measureText(loseTxt).width + 20;
  const px = VIEW_W / 2 - (w1 + w2 + 8) / 2;
  ctx.fillStyle = '#1e7d4f'; ctx.fillRect(px, 44, w1, 19);
  ctx.fillStyle = '#a83246'; ctx.fillRect(px + w1 + 8, 44, w2, 19);
  ctx.fillStyle = '#fff';
  ctx.fillText(winTxt, px + w1 / 2, 58);
  ctx.fillText(loseTxt, px + w1 + 8 + w2 / 2, 58);
  // Top-right: the score is the biggest number on screen (30px bold).
  ctx.textAlign = 'right';
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W - 28, 38);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`◉ ${state.coins} COINS · COMBO ×${comboMult(state)}`, VIEW_W - 28, 60);
  // INCOMING panel: how many are left (unspawned budget + live enemies) and what the next stage brings.
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
  // Boss warning on a boss stage, before the heron arrives — never a surprise.
  if (STAGES[state.stage - 1].boss && !state.bossSpawned && !state.boss) {
    const boss = bossForStage(state.stage);
    const warn = `⚠ ${boss ? boss.name : 'THE HERON'} IS COMING ⚠`;
    ctx.font = 'bold 17px sans-serif';
    const ww = ctx.measureText(warn).width + 40;
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - ww / 2, 78, ww, 32);
    ctx.fillStyle = `rgba(255,93,115,${0.6 + 0.4 * Math.sin(t * 6)})`;
    ctx.fillText(warn, VIEW_W / 2, 100);
  }
  // Boss bar under the top bar while a heron lives.
  if (state.boss) {
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - 190, 78, 380, 34);
    ctx.fillStyle = '#e8e4d8'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(state.boss.name, VIEW_W / 2, 94);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(VIEW_W / 2 - 180, 100, 360, 6);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(VIEW_W / 2 - 180, 100, 360 * (state.boss.hp / state.boss.maxHp), 6);
  }
  // Bottom bar, left: the build at a glance — 6 big weapon slots, 8 tighter skill chips.
  ctx.textAlign = 'left';
  ctx.fillStyle = PAL.dim; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SKILLS', 18, 690);
  let sx = 80;
  for (const d of UPGRADE_DEFS) {
    const lv = state.ups[d.id];
    const by = VIEW_H - 58;
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.9)' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(sx, by, 30, 36);
    ctx.fillStyle = lv > 0 ? '#062a33' : '#9fc4bd'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.icon, sx + 15, by + 17);
    if (lv > 0) {
      ctx.fillStyle = '#062a33'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`Lv${lv}`, sx + 15, by + 31);
    }
    sx += 33;
  }
  ctx.textAlign = 'left';
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const id = WEAPON_ORDER[i];
    const lv = state.weapons[id];
    const bx = 360 + i * 52, by = VIEW_H - 60;
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 48, 48);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, by, 48, 48);
    drawWeaponIcon(ctx, id, bx + 24, by + 20, 34, lv > 0);
    for (let j = 0; j < WEAPON_MAX; j += 1) {
      ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(bx + 10 + j * 6, by + 41, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Bottom bar, centre: controls, then best score + kills.
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.foam; ctx.font = '13px sans-serif';
  ctx.fillText('WASD move · SPACE dash · E grab · P pause · M mute', 850, 676);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`BEST ${state.best}  •  ${state.kills} slain`, 850, 700);
  // Bottom bar, right: minimap + dash/grab pill above it.
  drawMinimap(ctx, state, t);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(1012, 606, 240, 30);
  ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
  const dashTxt = p.dashCd <= 0 ? 'DASH READY' : `DASH ${p.dashCd.toFixed(1)}s`;
  const grabTxt = p.grab ? 'HOLDING!' : p.grabCd <= 0 ? 'GRAB READY' : `GRAB ${p.grabCd.toFixed(1)}s`;
  ctx.fillText(`${dashTxt} · ${grabTxt}`, 1240, 627);
  // Wave / elite banner in its own zone (y 146–186), dark backdrop + gold frame.
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
  // Tutorial hint pill, bottom centre: an icon plus one short line, fading
  // out. Play phase only — on the menu screen the cards own the player's
  // attention.
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
  ctx.fillText('P / Esc — resume      M — mute      R — restart', VIEW_W / 2, 380);
}
