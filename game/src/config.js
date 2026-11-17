// Balance numbers.
export const STAGE_COUNT = 30; // a full run is ~20–25 minutes
export const ARMOR_PER_BOSS = 30; // boss-clear reward: absorbs damage before HP, never heals
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const POOL = { x0: 0, y0: 72, x1: 1280, y1: 648, cx: 640, cy: 360, rx: 640, ry: 288 }; // full width between the HUD bars; rx/ry = half-extents
export const BEST_KEY = 'tidekeeper-best';

// Environments: six water colours, 5 stages each.
// Bosses at 5/10/15/20/25/30, the last stage of each band.
export const ENVS = [
  { name: 'SHALLOWS', water: '#35b8dc', water2: '#8fe8f8', sand: '#c9a86a', weed: '#2f8f6b', weed2: '#4fae7d', rays: 1, rain: 0, glow: 0 },
  { name: 'EMERALD LAGOON', water: '#0e7a4e', water2: '#3fc98a', sand: '#b0a05e', weed: '#0a5a36', weed2: '#1f7a4a', rays: 0.8, rain: 0, glow: 0 },
  { name: 'OPEN SEA', water: '#1a2f7e', water2: '#3563d8', sand: '#8a7a5a', weed: '#b04a7a', weed2: '#d97aa8', rays: 0.4, rain: 0, glow: 0 },
  { name: 'TWILIGHT DEEP', water: '#2a1a5e', water2: '#4d33a0', sand: '#6a5a7a', weed: '#5a3a8a', weed2: '#7a55a8', rays: 0.15, rain: 0, glow: 0 },
  { name: 'RED TIDE', water: '#5e1220', water2: '#8f2a3d', sand: '#7a5a4a', weed: '#5a2230', weed2: '#7a3040', rays: 0, rain: 0, glow: 0 },
  { name: 'STORM TIDE', water: '#0a0f24', water2: '#1a2547', sand: '#4a5060', weed: '#1a2a4a', weed2: '#2a3a5a', rays: 0, rain: 1, glow: 1 },
];
export function envForStage(stage) { return ENVS[Math.min(5, Math.floor((stage - 1) / 5))]; }

export const PAL = {
  deep: '#062a33', water: '#12708a', water2: '#1d8aa6', sand: '#c9a86a',
  sand2: '#e0c48f', foam: '#bfe8e0', crab: '#ff7a3c', crabDark: '#d94f1e',
  shell0: '#8a6f4d', shell1: '#b08954', shell2: '#4fa8a0', shell3: '#e8b64c',
  gold: '#ffd166', coral: '#ff5d73', ink: '#7b5cff',
  hp: '#ff5d73', xp: '#7fe0c3', text: '#f4f9ff', dim: '#9fc4bd', armor: '#8fb8c9',
};

export const PLAYER = {
  radius: 30, speed: 245, hp: 100,
  dashCd: 3.0, dashSpeed: 640, dashTime: 0.18, magnet: 75, iframes: 0.5,
};
export const ENEMIES = {
  guppy:    { hp: 10, speed: 102, dmg: 4,  r: 10, score: 10, coins: 1, color: '#ffd166', dark: '#c9962e' },
  jelly:    { hp: 24, speed: 56,  dmg: 7,  r: 16, score: 20, coins: 2, color: '#c9a7ff', dark: '#8a6fd6' },
  urchin:   { hp: 66, speed: 37,  dmg: 10, r: 20, score: 30, coins: 3, color: '#5d4a8a', dark: '#3a2d5e' },
  starfish: { hp: 32, speed: 72,  dmg: 6,  r: 15, score: 20, coins: 2, color: '#ff8fb0', dark: '#d65d7e' },
  eel:      { hp: 18, speed: 152, dmg: 8,  r: 12, score: 30, coins: 2, color: '#7fe0c3', dark: '#3fae8c' },
  squid:     { hp: 28, speed: 176, dmg: 8,  r: 14, score: 40, coins: 2, color: '#ff8a5c', dark: '#c75a30' },
  archer:   { hp: 20, speed: 95,  dmg: 3,  r: 13, score: 35, coins: 2, color: '#7fd4e0', dark: '#3a8ea8' },
  mini:     { hp: 8,  speed: 118, dmg: 5,  r: 8,  score: 5,  coins: 1, color: '#ff8fb0', dark: '#d65d7e' },
};
export const SPIT = { speed: 240, r: 6, cd: 3.0, range: 420, aim: 0.35, life: 2.5 }; // archerfish water jet
export const ELITE = { hpMul: 3.6, dmgMul: 1.5, sizeMul: 1.55, score: 150, coins: 5 };
export const BOSSES = [
  { stage: 5, type: 'turtle', name: 'THE ANCIENT TURTLE', hp: 1600, speed: 118, dmg: 18, r: 46, score: 500, coins: 25, color: '#8ab86a', dark: '#4a7a3e', dive: 2.1, summon: 0, summonEvery: 7 },
  { stage: 10, type: 'octopus', name: 'THE EMERALD OCTOPUS', hp: 2600, speed: 132, dmg: 22, r: 52, score: 1000, coins: 50, color: '#c08497', dark: '#7a4a5e', dive: 2.6, summon: 2, summonEvery: 7 },
  { stage: 15, type: 'hammerhead', name: 'THE HAMMERHEAD', hp: 4500, speed: 140, dmg: 26, r: 54, score: 1500, coins: 75, color: '#7a9bb8', dark: '#4a6a8a', dive: 2.8, summon: 2, summonEvery: 6 },
  { stage: 20, type: 'angler', name: 'THE ANGLER', hp: 12000, speed: 128, dmg: 30, r: 58, score: 2000, coins: 100, color: '#6a5a9a', dark: '#3a2d5e', dive: 2.4, summon: 3, summonEvery: 7 },
  { stage: 25, type: 'stingray', name: 'THE CRIMSON STINGRAY', hp: 19000, speed: 148, dmg: 34, r: 60, score: 2500, coins: 125, color: '#c05a5a', dark: '#7a2e2e', dive: 3.0, summon: 3, summonEvery: 6 },
  { stage: 30, type: 'kraken', name: 'THE KRAKEN', hp: 27000, speed: 140, dmg: 38, r: 66, score: 4000, coins: 200, color: '#9a4a6a', dark: '#5a2438', dive: 2.8, summon: 3, summonEvery: 5 },
];
export function bossForStage(stage) { return BOSSES.find((b) => b.stage === stage) || null; }

export const STAGES = Array.from({ length: STAGE_COUNT }, (_, i) => {
  const stage = i + 1;
  const boss = stage % 5 === 0;
  return {
    budget: Math.round((34 + (stage - 1) * 3.8) * (boss ? 0.7 : 1)),
    interval: Math.max(0.35, 0.75 - (stage - 1) * 0.030),
    batch: Math.min(6, 3 + Math.floor((stage - 1) / 5)),
    elite: stage >= 2, boss,
  };
});

export function spawnWeights(stage) {
  const w = { guppy: 10, jelly: 4, urchin: 2, starfish: 3, eel: 0, squid: 0, archer: 0 };
  if (stage >= 2) w.eel = 2;
  if (stage >= 3) { w.urchin = 4; w.jelly = 6; }
  if (stage >= 5) w.squid = 4;
  if (stage >= 7) { w.urchin = 6; w.eel = 3; w.guppy = 7; }
  if (stage >= 12) { w.jelly = 8; w.starfish = 5; w.archer = 2; }
  if (stage >= 15) w.archer = 3;
  if (stage >= 18) { w.urchin = 8; w.eel = 4; w.squid = 6; }
  if (stage >= 20) w.archer = 2;
  if (stage >= 24) { w.guppy = 5; w.jelly = 9; w.urchin = 10; w.eel = 5; w.squid = 7; w.starfish = 6; }
  if (stage >= 26) w.archer = 1;
  return w;
}
export function nextTypes(stage) {
  const w = spawnWeights(stage);
  return Object.keys(w).filter((k) => w[k] > 0)
    .sort((a, b) => w[b] - w[a]).slice(0, 2);
}
export function hpScale(stage) {
  if (stage <= 15) return 1 + (stage - 1) * 0.55;
  return 1 + 14 * 0.55 + (stage - 15) * 1.10;
}
export function dmgScale(stage) {
  if (stage <= 15) return 1 + (stage - 1) * 0.14;
  return 1 + 14 * 0.14 + (stage - 15) * 0.24;
}
export function speedScale(stage) { return 1 + (stage - 1) * 0.032; } // stage 30: 1.93x enemy speed

export const WEAPON_ORDER = ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser', 'trident'];
export const WEAPON_MAX = 5; // levels per weapon

export const SHOP = [
  { id: 'bow', kind: 'weapon', price: 50, up: [100, 150, 210, 280], name: 'BUBBLE BOW', icon: '⌖' },
  { id: 'blaster', kind: 'weapon', price: 110, up: [220, 290, 370, 460], name: 'INK BLASTER', icon: '✦' },
  { id: 'shell', kind: 'weapon', price: 90, up: [170, 230, 300, 380], name: 'HOMING SHELL', icon: '◎' },
  { id: 'spin', kind: 'weapon', price: 70, up: [140, 190, 250, 320], name: 'WHIRLPOOL SPIN', icon: '↻' },
  { id: 'laser', kind: 'weapon', price: 130, up: [200, 260, 330, 420], name: 'LASER GUN', icon: '≋' },
  { id: 'trident', kind: 'weapon', price: 120, up: [190, 250, 320, 410], name: 'TRIDENT', icon: 'Ψ' },
  { id: 'claw', kind: 'weapon', price: 0, up: [60, 95, 140, 200], name: 'SHARPEN CLAWS', icon: '✂' },
];

export const DIFFICULTIES = {
  easy: { label: 'EASY', desc: 'gentler foes', hp: 0.85, dmg: 0.8, speed: 0.97, bossHp: 0.9, bossDmg: 0.85 },
  normal: { label: 'NORMAL', desc: 'the true tide', hp: 1, dmg: 1, speed: 1, bossHp: 1, bossDmg: 1 },
  hard: { label: 'HARD', desc: 'merciless tide', hp: 1.1, dmg: 1.0, speed: 1.0, bossHp: 1.1, bossDmg: 1.0 },
};
export const DIFF_ORDER = ['easy', 'normal', 'hard'];

export const FEATS = [
  { id: 'firstblood', name: 'FIRST BLOOD', desc: 'Slay your first creature' },
  { id: 'arsenal', name: 'FULL ARSENAL', desc: 'Own all 7 weapons in one run' },
  { id: 'beast', name: 'BEAST SLAYER', desc: 'Drive off a sea beast' },
  { id: 'king', name: 'KINGSLAYER', desc: 'Beat the Kraken' },
  { id: 'untouched', name: 'UNTOUCHED', desc: 'Clear a stage without a scratch' },
  { id: 'rich', name: 'RICH CRAB', desc: 'Hold 500+ coins at once' },
  { id: 'combo', name: 'COMBO ×8', desc: 'Reach combo ×8' },
];

// Awards: 3/10/20 clears.
// NORMAL, crowns + a title on HARD.
export const AWARD_TIERS = [
  { wins: 3, metal: 'BRONZE', color: '#cd7f32' },
  { wins: 10, metal: 'SILVER', color: '#c0c0c0' },
  { wins: 20, metal: 'GOLD', color: '#ffd700' },
];
export const AWARD_KIND = { easy: 'MEDAL', normal: 'CUP', hard: 'CROWN' };
export const AWARD_TITLES = ['Tide Guardian', 'Kraken Slayer', 'Tidekeeper Legend'];

export const CREATURE_NAMES = {
  guppy: 'GUPPY', jelly: 'JELLY', urchin: 'URCHIN',
  starfish: 'STARFISH', eel: 'EEL', squid: 'SQUID', archer: 'ARCHER',
};
export const CREATURE_ORDER = ['guppy', 'jelly', 'urchin', 'starfish', 'eel', 'squid', 'archer'];

export const COMBO_WINDOW = 3.0;
export const COMBO_MAX = 8;
