import { POOL } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { nextStage, stepWorld } from './world.js';
import { autoBuy, drawHand } from './cards.js';
import { applyLevelChoice, rollLevelChoices } from './level.js';
import { spawnEnemy } from './enemies.js';
function autopilotInput(state) {
  const p = state.player;
  let mx = 0, my = 0, fx = 0, fy = 0;
  let near = 0;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < 130) { near += 1; const w = 1 / (d * d + 40); fx += (p.x - e.x) * w; fy += (p.y - e.y) * w; }
  }
  for (const s of state.spits || []) {
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < 170) {
      const sl = Math.hypot(s.vx, s.vy) || 1;
      const px = -s.vy / sl, py = s.vx / sl;
      const sgn = (px * (p.x - s.x) + py * (p.y - s.y)) >= 0 ? 1 : -1;
      const w = 3 / (d * d + 40);
      fx += px * sgn * w; fy += py * sgn * w;
    }
  }
  if (state.boss && state.boss.slamSpots) {
    for (const c of state.boss.slamSpots) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < c.r + 70) { near += 1; const w = 4 / (d * d + 40); fx += (p.x - c.x) * w; fy += (p.y - c.y) * w; }
    }
  }
  if (near > 0 && (fx || fy)) {
    mx = fx; my = fy;
  } else {
    let coin = null, pd = 1e9;
    for (const pe of state.drops) {
      const d = Math.hypot(pe.x - p.x, pe.y - p.y);
      if (d < pd) { pd = d; coin = pe; }
    }
    if (coin) { mx = (coin.x - p.x) / (pd || 1); my = (coin.y - p.y) / (pd || 1); }
    else { mx = (POOL.cx - p.x) / 400; my = (POOL.cy - p.y) / 400; }
  }
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
function runUntil(state, pred, maxSteps, fx, audio) {
  let steps = 0;
  while (steps < maxSteps) {
    if (pred(state)) return true;
    if (state.phase === 'over') return pred(state);
    if (state.phase === 'levelup') {
      applyLevelChoice(state, (state.levelChoices || [])[0]);
      state.pendingLevels = Math.max(0, (state.pendingLevels || 1) - 1);
      if (state.pendingLevels > 0) state.levelChoices = rollLevelChoices(state);
      else { state.levelChoices = null; state.phase = 'play'; }
    } else if (state.phase === 'stageclear') {
      autoBuy(state);
      nextStage(state, audio);
    } else if (state.phase === 'play') {
      stepWorld(state, autopilotInput(state), 1 / 60, fx, audio);
    } else {
      return pred(state);
    }
    steps += 1;
  }
  return pred(state);
}
function poseBossShot(s, shot) {
  const b = s.boss;
  s.player.x = 480; s.player.y = 430; s.player.angle = -0.5;
  b.x = 830; b.y = 280;
  b.state = 'dive'; b.diveT = 0.4;
  b.hp = Math.min(b.hp, b.maxHp * 0.7);
  if (shot === 'storm' || shot === 'kraken') {
    s.player.armor = Math.max(s.player.armor, 60);
    b.atkState = 'tele'; b.atkPhaseT = 0.9;
    b.slamSpots = [
      { x: s.player.x + 70, y: s.player.y - 40, r: 55 },
      { x: s.player.x - 80, y: s.player.y + 55, r: 55 },
      { x: s.player.x + 140, y: s.player.y + 90, r: 55 },
    ];
  }
  for (let i = 0; i < 3; i += 1) {
    const g = spawnEnemy(s, 'squid', false);
    const a = 0.6 + i * 2.0;
    g.x = Math.min(1160, Math.max(120, s.player.x + Math.cos(a) * 220));
    g.y = Math.min(600, Math.max(170, s.player.y + Math.sin(a) * 150));
    g.state = 'circle'; g.diveT = 0.4;
  }
  if (s.weapons.laser > 0) {
    s.player.laser = 0.15; s.player.laserLen = 420;
    s.player.laserBeams = s.weapons.laser >= 5 ? 2 : 1;
  }
  if (s.weapons.spin > 0) s.player.spin = 0.15;
  const ar = spawnEnemy(s, 'archer', false);
  ar.x = Math.min(1160, Math.max(120, s.player.x - 280));
  ar.y = Math.min(600, Math.max(170, s.player.y - 90));
  ar.windup = 0.2; ar.lungeCd = 2;
  s.spits.push({ x: (ar.x + s.player.x) / 2, y: (ar.y + s.player.y) / 2,
    vx: 200, vy: 60, dmg: ar.dmg, r: 6, life: 2 });
  s.banner = `${b.name} — DRIVE IT OFF!`;
  s.bannerT = 2.5;
  return s;
}
export function stageShot(shot, seed, fx, audio) {
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
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 12 && st.enemies.length >= 10, 60000, fx, audio);
    if (s.phase === 'play') {
      let elite = s.enemies.find((e) => e.elite);
      if (!elite) elite = spawnEnemy(s, 'urchin', true);
      elite.x = Math.min(1030, Math.max(250, s.player.x - 200));
      elite.y = Math.min(560, Math.max(200, s.player.y + 120));
      s.banner = '★ ELITE URCHIN — big coins!'; s.bannerT = 2.5;
      if (s.weapons.laser > 0) {
        s.player.laser = 0.15; s.player.laserLen = 420;
        s.player.laserBeams = s.weapons.laser >= 5 ? 2 : 1;
      }
      if (s.weapons.spin > 0) s.player.spin = 0.15;
    }
    return s;
  }
  if (shot === 'kraken') {
    const s = createStateFromSeed(seed); s.phase = 'play';
    s.stage = 30; s.stageSpawned = 51; s.spawnT = 999;
    s.level = 12; s.xp = 200; s.xpNext = 350; s.coins = 412; s.score = 246800; s.kills = 640;
    s.weapons = { claw: 6, bow: 4, blaster: 3, shell: 3, spin: 4, laser: 5, trident: 2 };
    s.ups = { claws: 3, tempo: 2, reach: 2, shell: 1, legs: 2, bubbles: 1, magnet: 2 };
    s.player.maxHp = 155; s.player.hp = 128; s.player.armor = 120;
    s.potions = 2;
    for (let i = 0; i < 5; i += 1) stepWorld(s, autopilotInput(s), 1 / 60, fx, audio);
    if (!s.boss) return s;
    poseBossShot(s, 'kraken');
    s.player.laserLen = 560;
    const b = s.boss; b.hp = b.maxHp; b.atkState = null; b.slamSpots = null;
    s.player.x = 640; b.x = 250; b.y = 160;
    s.banner = 'THE KRAKEN ARRIVES!';
    s.combo = 18; s.comboT = 3;
    s.pet.x = 705; s.pet.y = 485;
    const types = 'jelly,urchin,squid,jelly,urchin,guppy,starfish,eel'.split(',');
    for (let i = 0; i < 110; i += 1) {
      const e = spawnEnemy(s, types[i % 8], i % 9 === 4);
      const a = i * 2.39996;
      const r = i < 55 ? 30 + (i * 53) % 120 : 160 + (i * 71) % 390;
      e.x = Math.min(1190, Math.max(90, s.player.x + Math.cos(a) * r));
      e.y = Math.min(610, Math.max(110, s.player.y + Math.sin(a) * r * 0.85));
      const dx = e.x - b.x, dy = e.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d < 130) { e.x = b.x + dx / d * 130; e.y = b.y + dy / d * 130; }
    }
    for (let i = 0; i < 18; i += 1) s.drops.push({ x: 120 + (i * 67) % 1040, y: 130 + (i * 113) % 450, v: 1, vx: 0, vy: 0, life: 25, bob: i });
    s.pickups.push({ x: 565, y: 525, kind: 'heal', life: 20 });
    return s;
  }
  if (shot === 'boss' || shot === 'storm') {
    const wantStage = shot === 'storm' ? 15 : 5;
    for (let trySeed = seed; trySeed < seed + 8; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'play' && st.stage === wantStage && st.boss, 120000, fx, audio);
      if (s.phase === 'play' && s.boss && s.stage === wantStage) return poseBossShot(s, shot);
    }
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 12 && st.enemies.length >= 10, 60000, fx, audio);
    return s;
  }
  if (shot.startsWith('band')) {
    const target = parseInt(shot.slice(4), 10) || 1;
    for (let trySeed = seed; trySeed < seed + 8; trySeed += 1) {
      const s = createStateFromSeed(trySeed); s.phase = 'play';
      runUntil(s, (st) => st.phase === 'play' && st.stage >= target && st.enemies.length >= 8, 120000, fx, audio);
      if (s.phase === 'play' && s.stage >= target) return s;
    }
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'play' && st.stage >= 12 && st.enemies.length >= 10, 60000, fx, audio);
    return s;
  }
  if (shot === 'stageclear') {
    const s = createStateFromSeed(seed); s.phase = 'stageclear';
    s.stage = 15; s.level = 12; s.xp = 200; s.xpNext = 350; s.coins = 540; s.score = 186400; s.kills = 480;
    s.weapons = { claw: 6, bow: 5, blaster: 4, shell: 4, spin: 5, laser: 4, trident: 0 };
    s.ups = { claws: 3, tempo: 2, reach: 2, shell: 1, legs: 2, bubbles: 1, magnet: 2 };
    s.player.maxHp = 165; s.player.hp = 165; s.player.armor = 90;
    s.potions = 3;
    s.hand = drawHand(s);
    for (let i = 0; i < 20 && !s.hand.some((c) => c.kind === 'weapon'); i += 1) s.hand = drawHand(s);
    fx.clear();
    return s;
  }
  if (shot === 'levelup') {
    const s = createStateFromSeed(seed); s.phase = 'play';
    runUntil(s, (st) => st.phase === 'levelup', 20000, fx, audio);
    if (s.phase !== 'levelup') {
      s.levelChoices = rollLevelChoices(s);
      s.pendingLevels = 1;
      s.phase = 'levelup';
    }
    return s;
  }
  if (shot === 'end') {
    const s = createStateFromSeed(seed); s.phase = 'over';
    s.stage = 22; s.level = 16; s.time = 505; s.score = 312400; s.kills = 720;
    s.player.hp = 0;
    const types = 'jelly,guppy,starfish,eel,squid,urchin,jelly,guppy'.split(',');
    for (let i = 0; i < 8; i += 1) {
      const e = spawnEnemy(s, types[i], false);
      e.x = 100 + i * 140; e.y = 150 + (i % 3) * 180;
    }
    fx.clear();
    return s;
  }
  return createStateFromSeed(seed);
}
function createStateFromSeed(seed) {
  const rng = createRandom(seed);
  return createState(rng, seed);
}
