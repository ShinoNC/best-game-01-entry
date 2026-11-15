// TIDEKEEPER tuning: every number the game balances on, in one place.
// Win = survive until HIGH TIDE at 5:00. Lose = 0 HP. Score = kills + pearls + time.
export const WIN_TIME = 300; // seconds to high tide
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
  radius: 20, speed: 245, hp: 100, clawDamage: 14, clawRate: 0.55,
  clawRange: 120, clawArc: 1.6, boltDamage: 20, boltCd: 1.4, boltSpeed: 540,
  dashCd: 2.6, dashSpeed: 640, dashTime: 0.18, magnet: 75, iframes: 0.7,
};

// Enemy table. Behaviour: guppy swarms, jelly drifts, urchin tanks, starfish splits,
// eel lunges, gull swoops (from 2:00). Elites are big gold versions; the Heron is the boss.
export const ENEMIES = {
  guppy:    { hp: 10, speed: 102, dmg: 4,  r: 10, xp: 1, score: 10, color: '#ffd166', dark: '#c9962e' },
  jelly:    { hp: 24, speed: 56,  dmg: 7,  r: 16, xp: 2, score: 20, color: '#c9a7ff', dark: '#8a6fd6' },
  urchin:   { hp: 66, speed: 37,  dmg: 10, r: 20, xp: 3, score: 30, color: '#5d4a8a', dark: '#3a2d5e' },
  starfish: { hp: 32, speed: 72,  dmg: 6,  r: 15, xp: 2, score: 20, color: '#ff8fb0', dark: '#d65d7e' },
  eel:      { hp: 18, speed: 152, dmg: 8,  r: 12, xp: 3, score: 30, color: '#7fe0c3', dark: '#3fae8c' },
  gull:     { hp: 28, speed: 176, dmg: 8,  r: 14, xp: 4, score: 40, color: '#f4f9ff', dark: '#9fb4c0' },
  mini:     { hp: 8,  speed: 118, dmg: 5,  r: 8,  xp: 1, score: 5,  color: '#ff8fb0', dark: '#d65d7e' },
};
export const ELITE = { hpMul: 3.6, dmgMul: 1.5, sizeMul: 1.55, xp: 10, score: 150 };
export const BOSS = { hp: 950, speed: 118, dmg: 20, r: 46, xp: 25, score: 500, spawnAt: 240 };

// Spawn director: interval shrinks, batch grows, weights shift with the clock.
export function spawnInterval(t) { return Math.max(0.5, 1.2 - t * 0.0032); }
export function spawnBatch(t) { return 1 + Math.floor(t / 90); }
export function spawnWeights(t) {
  const w = { guppy: 10, jelly: 4, urchin: 2, starfish: 3, eel: 0, gull: 0 };
  if (t > 30) w.eel = 3;
  if (t > 60) { w.urchin = 4; w.jelly = 6; }
  if (t > 120) w.gull = 4;
  if (t > 180) { w.urchin = 6; w.eel = 5; w.guppy = 7; }
  return w;
}
export function hpScale(t) { return 1 + (t / WIN_TIME) * 1.2; }
export function xpNeed(level) { return 6 + level * 6 + Math.floor((level * level) / 2); } // pearls to the next level (grows fast, so late levels are earned)
export const ELITE_EVERY = 45; // seconds between elites
export const WAVE_EVERY = 30; // seconds between wave banners
