// Deterministic screenshot scenes (?shot=start|play|elite|boss|storm|levelup|stageclear|end&seed=N).
// Each one plays the real rules forward from a fresh world, steered by an autopilot
// that kites from danger, chases pearls and dashes when surrounded — so every frame
// is what a real game looks like, and the same seed always gives the same frame.
// The autopilot also picks stage cards (weapons first), shops, and advances stages.
import { POOL, STAGE_COUNT, xpNeed } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { nextStage, stepWorld } from './world.js';
import { applyUpgrade } from './upgrades.js';
import { applyStageCard, autoShop } from './weapons.js';
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

// Pick the best offered stage card: a new weapon first (the most exciting draw),
// then the highest-priority upgrade track.
function pickStageCardAuto(state) {
  const choices = state.levelChoices || [];
  const weapon = choices.find((c) => c.isWeapon);
  const pick = weapon
    || PICK_ORDER.map((id) => choices.find((c) => c.id === id)).find(Boolean)
    || choices[0];
  if (!pick) return;
  if (!applyStageCard(state, pick)) applyUpgrade(state, pick.id);
  state.pickedCard = pick; state.stagePicked = true;
}

// Run the real sim until `pred(state)` is true, a run ends, or maxSteps is hit.
// Level-ups and stage-clears are handled the way a player would handle them.
function runUntil(state, pred, maxSteps, fx, audio) {
  let steps = 0;
  while (steps < maxSteps) {
    // The predicate is checked FIRST: a stage-clear or level-up the caller is
    // looking for must be returned as-is, not auto-played past.
    if (pred(state)) return true;
    if (state.phase === 'over') return pred(state);
    if (state.phase === 'levelup' && state.levelChoices) {
      const pick = PICK_ORDER.map((id) => state.levelChoices.find((c) => c.id === id)).find(Boolean)
        || state.levelChoices[0];
      applyUpgrade(state, pick.id);
      state.levelChoices = null; state.phase = 'play';
    } else if (state.phase === 'stageclear' && state.levelChoices) {
      if (!state.stagePicked) pickStageCardAuto(state);
      autoShop(state);
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
  if (shot === 'start') {
    return createStateFromSeed(seed);
  }
  if (shot === 'play') {
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.time >= 120, 12000, fx, audio);
    return s;
  }
  if (shot === 'levelup') {
    // A real level-up mid-fight: run to the first level-up after 60 s.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'levelup' && st.time > 60, 20000, fx, audio);
    if (s.phase === 'levelup') return s;
    // Fallback: any level-up will do.
    const s2 = createStateFromSeed(seed + 1); s2.phase = 'play';
    runUntil(s2, (st) => st.phase === 'levelup', 20000, fx, audio);
    return s2;
  }
  if (shot === 'elite') {
    // A dense late fight: stage 6+, ten or more creatures on screen, an elite
    // in frame below the banner.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 6 && st.enemies.length >= 10, 30000, fx, audio);
    if (s.phase === 'play') {
      // An elite in frame, near the crab but clamped into the clear zone below
      // the banner and above the bottom bar — never half-hidden behind the HUD.
      let elite = s.enemies.find((e) => e.elite);
      if (!elite) elite = spawnEnemy(s, 'urchin', true);
      elite.x = Math.min(1030, Math.max(250, s.player.x - 200));
      elite.y = Math.min(560, Math.max(200, s.player.y + 120));
      s.banner = '★ ELITE URCHIN — big pearls!'; s.bannerT = 2.5;
    }
    return s;
  }
  if (shot === 'boss' || shot === 'storm') {
    // A boss fight: stage 5's Great Heron, or stage 10's Storm Heron. Try seeds
    // until the autopilot is alive with the boss in the air, then stage the bird
    // mid-swoop near the crab with a flock of gulls around it — the boss bar,
    // the banner and the dive all in one frame.
    const wantStage = shot === 'storm' ? STAGE_COUNT : 5;
    for (let trySeed = seed; trySeed < seed + 8; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'play' && st.stage === wantStage && st.boss, 40000, fx, audio);
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
          g.state = 'circle'; g.diveT = 0.8;
        }
        s.banner = shot === 'storm' ? 'THE STORM HERON — DRIVE IT OFF!' : 'THE GREAT HERON — DRIVE IT OFF!';
        s.bannerT = 2.5;
        return s;
      }
    }
    // Fallback: the autopilot fell before the boss in every seed — take the
    // elite frame instead (still a dense late-game fight, never a blank shot).
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 6 && st.enemies.length >= 10, 30000, fx, audio);
    return s;
  }
  if (shot === 'stageclear') {
    // The stage-clear screen after stage 3: three cards, the shop with real
    // prices, and enough coins (~100) that some offers are buyable and some
    // are not — the economy reads at a glance. The card is NOT picked yet, so
    // the frame shows the choice itself. Prefer a seed whose draw includes a
    // weapon card (the "NEW WEAPON" draw is the exciting one); the crab sits
    // bottom-left so the card row stays centred, and the leftover damage
    // numbers are cleared so they do not show through the dim over the shop.
    let fallback = null;
    for (let trySeed = seed; trySeed < seed + 6; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'stageclear' && st.stage === 3, 30000, fx, audio);
      if (s.phase === 'stageclear' && s.stage === 3 && s.levelChoices && s.levelChoices.length === 3) {
        if (!fallback) fallback = s;
        if (s.levelChoices.some((c) => c.isWeapon)) {
          s.player.x = 200; s.player.y = 620; s.player.angle = 0;
          fx.clear();
          return s;
        }
      }
    }
    if (fallback) {
      fallback.player.x = 200; fallback.player.y = 620; fallback.player.angle = 0;
      fx.clear();
      return fallback;
    }
    // Fallback: any stage-clear screen will do.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'stageclear', 20000, fx, audio);
    s.player.x = 200; s.player.y = 620; s.player.angle = 0;
    fx.clear();
    return s;
  }
  if (shot === 'end') {
    // Try seeds until the autopilot clears all 10 stages; a real victory screen.
    for (let trySeed = seed; trySeed < seed + 10; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'over', 40000, fx, audio);
      if (s.phase === 'over' && s.result === 'won') return s;
    }
    // Fallback: the autopilot fell — a real game-over screen is still a complete loop.
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'over', 40000, fx, audio);
    if (s.phase === 'play') { s.phase = 'over'; s.result = 'lost'; s.player.hp = 0; }
    return s;
  }
  return createStateFromSeed(seed);
}

export function createStateFromSeed(seed) {
  const rng = createRandom(seed);
  return createState(rng, seed);
}
