import { SHOP, WEAPON_ORDER, modOf } from './config.js';
import { WEAPONS, weaponLevelDef } from './weapons.js';
import { UPGRADE_DEFS, applyUpgrade } from './upgrades.js';
import { checkFeats, featBanner } from './meta.js';

export const REROLL_COST = 10;
export const HAND_SIZE = 5;
export const REPAIR_PRICE = 25;
export const REPAIR_HEAL = 40;

function shopEntry(wid) { return SHOP.find((s) => s.id === wid); }

// Upgrade price from current level lv (to lv+1): defined prices up to Lv5,
// then the Lv5 price scaled ×1.3 per level beyond, rounded to the nearest 5.
function upPrice(entry, lv) {
  const ups = entry.up;
  if (lv <= ups.length) return ups[lv - 1];
  return Math.round((ups[ups.length - 1] * (1.3 ** (lv - ups.length - 1))) / 5) * 5;
}

export function cardStats(card, state) {
  if (card.kind === 'repair') return `+${REPAIR_HEAL} HP`;
  if (card.kind === 'skill') {
    const d = UPGRADE_DEFS.find((u) => u.id === card.track);
    return d ? d.stat : '';
  }
  const W = WEAPONS[card.wid];
  const mult = 1.14 * (1.05 ** state.ups.claws);
  const dmgAt = (lv) => Math.round(weaponLevelDef(card.wid, lv).dmg * mult);
  if (card.kind === 'weapon') {
    const L = W.levels[0];
    const sig = L.harpoons ? `×${L.harpoons}` : L.beams ? `${L.beams} BEAM`
      : L.pierce ? `PIERCE ${L.pierce}` : L.turn ? 'HOMING' : L.arc ? `${L.hits} HITS`
      : L.rate <= 0.5 ? 'RAPID' : 'AREA';
    return `${dmgAt(1)} DMG · ${sig}`;
  }
  let s = `DMG ${dmgAt(card.lv)}→${dmgAt(card.toLevel)}`;
  const a = weaponLevelDef(card.wid, card.lv), b = weaponLevelDef(card.wid, card.toLevel);
  for (const [k, label] of [['arrows', 'ARROW'], ['pellets', 'PELLET'], ['harpoons', 'HARPOON'],
    ['beams', 'BEAM'], ['hits', 'HIT'], ['pierce', 'PIERCE']]) {
    if ((b[k] || 0) > (a[k] || 0)) s += ` · +${b[k] - a[k]} ${label}`;
  }
  return s;
}

export function cardPool(state) {
  const pr = (p) => Math.round(p * modOf(state, 'price'));
  const pool = [];
  for (const wid of WEAPON_ORDER) {
    if (wid === 'claw') continue;
    if (state.weapons[wid] === 0) {
      pool.push({ id: `weapon:${wid}`, kind: 'weapon', wid, lv: 0, toLevel: 1,
        price: pr(shopEntry(wid).price), name: WEAPONS[wid].name,
        tag: 'NEW WEAPON', weight: 3, bought: false });
    }
  }
  for (const wid of WEAPON_ORDER) {
    const lv = state.weapons[wid];
    if (lv > 0) {
      pool.push({ id: `wup:${wid}:${lv + 1}`, kind: 'wup', wid, lv, toLevel: lv + 1,
        price: pr(upPrice(shopEntry(wid), lv)), name: `${WEAPONS[wid].name} Lv${lv + 1}`,
        tag: 'LEVEL UP', weight: 2, bought: false });
    }
  }
  return pool;
}

function repairCard(n, state) {
  return { id: `repair:${n}`, kind: 'repair', lv: 0, toLevel: 0, price: Math.round(REPAIR_PRICE * modOf(state, 'price')),
    name: 'SHELL REPAIR', tag: 'REPAIR',
    weight: 0, bought: false };
}

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
    hand.push(repairCard(n += 1, state));
  }
  return hand;
}

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
  featBanner(state, checkFeats(state));
  card.bought = true;
  return 'ok';
}

export function rerollHand(state) {
  if (state.coins < REROLL_COST) return false;
  state.coins -= REROLL_COST;
  state.stats.spent += REROLL_COST;
  state.stats.rerolls += 1;
  state.rerolls += 1;
  state.hand = drawHand(state);
  return true;
}

const SKILL_ORDER = ['claws', 'tempo', 'shell', 'reach', 'bubbles', 'legs', 'magnet'];
function cardScore(card) {
  if (card.kind === 'weapon') return 1000 - card.price;
  if (card.kind === 'wup') return (card.wid === 'claw' ? 900 : 800) - card.price;
  if (card.kind === 'skill') return 300 - SKILL_ORDER.indexOf(card.track) * 10;
  return 100;
}
export function autoBuy(state) {
  const owned = WEAPON_ORDER.filter((w) => state.weapons[w] > 0).length;
  for (let fish = 0; fish < 2; fish += 1) {
    if (owned >= WEAPON_ORDER.length) break;
    if (state.hand.some((c) => c.kind === 'weapon' && !c.bought)) break;
    if (state.coins < REROLL_COST + 50) break;
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
    if (bought > 0) break;
    if (round < 2 && state.coins >= REROLL_COST + 10 && state.hand.length > 0) {
      if (!rerollHand(state)) break;
    } else break;
  }
  return bought;
}
