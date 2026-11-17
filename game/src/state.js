// One GameState holds everything. Phases: title, play, stageclear, paused, over.
// A fresh state is cheap, so restart is just createState with the same seed stream.
// Coins are the single currency: kills drop coins only, and the stage-clear menu
// spends them on cards (weapons, weapon levels, skills). There is no level or XP.
import { PAL, PLAYER, POOL } from './config.js';

export function createState(rng, seed, difficulty = 'normal') {
  // Run variety (criterion 2): every run reshuffles the pool. A theme picks
  // the decor mix (rocky / weedy / shelly) and the count (45–75 pieces), and
  // a spawn mix tilts which creatures the tide brings (×0.85–×1.2 per type,
  // same total budget). Same seed = same pool; a new run is a new pool.
  const theme = rng.pick(['rocky', 'weedy', 'shelly']);
  const kinds = theme === 'rocky' ? ['rock', 'rock', 'rock', 'weed', 'shell', 'star']
    : theme === 'weedy' ? ['weed', 'weed', 'weed', 'rock', 'shell', 'star']
    : ['shell', 'shell', 'star', 'star', 'weed', 'rock'];
  const decor = [];
  const nDecor = 45 + Math.floor(rng.next() * 31);
  for (let i = 0; i < nDecor; i += 1) { // rocks, weed tufts and shells scattered in the pool
    const a = rng.angle(), rr = Math.sqrt(rng.next());
    decor.push({
      x: POOL.cx + Math.cos(a) * rr * POOL.rx * 0.94,
      y: POOL.cy + Math.sin(a) * rr * POOL.ry * 0.94,
      kind: rng.pick(kinds),
      s: rng.range(0.6, 1.6), rot: rng.angle(),
    });
  }
  const mix = {};
  for (const k of ['guppy', 'jelly', 'urchin', 'starfish', 'eel', 'gull', 'archer']) mix[k] = rng.range(0.85, 1.2);
  return {
    rng, seed, decor, theme, mix, time: 0, phase: 'title',
    difficulty, // 'easy' | 'normal' | 'hard' — set on the title, fixed for the run
    // Combo: chained kills raise the score multiplier (×1–×8). comboT counts
    // down from COMBO_WINDOW after every kill; at 0 the chain resets.
    combo: 0, comboT: 0,
    player: {
      x: POOL.cx, y: POOL.cy + 40, px: POOL.cx, py: POOL.cy + 40, // px/py = position at the previous sim step (render interpolation)
      vx: 0, vy: 0, angle: -Math.PI / 2,
      hp: PLAYER.hp, maxHp: PLAYER.hp, radius: PLAYER.radius,
      speed: PLAYER.speed, weapCd: { claw: 0, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0 },
      dashCd: 0, dashT: 0,
      grab: null, grabCd: 0, grabT: 0, // Claw Grab: held creature, cooldown, escape timer
      iframes: 0, magnet: PLAYER.magnet, shellTier: 0, flash: 0, swing: 0, spin: 0,
      laser: 0, laserLen: 0, laserBeams: 1, moving: 0,
    },
    // Upgrade levels, one slot per track — the HUD shows them as skill slots.
    ups: { claws: 0, tempo: 0, reach: 0, shell: 0, legs: 0, bubbles: 0, ink: 0, magnet: 0 },
    coins: 0, coinsEarned: 0,
    // Six auto-weapons, ALL firing at once. Claw is owned from the start;
    // the rest come from menu cards. Level 0 = not owned.
    weapons: { claw: 1, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0 },
    // Stage progression: the stage clears when the budget is spent and the
    // pool is empty. stageClearT is the banner beat before the menu.
    stage: 1, stageSpawned: 0, stageEliteDone: false, stageClearT: 0,
    enemies: [], bolts: [], spits: [], drops: [], pickups: [], inks: [],
    kills: 0, score: 0, spawnT: 0.8, bossSpawned: false,
    boss: null, banner: '', bannerT: 0, bubbleT: 6, result: null, best: 0,
    // The stage-clear menu: the 5-card hand, rerolls used this visit, the
    // clear bonus paid for this stage, and a transient message slot
    // (e.g. "NOT ENOUGH COINS") shown under the buttons.
    hand: [], rerolls: 0, clearBonus: 0, menuMsg: '', menuMsgT: 0,
    stats: { damage: 0, taken: 0, dashes: 0, spent: 0, rerolls: 0,
      // Feat counters: bosses driven off, best combo reached, most coins held
      // at once, and whether any stage was cleared without a scratch.
      bossesDown: 0, bestCombo: 0, maxCoins: 0, cleanStage: false },
    stageTaken: 0, // damage taken during the current stage (UNTOUCHED feat)
    // The tutorial hint queue and the boss warning.
    hints: { idx: 0, cur: null, t: 0, wait: 0, done: [false, false, false, false] },
    bossWarned: false,
  };
}

export { PAL };
