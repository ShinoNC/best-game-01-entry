// TIDEKEEPER tuning: every balance number in one place. Win = clear 30 stages; lose = 0 HP.
export const STAGE_COUNT = 30; // a full run is ~20–25 minutes
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const POOL = { cx: 640, cy: 360, rx: 556, ry: 288 }; // y 72–648: between the HUD bars
export const BEST_KEY = 'tidekeeper-best';

// Palette: deep teal water, warm sand, orange crab — one identity, readable at a glance.
export const PAL = {
  deep: '#062a33', water: '#12708a', water2: '#1d8aa6', sand: '#c9a86a',
  sand2: '#e0c48f', foam: '#bfe8e0', crab: '#ff7a3c', crabDark: '#d94f1e',
  shell0: '#8a6f4d', shell1: '#b08954', shell2: '#4fa8a0', shell3: '#e8b64c',
  gold: '#ffd166', coral: '#ff5d73', ink: '#7b5cff',
  hp: '#ff5d73', xp: '#7fe0c3', text: '#f4f9ff', dim: '#9fc4bd',
};

export const PLAYER = {
  radius: 30, speed: 245, hp: 100,
  dashCd: 3.0, dashSpeed: 640, dashTime: 0.18, magnet: 75, iframes: 0.5,
};
// Enemy table: guppy swarms, jelly drifts, urchin tanks, starfish splits, eel lunges, gull swoops, archer spits.
export const ENEMIES = {
  guppy:    { hp: 10, speed: 102, dmg: 4,  r: 10, score: 10, coins: 1, color: '#ffd166', dark: '#c9962e' },
  jelly:    { hp: 24, speed: 56,  dmg: 7,  r: 16, score: 20, coins: 2, color: '#c9a7ff', dark: '#8a6fd6' },
  urchin:   { hp: 66, speed: 37,  dmg: 10, r: 20, score: 30, coins: 3, color: '#5d4a8a', dark: '#3a2d5e' },
  starfish: { hp: 32, speed: 72,  dmg: 6,  r: 15, score: 20, coins: 2, color: '#ff8fb0', dark: '#d65d7e' },
  eel:      { hp: 18, speed: 152, dmg: 8,  r: 12, score: 30, coins: 2, color: '#7fe0c3', dark: '#3fae8c' },
  gull:     { hp: 28, speed: 176, dmg: 8,  r: 14, score: 40, coins: 2, color: '#f4f9ff', dark: '#9fb4c0' },
  archer:   { hp: 20, speed: 95,  dmg: 3,  r: 13, score: 35, coins: 2, color: '#7fd4e0', dark: '#3a8ea8' },
  mini:     { hp: 8,  speed: 118, dmg: 5,  r: 8,  score: 5,  coins: 1, color: '#ff8fb0', dark: '#d65d7e' },
};
export const SPIT = { speed: 240, r: 6, cd: 3.0, range: 420, aim: 0.35, life: 2.5 }; // archerfish water jet
export const ELITE = { hpMul: 3.6, dmgMul: 1.5, sizeMul: 1.55, score: 150, coins: 5 };
// Six boss herons, one per fifth stage; later birds are bigger, faster, summon more gulls.
export const BOSSES = [
  { stage: 5, type: 'heron', name: 'THE GREAT HERON', hp: 1600, speed: 118, dmg: 18, r: 46, score: 500, coins: 25, color: '#e8e4d8', dark: '#8a8578', dive: 2.1, summon: 0, summonEvery: 7 },
  { stage: 10, type: 'stormheron', name: 'THE STORM HERON', hp: 2600, speed: 132, dmg: 22, r: 52, score: 1000, coins: 50, color: '#8a93b8', dark: '#4a5178', dive: 2.6, summon: 2, summonEvery: 7 },
  { stage: 15, type: 'duskheron', name: 'THE DUSK HERON', hp: 4500, speed: 140, dmg: 26, r: 54, score: 1500, coins: 75, color: '#b08ac0', dark: '#6b4a78', dive: 2.8, summon: 2, summonEvery: 6 },
  { stage: 20, type: 'tidalheron', name: 'THE TIDAL HERON', hp: 12000, speed: 128, dmg: 30, r: 58, score: 2000, coins: 100, color: '#5fb8a8', dark: '#2f6e64', dive: 2.4, summon: 3, summonEvery: 7 },
  { stage: 25, type: 'abyssheron', name: 'THE ABYSS HERON', hp: 19000, speed: 148, dmg: 34, r: 60, score: 2500, coins: 125, color: '#5a6fd6', dark: '#2e3a7a', dive: 3.0, summon: 3, summonEvery: 6 },
  { stage: 30, type: 'kingheron', name: 'THE HERON KING', hp: 27000, speed: 140, dmg: 38, r: 66, score: 4000, coins: 200, color: '#e8b64c', dark: '#8a6a1e', dive: 2.8, summon: 3, summonEvery: 5 },
];
export function bossForStage(stage) { return BOSSES.find((b) => b.stage === stage) || null; }

// Spawn plan: budget 34 → 144, interval 0.90 → 0.45 s, batch 2 → 5, one elite from stage 2, boss every fifth.
export const STAGES = Array.from({ length: STAGE_COUNT }, (_, i) => {
  const stage = i + 1;
  const boss = stage % 5 === 0;
  return {
    budget: Math.round((34 + (stage - 1) * 3.8) * (boss ? 0.7 : 1)),
    interval: Math.max(0.45, 0.90 - (stage - 1) * 0.032),
    batch: Math.min(5, 2 + Math.floor((stage - 1) / 6)),
    elite: stage >= 2, boss,
  };
});

// Spawn weights shift with the stage. Archers: none before 12, main pressure 12–19, a few only 26–30.
export function spawnWeights(stage) {
  const w = { guppy: 10, jelly: 4, urchin: 2, starfish: 3, eel: 0, gull: 0, archer: 0 };
  if (stage >= 2) w.eel = 2;
  if (stage >= 3) { w.urchin = 4; w.jelly = 6; }
  if (stage >= 5) w.gull = 4;
  if (stage >= 7) { w.urchin = 6; w.eel = 3; w.guppy = 7; }
  if (stage >= 12) { w.jelly = 8; w.starfish = 5; w.archer = 2; }
  if (stage >= 15) w.archer = 3;
  if (stage >= 18) { w.urchin = 8; w.eel = 4; w.gull = 6; }
  if (stage >= 20) w.archer = 2;
  if (stage >= 24) { w.guppy = 5; w.jelly = 9; w.urchin = 10; w.eel = 5; w.gull = 7; w.starfish = 6; }
  if (stage >= 26) w.archer = 1;
  return w;
}
// The two most common types at a stage, by spawn weight — the INCOMING panel and menu preview read this.
export function nextTypes(stage) {
  const w = spawnWeights(stage);
  return Object.keys(w).filter((k) => w[k] > 0)
    .sort((a, b) => w[b] - w[a]).slice(0, 2);
}
export function hpScale(stage) {
  // 0.55/stage to 15, 1.10/stage after. Stage 30: 25.2x enemy HP.
  if (stage <= 15) return 1 + (stage - 1) * 0.55;
  return 1 + 14 * 0.55 + (stage - 15) * 1.10;
}
export function dmgScale(stage) {
  // 0.14/stage to stage 15, 0.24/stage after. Stage 30: 6.6x damage.
  if (stage <= 15) return 1 + (stage - 1) * 0.14;
  return 1 + 14 * 0.14 + (stage - 15) * 0.24;
}
export function speedScale(stage) { return 1 + (stage - 1) * 0.032; } // stage 30: 1.93x enemy speed

// The weapon table lives in weapons.js; this file keeps only the order and level cap.
export const WEAPON_ORDER = ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser'];
export const WEAPON_MAX = 5; // levels per weapon

// Menu prices (criterion 2): real prices, escalating by tier. Maxing everything costs ~8,255 coins vs ~8,900 earned per run.
export const SHOP = [
  { id: 'bow', kind: 'weapon', price: 50, up: [100, 150, 210, 280], name: 'BUBBLE BOW', icon: '⌖', desc: 'Long-range piercing arrows' },
  { id: 'blaster', kind: 'weapon', price: 110, up: [220, 290, 370, 460], name: 'INK BLASTER', icon: '✦', desc: 'Rapid spread of ink pellets' },
  { id: 'shell', kind: 'weapon', price: 90, up: [170, 230, 300, 380], name: 'HOMING SHELL', icon: '◎', desc: 'Slow shell that chases prey' },
  { id: 'spin', kind: 'weapon', price: 70, up: [140, 190, 250, 320], name: 'WHIRLPOOL SPIN', icon: '↻', desc: 'Ring blast around the crab' },
  { id: 'laser', kind: 'weapon', price: 130, up: [200, 260, 330, 420], name: 'LASER GUN', icon: '≋', desc: 'Fixed horizontal beam' },
  { id: 'claw', kind: 'weapon', price: 0, up: [60, 95, 140, 200], name: 'SHARPEN CLAWS', icon: '✂', desc: 'Claw +damage, +range' },
];

// Difficulties: real tuning, not labels — NORMAL is balanced (all 1.0).
export const DIFFICULTIES = {
  easy: { label: 'EASY', desc: 'gentler foes', hp: 0.85, dmg: 0.8, speed: 0.97, bossHp: 0.9, bossDmg: 0.85 },
  normal: { label: 'NORMAL', desc: 'the true tide', hp: 1, dmg: 1, speed: 1, bossHp: 1, bossDmg: 1 },
  hard: { label: 'HARD', desc: 'merciless tide', hp: 1.1, dmg: 1.0, speed: 1.0, bossHp: 1.1, bossDmg: 1.0 },
};
export const DIFF_ORDER = ['easy', 'normal', 'hard'];

// Feats: seven named goals beyond winning, persisted across runs.
export const FEATS = [
  { id: 'firstblood', name: 'FIRST BLOOD', desc: 'Slay your first creature' },
  { id: 'arsenal', name: 'FULL ARSENAL', desc: 'Own all 6 weapons in one run' },
  { id: 'heron', name: 'HERON SLAYER', desc: 'Drive off a heron' },
  { id: 'king', name: 'KINGSLAYER', desc: 'Beat the Heron King' },
  { id: 'untouched', name: 'UNTOUCHED', desc: 'Clear a stage without a scratch' },
  { id: 'rich', name: 'RICH CRAB', desc: 'Hold 500+ coins at once' },
  { id: 'combo', name: 'COMBO ×8', desc: 'Reach combo ×8' },
];

// The bestiary: display names for the seven creatures, shown on the title.
export const CREATURE_NAMES = {
  guppy: 'GUPPY', jelly: 'JELLY', urchin: 'URCHIN',
  starfish: 'STARFISH', eel: 'EEL', gull: 'GULL', archer: 'ARCHER',
};
export const CREATURE_ORDER = ['guppy', 'jelly', 'urchin', 'starfish', 'eel', 'gull', 'archer'];

// Claw Grab (E): snatch, hold, hurl — thrown creature deals base + its own max HP.
export const GRAB = { range: 160, cd: 3.0, hold: 4.0, base: 60, speed: 520 };

// Combo: kills within 3 s chain; every 4 chained kills raise the score multiplier, up to ×8.
export const COMBO_WINDOW = 3.0;
export const COMBO_MAX = 8;
