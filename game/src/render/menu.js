import { ARMOR_PER_BOSS, PAL, VIEW_H, VIEW_W, bossForStage, clusterMod, clusterOf, envForStage } from '../config.js';
import { REROLL_COST, cardStats } from '../cards.js';
import { drawCoin, drawPips, drawPotion, drawSkillIcon, drawWeaponIcon, heart } from './icons.js';
import { stageMenuLayout } from './layout.js';
import {bevel, pxFrame, pxPanel, txt, px, vt} from './polish.js';

const KIND_COLOR = { skill: '#7fe0c3', wup: '#ffd166', weapon: '#c9a7ff', repair: '#ff8fb0', potion: '#ff5d73' };

function drawMenuCard(ctx, card, x, y, w, h, i, state, hovered) {
  const poor = !card.bought && state.coins < card.price;
  const kc = KIND_COLOR[card.kind] || PAL.dim;
  ctx.save();
  if (card.bought) ctx.globalAlpha = 0.6;
  else if (poor) ctx.globalAlpha = 0.85;
  const border = card.bought ? '#7fe0c3' : hovered ? PAL.gold : poor ? 'rgba(159,196,189,0.4)' : kc;
  pxPanel(ctx, x, y, w, h, '#0e5162', '#0a3d4a', border);
  ctx.fillStyle = kc; ctx.fillRect(x + 3, y + 3, w - 6, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 3, y + 9, w - 6, 2);
  if (hovered && !card.bought) {
    pxFrame(ctx, x - 4, y - 4, w + 8, h + 8, 'rgba(255,209,102,0.6)', 2);
  }
  ctx.textAlign = 'center';
  ctx.font = px(8);
  txt(ctx, card.tag, x + w / 2, y + 22, kc);
  ctx.font = px(9);
  txt(ctx, `[${i + 1}]`, x + w - 24, y + 22, PAL.dim);
  if (card.kind === 'weapon' || card.kind === 'wup') drawWeaponIcon(ctx, card.wid, x + w / 2, y + 62, 48, true);
  else if (card.kind === 'repair') heart(ctx, x + w / 2, y + 62, 20, '#ff8fb0');
  else if (card.kind === 'potion') drawPotion(ctx, x + w / 2, y + 62, 48);
  else drawSkillIcon(ctx, card.track, x + w / 2, y + 62, 48, true);
  ctx.font = px(11);
  if (ctx.measureText(card.name).width > w - 20) ctx.font = px(9);
  txt(ctx, card.name, x + w / 2, y + 108, PAL.text);
  const st = cardStats(card, state);
  ctx.font = px(8);
  if (ctx.measureText(st).width > w - 16) ctx.font = px(8);
  txt(ctx, st, x + w / 2, y + 134, PAL.foam);
  if (card.kind !== 'repair' && card.kind !== 'potion') drawPips(ctx, x + w / 2, y + 158, card.lv, !card.bought);
  if (card.bought) {
    ctx.font = px(11);
    txt(ctx, '✓ BOUGHT', x + w / 2, y + 198, '#7fe0c3');
  } else {
    ctx.font = px(14);
    const pt = `${card.price}`;
    const pw = ctx.measureText(pt).width;
    drawCoin(ctx, x + w / 2 - pw / 2 - 14, y + 190, 10);
    txt(ctx, pt, x + w / 2 + 8, y + 198, poor ? '#ff8fa0' : PAL.gold);
  }
  ctx.restore();
}

export function drawStageMenu(ctx, state, hover) {
  const L = stageMenuLayout(state);
  ctx.fillStyle = '#072a35'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.font = px(22);
  txt(ctx, `★ STAGE ${state.stage} CLEAR — ${envForStage(state.stage, state.envs).name} ★`, VIEW_W / 2, 70, PAL.gold, 3);
  const mod = clusterMod(state, state.stage);
  const c0 = clusterOf(state.stage) * 5 + 1, c1 = c0 + 4;
  ctx.font = px(9);
  txt(ctx, `EFFECT (STAGES ${c0}–${c1}): ${mod.n} — ${mod.d}`, VIEW_W / 2, 100, PAL.xp);
  ctx.font = px(17);
  const ct = `${state.coins} COINS`;
  const cw = ctx.measureText(ct).width;
  drawCoin(ctx, VIEW_W / 2 - cw / 2 - 18, 126, 12);
  txt(ctx, ct, VIEW_W / 2 + 10, 134, PAL.gold);
  if (bossForStage(state.stage)) {
    ctx.font = px(12);
    txt(ctx, `+${ARMOR_PER_BOSS} ARMOR`, VIEW_W / 2, 180, PAL.armor, 3);
  }
  const hand = state.hand || [];
  if (hand.length === 0) {
    ctx.font = px(14);
    txt(ctx, 'BUILD COMPLETE — NOTHING LEFT TO BUY', VIEW_W / 2, 360, PAL.foam);
  }
  hand.forEach((c, i) => {
    const b = L.cards[i];
    const hovered = hover && hover.x >= b.x && hover.x <= b.x + b.w && hover.y >= b.y && hover.y <= b.y + b.h;
    drawMenuCard(ctx, c, b.x, b.y, b.w, b.h, i, state, hovered);
  });
  const r = L.reroll;
  const canReroll = state.coins >= REROLL_COST;
  const rHover = hover && hover.x >= r.x && hover.x <= r.x + r.w && hover.y >= r.y && hover.y <= r.y + r.h;
  ctx.globalAlpha = canReroll ? 1 : 0.45;
  bevel(ctx, r.x, r.y, r.w, r.h, 8, '#116072', '#0b4256',
    canReroll ? (rHover ? PAL.gold : PAL.foam) : 'rgba(159,196,189,0.5)', 2);
  ctx.font = px(11);
  const rt = `REROLL — ${REROLL_COST}`, rs = '  [R]';
  const totW = ctx.measureText(rt).width + 24 + ctx.measureText(rs).width;
  const tx0 = r.x + r.w / 2 - totW / 2;
  ctx.textAlign = 'left';
  txt(ctx, rt, tx0, r.y + 33, canReroll ? PAL.text : PAL.dim);
  drawCoin(ctx, tx0 + ctx.measureText(rt).width + 12, r.y + 26, 9);
  txt(ctx, rs, tx0 + ctx.measureText(rt).width + 24, r.y + 33, canReroll ? PAL.text : PAL.dim);
  ctx.textAlign = 'center';
  ctx.globalAlpha = 1;
  const n = L.next;
  const nHover = hover && hover.x >= n.x && hover.x <= n.x + n.w && hover.y >= n.y && hover.y <= n.y + n.h;
  bevel(ctx, n.x, n.y, n.w, n.h, 8, nHover ? '#ffe08a' : '#ffd97a', '#f0b23e', PAL.gold, 2);
  ctx.font = px(12);
  txt(ctx, `NEXT STAGE ${state.stage + 1} →  [Enter]`, n.x + n.w / 2, n.y + 33, '#fff');
  if (state.menuMsgT > 0 && state.menuMsg) {
    ctx.font = px(10);
    txt(ctx, state.menuMsg, VIEW_W / 2, 570, '#ff8fa0');
  }
}
