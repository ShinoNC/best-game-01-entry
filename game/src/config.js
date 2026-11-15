// TIDEKEEPER tuning: every number the game balances on, in one place.
// Win = clear all 10 stages and drive off both herons (stages 5 and 10).
// Lose = 0 HP. Score = kills + pearls + coins + stage bonuses.
// Coins buy weapons in the shop.
export const STAGE_COUNT = 10; // stages in one run — see the stage-count note in BUILD-REPORT-V4.md
export const VIEW_W = 1280;
export const VIEW_H = 720;
// The rockpool: an ellipse of shallow water the crab can walk in.
export const POOL = { cx: 640, cy: 388, rx: 556, ry: 288 };
export const BEST_KEY = 'tidekeeper-best';

// Palette: deep teal water, warm sand, orange crab — one identity, readable at a glance.
export const PAL = {
  deep: '#062a33', water: '#0b3d4a', water2: '#0e5566', sand: '#c9a86a',
  sand2: '#e0c48f', foam: '#bfe8e0', crab: '#ff7a3c', crabDark: '#d94f1e',
  shell0: '#8a6f4d', shell1: '#b08954', shell2: '#4fa8a0', shell3: '#e8b64c',
  pearl: '#f4f9ff', gold: '#ffd166', coral: '#ff5d73', ink: '#7b5cff',
  hp: '#ff5d73', xp: '#7fe0c3', text: '#f4f9ff', dim: '#9fc4bd',
};

export const PLAYER = {
  radius: 30, speed: 245, hp: 100, boltDamage: 20, boltCd: 1.4, boltSpeed: 540,
  dashCd: 3.0, dashSpeed: 640, dashTime: 0.18, magnet: 75, iframes: 0.5,
};
// The crab is 1.5x the v1 size (radius 20 -> 30) so a first-time player can find
// it at a glance. Weapon damage/rate/range live in WEAPONS + weaponStats — the
// player object only carries the click-fired bubble bolt's numbers.

// Enemy table. Behaviour: guppy swarms, jelly drifts, urchin tanks, starfish splits,
// eel lunges, gull swoops (from stage 5). Elites are big gold versions; the Heron is the boss.
export const ENEMIES = {
  guppy:    { hp: 10, speed: 102, dmg: 4,  r: 10, xp: 1, score: 10, coins: 1, color: '#ffd166', dark: '#c9962e' },
  jelly:    { hp: 24, speed: 56,  dmg: 7,  r: 16, xp: 2, score: 20, coins: 2, color: '#c9a7ff', dark: '#8a6fd6' },
  urchin:   { hp: 66, speed: 37,  dmg: 10, r: 20, xp: 3, score: 30, coins: 3, color: '#5d4a8a', dark: '#3a2d5e' },
  starfish: { hp: 32, speed: 72,  dmg: 6,  r: 15, xp: 2, score: 20, coins: 2, color: '#ff8fb0', dark: '#d65d7e' },
  eel:      { hp: 18, speed: 152, dmg: 8,  r: 12, xp: 3, score: 30, coins: 2, color: '#7fe0c3', dark: '#3fae8c' },
  gull:     { hp: 28, speed: 176, dmg: 8,  r: 14, xp: 4, score: 40, coins: 2, color: '#f4f9ff', dark: '#9fb4c0' },
  mini:     { hp: 8,  speed: 118, dmg: 5,  r: 8,  xp: 1, score: 5,  coins: 1, color: '#ff8fb0', dark: '#d65d7e' },
};
export const ELITE = { hpMul: 3.6, dmgMul: 1.5, sizeMul: 1.55, xp: 10, score: 150, coins: 5 };
// Bosses every 5th stage: the Great Heron at stage 5, the Storm Heron — the
// same bird returned bigger, faster and angrier, summoning gulls — at stage 10.
export const BOSS = { hp: 1000, speed: 118, dmg: 18, r: 46, xp: 25, score: 500, coins: 25 };
export const BOSS_STORM = { hp: 2200, speed: 132, dmg: 22, r: 52, xp: 40, score: 1000, coins: 50 };

// Per-stage spawn plan. budget = total enemies that spawn this stage; the stage
// clears when the budget is spent AND the pool is empty. interval/batch pace each
// stage to ~25 s, so 10 stages fill the ~5-minute session. One elite per stage
// from stage 2 (at half the budget); a boss every 5th stage (5 and 10), also at
// half the budget — the boss stage's budget is smaller, because the boss IS the
// stage's second half.
export const STAGES = [
  { budget: 16, interval: 1.30, batch: 1, elite: false, boss: false }, // 1: learn the ropes
  { budget: 20, interval: 1.20, batch: 1, elite: true,  boss: false }, // 2: eels arrive
  { budget: 24, interval: 1.10, batch: 2, elite: true,  boss: false }, // 3
  { budget: 28, interval: 1.05, batch: 2, elite: true,  boss: false }, // 4
  { budget: 24, interval: 1.00, batch: 2, elite: true,  boss: true  }, // 5: THE GREAT HERON
  { budget: 36, interval: 0.95, batch: 2, elite: true,  boss: false }, // 6
  { budget: 40, interval: 0.90, batch: 3, elite: true,  boss: false }, // 7
  { budget: 44, interval: 0.85, batch: 4, elite: true,  boss: false }, // 8
  { budget: 48, interval: 0.80, batch: 4, elite: true,  boss: false }, // 9
  { budget: 40, interval: 0.85, batch: 4, elite: false, boss: true  }, // 10: THE STORM HERON
];

// Spawn director: weights shift with the stage, HP scales with the stage.
export function spawnWeights(stage) {
  const w = { guppy: 10, jelly: 4, urchin: 2, starfish: 3, eel: 0, gull: 0 };
  if (stage >= 2) w.eel = 3;
  if (stage >= 3) { w.urchin = 4; w.jelly = 6; }
  if (stage >= 5) w.gull = 4;
  if (stage >= 7) { w.urchin = 6; w.eel = 5; w.guppy = 7; }
  return w;
}
export function hpScale(stage) { return 1 + (stage - 1) * 0.34; }
export function dmgScale(stage) { return 1 + (stage - 1) * 0.14; }
export function speedScale(stage) { return 1 + (stage - 1) * 0.035; }
export function xpNeed(level) { return 6 + level * 6 + Math.floor((level * level) / 2); } // pearls to the next level (grows fast, so late levels are earned)

// Weapons (criterion 2): three tools, three feels — and ALL of them AUTOMATIC,
// like the v1–v3 auto-swinging claw. The sword spins on its own, the bow looses
// on its own, the blaster bursts on its own, each aimed at the nearest creature
// in range. The player's job is movement, positioning and dodging — swarms WILL
// hit you if you cannot dodge, so weapons must get MEANINGFULLY stronger as the
// run goes on: levels jump HARD (damage, rate, arc/pierce/pellets), and a late
// weapon visibly shreds what an early one struggles with. The three differ in
// speed and damage: the claw is slow and heavy with a wide arc, the bow is a
// medium-rate long-range piercer, the blaster is rapid-fire low damage per pellet.
export const WEAPONS = {
  claw: { name: 'CLAW', icon: '✂', desc: 'Melee arc — cleaves a crowd',
    levels: [
      { dmg: 14, rate: 0.55, range: 140, arc: 1.6, hits: 4 },
      { dmg: 20, rate: 0.50, range: 155, arc: 1.7, hits: 5 },
      { dmg: 28, rate: 0.42, range: 170, arc: 1.9, hits: 6 },
    ] },
  bow: { name: 'BUBBLE BOW', icon: '⌖', desc: 'Long-range piercing arrow',
    levels: [
      { dmg: 22, rate: 0.80, range: 420, pierce: 2 },
      { dmg: 32, rate: 0.65, range: 460, pierce: 3 },
      { dmg: 45, rate: 0.55, range: 500, pierce: 4 },
    ] },
  blaster: { name: 'INK BLASTER', icon: '✦', desc: 'Rapid 3-pellet burst',
    levels: [
      { dmg: 8, rate: 0.35, range: 320, pellets: 3 },
      { dmg: 12, rate: 0.30, range: 340, pellets: 3 },
      { dmg: 16, rate: 0.26, range: 360, pellets: 4 },
    ] },
};
export const WEAPON_ORDER = ['claw', 'bow', 'blaster'];

// The shop (criterion 2): real prices, real purchases, escalating by tier —
// better weapons cost more. Weapon slots sell the weapon, then its Lv2/Lv3
// upgrades; the other slots sell repeatable or capped boosts.
export const SHOP = [
  { id: 'bow', kind: 'weapon', price: 60, up: [80, 120], name: 'BUBBLE BOW', icon: '⌖', desc: 'Long-range piercing arrow' },
  { id: 'blaster', kind: 'weapon', price: 140, up: [170, 230], name: 'INK BLASTER', icon: '✦', desc: 'Rapid 3-pellet burst' },
  { id: 'claw', kind: 'weapon', price: 0, up: [50, 90], name: 'SHARPEN CLAWS', icon: '✂', desc: 'Claw +damage, +range' },
  { id: 'heal', kind: 'heal', price: 30, name: 'SHELL REPAIR', icon: '♥', desc: 'Heal 40 HP' },
  { id: 'legs', kind: 'boost', price: 40, max: 3, name: 'SWIFT LEGS', icon: '»', desc: '+10% move speed' },
  { id: 'magnet', kind: 'boost', price: 35, max: 2, name: 'PEARL MAGNET', icon: '◎', desc: '+30% pickup radius' },
];
