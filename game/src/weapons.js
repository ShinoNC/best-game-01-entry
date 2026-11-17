// Seven weapons.
import { WEAPON_MAX, modOf } from './config.js';

// Weapon table.
// more damage per level.
export const WEAPONS = {
  claw: { name: 'CLAW', icon: '✂',
    levels: [
      { dmg: 14, rate: 0.60, range: 140, arc: 1.6, hits: 4 },
      { dmg: 16, rate: 0.55, range: 148, arc: 1.65, hits: 4 },
      { dmg: 18, rate: 0.50, range: 155, arc: 1.7, hits: 5 },
      { dmg: 20, rate: 0.46, range: 162, arc: 1.75, hits: 5 },
      { dmg: 23, rate: 0.42, range: 170, arc: 1.85, hits: 6 },
    ] },
  bow: { name: 'BUBBLE BOW', icon: '⌖',
    levels: [
      { dmg: 22, rate: 0.80, range: 420, arrows: 1, pierce: 2 },
      { dmg: 25, rate: 0.74, range: 440, arrows: 2, pierce: 2 },
      { dmg: 28, rate: 0.68, range: 460, arrows: 2, pierce: 2 },
      { dmg: 32, rate: 0.62, range: 480, arrows: 3, pierce: 2 },
      { dmg: 36, rate: 0.56, range: 500, arrows: 3, pierce: 3 },
    ] },
  blaster: { name: 'INK BLASTER', icon: '✦',
    levels: [
      { dmg: 9, rate: 0.42, range: 320, pellets: 1 },
      { dmg: 10, rate: 0.38, range: 330, pellets: 2 },
      { dmg: 11, rate: 0.34, range: 340, pellets: 3 },
      { dmg: 12, rate: 0.30, range: 350, pellets: 4 },
      { dmg: 14, rate: 0.26, range: 365, pellets: 5 },
    ] },
  shell: { name: 'HOMING SHELL', icon: '◎',
    levels: [
      { dmg: 26, rate: 1.10, range: 480, turn: 3.2, speed: 380 },
      { dmg: 29, rate: 1.05, range: 500, turn: 3.4, speed: 380 },
      { dmg: 32, rate: 1.00, range: 520, turn: 3.6, speed: 390 },
      { dmg: 36, rate: 0.95, range: 540, turn: 3.8, speed: 400 },
      { dmg: 41, rate: 0.88, range: 560, turn: 4.0, speed: 410 },
    ] },
  spin: { name: 'WHIRLPOOL SPIN', icon: '↻',
    levels: [
      { dmg: 16, rate: 1.60, range: 150 },
      { dmg: 18, rate: 1.50, range: 160 },
      { dmg: 20, rate: 1.40, range: 170 },
      { dmg: 23, rate: 1.30, range: 180 },
      { dmg: 26, rate: 1.20, range: 195 },
    ] },
  laser: { name: 'LASER GUN', icon: '≋',
    levels: [
      { dmg: 30, rate: 1.40, range: 300, beams: 1 },
      { dmg: 36, rate: 1.30, range: 360, beams: 1 },
      { dmg: 43, rate: 1.20, range: 420, beams: 1 },
      { dmg: 50, rate: 1.10, range: 480, beams: 1 },
      { dmg: 60, rate: 1.00, range: 560, beams: 2 },
    ] },
  trident: { name: 'TRIDENT', icon: 'Ψ',
    levels: [
      { dmg: 18, rate: 0.90, range: 380, harpoons: 3, spread: 0.35 },
      { dmg: 21, rate: 0.84, range: 400, harpoons: 3, spread: 0.38 },
      { dmg: 24, rate: 0.78, range: 420, harpoons: 3, spread: 0.42 },
      { dmg: 28, rate: 0.72, range: 440, harpoons: 3, spread: 0.46 },
      { dmg: 32, rate: 0.66, range: 460, harpoons: 3, spread: 0.50 },
    ] },
};

// Effective stats.
export function weaponStatsFor(state, id) {
  const lv = state.weapons[id];
  const def = WEAPONS[id].levels[Math.max(0, Math.min(WEAPON_MAX, lv) - 1)];
  return {
    dmg: def.dmg * 1.14 * (1.10 ** state.ups.claws) * modOf(state, 'dmg'),
    rate: def.rate * (0.90 ** state.ups.tempo) * modOf(state, 'rate'),
    range: def.range * (1.2 ** state.ups.reach),
    arc: def.arc ?? 0, pierce: def.pierce ?? 0, pellets: def.pellets ?? 1,
    hits: def.hits ?? 1, turn: def.turn ?? 0, speed: def.speed ?? 0,
    arrows: def.arrows ?? 1, beams: def.beams ?? 0,
    harpoons: def.harpoons ?? 0, spread: def.spread ?? 0,
  };
}
