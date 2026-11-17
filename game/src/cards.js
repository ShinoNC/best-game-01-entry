// The stage-clear menu's cards (criterion 2): ONE menu, only at stage-clear,
// 5 cards with coin prices. No level-up screen, no separate shop: the cards ARE the shop.
// A card: { id, kind, wid|track, lv, toLevel, price, name, icon, desc, tag, bought }.
import { SHOP, WEAPON_MAX, WEAPON_ORDER } from './config.js';
import { WEAPONS } from './weapons.js';
import { SKILL_PRICES, UPGRADE_DEFS, applyUpgrade } from './upgrades.js';

export const REROLL_COST = 10; // flat, per reroll — cheap enough to use, dear enough to matter
export const HAND_SIZE = 5;
export const REPAIR_PRICE = 25;
export const REPAIR_HEAL = 40;

function shopEntry(wid) { return SHOP.find((s) => s.id === wid); }

// Every card drawable right now: unowned weapons (weight 3), weapon level-ups
// (weight 2), skill upgrades (weight 1). One card per option — 5 distinct draws.
export function cardPool(state) {
  const pool = [];
  for (const wid of WEAPON_ORDER) {
    if (wid === 'claw') continue; // the claw is owned from the start
    if (state.weapons[wid] === 0) {
      pool.push({ id: `weapon:${wid}`, kind: 'weapon', wid, lv: 0, toLevel: 1,
        price: shopEntry(wid).price, name: WEAPONS[wid].name, icon: WEAPONS[wid].icon,
        desc: WEAPONS[wid].desc, tag: 'NEW WEAPON', weight: 3, bought: false });
    }
  }
  for (const wid of WEAPON_ORDER) {
    const lv = state.weapons[wid];
    if (lv > 0 && lv < WEAPON_MAX) {
      pool.push({ id: `wup:${wid}:${lv + 1}`, kind: 'wup', wid, lv, toLevel: lv + 1,
        price: shopEntry(wid).up[lv - 1], name: `${WEAPONS[wid].name} Lv${lv + 1}`,
        icon: WEAPONS[wid].icon, desc: WEAPONS[wid].desc, tag: 'LEVEL UP', weight: 2, bought: false });
    }
  }
  for (const d of UPGRADE_DEFS) {
    const lv = state.ups[d.id];
    if (lv < d.max) {
      pool.push({ id: `skill:${d.id}:${lv + 1}`, kind: 'skill', track: d.id, lv, toLevel: lv + 1,
        price: SKILL_PRICES[lv], name: d.name, icon: d.icon, desc: d.desc,
        tag: 'SKILL', weight: 1, bought: false });
    }
  }
  return pool;
}

function repairCard(n) {
  return { id: `repair:${n}`, kind: 'repair', lv: 0, toLevel: 0, price: REPAIR_PRICE,
    name: 'SHELL REPAIR', icon: '♥', desc: `HEAL +${REPAIR_HEAL} HP`, tag: 'REPAIR',
    weight: 0, bought: false };
}

// Draw a fresh 5-card hand: weighted sample without replacement. The FIRST
// menu (after stage 1) always includes a new weapon. Repair cards pad a
// nearly-empty pool (only while damaged — never a useless card).
export function drawHand(state) {
  const pool = cardPool(state);
  const weighted = [];
  for (const c of pool) for (let i = 0; i < c.weight; i += 1) weighted.push(c);
  const hand = [];
  while (hand.length < HAND_SIZE && weighted.length > 0) {
    const c = state.rng.pick(weighted);
    if (!hand.includes(c)) hand.push(c);
    for (let i = weighted.length - 1; i >= 0; i -= 1) if (weighted[i] === c) weighted.splice(i, 1);
  }
  if (state.stage === 1 && !hand.some((c) => c.kind === 'weapon')) {
    const fresh = pool.filter((c) => c.kind === 'weapon' && !hand.includes(c));
    if (fresh.length > 0 && hand.length > 0) hand[hand.length - 1] = state.rng.pick(fresh);
  }
  let n = 0;
  while (hand.length < HAND_SIZE && state.player.hp < state.player.maxHp) {
    hand.push(repairCard(n += 1));
  }
  return hand;
}

// Buy one card. Returns 'ok', 'poor' (not enough coins) or 'bought' (already
// bought this visit). A bought card stays in the hand, marked, so the row
// never reflows mid-visit — the player sees exactly what they bought.
export function buyCard(state, card) {
  if (!card || card.bought) return 'bought';
  if (state.coins < card.price) return 'poor';
  state.coins -= card.price;
  state.stats.spent += card.price;
  if (card.kind === 'weapon' || card.kind === 'wup') {
    state.weapons[card.wid] = card.toLevel;
  } else if (card.kind === 'skill') {
    applyUpgrade(state, card.track);
  } else if (card.kind === 'repair') {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + REPAIR_HEAL);
  }
  card.bought = true;
  return 'ok';
}

// Reroll the hand for a flat 10 coins. Returns false when unaffordable.
// Bought cards are gone from the pool, so a reroll never re-offers one.
export function rerollHand(state) {
  if (state.coins < REROLL_COST) return false;
  state.coins -= REROLL_COST;
  state.stats.spent += REROLL_COST;
  state.stats.rerolls += 1;
  state.rerolls += 1;
  state.hand = drawHand(state);
  return true;
}

// The sim autopilot's shopper: new weapons first (cheapest first), then
// weapon level-ups (claw first), then skills in priority order, repair last.
// Buys while affordable; if the hand offered nothing buyable and coins allow,
// rerolls up to twice to fish for a wanted card. A reasonable player, not an
// optimal one — it stops after buying, it never fishes after a purchase.
const SKILL_ORDER = ['claws', 'tempo', 'shell', 'reach', 'bubbles', 'legs', 'ink', 'magnet'];
function cardScore(card) {
  if (card.kind === 'weapon') return 1000 - card.price;
  if (card.kind === 'wup') return (card.wid === 'claw' ? 900 : 800) - card.price;
  if (card.kind === 'skill') return 300 - SKILL_ORDER.indexOf(card.track) * 10;
  return 100;
}
export function autoBuy(state) {
  // A human fishes for the missing weapons: if the hand has no new weapon
  // and the arsenal is incomplete, reroll first (up to 2x) before buying
  // anything — a cheap skill is a worse use of the menu than a new gun.
  const owned = WEAPON_ORDER.filter((w) => state.weapons[w] > 0).length;
  for (let fish = 0; fish < 2; fish += 1) {
    if (owned >= WEAPON_ORDER.length) break;
    if (state.hand.some((c) => c.kind === 'weapon' && !c.bought)) break;
    if (state.coins < REROLL_COST + 50) break; // keep enough to buy the weapon
    if (!rerollHand(state)) break;
  }
  let bought = 0;
  for (let round = 0; round < 3; round += 1) {
    for (;;) {
      let best = null, bestScore = -1;
      for (const c of state.hand) {
        if (c.bought || state.coins < c.price) continue;
        const s = cardScore(c);
        if (s > bestScore) { bestScore = s; best = c; }
      }
      if (!best) break;
      if (buyCard(state, best) !== 'ok') break;
      bought += 1;
    }
    if (bought > 0) return bought;
    if (round < 2 && state.coins >= REROLL_COST + 10 && state.hand.length > 0) {
      if (!rerollHand(state)) return bought;
    } else return bought;
  }
  return bought;
}
