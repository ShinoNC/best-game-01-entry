// Enemies: seven behaviours + elites + six bosses.
import { DIFFICULTIES, ELITE, ENEMIES, POOL, SPIT, STAGES, bossForStage, dmgScale, hpScale, spawnWeights, speedScale } from './config.js';

let nextId = 1;

export function spawnEnemy(state, type, elite, fx) {
  const def = ENEMIES[type];
  const diff = DIFFICULTIES[state.difficulty || 'normal'];
  const s = Math.floor(state.rng.next() * 4), f = state.rng.next(); // one of the four edges, just outside it
  const x = s === 1 ? POOL.x1 + 14 : s === 3 ? POOL.x0 - 14 : POOL.x0 + f * (POOL.x1 - POOL.x0);
  const y = s === 0 ? POOL.y0 - 14 : s === 2 ? POOL.y1 + 14 : POOL.y0 + f * (POOL.y1 - POOL.y0);
  // Spawn telegraph: a ripple ring at the edge entry point.
  if (fx && fx.ring) fx.ring(Math.max(POOL.x0 + 8, Math.min(POOL.x1 - 8, x)), Math.max(POOL.y0 + 8, Math.min(POOL.y1 - 8, y)));
  const hp = Math.round(def.hp * hpScale(state.stage) * diff.hp * (elite ? ELITE.hpMul : 1));
  const e = {
    id: nextId += 1, type, x, y, hp, maxHp: hp, r: def.r * (elite ? ELITE.sizeMul : 1),
    speed: def.speed * speedScale(state.stage) * diff.speed * state.rng.range(0.9, 1.1), dmg: Math.round(def.dmg * dmgScale(state.stage) * diff.dmg * (elite ? ELITE.dmgMul : 1)),
    score: elite ? ELITE.score : def.score,
    coins: elite ? ELITE.coins : def.coins,
    color: def.color, dark: def.dark, elite: !!elite,
    wob: state.rng.angle(), hitCd: 0, flash: 0, lungeT: 0, windup: 0, lungeCd: state.rng.range(1, 3),
    diveT: 0, state: 'approach',
  };
  state.enemies.push(e);
  return e;
}

function pickType(state) {
  const w = spawnWeights(state.stage);
  // The spawn mix tilts the weights — the tide never repeats.
  const mix = state.mix || {};
  let total = 0;
  for (const k in w) { w[k] *= mix[k] || 1; total += w[k]; }
  let roll = state.rng.next() * total;
  for (const k in w) { roll -= w[k]; if (roll <= 0) return k; }
  return 'guppy';
}

function spawnBoss(state, fx, audio) {
  state.bossSpawned = true;
  const def = bossForStage(state.stage);
  const diff = DIFFICULTIES[state.difficulty || 'normal'];
  const b = spawnEnemy(state, 'gull', true, fx);
  b.type = def.type;
  b.boss = true;
  b.name = def.name;
  b.hp = Math.round(def.hp * diff.bossHp); b.maxHp = b.hp; b.r = def.r;
  b.speed = def.speed; b.dmg = Math.round(def.dmg * diff.bossDmg); b.score = def.score;
  b.coins = def.coins;
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

// Spawn director.
export function updateSpawner(state, dt, fx, audio) {
  const plan = STAGES[state.stage - 1];
  state.spawnT -= dt;
  if (state.spawnT <= 0 && state.stageSpawned < plan.budget && state.enemies.length < 60) {
    state.spawnT = plan.interval;
    const n = Math.min(plan.batch, plan.budget - state.stageSpawned);
    for (let i = 0; i < n; i += 1) { spawnEnemy(state, pickType(state), false, fx); state.stageSpawned += 1; }
  }
  // Elites and bosses at half budget.
  if (plan.elite && !state.stageEliteDone && state.stageSpawned >= plan.budget / 2) {
    state.stageEliteDone = true;
    const type = state.rng.pick(['urchin', 'jelly', 'eel', 'starfish']);
    const e = spawnEnemy(state, type, true, fx);
    state.banner = `★ ELITE ${type.toUpperCase()} — big coins!`; state.bannerT = 2.5;
    fx.burst(e.x, e.y, '#ffd166', 14, 180); audio.elite();
  }
  if (plan.boss && !state.bossSpawned && state.stageSpawned >= plan.budget / 2) {
    spawnBoss(state, fx, audio);
  }
  // A summoning boss calls gulls.
  // Called gulls fly in from the edges — never pop by the boss.
  if (state.boss && state.boss.summonN > 0) {
    state.boss.summonT -= dt;
    if (state.boss.summonT <= 0 && state.enemies.length < 55) {
      state.boss.summonT = state.boss.summonEvery;
      for (let i = 0; i < state.boss.summonN; i += 1) {
        const g = spawnEnemy(state, 'gull', false, fx);
        g.state = 'approach';
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
    } else if (e.type === 'eel') { // lunges: 0.4s wind-up (still + flashing), then burst
      e.lungeCd -= dt;
      if (e.lungeT > 0) { e.lungeT -= dt; e.x += nx * sp * 2.4 * dt; e.y += ny * sp * 2.4 * dt; }
      else if (e.windup > 0) { e.windup -= dt; if (e.windup <= 0) { e.lungeT = 0.45; e.lungeCd = 2.6; } }
      else if (e.lungeCd <= 0 && d < 260) { e.windup = 0.4; }
      else { e.x += nx * sp * 0.55 * dt; e.y += ny * sp * 0.55 * dt; }
    } else if (e.type === 'archer') { // spitter: holds 240–360px, aims 0.35s, spits at the crab
      e.lungeCd -= dt; // reuses the eel's cooldown slot as the spit timer
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          state.spits.push({ x: e.x + nx * e.r * 1.6, y: e.y + ny * e.r * 1.6, vx: nx * SPIT.speed, vy: ny * SPIT.speed, dmg: e.dmg, r: SPIT.r, life: SPIT.life });
          e.lungeCd = SPIT.cd * state.rng.range(0.85, 1.15);
        }
      } else if (e.lungeCd <= 0 && d < SPIT.range) { e.windup = SPIT.aim; }
      else { // too far: close in; too close: back off; in band: strafe
        const want = d > 360 ? 1 : d < 240 ? -1 : 0;
        const strafe = want === 0 ? Math.sin(e.wob * 0.7) * 0.8 : 0;
        e.x += (nx * want - ny * strafe) * sp * dt; e.y += (ny * want + nx * strafe) * sp * dt;
      }
    } else if (e.type === 'gull' || e.boss) { // swoopers circle, then dive
      e.diveT -= dt;
      const boss = !!e.boss;
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
  // Separation: creatures push apart, so the swarm stays a swarm.
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

// Starfish split into two minis at the death spot.
export function onEnemyKilled(state, e, fx) {
  if (e.type === 'starfish') {
    for (let i = 0; i < 2; i += 1) {
      const m = spawnEnemy(state, 'mini', false);
      m.x = e.x + (i ? 14 : -14); m.y = e.y + (i ? -10 : 10);
    }
    if (fx) { fx.burst(e.x, e.y, '#ff8fb0', 8, 120); if (fx.ring) fx.ring(e.x, e.y); }
  }
  if (e.boss) {
    state.boss = null;
    state.stats.bossesDown = (state.stats.bossesDown || 0) + 1;
    state.banner = `${e.name} IS DRIVEN OFF! +${e.score}`;
    state.bannerT = 3;
  }
}
