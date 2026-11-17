// One GameState holds everything. Phases: title, play, stageclear, paused, over.
import { PAL, PLAYER, POOL } from './config.js';

export function createState(rng, seed, difficulty = 'normal') {
// Run variety: every run reshuffles the pool theme and spawn mix. Same seed = same pool.
  const theme = rng.pick(['rocky', 'weedy', 'shelly']);
  const kinds = theme === 'rocky' ? ['rock', 'rock', 'rock', 'weed', 'shell', 'star']
    : theme === 'weedy' ? ['weed', 'weed', 'weed', 'rock', 'shell', 'star']
    : ['shell', 'shell', 'star', 'star', 'weed', 'rock'];
  const decor = [];
  const nDecor = 45 + Math.floor(rng.next() * 31);
  for (let i = 0; i < nDecor; i += 1) { // rocks, weed tufts and shells scattered in the pool
    decor.push({
      x: POOL.x0 + 20 + rng.next() * (POOL.x1 - POOL.x0 - 40),
      y: POOL.y0 + 20 + rng.next() * (POOL.y1 - POOL.y0 - 40),
      kind: rng.pick(kinds),
      s: rng.range(0.6, 1.6), rot: rng.angle(),
    });
  }
  const mix = {};
  for (const k of ['guppy', 'jelly', 'urchin', 'starfish', 'eel', 'gull', 'archer']) mix[k] = rng.range(0.85, 1.2);
  return {
    rng, seed, decor, theme, mix, time: 0, phase: 'title', menuSel: 0,
    difficulty, // 'easy' | 'normal' | 'hard' — set on the title, fixed for the run
// Combo: chained kills raise the score multiplier (x1-x8).
    combo: 0, comboT: 0,
    player: {
      x: POOL.cx, y: POOL.cy + 40, px: POOL.cx, py: POOL.cy + 40, // px/py = position at the previous sim step (render interpolation)
      vx: 0, vy: 0, angle: -Math.PI / 2,
      hp: PLAYER.hp, maxHp: PLAYER.hp, radius: PLAYER.radius,
      speed: PLAYER.speed, weapCd: { claw: 0, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0, trident: 0 },
      dashCd: 0, dashT: 0,
      iframes: 0, magnet: PLAYER.magnet, shellTier: 0, flash: 0, swing: 0, spin: 0,
      laser: 0, laserLen: 0, laserBeams: 1, moving: 0,
    },
    ups: { claws: 0, tempo: 0, reach: 0, shell: 0, legs: 0, bubbles: 0, magnet: 0 },
    coins: 0, coinsEarned: 0,
// Seven auto-weapons, ALL firing at once. Claw is owned from the start.
    weapons: { claw: 1, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0, trident: 0 },
// Stage progression: the stage clears when the budget is spent and the pool is empty.
    stage: 1, stageSpawned: 0, stageEliteDone: false, stageClearT: 0,
    enemies: [], bolts: [], spits: [], drops: [], pickups: [],
    kills: 0, score: 0, spawnT: 0.8, bossSpawned: false,
    boss: null, banner: '', bannerT: 0, bubbleT: 6, result: null, best: 0,
// The stage-clear menu: the 5-card hand, rerolls, clear bonus, message slot.
    hand: [], rerolls: 0, clearBonus: 0, menuMsg: '', menuMsgT: 0,
    stats: { damage: 0, taken: 0, dashes: 0, spent: 0, rerolls: 0,
// Feat counters: bosses, best combo, most coins held, scratch-free stages.
      bossesDown: 0, bestCombo: 0, maxCoins: 0, cleanStage: false },
    stageTaken: 0, // damage taken during the current stage (UNTOUCHED feat)
    hints: { idx: 0, cur: null, t: 0, wait: 0, done: [false, false, false, false] },
    bossWarned: false,
  };
}

export { PAL };
