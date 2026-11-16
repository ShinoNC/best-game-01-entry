// TIDEKEEPER tuning: every number the game balances on, in one place.
// Win = clear all 30 stages and drive off the heron at every fifth stage
// (5, 10, 15, 20, 25, 30). Lose = 0 HP. Score = kills + pearls + coins +
// stage bonuses. Coins buy weapons in the shop.
export const STAGE_COUNT = 30; // stages in one run — a full session is ~20–25 minutes
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
  radius: 30, speed: 245, hp: 100,
  dashCd: 3.0, dashSpeed: 640, dashTime: 0.18, magnet: 75, iframes: 0.5,
};
// The crab is 1.5x the v1 size (radius 20 -> 30) so a first-time player can find
// it at a glance. Weapon damage/rate/range live in WEAPONS + weaponStatsFor.

// Enemy table. Behaviour: guppy swarms, jelly drifts, urchin tanks, starfish splits,
// eel lunges, gull swoops (from stage 5). Elites are big gold versions; the herons are the bosses.
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
// Six boss herons, one per fifth stage. Each is a distinct fight: bigger,
// tougher, faster-diving and summoning more gulls as the run goes on. The
// Heron King at stage 30 is the final boss.
export const BOSSES = [
  { stage: 5, type: 'heron', name: 'THE GREAT HERON', hp: 2700, speed: 118, dmg: 18, r: 46, xp: 25, score: 500, coins: 25, color: '#e8e4d8', dark: '#8a8578', dive: 2.1, summon: 0, summonEvery: 7 },
  { stage: 10, type: 'stormheron', name: 'THE STORM HERON', hp: 6000, speed: 132, dmg: 22, r: 52, xp: 40, score: 1000, coins: 50, color: '#8a93b8', dark: '#4a5178', dive: 2.6, summon: 2, summonEvery: 7 },
  { stage: 15, type: 'duskheron', name: 'THE DUSK HERON', hp: 9750, speed: 140, dmg: 26, r: 54, xp: 55, score: 1500, coins: 75, color: '#b08ac0', dark: '#6b4a78', dive: 2.8, summon: 2, summonEvery: 6 },
  { stage: 20, type: 'tidalheron', name: 'THE TIDAL HERON', hp: 14100, speed: 128, dmg: 30, r: 58, xp: 70, score: 2000, coins: 100, color: '#5fb8a8', dark: '#2f6e64', dive: 2.4, summon: 3, summonEvery: 7 },
  { stage: 25, type: 'abyssheron', name: 'THE ABYSS HERON', hp: 19500, speed: 148, dmg: 34, r: 60, xp: 85, score: 2500, coins: 125, color: '#5a6fd6', dark: '#2e3a7a', dive: 3.0, summon: 3, summonEvery: 6 },
  { stage: 30, type: 'kingheron', name: 'THE HERON KING', hp: 27000, speed: 140, dmg: 38, r: 66, xp: 120, score: 4000, coins: 200, color: '#e8b64c', dark: '#8a6a1e', dive: 2.8, summon: 3, summonEvery: 5 },
];
export function bossForStage(stage) { return BOSSES.find((b) => b.stage === stage) || null; }

// Per-stage spawn plan, generated: budget grows 34 → 144, spawn interval
// shrinks 1.30 → 0.45 s, batch grows 1 → 5, one elite per stage from stage 2
// (at half the budget), and a boss at every fifth stage, also at half the
// budget. Boss stages run a 30% smaller budget, because the boss IS the
// stage's second half. Each stage is ~30–45 s of combat, so 30 stages fill
// a ~20–25 minute session.
export const STAGES = Array.from({ length: STAGE_COUNT }, (_, i) => {
  const stage = i + 1;
  const boss = stage % 5 === 0;
  return {
    budget: Math.round((34 + (stage - 1) * 3.8) * (boss ? 0.7 : 1)),
    interval: Math.max(0.45, 1.30 - (stage - 1) * 0.030),
    batch: 1 + Math.floor((stage - 1) / 6),
    elite: stage >= 2, boss,
  };
});

// Spawn director: weights shift with the stage, HP scales with the stage.
export function spawnWeights(stage) {
  const w = { guppy: 10, jelly: 4, urchin: 2, starfish: 3, eel: 0, gull: 0 };
  if (stage >= 2) w.eel = 3;
  if (stage >= 3) { w.urchin = 4; w.jelly = 6; }
  if (stage >= 5) w.gull = 4;
  if (stage >= 7) { w.urchin = 6; w.eel = 5; w.guppy = 7; }
  if (stage >= 12) { w.jelly = 8; w.starfish = 5; }
  if (stage >= 18) { w.urchin = 8; w.eel = 7; w.gull = 6; }
  if (stage >= 24) { w.guppy = 5; w.jelly = 9; w.urchin = 10; w.eel = 8; w.gull = 7; w.starfish = 6; }
  return w;
}
export function hpScale(stage) { return 1 + (stage - 1) * 0.65; } // stage 30: 19.9x enemy HP
export function dmgScale(stage) { return 1 + (stage - 1) * 0.17; } // stage 30: 5.9x enemy damage
export function speedScale(stage) { return 1 + (stage - 1) * 0.032; } // stage 30: 1.93x enemy speed
export function xpNeed(level) { return 8 + level * 8 + level * level; } // pearls to the next level — levels come slowly across 30 stages

// Weapons (criterion 2): six tools, six feels — and ALL of them AUTOMATIC.
// EVERY owned weapon fires at once, each on its own cooldown, each aimed at
// the nearest creature in ITS range (the laser fires fixed horizontal beams
// instead). There is no equipped weapon and no switching: a new weapon is
// ADDED to the arsenal, never replaces an old one. The player's job is
// movement, positioning and dodging — swarms WILL hit you if you cannot
// dodge. Level steps are small, so the power curve stretches over the whole
// 30-stage run and no weapon maxes out early. Each weapon scales its own way:
// the claw swings faster and harder; the bow and blaster fire MORE shots per
// volley (Lv1 = 1 shot) plus speed and damage; the laser's beams get longer
// and stronger, and at Lv5 it fires TWO beams (left + right).
export const WEAPONS = {
  claw: { name: 'CLAW', icon: '✂', desc: 'Slow heavy cleave, wide arc',
    levels: [
      { dmg: 14, rate: 0.60, range: 140, arc: 1.6, hits: 4 },
      { dmg: 16, rate: 0.55, range: 148, arc: 1.65, hits: 4 },
      { dmg: 18, rate: 0.50, range: 155, arc: 1.7, hits: 5 },
      { dmg: 20, rate: 0.46, range: 162, arc: 1.75, hits: 5 },
      { dmg: 23, rate: 0.42, range: 170, arc: 1.85, hits: 6 },
    ] },
  bow: { name: 'BUBBLE BOW', icon: '⌖', desc: 'Long-range piercing arrows',
    levels: [
      { dmg: 22, rate: 0.80, range: 420, arrows: 1, pierce: 2 },
      { dmg: 25, rate: 0.74, range: 440, arrows: 2, pierce: 2 },
      { dmg: 28, rate: 0.68, range: 460, arrows: 2, pierce: 2 },
      { dmg: 32, rate: 0.62, range: 480, arrows: 3, pierce: 2 },
      { dmg: 36, rate: 0.56, range: 500, arrows: 3, pierce: 3 },
    ] },
  blaster: { name: 'INK BLASTER', icon: '✦', desc: 'Rapid spread of ink pellets',
    levels: [
      { dmg: 9, rate: 0.42, range: 320, pellets: 1 },
      { dmg: 10, rate: 0.38, range: 330, pellets: 2 },
      { dmg: 11, rate: 0.34, range: 340, pellets: 3 },
      { dmg: 12, rate: 0.30, range: 350, pellets: 4 },
      { dmg: 14, rate: 0.26, range: 365, pellets: 5 },
    ] },
  shell: { name: 'HOMING SHELL', icon: '◎', desc: 'Slow shell that chases prey',
    levels: [
      { dmg: 26, rate: 1.10, range: 480, turn: 3.2, speed: 380 },
      { dmg: 29, rate: 1.05, range: 500, turn: 3.4, speed: 380 },
      { dmg: 32, rate: 1.00, range: 520, turn: 3.6, speed: 390 },
      { dmg: 36, rate: 0.95, range: 540, turn: 3.8, speed: 400 },
      { dmg: 41, rate: 0.88, range: 560, turn: 4.0, speed: 410 },
    ] },
  spin: { name: 'WHIRLPOOL SPIN', icon: '↻', desc: 'Ring blast around the crab',
    levels: [
      { dmg: 16, rate: 1.60, range: 150 },
      { dmg: 18, rate: 1.50, range: 160 },
      { dmg: 20, rate: 1.40, range: 170 },
      { dmg: 23, rate: 1.30, range: 180 },
      { dmg: 26, rate: 1.20, range: 195 },
    ] },
  laser: { name: 'LASER GUN', icon: '≋', desc: 'Fixed horizontal beam',
    levels: [
      { dmg: 30, rate: 1.40, range: 300, beams: 1 },
      { dmg: 36, rate: 1.30, range: 360, beams: 1 },
      { dmg: 43, rate: 1.20, range: 420, beams: 1 },
      { dmg: 50, rate: 1.10, range: 480, beams: 1 },
      { dmg: 60, rate: 1.00, range: 560, beams: 2 },
    ] },
};
export const WEAPON_ORDER = ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser'];
export const WEAPON_MAX = 5; // levels per weapon

// The shop (criterion 2): real prices, real purchases, escalating by tier —
// better weapons cost more. Five weapon slots sell the weapon, then its four
// level-ups; the claw slot sells claw levels (the claw is owned from the
// start). Full max-out costs ~6,325 coins against ~3,900 earned per run —
// the player must choose, never maxes everything.
export const SHOP = [
  { id: 'bow', kind: 'weapon', price: 60, up: [100, 150, 210, 280], name: 'BUBBLE BOW', icon: '⌖', desc: 'Long-range piercing arrows' },
  { id: 'blaster', kind: 'weapon', price: 140, up: [220, 290, 370, 460], name: 'INK BLASTER', icon: '✦', desc: 'Rapid spread of ink pellets' },
  { id: 'shell', kind: 'weapon', price: 110, up: [170, 230, 300, 380], name: 'HOMING SHELL', icon: '◎', desc: 'Slow shell that chases prey' },
  { id: 'spin', kind: 'weapon', price: 90, up: [140, 190, 250, 320], name: 'WHIRLPOOL SPIN', icon: '↻', desc: 'Ring blast around the crab' },
  { id: 'laser', kind: 'weapon', price: 160, up: [200, 260, 330, 420], name: 'LASER GUN', icon: '≋', desc: 'Fixed horizontal beam' },
  { id: 'claw', kind: 'weapon', price: 0, up: [60, 95, 140, 200], name: 'SHARPEN CLAWS', icon: '✂', desc: 'Claw +damage, +range' },
];
