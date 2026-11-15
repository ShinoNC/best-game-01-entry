// Weapons and the shop (criterion 2): three tools with three feels, bought with
// coins earned by killing creatures, and a shop with real prices and real purchases.
// The upgrade tracks (claws/tempo/reach) multiply the damage/rate/range of ALL
// weapons, so every upgrade stays meaningful whichever weapon is equipped.
import { SHOP, WEAPONS, WEAPON_ORDER } from './config.js';
import { UPGRADE_DEFS } from './upgrades.js';

// Effective stats of the equipped weapon: its level table, multiplied by the
// crab's upgrade tracks. One function, so the sim and the HUD always agree.
export function weaponStats(state) {
  const lv = state.weapons[state.weapon];
  const def = WEAPONS[state.weapon].levels[Math.max(0, lv - 1)];
  return {
    dmg: def.dmg * (1.12 ** state.ups.claws),
    rate: def.rate * (0.90 ** state.ups.tempo),
    range: def.range * (1.2 ** state.ups.reach),
    arc: def.arc ?? 0, pierce: def.pierce ?? 0, pellets: def.pellets ?? 1,
    hits: def.hits ?? 1,
  };
}

// Cycle to the next OWNED weapon (Q). The shop auto-equips a new weapon, so the
// player always feels what they just bought.
export function switchWeapon(state) {
  const owned = WEAPON_ORDER.filter((id) => state.weapons[id] > 0);
  if (owned.length < 2) return;
  const i = owned.indexOf(state.weapon);
  state.weapon = owned[(i + 1) % owned.length];
}

// Stage-clear card pool: unowned weapons first (a weapon card is the most
// exciting draw), then the upgrade tracks that are not maxed yet. Roll 3 distinct.
export function rollStageChoices(state) {
  const pool = [];
  for (const id of ['bow', 'blaster']) {
    if (state.weapons[id] === 0) {
      pool.push({ id: `weapon:${id}`, name: WEAPONS[id].name, icon: WEAPONS[id].icon,
        desc: 'NEW WEAPON', what: WEAPONS[id].desc, isWeapon: true });
    }
  }
  for (const d of UPGRADE_DEFS) {
    if (state.ups[d.id] < d.max) pool.push(d);
  }
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const d = state.rng.pick(pool);
    if (!out.includes(d)) out.push(d);
    for (let i = pool.length - 1; i >= 0; i -= 1) if (pool[i] === d) pool.splice(i, 1);
  }
  return out;
}

// Apply a stage-clear card: a weapon card owns + equips the weapon, an upgrade
// card applies through the normal upgrade path (handled by the caller).
export function applyStageCard(state, card) {
  if (!card.isWeapon) return false;
  const id = card.id.split(':')[1];
  state.weapons[id] = 1;
  state.weapon = id; // a new weapon is equipped at once
  return true;
}

// The shop's six offers, priced for the CURRENT state: a weapon slot sells the
// weapon, then its Lv2/Lv3 upgrades; boost slots cap out; heal is repeatable.
// Each offer carries its own state so the render and the click logic agree.
export function shopOffers(state) {
  return SHOP.map((item) => {
    const o = { ...item, state: 'buy', price: item.price, label: '' };
    if (item.kind === 'weapon') {
      const lv = state.weapons[item.id];
      if (lv >= 3) { o.state = 'max'; o.label = 'MAX'; }
      else if (lv === 0) { o.price = item.price; o.label = item.id === 'claw' ? 'OWNED' : `${item.price} ◉`; o.state = item.id === 'claw' ? 'max' : 'buy'; }
      else { o.price = item.up[lv - 1]; o.label = `${o.price} ◉`; o.name = `${WEAPONS[item.id].name} Lv${lv + 1}`; }
    } else if (item.kind === 'heal') {
      o.label = `${item.price} ◉`;
      if (state.player.hp >= state.player.maxHp) { o.state = 'max'; o.label = 'FULL HP'; }
    } else if (item.kind === 'boost') {
      const lv = state.ups[item.id] || 0;
      if (lv >= item.max) { o.state = 'max'; o.label = 'MAX'; }
      else o.label = `${item.price} ◉`;
    }
    if (o.state === 'buy' && state.coins < o.price) o.state = 'poor';
    return o;
  });
}

// Buy one offer (by shop index). Returns true if the purchase went through —
// the caller plays the sound and the render shows the new state at once.
export function buyOffer(state, idx) {
  const offers = shopOffers(state);
  const o = offers[idx];
  if (!o || o.state !== 'buy' || state.coins < o.price) return false;
  state.coins -= o.price;
  state.stats.spent += o.price;
  if (o.kind === 'weapon') {
    if (state.weapons[o.id] === 0) { state.weapons[o.id] = 1; state.weapon = o.id; }
    else state.weapons[o.id] += 1;
  } else if (o.kind === 'heal') {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 40);
  } else if (o.kind === 'boost') {
    state.ups[o.id] += 1;
    if (o.id === 'legs') state.player.speed *= 1.1;
    if (o.id === 'magnet') state.player.magnet *= 1.3;
  }
  return true;
}

// The sim autopilot's shopper: buy the bow, then the blaster, then claw levels,
// heal when hurt, then boosts — a reasonable player, not an optimal one.
export function autoShop(state) {
  for (let guard = 0; guard < 8; guard += 1) {
    const offers = shopOffers(state);
    const buyable = offers.map((o, i) => ({ o, i })).filter(({ o }) => o.state === 'buy');
    if (!buyable.length) return;
    const want = buyable.find(({ o }) => o.id === 'bow')
      || buyable.find(({ o }) => o.id === 'blaster')
      || (state.player.hp < state.player.maxHp * 0.5 && buyable.find(({ o }) => o.id === 'heal'))
      || buyable.find(({ o }) => o.id === 'claw')
      || buyable.find(({ o }) => o.id === 'legs')
      || buyable.find(({ o }) => o.id === 'magnet')
      || buyable[0];
    if (!buyOffer(state, want.i)) return;
  }
}
