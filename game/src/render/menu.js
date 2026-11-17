// The stage-clear menu: the ONLY menu, shown only between stages.
import { CREATURE_NAMES, ENEMIES, PAL, VIEW_H, VIEW_W, WEAPON_MAX, WEAPON_ORDER, bossForStage, envForStage, nextTypes } from '../config.js';
import { UPGRADE_DEFS } from '../upgrades.js';
import { REROLL_COST } from '../cards.js';
import { drawCoin, drawPips, drawWeaponIcon } from './icons.js';
import { drawEnemy } from './creatures.js';
import { stageMenuLayout } from './layout.js';

// Card colour coding: SKILL mint, LEVEL-UP gold, NEW WEAPON purple, REPAIR pink.
const KIND_COLOR = { skill: '#7fe0c3', wup: '#ffd166', weapon: '#c9a7ff', repair: '#ff8fb0' };

// One menu card: tag, picture, name, level pips, price — no description line,
// the names are self-explanatory. States differ by more than colour:
// unaffordable = RED price + "NEED N MORE"; bought = green border + "✓ BOUGHT"
// stamp, keeps its place; hovered = thick gold frame.
function drawMenuCard(ctx, card, x, y, w, h, i, state, hovered) {
  const poor = !card.bought && state.coins < card.price;
  const need = card.price - state.coins;
  const kc = KIND_COLOR[card.kind] || PAL.dim;
  ctx.save();
  if (card.bought) ctx.globalAlpha = 0.6;
  else if (poor) ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#0e5566'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = kc; ctx.fillRect(x, y, w, 6); // kind strip across the top
  ctx.strokeStyle = card.bought ? '#7fe0c3' : hovered ? PAL.gold : poor ? 'rgba(159,196,189,0.4)' : kc;
  ctx.lineWidth = hovered && !card.bought ? 4 : 2;
  ctx.strokeRect(x, y, w, h);
  if (hovered && !card.bought) { // a second frame: the focus ring reads at a glance
    ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }
  ctx.textAlign = 'center';
  // Tag (top) + key badge (top-right): both own their own corner, they never meet.
  ctx.fillStyle = kc;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(card.tag, x + w / 2, y + 22);
  ctx.fillStyle = PAL.dim; ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`[${i + 1}]`, x + w - 24, y + 22);
  // Picture first: a weapon card shows its drawn icon, a skill card its glyph.
  if (card.kind === 'weapon' || card.kind === 'wup') drawWeaponIcon(ctx, card.wid, x + w / 2, y + 62, 48, true);
  else {
    ctx.fillStyle = card.kind === 'repair' ? '#ff8fb0' : PAL.xp;
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(card.icon, x + w / 2, y + 78);
  }
  // The name shrinks one step if it would overflow the card.
  ctx.fillStyle = PAL.text;
  ctx.font = 'bold 18px sans-serif';
  if (ctx.measureText(card.name).width > w - 20) ctx.font = 'bold 15px sans-serif';
  ctx.fillText(card.name, x + w / 2, y + 108);
  // Level pips: filled = owned, gold = the level this card adds.
  if (card.kind !== 'repair') drawPips(ctx, x + w / 2, y + 148, card.lv, !card.bought);
  // Price — a drawn coin + the number — or the bought stamp, or the shortfall in words (never colour alone).
  if (card.bought) {
    ctx.fillStyle = '#7fe0c3'; ctx.font = 'bold 18px sans-serif';
    ctx.fillText('✓ BOUGHT', x + w / 2, y + 198);
  } else {
    ctx.fillStyle = poor ? '#ff8fa0' : PAL.gold; ctx.font = 'bold 22px sans-serif';
    const pt = `${card.price}`;
    const pw = ctx.measureText(pt).width;
    drawCoin(ctx, x + w / 2 - pw / 2 - 14, y + 190, 10);
    ctx.fillText(pt, x + w / 2 + 8, y + 198);
    if (poor) {
      ctx.fillStyle = '#ff8fa0'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`NEED ${need} MORE`, x + w / 2, y + 222);
    }
  }
  ctx.restore();
}

export function drawStageMenu(ctx, state, hover) {
  const L = stageMenuLayout(state);
  ctx.fillStyle = 'rgba(6,42,51,0.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 36px sans-serif';
  ctx.fillText(`★ STAGE ${state.stage} CLEAR — ${envForStage(state.stage).name} ★`, VIEW_W / 2, 68);
  const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
  ctx.fillStyle = PAL.dim; ctx.font = '16px sans-serif';
  ctx.fillText(`${state.kills} slain  •  ${mins}:${String(secs).padStart(2, '0')}  •  +${state.clearBonus} CLEAR BONUS`, VIEW_W / 2, 96);
  ctx.fillStyle = PAL.gold; ctx.font = 'bold 28px sans-serif';
  const ct = `${state.coins} COINS`;
  const cw = ctx.measureText(ct).width;
  drawCoin(ctx, VIEW_W / 2 - cw / 2 - 18, 116, 12);
  ctx.fillText(ct, VIEW_W / 2 + 10, 124);
  const hand = state.hand || [];
  if (hand.length === 0) {
    // Empty state: everything is owned and maxed and the shell is whole.
    ctx.fillStyle = PAL.foam; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('BUILD COMPLETE — NOTHING LEFT TO BUY', VIEW_W / 2, 260);
  }
  hand.forEach((c, i) => {
    const b = L.cards[i];
    const hovered = hover && hover.x >= b.x && hover.x <= b.x + b.w && hover.y >= b.y && hover.y <= b.y + b.h;
    drawMenuCard(ctx, c, b.x, b.y, b.w, b.h, i, state, hovered);
  });
  // REROLL (secondary, outline) and NEXT (the one primary CTA, gold-filled).
  const r = L.reroll;
  const canReroll = state.coins >= REROLL_COST;
  const rHover = hover && hover.x >= r.x && hover.x <= r.x + r.w && hover.y >= r.y && hover.y <= r.y + r.h;
  ctx.fillStyle = canReroll ? '#0e5566' : 'rgba(6,42,51,0.85)';
  ctx.globalAlpha = canReroll ? 1 : 0.45;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = canReroll ? (rHover ? PAL.gold : PAL.foam) : 'rgba(159,196,189,0.5)';
  ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = canReroll ? PAL.text : PAL.dim;
  ctx.font = 'bold 18px sans-serif';
  const rt = `REROLL — ${REROLL_COST}`, rs = '  [R]';
  const totW = ctx.measureText(rt).width + 24 + ctx.measureText(rs).width;
  const tx0 = r.x + r.w / 2 - totW / 2;
  ctx.textAlign = 'left';
  ctx.fillText(rt, tx0, r.y + 33);
  drawCoin(ctx, tx0 + ctx.measureText(rt).width + 12, r.y + 26, 9);
  ctx.fillText(rs, tx0 + ctx.measureText(rt).width + 24, r.y + 33);
  ctx.textAlign = 'center';
  ctx.globalAlpha = 1;
  const n = L.next;
  const nHover = hover && hover.x >= n.x && hover.x <= n.x + n.w && hover.y >= n.y && hover.y <= n.y + n.h;
  ctx.fillStyle = nHover ? '#ffd97a' : PAL.gold;
  ctx.fillRect(n.x, n.y, n.w, n.h);
  ctx.fillStyle = '#062a33'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`NEXT STAGE ${state.stage + 1} →  [Enter]`, n.x + n.w / 2, n.y + 33);
  // One line under the buttons: an error message shows while it lasts — the
  // [1]–[5] numbers, [R] and [Enter] on the buttons already teach the keys.
  if (state.menuMsgT > 0 && state.menuMsg) {
    ctx.fillStyle = '#ff8fa0'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(state.menuMsg, VIEW_W / 2, 480);
  }
  // Build recap: the arsenal and the skills in one centred row.
  ctx.fillStyle = PAL.dim; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('YOUR BUILD', VIEW_W / 2, 516);
  let bx = 324;
  for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
    const id = WEAPON_ORDER[i];
    const lv = state.weapons[id];
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, 528, 40, 44);
    ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1; ctx.strokeRect(bx, 528, 40, 44);
    drawWeaponIcon(ctx, id, bx + 20, 545, 28, lv > 0);
    for (let j = 0; j < WEAPON_MAX; j += 1) {
      ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(bx + 8 + j * 6, 566, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    bx += 48;
  }
  ctx.strokeStyle = 'rgba(159,196,189,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 4, 532); ctx.lineTo(bx + 4, 568); ctx.stroke();
  bx += 24;
  for (const d of UPGRADE_DEFS) {
    const lv = state.ups[d.id];
    ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.9)' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(bx, 528, 34, 44);
    ctx.fillStyle = lv > 0 ? '#062a33' : '#9fc4bd'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(d.icon, bx + 17, 546);
    ctx.fillStyle = lv > 0 ? '#062a33' : PAL.dim; ctx.font = 'bold 10px sans-serif';
    ctx.fillText(lv > 0 ? `Lv${lv}` : '—', bx + 17, 561);
    bx += 42;
  }
  // What comes next: a boss is never a surprise; a normal stage names its two most common creatures, icons flanking.
  const nextBoss = bossForStage(state.stage + 1);
  if (nextBoss) {
    ctx.fillStyle = '#ff5d73'; ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`⚠ BOSS NEXT — ${nextBoss.name} ⚠`, VIEW_W / 2, 608);
  } else {
    const types = nextTypes(state.stage + 1);
    const label = `NEXT: STAGE ${state.stage + 1} — ${types.map((k) => CREATURE_NAMES[k]).join(' + ')} SWARM`;
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 17px sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, VIEW_W / 2, 608);
    types.forEach((k, i) => {
      const def = ENEMIES[k];
      const ex = i === 0 ? VIEW_W / 2 - tw / 2 - 30 : VIEW_W / 2 + tw / 2 + 30;
      drawEnemy(ctx, { type: k, x: ex, y: 602, r: 13, color: def.color, dark: def.dark, hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI / 2);
    });
  }
}
