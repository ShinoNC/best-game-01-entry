import { ELITE, ENEMIES, POOL, SPIT, STAGES, bossForStage, contentStage, dmgScale, hpScale, modOf, sandRect, spawnWeights, speedScale } from './config.js';

let nextId = 1;

export function hurtEnemy(state, e, dmg) {
  if (e.shelled) return false;
  e.hp -= dmg; e.flash = 0.12; state.stats.damage += dmg;
  return true;
}

export function spawnEnemy(state, type, elite, fx) {
  const def = ENEMIES[type];
  const sand = sandRect(state.sandCorner), M = 20;
  let x, y;
  for (let tries = 0; tries < 6; tries += 1) {
    const s = Math.floor(state.rng.next() * 4), f = state.rng.next();
    x = s === 1 ? POOL.x1 + 14 : s === 3 ? POOL.x0 - 14 : POOL.x0 + f * (POOL.x1 - POOL.x0);
    y = s === 0 ? POOL.y0 - 14 : s === 2 ? POOL.y1 + 14 : POOL.y0 + f * (POOL.y1 - POOL.y0);
    const cx = Math.max(POOL.x0 + 8, Math.min(POOL.x1 - 8, x)), cy = Math.max(POOL.y0 + 8, Math.min(POOL.y1 - 8, y));
    if (cx < sand.x0 - M || cx > sand.x1 + M || cy < sand.y0 - M || cy > sand.y1 + M) break;
    if (tries === 5) { x = POOL.cx; y = POOL.y1 + 14; }
  }
  if (fx && fx.ring) fx.ring(Math.max(POOL.x0 + 8, Math.min(POOL.x1 - 8, x)), Math.max(POOL.y0 + 8, Math.min(POOL.y1 - 8, y)));
  const st = state.stage;
  const hp = Math.round(def.hp * hpScale(st) * (elite ? ELITE.hpMul : 1) * modOf(state, 'ehp'));
  const e = {
    id: nextId += 1, type, x, y, hp, maxHp: hp, r: def.r * (elite ? ELITE.sizeMul : 1),
    speed: def.speed * speedScale(st) * modOf(state, 'espd') * state.rng.range(0.9, 1.1), dmg: Math.round(def.dmg * dmgScale(st) * (elite ? ELITE.dmgMul : 1)),
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
  const cs = contentStage(state);
  const w = { ...((state.stageMix && state.stageMix[cs - 1]) || spawnWeights(cs)) };
  let total = 0;
  for (const k in w) total += w[k];
  let roll = state.rng.next() * total;
  for (const k in w) { roll -= w[k]; if (roll <= 0) return k; }
  return 'guppy';
}

function spawnBoss(state, fx, audio) {
  state.bossSpawned = true;
  const def = bossForStage(state.stage, state.bossOrder);
  const b = spawnEnemy(state, 'squid', true, fx);
  b.type = def.type;
  b.boss = true;
  b.name = def.name;
  b.hp = Math.round(def.hp * modOf(state, 'ehp')); b.maxHp = b.hp; b.r = def.r;
  b.speed = def.speed * modOf(state, 'espd'); b.dmg = Math.round(def.dmg); b.score = def.score;
  b.coins = def.coins;
  b.color = def.color;
  b.dark = def.dark;
  b.diveMul = def.dive;
  b.summonN = def.summon;
  b.summonEvery = def.summonEvery;
  b.summonT = 5;
  b.atk = def.atk; b.atkEvery = def.atkEvery; b.atkT = 4;
  b.atkState = null; b.atkPhaseT = 0; b.shelled = false; b.dmgMul = 1; b.slamSpots = null;
  state.boss = b;
  state.banner = `${def.name} ARRIVES!`;
  state.bannerT = 3;
  audio.boss(); fx.shake(0.6);
}

export function updateSpawner(state, dt, fx, audio) {
  const plan = STAGES[contentStage(state) - 1];
  state.spawnT -= dt;
  if (state.spawnT <= 0 && state.stageSpawned < plan.budget && state.enemies.length < 60) {
    state.spawnT = plan.interval * modOf(state, 'spawn');
    const n = Math.min(plan.batch, plan.budget - state.stageSpawned);
    for (let i = 0; i < n; i += 1) { spawnEnemy(state, pickType(state), false, fx); state.stageSpawned += 1; }
  }
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
  if (state.boss && state.boss.summonN > 0) {
    state.boss.summonT -= dt;
    if (state.boss.summonT <= 0 && state.enemies.length < 55) {
      state.boss.summonT = state.boss.summonEvery;
      for (let i = 0; i < state.boss.summonN; i += 1) {
        const g = spawnEnemy(state, 'squid', false, fx);
        g.state = 'approach';
      }
      fx.burst(state.boss.x, state.boss.y, state.boss.color, 10, 160);
    }
  }
}

const ATK_TELE = { shell: 0.5, ink: 0.5, line: 0.8, lure: 0.6, barbs: 0.5, slam: 0.9 };
function bossAttack(state, e, dt, nx, ny, fx) {
  if (!e.atkState) {
    e.atkT -= dt;
    if (e.atkT > 0) return false;
    e.atkState = 'tele'; e.atkPhaseT = ATK_TELE[e.atk]; e.state = 'approach';
    e.atkDx = nx; e.atkDy = ny;
    if (e.atk === 'slam') {
      const p = state.player;
      e.slamSpots = [{ x: p.x, y: p.y, r: 55 }, { x: p.x + 90, y: p.y - 40, r: 55 }, { x: p.x - 80, y: p.y + 50, r: 55 }];
    }
    return true;
  }
  e.atkPhaseT -= dt;
  if (e.atkState === 'tele') {
    if (e.atkPhaseT > 0) return true;
    const base = Math.atan2(e.atkDy, e.atkDx);
    const fan = (offs, speed, r, life, color) => {
      for (const off of offs) {
        const a = base + off;
        state.spits.push({ x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r,
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: e.dmg, r, life, color });
      }
    };
    if (e.atk === 'ink') fan([-0.35, 0, 0.35], 200, 10, 2.5, '#5e2a84');
    else if (e.atk === 'barbs') fan([-0.5, -0.25, 0, 0.25, 0.5], 330, 4, 2, '#ff5d5d');
    else if (e.atk === 'slam') {
      for (const s of e.slamSpots) {
        state.spits.push({ x: s.x, y: s.y, vx: 0, vy: 0, dmg: e.dmg, r: s.r, life: 0.15, color: '#ff5d73' });
        if (fx) { fx.burst(s.x, s.y, '#ff5d73', 10, 160); if (fx.ring) fx.ring(s.x, s.y); }
      }
      e.slamSpots = null;
      if (fx) fx.shake(0.4);
      for (let i = 0; i < 8; i += 1) {
        const a = i * Math.PI / 4;
        state.spits.push({ x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r,
          vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, dmg: e.dmg, r: 6, life: 2.5, color: '#ff5d73' });
      }
    } else if (e.atk === 'shell') { e.atkState = 'retreat'; e.atkPhaseT = 2; e.shelled = true; return true; }
    else if (e.atk === 'line') { e.atkState = 'charge'; e.atkPhaseT = 1.2; e.dmgMul = 1.5; return true; }
    else if (e.atk === 'lure') { e.atkState = 'dash'; e.atkPhaseT = 0.6; return true; }
    e.atkState = null; e.atkT = e.atkEvery;
    return true;
  }
  if (e.atkState === 'retreat') {
    if (e.atkPhaseT <= 0) { e.shelled = false; e.atkState = 'charge'; e.atkPhaseT = 1; }
    return true;
  }
  if (e.atkState === 'charge' || e.atkState === 'dash') {
    const mul = e.atk === 'line' ? 4 : e.atk === 'lure' ? 3.5 : 3;
    e.x += e.atkDx * e.speed * mul * dt; e.y += e.atkDy * e.speed * mul * dt;
    const hitEdge = e.x <= POOL.x0 + e.r || e.x >= POOL.x1 - e.r || e.y <= POOL.y0 + e.r || e.y >= POOL.y1 - e.r;
    e.x = Math.max(POOL.x0 + e.r, Math.min(POOL.x1 - e.r, e.x));
    e.y = Math.max(POOL.y0 + e.r, Math.min(POOL.y1 - e.r, e.y));
    if (e.atkPhaseT <= 0 || hitEdge) {
      e.dmgMul = 1;
      const base = Math.atan2(state.player.y - e.y, state.player.x - e.x);
      const offs = e.atk === 'shell' ? [0, 1.05, 2.1, 3.14, 4.19, 5.24] : [-0.35, 0, 0.35];
      for (const off of offs) {
        const a = base + off;
        state.spits.push({ x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r,
          vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: e.dmg, r: 6, life: 2.5, color: e.color });
      }
      if (e.atk === 'lure') { e.atkState = 'stun'; e.atkPhaseT = 0.5; }
      else { e.atkState = null; e.atkT = e.atkEvery; }
    }
    return true;
  }
  if (e.atkState === 'stun') {
    if (e.atkPhaseT <= 0) { e.atkState = null; e.atkT = e.atkEvery; }
    return true;
  }
  return false;
}

export function updateEnemies(state, dt, fx) {
  const p = state.player;
  for (const e of state.enemies) {
    e.hitCd -= dt; e.flash -= dt; e.wob += dt;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    let sp = e.speed;
    if (e.boss && bossAttack(state, e, dt, nx, ny, fx)) continue;
    if (e.type === 'jelly') {
      const w = Math.sin(e.wob * 2.2) * 0.6;
      e.x += (nx - ny * w) * sp * dt; e.y += (ny + nx * w) * sp * dt;
    } else if (e.type === 'eel') {
      e.lungeCd -= dt;
      if (e.lungeT > 0) { e.lungeT -= dt; e.x += nx * sp * 2.4 * dt; e.y += ny * sp * 2.4 * dt; }
      else if (e.windup > 0) { e.windup -= dt; if (e.windup <= 0) { e.lungeT = 0.45; e.lungeCd = 2.6; } }
      else if (e.lungeCd <= 0 && d < 260) { e.windup = 0.4; }
      else { e.x += nx * sp * 0.55 * dt; e.y += ny * sp * 0.55 * dt; }
    } else if (e.type === 'archer') {
      e.lungeCd -= dt;
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          state.spits.push({ x: e.x + nx * e.r * 1.6, y: e.y + ny * e.r * 1.6, vx: nx * SPIT.speed, vy: ny * SPIT.speed, dmg: e.dmg, r: SPIT.r, life: SPIT.life });
          e.lungeCd = SPIT.cd * state.rng.range(0.85, 1.15);
        }
      } else if (e.lungeCd <= 0 && d < SPIT.range) { e.windup = SPIT.aim; }
      else {
        const want = d > 360 ? 1 : d < 240 ? -1 : 0;
        const strafe = want === 0 ? Math.sin(e.wob * 0.7) * 0.8 : 0;
        e.x += (nx * want - ny * strafe) * sp * dt; e.y += (ny * want + nx * strafe) * sp * dt;
      }
    } else if (e.type === 'squid' || e.boss) {
      e.diveT -= dt;
      const boss = !!e.boss;
      if (e.state === 'approach' && d < 200) { e.state = 'circle'; e.diveT = boss ? 0.5 : 1.1; }
      if (e.state === 'circle') {
        const t = e.wob * 1.4;
        e.x += (Math.cos(t) * 0.8 + nx * 0.2) * sp * dt;
        e.y += (Math.sin(t) * 0.8 + ny * 0.2) * sp * dt;
        if (e.diveT <= 0) { e.state = 'dive'; e.diveT = boss ? 0.7 : 0.5; }
      } else if (e.state === 'dive') {
        const mul = e.diveMul || 2.1;
        e.x += nx * sp * mul * dt; e.y += ny * sp * mul * dt;
        if (e.diveT <= 0) e.state = 'approach';
      } else { e.x += nx * sp * dt; e.y += ny * sp * dt; }
    } else {
      e.x += nx * sp * dt; e.y += ny * sp * dt;
    }
  }
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
