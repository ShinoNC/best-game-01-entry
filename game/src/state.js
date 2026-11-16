// One GameState holds everything. Phases: title, play, levelup, stageclear, paused, over.
// A fresh state is cheap, so restart is just createState with the same seed stream.
import { PAL, PLAYER, POOL } from './config.js';

export function createState(rng, seed) {
  const decor = [];
  for (let i = 0; i < 60; i += 1) { // rocks, weed tufts and shells scattered in the pool
    const a = rng.angle(), rr = Math.sqrt(rng.next());
    decor.push({
      x: POOL.cx + Math.cos(a) * rr * POOL.rx * 0.94,
      y: POOL.cy + Math.sin(a) * rr * POOL.ry * 0.94,
      kind: rng.pick(['rock', 'rock', 'weed', 'weed', 'weed', 'shell', 'star']),
      s: rng.range(0.6, 1.6), rot: rng.angle(),
    });
  }
  return {
    rng, seed, decor, time: 0, phase: 'title',
    player: {
      x: POOL.cx, y: POOL.cy + 40, vx: 0, vy: 0, angle: -Math.PI / 2,
      hp: PLAYER.hp, maxHp: PLAYER.hp, radius: PLAYER.radius,
      speed: PLAYER.speed, weapCd: { claw: 0, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0 },
      dashCd: 0, dashT: 0,
      iframes: 0, magnet: PLAYER.magnet, shellTier: 0, flash: 0, swing: 0, spin: 0,
      laser: 0, laserLen: 0, laserBeams: 1, moving: 0,
    },
    // Upgrade levels, one slot per track — the HUD shows these as ability slots.
    ups: { claws: 0, tempo: 0, reach: 0, shell: 0, legs: 0, bubbles: 0, ink: 0, magnet: 0 },
    level: 1, xp: 0, pearlsCollected: 0, coins: 0, coinsEarned: 0,
    // Six auto-weapons, ALL firing at once — there is no equipped weapon.
    // Claw is owned from the start; the rest come from stage cards or the
    // shop. Level 0 = not owned; each weapon has its own cooldown (weapCd).
    weapons: { claw: 1, bow: 0, blaster: 0, shell: 0, spin: 0, laser: 0 },
    // Stage progression. stageSpawned counts this stage's spawned enemies
    // against the stage budget; the stage clears when the budget is spent and
    // the pool is empty. stageClearT is the banner beat before the card+shop.
    stage: 1, stageSpawned: 0, stageEliteDone: false, stageClearT: 0,
    enemies: [], bolts: [], pearls: [], pickups: [], inks: [],
    kills: 0, score: 0, spawnT: 0.8, bossSpawned: false,
    boss: null, banner: '', bannerT: 0, bubbleT: 6, result: null, best: 0,
    levelChoices: null, cardSource: 'level', stagePicked: false, pickedCard: null,
    stats: { damage: 0, taken: 0, dashes: 0, spent: 0 },
    // The tutorial hint queue, the boss warning, the level-up flash.
    hints: { idx: 0, cur: null, t: 0, wait: 0, done: [false, false, false, false, false] },
    bossWarned: false, levelFlash: 0,
  };
}

export { PAL };
