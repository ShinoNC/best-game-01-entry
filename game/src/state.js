import { ENV_PALETTES, MODIFIERS, PAL, PLAYER, POOL, genStageMix } from './config.js';

export function createState(rng, seed, difficulty = 'normal') {
  const theme = rng.pick(['rocky', 'weedy', 'shelly', 'coral']);
  const kinds = theme === 'rocky' ? ['rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'weed', 'shell']
    : theme === 'weedy' ? ['weed', 'weed', 'weed', 'weed', 'weed', 'weed', 'weed', 'weed', 'rock', 'shell']
    : theme === 'coral' ? ['coral', 'coral', 'coral', 'coral', 'coral', 'coral', 'coral', 'coral', 'rock', 'weed']
    : ['shell', 'shell', 'shell', 'shell', 'star', 'star', 'star', 'star', 'rock', 'weed'];
  const decor = [];
  const nDecor = 45 + Math.floor(rng.next() * 31);
  for (let i = 0; i < nDecor; i += 1) {
    decor.push({
      x: POOL.x0 + 20 + rng.next() * (POOL.x1 - POOL.x0 - 40),
      y: POOL.y0 + 20 + rng.next() * (POOL.y1 - POOL.y0 - 40),
      kind: rng.pick(kinds),
      s: rng.range(0.6, 1.6), rot: rng.angle(),
    });
  }
  const rocks = decor.filter((d) => d.kind === 'rock' && d.y >= 180);
  for (const d of decor) {
    if (d.kind !== 'weed') continue;
    if (rocks.length && rng.next() < 0.6) {
      const r = rocks[Math.floor(rng.next() * rocks.length)];
      d.x = r.x; d.y = r.y - 4 * r.s;
    } else {
      d.y = POOL.y1 - 10 - rng.next() * 20;
    }
  }
  const envs = Array.from({ length: 30 }, () => rng.pick(ENV_PALETTES));
  const bossOrder = ['turtle', 'octopus', 'hammerhead', 'angler', 'stingray'];
  for (let i = bossOrder.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [bossOrder[i], bossOrder[j]] = [bossOrder[j], bossOrder[i]];
  }
  const stageMap = [];
  for (let b = 0; b < 6; b += 1) {
    const four = [b * 5 + 1, b * 5 + 2, b * 5 + 3, b * 5 + 4];
    if (b > 0) for (let i = 3; i > 0; i -= 1) {
      const j = Math.floor(rng.next() * (i + 1));
      [four[i], four[j]] = [four[j], four[i]];
    }
    stageMap.push(...four, b * 5 + 5);
  }
  const stageMix = [];
  for (let s = 1; s <= 30; s += 1) stageMix.push(s % 5 === 0 ? null : genStageMix(rng, s));
  const modifier = rng.pick(MODIFIERS);
  const hp0 = Math.round(PLAYER.hp * (modifier.hpMul || 1));
  return {
    rng, seed, decor, theme, stageMix, envs, bossOrder, stageMap, modifier, sandCorner: ['tl', 'tr', 'bl', 'br'][((seed % 4) + 4) % 4], time: 0, phase: 'title', menuSel: 0,
    difficulty,
    combo: 0, comboT: 0,
    player: {
      x: POOL.cx, y: POOL.cy + 40, px: POOL.cx, py: POOL.cy + 40,
      vx: 0, vy: 0, angle: -Math.PI / 2,
      hp: hp0, maxHp: hp0, armor: 0, radius: PLAYER.radius,
      speed: PLAYER.speed * (modifier.spd || 1), weapCd: { claw: 0, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0, trident: 0 },
      dashCd: 0, dashT: 0,
      iframes: 0, magnet: PLAYER.magnet, shellTier: 0, flash: 0, swing: 0, spin: 0,
      laser: 0, laserLen: 0, laserBeams: 1, moving: 0,
    },
    ups: { claws: 0, tempo: 0, reach: 0, shell: 0, legs: 0, bubbles: 0, magnet: 0 },
    skillPts: 1,
    coins: 0, coinsEarned: 0,
    weapons: { claw: 1, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0, trident: 0 },
    stage: 1, stageSpawned: 0, stageEliteDone: false, stageClearT: 0,
    enemies: [], bolts: [], spits: [], drops: [], pickups: [],
    kills: 0, score: 0, spawnT: 0.8, bossSpawned: false,
    boss: null, banner: '', bannerT: 0, bubbleT: 6, result: null, best: 0,
    hand: [], rerolls: 0, clearBonus: 0, menuMsg: '', menuMsgT: 0,
    stats: { damage: 0, taken: 0, dashes: 0, spent: 0, rerolls: 0,
      bossesDown: 0, bestCombo: 0, maxCoins: 0, cleanStage: false },
    stageTaken: 0,
    hints: { idx: 0, cur: null, t: 0, wait: 0, done: [false, false, false, false] },
    bossWarned: false,
  };
}

export { PAL };
