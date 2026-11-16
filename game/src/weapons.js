// Weapons and the shop (criterion 2): six tools with six feels, bought with
// coins earned by killing creatures, and a shop with real prices and real purchases.
// ALL owned weapons fire at once, each on its own cooldown — there is no
// equipped weapon. The upgrade tracks (claws/tempo/reach) multiply the
// damage/rate/range of ALL weapons, so every upgrade stays meaningful.
import { SHOP, WEAPONS, WEAPON_MAX, WEAPON_ORDER } from './config.js';
import { UPGRADE_DEFS } from './upgrades.js';

// Effective stats of ONE weapon (by id): its level table, multiplied by the
// crab's upgrade tracks. One function, so the sim and the HUD always agree.
export function weaponStatsFor(state, id) {
  const lv = state.weapons[id];
  const def = WEAPONS[id].levels[Math.max(0, Math.min(WEAPON_MAX, lv) - 1)];
  return {
    dmg: def.dmg * (1.10 ** state.ups.claws),
    rate: def.rate * (0.90 ** state.ups.tempo),
    range: def.range * (1.2 ** state.ups.reach),
    arc: def.arc ?? 0, pierce: def.pierce ?? 0, pellets: def.pellets ?? 1,
    hits: def.hits ?? 1, turn: def.turn ?? 0, speed: def.speed ?? 0,
    arrows: def.arrows ?? 1, beams: def.beams ?? 0,
  };
}

// Stage-clear card pool: unowned weapons first (a weapon card is the most
// exciting draw), then the upgrade tracks that are not maxed yet. Weapon
// levels come ONLY from the shop — cards never grant them, so the power curve
// stretches over the whole run. Roll 3 distinct.
export function rollStageChoices(state) {
  const pool = [];
  for (const id of WEAPON_ORDER) {
    if (id !== 'claw' && state.weapons[id] === 0) {
      pool.push({ id: `weapon:${id}`, name: WEAPONS[id].name, icon: WEAPONS[id].icon,
        desc: 'NEW WEAPON', isWeapon: true });
    }
  }
  for (const d of UPGRADE_DEFS) {
    if (state.ups[d.id] < d.max) pool.push(d);
  }
  if (pool.length === 0) {
    // Everything is owned and maxed: the card is a shell repair instead, so
    // the stage-clear screen always offers a real pick.
    return [{ id: 'healcard', name: 'SHELL REPAIR', icon: '♥', desc: 'HEAL +40 HP', isHeal: true }];
  }
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const d = state.rng.pick(pool);
    if (!out.includes(d)) out.push(d);
    for (let i = pool.length - 1; i >= 0; i -= 1) if (pool[i] === d) pool.splice(i, 1);
  }
  return out;
}

// Apply a stage-clear card: a weapon card ADDS the weapon to the arsenal (it
// fires alongside the others — nothing is replaced); a heal card patches the
// shell; an upgrade card applies through the normal upgrade path (handled by
// the caller).
export function applyStageCard(state, card) {
  if (card.isWeapon) {
    state.weapons[card.id.split(':')[1]] = 1;
    return true;
  }
  if (card.isHeal) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 40);
    return true;
  }
  return false;
}

// The shop's six offers, priced for the CURRENT state: a weapon slot sells the
// weapon, then its Lv2–Lv5 upgrades. Each offer carries its own state so the
// render and the click logic agree.
export function shopOffers(state) {
  return SHOP.map((item) => {
    const o = { ...item, state: 'buy', price: item.price, label: '' };
    const lv = state.weapons[item.id];
    if (lv >= WEAPON_MAX) { o.state = 'max'; o.label = 'MAX'; }
    else if (lv === 0) { o.price = item.price; o.label = `${item.price} ◉`; }
    else { o.price = item.up[lv - 1]; o.label = `${o.price} ◉`; o.name = `${WEAPONS[item.id].name} Lv${lv + 1}`; }
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
  if (state.weapons[o.id] === 0) state.weapons[o.id] = 1;
  else state.weapons[o.id] += 1;
  return true;
}

// The sim autopilot's shopper: collect all five buyable weapons first
// (cheapest first), then level the weapons up — a reasonable player, not an
// optimal one.
export function autoShop(state) {
  for (let guard = 0; guard < 10; guard += 1) {
    const offers = shopOffers(state);
    const buyable = offers.map((o, i) => ({ o, i })).filter(({ o }) => o.state === 'buy');
    if (!buyable.length) return;
    const want = buyable.find(({ o }) => o.id === 'bow' && state.weapons.bow === 0)
      || buyable.find(({ o }) => o.id === 'spin' && state.weapons.spin === 0)
      || buyable.find(({ o }) => o.id === 'shell' && state.weapons.shell === 0)
      || buyable.find(({ o }) => o.id === 'blaster' && state.weapons.blaster === 0)
      || buyable.find(({ o }) => o.id === 'laser' && state.weapons.laser === 0)
      || buyable.find(({ o }) => o.id === 'claw')
      || buyable[0];
    if (!buyOffer(state, want.i)) return;
  }
}
