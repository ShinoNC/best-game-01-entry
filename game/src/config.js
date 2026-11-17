export const STAGE_COUNT = 30;
export const ARMOR_PER_BOSS = 30;

export const MODIFIERS = [
  { n: 'SWARM TIDE', d: 'foes swarm · +50% coins', spawn: 0.8, coin: 1.5 },
  { n: 'POWER HIT', d: 'foes +10% HP · +20% damage', ehp: 1.1, dmg: 1.2 },
  { n: 'SWIFT CURRENT', d: '+35% speed · +10% damage', spd: 1.35, dmg: 1.1 },
  { n: 'CHEAP WATERS', d: 'shop -20% · -20 max HP', price: 0.8, hpMul: 0.8 },
  { n: 'THICK HIDE', d: 'take 25% less damage', taken: 0.75 },
  { n: 'HIGH RISK', d: '+25% damage · take 15% more', dmg: 1.25, taken: 1.15 },
];
export function modOf(state, key) { return (state.modifier && state.modifier[key]) || 1; }
export function contentStage(state, pos) {
  const m = state.stageMap;
  return m ? m[(pos || state.stage) - 1] : (pos || state.stage);
}
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const POOL = { x0: 0, y0: 72, x1: 1280, y1: 648, cx: 640, cy: 360, rx: 640, ry: 288 };
export const BEST_KEY = 'tidekeeper-best';

export const ENV_BANDS = [
  { rays: 1, rain: 0, glow: 0 }, { rays: 0.8, rain: 0, glow: 0 }, { rays: 0.4, rain: 0, glow: 0 },
  { rays: 0.15, rain: 0, glow: 0 }, { rays: 0, rain: 0, glow: 0 }, { rays: 0, rain: 1, glow: 1 },
];
export const ENV_PALETTES = [
  ['AZURE SEA', '#1a6ec8', '#4a9ae8'],
  ['EMERALD SEA', '#1a8a4a', '#4ac87a'],
  ['VIOLET DEEP', '#5a2a8a', '#8a4ac8'],
  ['CRIMSON TIDE', '#8a2a2a', '#c84a4a'],
  ['GOLDEN SHOALS', '#b8860b', '#e8b84a'],
];
export function envForStage(stage, envs) {
  const band = Math.min(5, Math.floor((stage - 1) / 5));
  const p = (envs && envs[stage - 1]) || ENV_PALETTES[0];
  const fx = ENV_BANDS[band];
  return { name: p[0], water: p[1], water2: p[2], sand: '#c9a86a', weed: '#2f8f6b', weed2: '#4fae7d', rays: fx.rays, rain: fx.rain, glow: fx.glow };
}

export function sandRect(corner) {
  const c = corner || 'bl';
  const x0 = c[1] === 'r' ? POOL.x1 - 400 : POOL.x0;
  const y0 = c[0] === 'b' ? POOL.y1 - 250 : POOL.y0;
  return { x0, y0, x1: x0 + 400, y1: y0 + 250 };
}

export const PAL = {
  deep: '#062a33', foam: '#bfe8e0', crab: '#ff7a3c', crabDark: '#d94f1e',
  shell0: '#8a6f4d', shell1: '#b08954', shell2: '#4fa8a0', shell3: '#e8b64c',
  gold: '#ffd166', hp: '#ff5d73', xp: '#7fe0c3', text: '#f4f9ff', dim: '#9fc4bd', armor: '#8fb8c9',
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
export const SPIT = { speed: 240, r: 6, cd: 3.0, range: 420, aim: 0.35, life: 2.5 };
export const ELITE = { hpMul: 3.6, dmgMul: 1.5, sizeMul: 1.55, score: 150, coins: 5 };
export const BOSS_STAGES = [
  { stage: 5, hp: 1600, dmg: 18, score: 500, coins: 25, summon: 0, summonEvery: 7 },
  { stage: 10, hp: 2600, dmg: 22, score: 1000, coins: 50, summon: 2, summonEvery: 7 },
  { stage: 15, hp: 4500, dmg: 26, score: 1500, coins: 75, summon: 2, summonEvery: 6 },
  { stage: 20, hp: 12000, dmg: 30, score: 2000, coins: 100, summon: 3, summonEvery: 7 },
  { stage: 25, hp: 19000, dmg: 34, score: 2500, coins: 125, summon: 3, summonEvery: 6 },
  { stage: 30, hp: 27000, dmg: 38, score: 4000, coins: 200, summon: 3, summonEvery: 5 },
];
export const BOSS_TYPES = {
  turtle: { name: 'THE ANCIENT TURTLE', speed: 118, r: 46, color: '#8ab86a', dark: '#4a7a3e', dive: 2.1, atk: 'shell', atkEvery: 10 },
  octopus: { name: 'THE EMERALD OCTOPUS', speed: 132, r: 52, color: '#c08497', dark: '#7a4a5e', dive: 2.6, atk: 'ink', atkEvery: 9 },
  hammerhead: { name: 'THE HAMMERHEAD', speed: 140, r: 54, color: '#7a9bb8', dark: '#4a6a8a', dive: 2.8, atk: 'line', atkEvery: 11 },
  angler: { name: 'THE ANGLER', speed: 128, r: 58, color: '#6a5a9a', dark: '#3a2d5e', dive: 2.4, atk: 'lure', atkEvery: 8 },
  stingray: { name: 'THE CRIMSON STINGRAY', speed: 148, r: 60, color: '#c05a5a', dark: '#7a2e2e', dive: 3.0, atk: 'barbs', atkEvery: 7 },
  kraken: { name: 'THE KRAKEN', speed: 140, r: 66, color: '#9a4a6a', dark: '#5a2438', dive: 2.8, atk: 'slam', atkEvery: 12 },
};
export function bossForStage(stage, order) {
  const st = BOSS_STAGES.find((b) => b.stage === stage);
  if (!st) return null;
  const type = stage === 30 ? 'kraken' : (order || ['turtle', 'octopus', 'hammerhead', 'angler', 'stingray'])[stage / 5 - 1];
  return { stage, type, ...st, ...BOSS_TYPES[type] };
}

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
export function genStageMix(rng, stage) {
  const w = spawnWeights(stage);
  const bag = Object.keys(w).filter((k) => w[k] > 0);
  let sw = 0, sh = 0;
  for (const k of bag) { sw += w[k]; sh += w[k] * ENEMIES[k].hp; }
  const base = sh / sw;
  for (let a = 0; a < 8; a += 1) {
    const mix = {}, pool = [...bag];
    if (pool.includes('guppy')) { mix.guppy = w.guppy * rng.range(0.5, 0.9); pool.splice(pool.indexOf('guppy'), 1); }
    const n = Math.min(pool.length, 1 + Math.floor(rng.next() * 3));
    for (let i = 0; i < n; i += 1) {
      let t = 0; for (const k of pool) t += w[k];
      let r = rng.next() * t, pick = pool[pool.length - 1];
      for (const k of pool) { r -= w[k]; if (r <= 0) { pick = k; break; } }
      mix[pick] = w[pick] * rng.range(0.8, 1.4);
      pool.splice(pool.indexOf(pick), 1);
    }
    let mw = 0, mh = 0;
    for (const k in mix) { mw += mix[k]; mh += mix[k] * ENEMIES[k].hp; }
    const ratio = mh / mw / base;
    if (ratio >= 0.8 && ratio <= 1.2) return mix;
  }
  return { ...w };
}
export function nextTypes(stage, stageMix) {
  const w = (stageMix && stageMix[stage - 1]) || spawnWeights(stage);
  return Object.keys(w).filter((k) => w[k] > 0)
    .sort((a, b) => w[b] - w[a]).slice(0, 2);
}
export function hpScale(stage) {
  if (stage <= 15) return 1 + (stage - 1) * 0.55;
  return 1 + 14 * 0.55 + (stage - 15) * 0.95;
}
export function dmgScale(stage) {
  if (stage <= 15) return 1 + (stage - 1) * 0.14;
  return 1 + 14 * 0.14 + (stage - 15) * 0.24;
}
export function speedScale(stage) { return 1 + (stage - 1) * 0.032; }

export const WEAPON_ORDER = ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser', 'trident'];
export const WEAPON_MAX = 5;

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

export const FEAT_IDS = ['firstblood', 'arsenal', 'beast', 'king', 'untouched', 'rich', 'combo'];

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
