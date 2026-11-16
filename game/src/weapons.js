// Weapons (criterion 2): six tools with six feels, bought with coins earned
// by killing creatures. ALL owned weapons fire at once, each on its own
// cooldown — there is no equipped weapon. The upgrade tracks (claws/tempo/
// reach) multiply the damage/rate/range of ALL weapons, so every upgrade
// stays meaningful. The stage-clear menu (cards.js) owns buying: new weapons,
// weapon level-ups and skill cards are all cards with coin prices.
import { WEAPONS, WEAPON_MAX } from './config.js';

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
