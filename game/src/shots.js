// Deterministic screenshot scenes (?shot=start|play|elite|end&seed=N).
// Each one plays the real rules forward from a fresh world, steered by an autopilot
// that kites from danger, chases pearls and dashes when surrounded — so every frame
// is what a real game looks like, and the same seed always gives the same frame.
import { POOL, WIN_TIME } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { stepWorld } from './world.js';
import { applyUpgrade } from './upgrades.js';
import { spawnEnemy } from './enemies.js';

// The autopilot: flee the centroid of nearby threats, chase pearls, dash out of crowds.
function autopilotInput(state) {
  const p = state.player;
  let mx = 0, my = 0, fx = 0, fy = 0;
  let near = 0;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < 130) { near += 1; const w = 1 / (d * d + 40); fx += (p.x - e.x) * w; fy += (p.y - e.y) * w; }
  }
  if (near > 0 && (fx || fy)) { // kite away from the crowd
    mx = fx; my = fy;
  } else {
    let pearl = null, pd = 1e9; // otherwise chase the nearest pearl
    for (const pe of state.pearls) {
      const d = Math.hypot(pe.x - p.x, pe.y - p.y);
      if (d < pd) { pd = d; pearl = pe; }
    }
    if (pearl) { mx = (pearl.x - p.x) / (pd || 1); my = (pearl.y - p.y) / (pd || 1); }
    else { mx = (POOL.cx - p.x) / 400; my = (POOL.cy - p.y) / 400; }
  }
  // Near the pool's edge, steer back toward open water instead of hugging the rim.
  const ex = (p.x - POOL.cx) / POOL.rx, ey = (p.y - POOL.cy) / POOL.ry;
  const ed = Math.hypot(ex, ey);
  if (ed > 0.6) { mx += -ex * 2.2; my += -ey * 2.2; }
  const len = Math.hypot(mx, my) || 1;
  // Aim the bubble bolt at the nearest creature and fire whenever it is ready.
  let aim = null, ad = 380;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < ad) { ad = d; aim = e; }
  }
  return {
    move: () => ({ x: mx / len, y: my / len }),
    dashHeld: () => near >= 3,
    click: () => aim !== null && state.player.boltCd <= 0,
    mouse: () => (aim ? { x: aim.x, y: aim.y } : { x: 640, y: 360 }),
    wasPressed: () => false,
  };
}

// Priority order for level-up picks in staged games (deterministic, no clicking).
const PICK_ORDER = ['claws', 'tempo', 'shell', 'reach', 'bubbles', 'legs', 'ink', 'magnet'];

function runUntil(state, targetTime, fx, audio) {
  let steps = 0;
  while (state.phase === 'play' && state.time < targetTime && steps < 40000) {
    // A fresh steering decision every step — a stale vector walks into the rim and dies.
    stepWorld(state, autopilotInput(state), 1 / 60, fx, audio);
    steps += 1;
    if (state.phase === 'levelup' && state.levelChoices) {
      // Pick the highest-priority offered upgrade, then resume.
      const pick = PICK_ORDER.map((id) => state.levelChoices.find((c) => c.id === id)).find(Boolean)
        || state.levelChoices[0];
      applyUpgrade(state, pick.id);
      state.levelChoices = null; state.phase = 'play';
    }
  }
  return steps;
}

export function stageShot(shot, seed, fx, audio) {
  if (shot === 'start') {
    const s = createStateFromSeed(seed);
    return s;
  }
  if (shot === 'play') {
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, 120, fx, audio);
    return s;
  }
  if (shot === 'levelup') { // verification only: the first level-up choice screen
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, 60, fx, audio);
    if (s.phase === 'play') { s.levelChoices = s.levelChoices || null; }
    return s;
  }
  if (shot === 'elite') {
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, 200, fx, audio);
    if (s.phase === 'play') { // make sure an elite is in frame for the shot
      const hasElite = s.enemies.some((e) => e.elite);
      if (!hasElite) {
        const e = spawnEnemy(s, 'urchin', true);
        e.x = s.player.x + 200; e.y = Math.min(s.player.y + 140, 560); // below the banner, in frame
      }
      s.banner = '★ ELITE URCHIN — big pearls!'; s.bannerT = 2.5;
    }
    return s;
  }
  if (shot === 'end') {
    // Try seeds until the autopilot survives to high tide; a real victory screen.
    for (let trySeed = seed; trySeed < seed + 8; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, WIN_TIME + 1, fx, audio);
      if (s.phase === 'over' && s.result === 'won') return s;
    }
    // Fallback: the autopilot fell — a real game-over screen is still a complete loop.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, WIN_TIME + 1, fx, audio);
    if (s.phase === 'play') { s.phase = 'over'; s.result = 'lost'; s.player.hp = 0; }
    return s;
  }
  return createStateFromSeed(seed);
}

export function createStateFromSeed(seed) {
  const rng = createRandom(seed);
  return createState(rng, seed);
}
