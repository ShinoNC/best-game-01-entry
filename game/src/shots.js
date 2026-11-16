// Deterministic screenshot scenes (?shot=start|play|elite|boss|storm|stageclear|end&seed=N).
// Each one plays the real rules forward from a fresh world, steered by an autopilot
// that kites from danger, chases coins and dashes when surrounded — so every frame
// is what a real game looks like, and the same seed always gives the same frame.
// The autopilot also shops in the stage-clear menu (autoBuy) and advances stages.
import { POOL, STAGE_COUNT } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { nextStage, stepWorld } from './world.js';
import { autoBuy } from './cards.js';
import { spawnEnemy } from './enemies.js';

// The autopilot: flee the centroid of nearby threats, chase coins, dash out of crowds.
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
    let coin = null, pd = 1e9; // otherwise chase the nearest coin
    for (const pe of state.drops) {
      const d = Math.hypot(pe.x - p.x, pe.y - p.y);
      if (d < pd) { pd = d; coin = pe; }
    }
    if (coin) { mx = (coin.x - p.x) / (pd || 1); my = (coin.y - p.y) / (pd || 1); }
    else { mx = (POOL.cx - p.x) / 400; my = (POOL.cy - p.y) / 400; }
  }
  // Near the pool's edge, steer back toward open water instead of hugging the rim.
  const ex = (p.x - POOL.cx) / POOL.rx, ey = (p.y - POOL.cy) / POOL.ry;
  const ed = Math.hypot(ex, ey);
  if (ed > 0.6) { mx += -ex * 2.2; my += -ey * 2.2; }
  const len = Math.hypot(mx, my) || 1;
  return {
    move: () => ({ x: mx / len, y: my / len }),
    dashHeld: () => near >= 3,
    wasPressed: () => false,
  };
}

// Run the real sim until `pred(state)` is true, a run ends, or maxSteps is hit.
// Stage-clears are handled the way a player would handle them (shop, then advance).
function runUntil(state, pred, maxSteps, fx, audio) {
  let steps = 0;
  while (steps < maxSteps) {
    // The predicate is checked FIRST: a stage-clear the caller is looking for
    // must be returned as-is, not auto-played past.
    if (pred(state)) return true;
    if (state.phase === 'over') return pred(state);
    if (state.phase === 'stageclear') {
      autoBuy(state);
      nextStage(state, audio);
    } else if (state.phase === 'play') {
      // A fresh steering decision every step — a stale vector walks into the rim and dies.
      stepWorld(state, autopilotInput(state), 1 / 60, fx, audio);
    } else {
      return pred(state);
    }
    steps += 1;
  }
  return pred(state);
}

export function stageShot(shot, seed, fx, audio) {
  // Staging runs the full sim synchronously on the main thread — real WebAudio
  // would create tens of thousands of oscillator nodes for a 30-stage win, so
  // the staged run is silent.
  audio = new Proxy({}, { get: () => () => {} });
  if (shot === 'start') {
    return createStateFromSeed(seed);
  }
  if (shot === 'play') {
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.time >= 120, 12000, fx, audio);
    return s;
  }
  if (shot === 'elite') {
    // A dense late fight: stage 12+, ten or more creatures on screen, an elite
    // in frame below the banner — by then the crab owns several weapons, so
    // the frame shows the whole arsenal firing at once.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 12 && st.enemies.length >= 10, 60000, fx, audio);
    if (s.phase === 'play') {
      // An elite in frame, near the crab but clamped into the clear zone below
      // the banner and above the bottom bar — never half-hidden behind the HUD.
      let elite = s.enemies.find((e) => e.elite);
      if (!elite) elite = spawnEnemy(s, 'urchin', true);
      elite.x = Math.min(1030, Math.max(250, s.player.x - 200));
      elite.y = Math.min(560, Math.max(200, s.player.y + 120));
      s.banner = '★ ELITE URCHIN — big coins!'; s.bannerT = 2.5;
      // The frame shows the whole arsenal firing at once: the laser beam and
      // the spin ring are mid-blast when the frame is taken (the staged state
      // is static, so the timers hold until the screenshot).
      if (s.weapons.laser > 0) {
        s.player.laser = 0.15; s.player.laserLen = 420;
        s.player.laserBeams = s.weapons.laser >= 5 ? 2 : 1;
      }
      if (s.weapons.spin > 0) s.player.spin = 0.15;
    }
    return s;
  }
  if (shot === 'boss' || shot === 'storm') {
    // A boss fight: stage 5's Great Heron, or stage 30's Heron King. Try seeds
    // until the autopilot is alive with the boss in the air, then stage the bird
    // mid-swoop near the crab with a flock of gulls around it — the boss bar,
    // the banner and the dive all in one frame.
    const wantStage = shot === 'storm' ? STAGE_COUNT : 5;
    for (let trySeed = seed; trySeed < seed + 8; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'play' && st.stage === wantStage && st.boss, 120000, fx, audio);
      if (s.phase === 'play' && s.boss && s.stage === wantStage) {
        const b = s.boss;
        // Dive in from the upper right of the crab — clamped into the clear
        // zone below the HUD boxes and above the bottom bar, so the bird is
        // never hidden behind the timer or the boss bar.
        b.x = Math.min(1030, Math.max(250, s.player.x + 170));
        b.y = Math.min(560, Math.max(200, s.player.y - 130));
        b.state = 'dive'; b.diveT = 0.4; // mid-swoop when the frame is taken
        b.hp = Math.min(b.hp, b.maxHp * 0.7); // the bar shows real damage, not a full bar
        for (let i = 0; i < 3; i += 1) { // a flock of gulls joins the fight
          const g = spawnEnemy(s, 'gull', false);
          const a = 0.6 + i * 2.0;
          g.x = Math.min(1160, Math.max(120, s.player.x + Math.cos(a) * 220));
          g.y = Math.min(600, Math.max(170, s.player.y + Math.sin(a) * 150));
          // diveT under 0.6 s: their dive telegraphs (dashed line + ring on
          // the crab) are visible in the frame — the flock is about to burst.
          g.state = 'circle'; g.diveT = 0.4;
        }
        // The frame shows the whole arsenal firing at once: the laser beam and
        // the spin ring are mid-blast when the frame is taken (the staged state
        // is static, so the timers hold until the screenshot).
        if (s.weapons.laser > 0) {
          s.player.laser = 0.15; s.player.laserLen = 420;
          s.player.laserBeams = s.weapons.laser >= 5 ? 2 : 1;
        }
        if (s.weapons.spin > 0) s.player.spin = 0.15;
        // The crab holds a guppy overhead — the Claw Grab reads in the cover.
        const held = spawnEnemy(s, 'guppy', false);
        s.enemies.splice(s.enemies.indexOf(held), 1);
        s.player.grab = held; s.player.grabT = 4;
        s.banner = `${b.name} — DRIVE IT OFF!`;
        s.bannerT = 2.5;
        return s;
      }
    }
    // Fallback: the autopilot fell before the boss in every seed — take the
    // elite frame instead (still a dense late-game fight, never a blank shot).
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 12 && st.enemies.length >= 10, 60000, fx, audio);
    return s;
  }
  if (shot === 'stageclear') {
    // The stage-clear menu after a LATER stage (15 first, then 10, then 3):
    // a fuller build reads in the YOUR BUILD row, and the menu shows real
    // mid-game choices. Enough coins (~150) that some cards are buyable and
    // some are not — the economy reads at a glance. Prefer a seed whose hand
    // includes a weapon card (the "NEW WEAPON" draw is the exciting one);
    // the crab sits bottom-left so the menu stays centred, and the leftover
    // damage numbers are cleared so they do not show through the dim.
    for (const wantStage of [15, 10, 3]) {
      let fallback = null;
      for (let trySeed = seed; trySeed < seed + 6; trySeed += 1) {
        const s = createStateFromSeed(trySeed); s.phase = 'play';
        runUntil(s, (st) => st.phase === 'stageclear' && st.stage === wantStage, 60000, fx, audio);
        if (s.phase === 'stageclear' && s.stage === wantStage && s.hand && s.hand.length >= 3) {
          if (!fallback) fallback = s;
          if (s.hand.some((c) => c.kind === 'weapon')) {
            s.player.x = 200; s.player.y = 620; s.player.angle = 0;
            s.coins = Math.max(s.coins, 150); // some cards affordable, some not — the economy reads at a glance
            fx.clear();
            return s;
          }
        }
      }
      if (fallback) {
        fallback.player.x = 200; fallback.player.y = 620; fallback.player.angle = 0;
        fallback.coins = Math.max(fallback.coins, 150);
        fx.clear();
        return fallback;
      }
    }
    // Fallback: any stage-clear screen will do.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'stageclear', 20000, fx, audio);
    s.player.x = 200; s.player.y = 620; s.player.angle = 0;
    s.coins = Math.max(s.coins, 150);
    fx.clear();
    return s;
  }
  if (shot === 'end') {
    // Try seeds until the autopilot clears all 30 stages; prefer a GRADE S
    // win (60+ HP left) — the strongest victory screen. Fall back to the
    // best win found (highest HP), then to a real game-over screen.
    let bestWin = null;
    for (let trySeed = seed; trySeed < seed + 10; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'over', 120000, fx, audio);
      if (s.phase === 'over' && s.result === 'won') {
        if (s.player.hp >= 60) { fx.clear(); return s; }
        if (!bestWin || s.player.hp > bestWin.player.hp) bestWin = s;
      }
    }
    if (bestWin) { fx.clear(); return bestWin; }
    // Fallback: the autopilot fell — a real game-over screen is still a complete loop.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'over', 120000, fx, audio);
    if (s.phase === 'play') { s.phase = 'over'; s.result = 'lost'; s.player.hp = 0; }
    fx.clear();
    return s;
  }
  return createStateFromSeed(seed);
}

export function createStateFromSeed(seed) {
  const rng = createRandom(seed);
  return createState(rng, seed);
}
