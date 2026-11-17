export const STAGE_COUNT = 30;
export const ARMOR_PER_BOSS = 30;
export const MODIFIERS = [
  { n: 'SWARM TIDE', d: 'foes swarm · +50% coins', spawn: 0.8, coin: 1.5 },
  { n: 'POWER HIT', d: 'foes +10% HP · +20% damage', ehp: 1.1, dmg: 1.2 },
  { n: 'SWIFT CURRENT', d: '+35% speed · +10% damage', spd: 1.35, dmg: 1.1 },
  { n: 'CHEAP WATERS', d: 'shop -20% · -10% coins', price: 0.8, coin: 0.9 },
  { n: 'THICK HIDE', d: 'take 25% less damage', taken: 0.75 },
  { n: 'HIGH RISK', d: '+25% damage · take 15% more', dmg: 1.25, taken: 1.15 },
];
export function loopOf(stage) { return Math.floor((stage - 1) / STAGE_COUNT); }
export function templateStage(stage) { return ((stage - 1) % STAGE_COUNT) + 1; }
export function clusterOf(stage) { return Math.floor((stage - 1) / 5); }
export function clusterMod(state, stage) {
  const c = clusterOf(stage || state.stage);
  let h = (state.seed >>> 0) ^ (c * 2654435761);
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  return MODIFIERS[h % MODIFIERS.length];
}
export function modOf(state, key) {
  const m = clusterMod(state, state.stage);
  return (m && m[key]) || 1;
}
export function contentStage(state, pos) {
  const s = pos || state.stage;
  const m = state.stageMap;
  return m ? m[templateStage(s) - 1] : templateStage(s);
}
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const POOL = { x0: 0, y0: 72, x1: 1280, y1: 648, cx: 640, cy: 360, rx: 640, ry: 288 };
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
  const t = templateStage(stage);
  const band = Math.min(5, Math.floor((t - 1) / 5));
  const p = (envs && envs[t - 1]) || ENV_PALETTES[0];
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
  dashCd: 2.0, dashSpeed: 640, dashTime: 0.25, magnet: 75, iframes: 0.5,
};
export const ENEMIES = {
  guppy:    { hp: 10, speed: 102, dmg: 4,  r: 10, score: 10, coins: 1, xp: 2, color: '#ffd166', dark: '#c9962e' },
  jelly:    { hp: 24, speed: 56,  dmg: 7,  r: 16, score: 20, coins: 2, xp: 3, color: '#c9a7ff', dark: '#8a6fd6' },
  urchin:   { hp: 66, speed: 37,  dmg: 10, r: 20, score: 30, coins: 3, xp: 8, color: '#5d4a8a', dark: '#3a2d5e' },
  starfish: { hp: 32, speed: 72,  dmg: 6,  r: 15, score: 20, coins: 2, xp: 3, color: '#ff8fb0', dark: '#d65d7e' },
  eel:      { hp: 18, speed: 152, dmg: 8,  r: 12, score: 30, coins: 2, xp: 5, color: '#7fe0c3', dark: '#3fae8c' },
  squid:     { hp: 28, speed: 176, dmg: 8,  r: 14, score: 40, coins: 2, xp: 5, color: '#ff8a5c', dark: '#c75a30' },
  archer:   { hp: 20, speed: 95,  dmg: 3,  r: 13, score: 35, coins: 2, xp: 6, color: '#7fd4e0', dark: '#3a8ea8' },
  mini:     { hp: 8,  speed: 118, dmg: 5,  r: 8,  score: 5,  coins: 1, xp: 2, color: '#ff8fb0', dark: '#d65d7e' },
};
export const BOSS_XP = 40;
export const SPIT = { speed: 240, r: 6, cd: 3.0, range: 420, aim: 0.35, life: 2.5 };
export const ELITE = { hpMul: 3.6, dmgMul: 1.5, sizeMul: 1.55, score: 150, coins: 5 };
export const BOSS_STAGES = [
  { stage: 5, hp: 3200, dmg: 27, score: 500, coins: 25, summon: 0, summonEvery: 7 },
  { stage: 10, hp: 5200, dmg: 33, score: 1000, coins: 50, summon: 2, summonEvery: 7 },
  { stage: 15, hp: 9000, dmg: 39, score: 1500, coins: 75, summon: 2, summonEvery: 6 },
  { stage: 20, hp: 24000, dmg: 45, score: 2000, coins: 100, summon: 3, summonEvery: 7 },
  { stage: 25, hp: 38000, dmg: 51, score: 2500, coins: 125, summon: 3, summonEvery: 6 },
  { stage: 30, hp: 54000, dmg: 57, score: 4000, coins: 200, summon: 3, summonEvery: 5 },
];
export const BOSS_TYPES = {
  turtle: { name: 'THE ANCIENT TURTLE', speed: 195, r: 46, color: '#8ab86a', dark: '#4a7a3e', dive: 2.4, atk: 'shell', atkEvery: 7 },
  octopus: { name: 'THE EMERALD OCTOPUS', speed: 205, r: 52, color: '#c08497', dark: '#7a4a5e', dive: 2.8, atk: 'ink', atkEvery: 6 },
  hammerhead: { name: 'THE HAMMERHEAD', speed: 215, r: 54, color: '#7a9bb8', dark: '#4a6a8a', dive: 3.0, atk: 'line', atkEvery: 8 },
  angler: { name: 'THE ANGLER', speed: 200, r: 58, color: '#6a5a9a', dark: '#3a2d5e', dive: 2.6, atk: 'lure', atkEvery: 6 },
  stingray: { name: 'THE CRIMSON STINGRAY', speed: 220, r: 60, color: '#c05a5a', dark: '#7a2e2e', dive: 3.2, atk: 'barbs', atkEvery: 5 },
  kraken: { name: 'THE KRAKEN', speed: 210, r: 66, color: '#9a4a6a', dark: '#5a2438', dive: 3.0, atk: 'slam', atkEvery: 8 },
};
export function bossForStage(stage, order) {
  if (stage % 5 !== 0) return null;
  const t = templateStage(stage);
  const st = BOSS_STAGES.find((b) => b.stage === t);
  if (!st) return null;
  const loop = loopOf(stage);
  const type = t === 30 ? 'kraken' : (order || ['turtle', 'octopus', 'hammerhead', 'angler', 'stingray'])[(stage / 5 - 1) % 5];
  const hpMul = 1.35 ** loop, dmgMul = 1.2 ** loop;
  return { stage, type, ...st, ...BOSS_TYPES[type],
    hp: Math.round(st.hp * hpMul), dmg: Math.round(st.dmg * dmgMul),
    score: Math.round(st.score * (1 + loop)), coins: Math.round(st.coins * (1 + loop)) };
}
export const STAGES = Array.from({ length: STAGE_COUNT }, (_, i) => {
  const stage = i + 1;
  const boss = stage % 5 === 0;
  return {
    budget: Math.round((34 + (stage - 1) * 3.8) * (boss ? 0.7 : 1)),
    interval: Math.max(0.45, 0.75 - (stage - 1) * 0.025),
    batch: Math.min(4, 3 + Math.floor((stage - 1) / 8)),
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
  const t = templateStage(stage);
  const w = (stageMix && stageMix[t - 1]) || spawnWeights(t);
  return Object.keys(w).filter((k) => w[k] > 0)
    .sort((a, b) => w[b] - w[a]).slice(0, 2);
}
export function hpScale(stage) {
  const t = templateStage(stage);
  const base = t <= 15 ? 1 + (t - 1) * 0.55 : 1 + 14 * 0.55 + (t - 15) * 0.95;
  return base * (1.35 ** loopOf(stage));
}
export function dmgScale(stage) {
  const t = templateStage(stage);
  const base = t <= 15 ? 1 + (t - 1) * 0.14 : 1 + 14 * 0.14 + (t - 15) * 0.24;
  return base * (1.2 ** loopOf(stage));
}
export function speedScale(stage) { return 1 + (templateStage(stage) - 1) * 0.025; }
export const WEAPON_ORDER = ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser', 'trident'];
export const SHOP = [
  { id: 'bow', kind: 'weapon', price: 50, up: [100, 150, 210, 280], name: 'BUBBLE BOW' },
  { id: 'blaster', kind: 'weapon', price: 110, up: [220, 290, 370, 460], name: 'INK BLASTER' },
  { id: 'shell', kind: 'weapon', price: 90, up: [170, 230, 300, 380], name: 'HOMING SHELL' },
  { id: 'spin', kind: 'weapon', price: 70, up: [140, 190, 250, 320], name: 'WHIRLPOOL SPIN' },
  { id: 'laser', kind: 'weapon', price: 130, up: [200, 260, 330, 420], name: 'LASER GUN' },
  { id: 'trident', kind: 'weapon', price: 120, up: [190, 250, 320, 410], name: 'TRIDENT' },
  { id: 'claw', kind: 'weapon', price: 0, up: [60, 95, 140, 200], name: 'SHARPEN CLAWS' },
];
export const FEAT_IDS = ['slayer', 'beastslayer', 'veteran', 'deepdiver', 'bosscollector', 'arsenal', 'skillmaster', 'weaponmaster', 'skillexpert'];
export const FEAT_NAMES = {
  slayer: 'SLAYER', beastslayer: 'BEAST SLAYER', veteran: 'VETERAN', deepdiver: 'DEEP DIVER',
  bosscollector: 'BOSS COLLECTOR', arsenal: 'FULL ARSENAL', skillmaster: 'SKILL MASTER',
  weaponmaster: 'WEAPON MASTER', skillexpert: 'SKILL EXPERT',
};
export const FEAT_TIERS = {
  slayer: [100, 500, 1000, 5000, 10000],
  beastslayer: [1, 5, 10, 25, 50],
  veteran: [5, 10, 20, 30, 50],
  deepdiver: [10, 30, 60, 100, 200],
  bosscollector: [1, 3, 6],
  arsenal: [3, 5, 7],
  skillmaster: [2, 4, 6],
  weaponmaster: [5, 10, 20],
  skillexpert: [5, 10, 20],
};
export const FEAT_UNITS = {
  slayer: 'kills', beastslayer: 'bosses', veteran: 'level', deepdiver: 'stage',
  bosscollector: 'types', arsenal: 'weapons', skillmaster: 'skills',
  weaponmaster: 'level', skillexpert: 'level',
};
export const CREATURE_NAMES = {
  guppy: 'GUPPY', jelly: 'JELLY', urchin: 'URCHIN',
  starfish: 'STARFISH', eel: 'EEL', squid: 'SQUID', archer: 'ARCHER',
};
export const CREATURE_ORDER = ['guppy', 'jelly', 'urchin', 'starfish', 'eel', 'squid', 'archer'];
export const COMBO_WINDOW = 3.0;
export const COMBO_MAX = 8;
