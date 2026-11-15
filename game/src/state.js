// One GameState holds everything. Phases: title, play, levelup, paused, over.
// A fresh state is cheap, so restart is just createState with the same seed stream.
import { PAL, PLAYER, POOL, WIN_TIME } from './config.js';

export function createState(rng, seed) {
  const decor = [];
  for (let i = 0; i < 46; i += 1) { // rocks, weed tufts and shells scattered in the pool
    const a = rng.angle(), rr = Math.sqrt(rng.next());
    decor.push({
      x: POOL.cx + Math.cos(a) * rr * POOL.rx * 0.94,
      y: POOL.cy + Math.sin(a) * rr * POOL.ry * 0.94,
      kind: rng.pick(['rock', 'rock', 'weed', 'weed', 'shell', 'star']),
      s: rng.range(0.6, 1.6), rot: rng.angle(),
    });
  }
  return {
    rng, seed, decor, time: 0, phase: 'title',
    player: {
      x: POOL.cx, y: POOL.cy + 40, vx: 0, vy: 0, angle: -Math.PI / 2,
      hp: PLAYER.hp, maxHp: PLAYER.hp, radius: PLAYER.radius,
      speed: PLAYER.speed, clawDamage: PLAYER.clawDamage, clawRate: PLAYER.clawRate,
      clawRange: PLAYER.clawRange, clawCd: 0, boltCd: 0, dashCd: 0, dashT: 0,
      iframes: 0, magnet: PLAYER.magnet, shellTier: 0, flash: 0, swing: 0,
    },
    // Upgrade levels, one slot per track — the HUD shows these as ability slots.
    ups: { claws: 0, tempo: 0, reach: 0, shell: 0, legs: 0, bubbles: 0, ink: 0, magnet: 0 },
    level: 1, xp: 0, pearlsCollected: 0,
    enemies: [], bolts: [], pearls: [], pickups: [], inks: [],
    kills: 0, score: 0, wave: 1, spawnT: 0.8, eliteT: 45, bossSpawned: false,
    boss: null, banner: '', bannerT: 0, bubbleT: 6, result: null, best: 0,
    levelChoices: null, stats: { damage: 0, taken: 0, dashes: 0 },
  };
}

export function fmtTime(t) {
  const s = Math.max(0, Math.ceil(WIN_TIME - t));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
export { PAL };
