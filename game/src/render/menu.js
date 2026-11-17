// The stage-clear menu: the ONLY menu, shown only between stages.
import { PAL, VIEW_H, VIEW_W, envForStage } from '../config.js';
import { REROLL_COST, cardStats } from '../cards.js';
import { drawCoin, drawPips, drawWeaponIcon } from './icons.js';
import { stageMenuLayout } from './layout.js';
import { bevel, rr, txt } from './polish.js';

// Card colour coding: SKILL mint, LEVEL-UP gold, NEW WEAPON purple, REPAIR pink.
const KIND_COLOR = { skill: '#7fe0c3', wup: '#ffd166', weapon: '#c9a7ff', repair: '#ff8fb0' };

// One menu card: tag, picture, name, stats, pips, price. Unaffordable =
// red price + dimmed; bought = green border + ✓.
function drawMenuCard(ctx, card, x, y, w, h, i, state, hovered) {
  const poor = !card.bought && state.coins < card.price;
  const kc = KIND_COLOR[card.kind] || PAL.dim;
  ctx.save();
  if (card.bought) ctx.globalAlpha = 0.6;
  else if (poor) ctx.globalAlpha = 0.85;
  // Lifted card: shadow, gradient, top highlight.
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  const cg = ctx.createLinearGradient(0, y, 0, y + h);
  cg.addColorStop(0, '#116072'); cg.addColorStop(1, '#0b4256');
  ctx.fillStyle = cg;
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x + 2, y + 1, w - 4, 2);
  ctx.fillStyle = kc; ctx.fillRect(x, y, w, 6); // kind strip across the top
  ctx.strokeStyle = card.bought ? '#7fe0c3' : hovered ? PAL.gold : poor ? 'rgba(159,196,189,0.4)' : kc;
  ctx.lineWidth = hovered && !card.bought ? 4 : 2;
  rr(ctx, x, y, w, h, 8); ctx.stroke();
  if (hovered && !card.bought) { // a second frame: the focus ring reads at a glance
    ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }
  ctx.textAlign = 'center';
  // Tag + key badge own separate corners.
  ctx.font = 'bold 12px sans-serif';
  txt(ctx, card.tag, x + w / 2, y + 22, kc);
  ctx.font = 'bold 14px sans-serif';
  txt(ctx, `[${i + 1}]`, x + w - 24, y + 22, PAL.dim);
  // Weapon icon or skill glyph.
  if (card.kind === 'weapon' || card.kind === 'wup') drawWeaponIcon(ctx, card.wid, x + w / 2, y + 62, 48, true);
  else {
    ctx.font = 'bold 40px sans-serif';
    txt(ctx, card.icon, x + w / 2, y + 78, card.kind === 'repair' ? '#ff8fb0' : PAL.xp);
  }
  // The name shrinks one step if it would overflow the card.
  ctx.font = 'bold 18px sans-serif';
  if (ctx.measureText(card.name).width > w - 20) ctx.font = 'bold 15px sans-serif';
  txt(ctx, card.name, x + w / 2, y + 108, PAL.text);
  // Stats line: what the card does. Shrinks if it would overflow.
  const st = cardStats(card, state);
  ctx.font = 'bold 13px sans-serif';
  if (ctx.measureText(st).width > w - 16) ctx.font = 'bold 12px sans-serif';
  txt(ctx, st, x + w / 2, y + 134, PAL.foam);
  // Level pips: filled = owned, gold = the level this card adds.
  if (card.kind !== 'repair') drawPips(ctx, x + w / 2, y + 158, card.lv, !card.bought);
  // Price (coin + number) or the bought stamp.
  if (card.bought) {
    ctx.font = 'bold 18px sans-serif';
    txt(ctx, '✓ BOUGHT', x + w / 2, y + 198, '#7fe0c3');
  } else {
    ctx.font = 'bold 22px sans-serif';
    const pt = `${card.price}`;
    const pw = ctx.measureText(pt).width;
    drawCoin(ctx, x + w / 2 - pw / 2 - 14, y + 190, 10);
    txt(ctx, pt, x + w / 2 + 8, y + 198, poor ? '#ff8fa0' : PAL.gold);
  }
  ctx.restore();
}

export function drawStageMenu(ctx, state, hover) {
  const L = stageMenuLayout(state);
  // The shop has its own opaque dark background.
  const bg = ctx.createRadialGradient(640, 360, 100, 640, 360, 750);
  bg.addColorStop(0, '#0a3542'); bg.addColorStop(1, '#041f28');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px sans-serif';
  txt(ctx, `★ STAGE ${state.stage} CLEAR — ${envForStage(state.stage).name} ★`, VIEW_W / 2, 130, PAL.gold, 3);
  ctx.font = 'bold 28px sans-serif';
  const ct = `${state.coins} COINS`;
  const cw = ctx.measureText(ct).width;
  drawCoin(ctx, VIEW_W / 2 - cw / 2 - 18, 178, 12);
  txt(ctx, ct, VIEW_W / 2 + 10, 186, PAL.gold);
  const hand = state.hand || [];
  if (hand.length === 0) {
    // Empty state: everything owned/maxed.
    ctx.font = 'bold 22px sans-serif';
    txt(ctx, 'BUILD COMPLETE — NOTHING LEFT TO BUY', VIEW_W / 2, 360, PAL.foam);
  }
  hand.forEach((c, i) => {
    const b = L.cards[i];
    const hovered = hover && hover.x >= b.x && hover.x <= b.x + b.w && hover.y >= b.y && hover.y <= b.y + b.h;
    drawMenuCard(ctx, c, b.x, b.y, b.w, b.h, i, state, hovered);
  });
  // REROLL (secondary) and NEXT (primary CTA).
  const r = L.reroll;
  const canReroll = state.coins >= REROLL_COST;
  const rHover = hover && hover.x >= r.x && hover.x <= r.x + r.w && hover.y >= r.y && hover.y <= r.y + r.h;
  ctx.globalAlpha = canReroll ? 1 : 0.45;
  bevel(ctx, r.x, r.y, r.w, r.h, 8, '#116072', '#0b4256',
    canReroll ? (rHover ? PAL.gold : PAL.foam) : 'rgba(159,196,189,0.5)', 2);
  ctx.font = 'bold 18px sans-serif';
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
  ctx.font = 'bold 20px sans-serif';
  txt(ctx, `NEXT STAGE ${state.stage + 1} →  [Enter]`, n.x + n.w / 2, n.y + 33, '#062a33');
  // Error message under the buttons, while it lasts.
  if (state.menuMsgT > 0 && state.menuMsg) {
    ctx.font = 'bold 16px sans-serif';
    txt(ctx, state.menuMsg, VIEW_W / 2, 600, '#ff8fa0');
  }
}
