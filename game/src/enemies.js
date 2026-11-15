// Enemies: six behaviours + elites + the Great Heron boss.
// Criterion 2: each type moves and threatens differently, so positioning matters.
import { BOSS, ELITE, ENEMIES, POOL, hpScale, spawnBatch, spawnInterval, spawnWeights } from './config.js';

let nextId = 1;

export function spawnEnemy(state, type, elite) {
  const def = ENEMIES[type];
  const a = state.rng.angle();
  const x = POOL.cx + Math.cos(a) * POOL.rx * 1.02;
  const y = POOL.cy + Math.sin(a) * POOL.ry * 1.02;
  const hp = Math.round(def.hp * hpScale(state.time) * (elite ? ELITE.hpMul : 1));
  const e = {
    id: nextId += 1, type, x, y, hp, maxHp: hp, r: def.r * (elite ? ELITE.sizeMul : 1),
    speed: def.speed * state.rng.range(0.9, 1.1), dmg: Math.round(def.dmg * (elite ? ELITE.dmgMul : 1)),
    xp: elite ? ELITE.xp : def.xp, score: elite ? ELITE.score : def.score,
    color: def.color, dark: def.dark, elite: !!elite,
    wob: state.rng.angle(), hitCd: 0, flash: 0, lungeT: 0, lungeCd: state.rng.range(1, 3),
    diveT: 0, state: 'approach',
  };
  state.enemies.push(e);
  return e;
}

function pickType(state) {
  const w = spawnWeights(state.time);
  let total = 0; for (const k in w) total += w[k];
  let roll = state.rng.next() * total;
  for (const k in w) { roll -= w[k]; if (roll <= 0) return k; }
  return 'guppy';
}

// The spawn director: batches on a shrinking interval, elites every 45s, the boss at 4:00.
export function updateSpawner(state, dt, fx, audio) {
  state.spawnT -= dt;
  if (state.spawnT <= 0 && state.enemies.length < 60) {
    state.spawnT = spawnInterval(state.time);
    const n = spawnBatch(state.time);
    for (let i = 0; i < n; i += 1) spawnEnemy(state, pickType(state), false);
  }
  state.eliteT -= dt;
  if (state.eliteT <= 0) {
    state.eliteT = 45;
    const type = state.rng.pick(['urchin', 'jelly', 'eel', 'starfish']);
    const e = spawnEnemy(state, type, true);
    state.banner = `★ ELITE ${type.toUpperCase()} — big pearls!`; state.bannerT = 2.5;
    fx.burst(e.x, e.y, '#ffd166', 14, 180); audio.elite();
  }
  if (!state.bossSpawned && state.time >= BOSS.spawnAt) {
    state.bossSpawned = true;
    const b = spawnEnemy(state, 'gull', true);
    b.type = 'heron'; b.hp = BOSS.hp; b.maxHp = BOSS.hp; b.r = BOSS.r;
    b.speed = BOSS.speed; b.dmg = BOSS.dmg; b.score = BOSS.score; b.xp = BOSS.xp;
    b.color = '#e8e4d8'; b.dark = '#8a8578';
    state.boss = b;
    state.banner = 'THE GREAT HERON ARRIVES!'; state.bannerT = 3;
    audio.boss(); fx.shake(0.6);
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
    } else if (e.type === 'gull' || e.type === 'heron') { // swoopers circle, then dive
      e.diveT -= dt;
      if (e.state === 'approach' && d < 200) { e.state = 'circle'; e.diveT = 1.1; }
      if (e.state === 'circle') {
        const t = e.wob * 1.4;
        e.x += (Math.cos(t) * 0.8 + nx * 0.2) * sp * dt;
        e.y += (Math.sin(t) * 0.8 + ny * 0.2) * sp * dt;
        if (e.diveT <= 0) { e.state = 'dive'; e.diveT = 0.5; }
      } else if (e.state === 'dive') {
        e.x += nx * sp * 2.1 * dt; e.y += ny * sp * 2.1 * dt;
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
  if (e.type === 'heron') { state.boss = null; state.banner = 'THE HERON IS DRIVEN OFF! +500'; state.bannerT = 3; }
}
