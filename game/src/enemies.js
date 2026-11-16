// Enemies: six behaviours + elites + six boss herons (every fifth stage).
// Criterion 2: each type moves and threatens differently, so positioning matters.
import { ELITE, ENEMIES, POOL, STAGES, bossForStage, dmgScale, hpScale, spawnWeights, speedScale } from './config.js';

let nextId = 1;

export function spawnEnemy(state, type, elite) {
  const def = ENEMIES[type];
  const a = state.rng.angle();
  const x = POOL.cx + Math.cos(a) * POOL.rx * 1.02;
  const y = POOL.cy + Math.sin(a) * POOL.ry * 1.02;
  const hp = Math.round(def.hp * hpScale(state.stage) * (elite ? ELITE.hpMul : 1));
  const e = {
    id: nextId += 1, type, x, y, hp, maxHp: hp, r: def.r * (elite ? ELITE.sizeMul : 1),
    speed: def.speed * speedScale(state.stage) * state.rng.range(0.9, 1.1), dmg: Math.round(def.dmg * dmgScale(state.stage) * (elite ? ELITE.dmgMul : 1)),
    xp: elite ? ELITE.xp : def.xp, score: elite ? ELITE.score : def.score,
    coins: elite ? ELITE.coins : def.coins,
    color: def.color, dark: def.dark, elite: !!elite,
    wob: state.rng.angle(), hitCd: 0, flash: 0, lungeT: 0, lungeCd: state.rng.range(1, 3),
    diveT: 0, state: 'approach',
  };
  state.enemies.push(e);
  return e;
}

function pickType(state) {
  const w = spawnWeights(state.stage);
  let total = 0; for (const k in w) total += w[k];
  let roll = state.rng.next() * total;
  for (const k in w) { roll -= w[k]; if (roll <= 0) return k; }
  return 'guppy';
}

function spawnBoss(state, fx, audio) {
  state.bossSpawned = true;
  const def = bossForStage(state.stage);
  const b = spawnEnemy(state, 'gull', true);
  b.type = def.type;
  b.boss = true;
  b.name = def.name;
  b.hp = def.hp; b.maxHp = def.hp; b.r = def.r;
  b.speed = def.speed; b.dmg = def.dmg; b.score = def.score; b.xp = def.xp;
  b.coins = def.coins;
  // Each heron has its own plumage, dive speed and summons — the later birds
  // are bigger, faster-diving and call more gulls.
  b.color = def.color;
  b.dark = def.dark;
  b.diveMul = def.dive;
  b.summonN = def.summon;
  b.summonEvery = def.summonEvery;
  b.summonT = 5;
  state.boss = b;
  state.banner = `${def.name} ARRIVES!`;
  state.bannerT = 3;
  audio.boss(); fx.shake(0.6);
}

// The spawn director: each stage has a budget of enemies; the stage clears
// when the budget is spent and the pool is empty. One elite per stage (from stage
// 2) and a boss on every 5th stage, both arriving at half the budget.
export function updateSpawner(state, dt, fx, audio) {
  const plan = STAGES[state.stage - 1];
  state.spawnT -= dt;
  if (state.spawnT <= 0 && state.stageSpawned < plan.budget && state.enemies.length < 60) {
    state.spawnT = plan.interval;
    const n = Math.min(plan.batch, plan.budget - state.stageSpawned);
    for (let i = 0; i < n; i += 1) { spawnEnemy(state, pickType(state), false); state.stageSpawned += 1; }
  }
  // The elite (and the boss) arrive at half the budget — the stage's midpoint twist.
  if (plan.elite && !state.stageEliteDone && state.stageSpawned >= plan.budget / 2) {
    state.stageEliteDone = true;
    const type = state.rng.pick(['urchin', 'jelly', 'eel', 'starfish']);
    const e = spawnEnemy(state, type, true);
    state.banner = `★ ELITE ${type.toUpperCase()} — big pearls!`; state.bannerT = 2.5;
    fx.burst(e.x, e.y, '#ffd166', 14, 180); audio.elite();
  }
  if (plan.boss && !state.bossSpawned && state.stageSpawned >= plan.budget / 2) {
    spawnBoss(state, fx, audio);
  }
  // A summoning heron calls gulls while it lives — its adds do not count against
  // the stage budget, so the fight stays a fight even after the budget is spent.
  if (state.boss && state.boss.summonN > 0) {
    state.boss.summonT -= dt;
    if (state.boss.summonT <= 0 && state.enemies.length < 55) {
      state.boss.summonT = state.boss.summonEvery;
      for (let i = 0; i < state.boss.summonN; i += 1) {
        const g = spawnEnemy(state, 'gull', false);
        const a = state.rng.angle();
        g.x = state.boss.x + Math.cos(a) * 120; g.y = state.boss.y + Math.sin(a) * 90;
        g.state = 'circle'; g.diveT = 0.8;
      }
      fx.burst(state.boss.x, state.boss.y, state.boss.color, 10, 160);
    }
  }
}

export function updateEnemies(state, dt) {
  const p = state.player;
  for (const e of state.enemies) {
    e.hitCd -= dt; e.flash -= dt; e.wob += dt;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    let sp = e.speed;
    if (e.type === 'jelly') { // drifters wobble sideways as they close in
      const w = Math.sin(e.wob * 2.2) * 0.6;
      e.x += (nx - ny * w) * sp * dt; e.y += (ny + nx * w) * sp * dt;
    } else if (e.type === 'eel') { // lunges: pause, telegraph, burst
      e.lungeCd -= dt;
      if (e.lungeT > 0) { e.lungeT -= dt; e.x += nx * sp * 2.4 * dt; e.y += ny * sp * 2.4 * dt; }
      else if (e.lungeCd <= 0 && d < 260) { e.lungeT = 0.45; e.lungeCd = 2.6; }
      else { e.x += nx * sp * 0.55 * dt; e.y += ny * sp * 0.55 * dt; }
    } else if (e.type === 'gull' || e.type.endsWith('heron')) { // swoopers circle, then dive
      e.diveT -= dt;
      const boss = e.type.endsWith('heron');
      if (e.state === 'approach' && d < 200) { e.state = 'circle'; e.diveT = boss ? 0.8 : 1.1; }
      if (e.state === 'circle') {
        const t = e.wob * 1.4;
        e.x += (Math.cos(t) * 0.8 + nx * 0.2) * sp * dt;
        e.y += (Math.sin(t) * 0.8 + ny * 0.2) * sp * dt;
        if (e.diveT <= 0) { e.state = 'dive'; e.diveT = 0.5; }
      } else if (e.state === 'dive') {
        const mul = e.diveMul || 2.1;
        e.x += nx * sp * mul * dt; e.y += ny * sp * mul * dt;
        if (e.diveT <= 0) e.state = 'approach';
      } else { e.x += nx * sp * dt; e.y += ny * sp * dt; }
    } else { // chasers: straight at the crab
      e.x += nx * sp * dt; e.y += ny * sp * dt;
    }
  }
  // Separation: creatures push each other apart, so they cannot stack on one spot
  // and bite as a single blob — the swarm stays a swarm, not a wall.
  const list = state.enemies;
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = list[i], b = list[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.85;
      if (d > 0.01 && d < min) {
        const push = (min - d) / 2, ux = dx / d, uy = dy / d;
        a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
      }
    }
  }
}

// Starfish split into two minis when killed — the only enemy that multiplies.
export function onEnemyKilled(state, e, fx) {
  if (e.type === 'starfish') {
    for (let i = 0; i < 2; i += 1) {
      const m = spawnEnemy(state, 'mini', false);
      m.x = e.x + (i ? 14 : -14); m.y = e.y + (i ? -10 : 10);
    }
  }
  if (e.boss) {
    state.boss = null;
    state.banner = `${e.name} IS DRIVEN OFF! +${e.score}`;
    state.bannerT = 3;
  }
}
