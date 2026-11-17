import { PAL, PLAYER, POOL, WEAPON_ORDER, modOf } from './config.js';
import { weaponStatsFor } from './weapons.js';
import { hurtEnemy } from './enemies.js';

function clampToPool(p) {
  const r = p.radius || 0;
  p.x = Math.max(POOL.x0 + r, Math.min(POOL.x1 - r, p.x));
  p.y = Math.max(POOL.y0 + r, Math.min(POOL.y1 - r, p.y));
}

function slideAtEdge(p, vx, vy) {
  const r = p.radius || 0, m = 6;
  if (p.x - r - POOL.x0 < m && vx < 0) vx = 0;
  if (POOL.x1 - p.x - r < m && vx > 0) vx = 0;
  if (p.y - r - POOL.y0 < m && vy < 0) vy = 0;
  if (POOL.y1 - p.y - r < m && vy > 0) vy = 0;
  return { vx, vy };
}

export function nearestEnemy(state, x, y, range) {
  let best = null, bd = range * range;
  for (const e of state.enemies) {
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 < bd) { bd = d2; best = e; }
  }
  return best;
}

function fireWeapon(state, id, aim, target, fx, audio) {
  const p = state.player, w = weaponStatsFor(state, id);
  p.weapCd[id] = w.rate;
  if (id === 'claw') {
    p.angle = aim;
    p.swing = 0.18;
    const inArc = state.enemies
      .map((e) => ({ e, d: Math.hypot(e.x - p.x, e.y - p.y) }))
      .filter(({ e, d }) => {
        if (d > w.range + e.r) return false;
        let da = Math.atan2(e.y - p.y, e.x - p.x) - aim;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        return Math.abs(da) <= w.arc;
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, w.hits);
    let hits = 0;
    for (const { e } of inArc) {
      const dmg = Math.round(w.dmg * (0.9 + state.rng.next() * 0.2));
      if (!hurtEnemy(state, e, dmg)) continue;
      const ka = Math.atan2(e.y - p.y, e.x - p.x);
      const kb = e.elite ? 8 : 26;
      e.x += Math.cos(ka) * kb; e.y += Math.sin(ka) * kb;
      if (hits < 4 && e.boss) fx.text(e.x, e.y - e.r - 6, `${dmg}`, '#ffd166', false, e.id);
      fx.burst(e.x, e.y, '#ffd166', 5, 150);
      hits += 1;
    }
    audio.snap();
  } else if (id === 'bow') {
    for (let i = 0; i < w.arrows; i += 1) {
      const off = (i - (w.arrows - 1) / 2) * 14;
      state.bolts.push({ x: p.x + Math.cos(aim) * 28 - Math.sin(aim) * off,
        y: p.y + Math.sin(aim) * 28 + Math.cos(aim) * off,
        vx: Math.cos(aim) * 640, vy: Math.sin(aim) * 640, dmg: Math.round(w.dmg),
        pierce: w.pierce, r: 7, life: 1.1, kind: 'arrow' });
    }
    fx.bubbles(p.x + Math.cos(aim) * 28, p.y + Math.sin(aim) * 28, 2);
    audio.bolt();
  } else if (id === 'laser') {
    p.laser = 0.15; p.laserLen = w.range; p.laserBeams = w.beams;
    const dirs = w.beams >= 2 ? [1, -1] : [1];
    let hits = 0;
    for (const dir of dirs) {
      for (const e of state.enemies) {
        const dx = (e.x - p.x) * dir, dy = Math.abs(e.y - p.y);
        if (dx < 0 || dx > w.range + e.r || dy > 16 + e.r) continue;
        const dmg = Math.round(w.dmg * (0.9 + state.rng.next() * 0.2));
        if (!hurtEnemy(state, e, dmg)) continue;
        if (hits < 4 && e.boss) fx.text(e.x, e.y - e.r - 6, `${dmg}`, '#ff2e88', false, e.id);
        hits += 1;
      }
    }
    fx.burst(p.x, p.y, '#ff2e88', 6, 120);
    audio.bolt();
  } else if (id === 'shell') {
    state.bolts.push({ x: p.x + Math.cos(aim) * 28, y: p.y + Math.sin(aim) * 28,
      vx: Math.cos(aim) * w.speed, vy: Math.sin(aim) * w.speed, dmg: Math.round(w.dmg),
      pierce: 0, r: 9, life: 2.0, kind: 'homing', target, turn: w.turn, speed: w.speed });
    fx.bubbles(p.x + Math.cos(aim) * 28, p.y + Math.sin(aim) * 28, 2);
    audio.bolt();
  } else if (id === 'spin') {
    p.spin = 0.3;
    fx.burst(p.x, p.y, '#7fe0c3', 18, 260, 'bubble');
    let hits = 0;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > w.range + e.r) continue;
      const dmg = Math.round(w.dmg * (0.9 + state.rng.next() * 0.2));
      if (!hurtEnemy(state, e, dmg)) continue;
      const ka = Math.atan2(e.y - p.y, e.x - p.x);
      const kb = e.elite ? 8 : 30;
      e.x += Math.cos(ka) * kb; e.y += Math.sin(ka) * kb;
      if (hits < 4 && e.boss) fx.text(e.x, e.y - e.r - 6, `${dmg}`, '#7fe0c3', false, e.id);
      hits += 1;
    }
    audio.pop();
  } else if (id === 'trident') {
    for (let i = 0; i < w.harpoons; i += 1) {
      const off = (i - (w.harpoons - 1) / 2) * w.spread;
      state.bolts.push({ x: p.x + Math.cos(aim) * 28, y: p.y + Math.sin(aim) * 28,
        vx: Math.cos(aim + off) * 600, vy: Math.sin(aim + off) * 600, dmg: Math.round(w.dmg),
        pierce: 0, r: 6, life: 1.0, kind: 'harpoon' });
    }
    fx.bubbles(p.x + Math.cos(aim) * 28, p.y + Math.sin(aim) * 28, 2);
    audio.bolt();
  } else {
    for (let i = 0; i < w.pellets; i += 1) {
      const off = (i - (w.pellets - 1) / 2) * 0.14;
      state.bolts.push({ x: p.x + Math.cos(aim) * 26, y: p.y + Math.sin(aim) * 26,
        vx: Math.cos(aim + off) * 560, vy: Math.sin(aim + off) * 560, dmg: Math.round(w.dmg),
        pierce: 0, r: 6, life: 0.9, kind: 'pellet' });
    }
    fx.burst(p.x + Math.cos(aim) * 26, p.y + Math.sin(aim) * 26, '#7b5cff', 3, 80);
    audio.snap();
  }
}

function laserTarget(state, w) {
  const p = state.player;
  const dirs = w.beams >= 2 ? [1, -1] : [1];
  return state.enemies.some((e) => {
    if (Math.abs(e.y - p.y) > 16 + e.r) return false;
    return dirs.some((dir) => {
      const dx = (e.x - p.x) * dir;
      return dx >= 0 && dx <= w.range + e.r;
    });
  });
}

export function updatePlayer(state, input, dt, fx, audio) {
  const p = state.player;
  for (const id of WEAPON_ORDER) p.weapCd[id] -= dt;
  p.dashCd -= dt; p.iframes -= dt; p.flash -= dt; p.swing -= dt; p.spin -= dt; p.laser -= dt;
  const mv = input.move();
  p.moving = (mv.x || mv.y || p.dashT > 0) ? 1 : Math.max(0, p.moving - dt * 5);
  if (p.dashT > 0) {
    p.dashT -= dt;
    const s = slideAtEdge(p, p.dashVx, p.dashVy);
    p.x += s.vx * dt; p.y += s.vy * dt;
    fx.bubbles(p.x, p.y, 1);
  } else if (mv.x || mv.y) {
    const s = slideAtEdge(p, mv.x * p.speed, mv.y * p.speed);
    p.x += s.vx * dt; p.y += s.vy * dt;
    p.angle = Math.atan2(mv.y, mv.x);
  }
  clampToPool(p);
  if (input.dashHeld() && p.dashCd <= 0 && (mv.x || mv.y)) {
    p.dashCd = PLAYER.dashCd; p.dashT = PLAYER.dashTime;
    p.dashVx = mv.x * PLAYER.dashSpeed; p.dashVy = mv.y * PLAYER.dashSpeed;
    p.iframes = Math.max(p.iframes, 0.3);
    state.stats.dashes += 1;
    fx.bubbles(p.x, p.y, 8); audio.dash();
  }
  const face = nearestEnemy(state, p.x, p.y, 560);
  if (face) p.angle = Math.atan2(face.y - p.y, face.x - p.x);
  for (const id of WEAPON_ORDER) {
    if (state.weapons[id] <= 0 || p.weapCd[id] > 0) continue;
    const w = weaponStatsFor(state, id);
    if (id === 'laser') {
      if (laserTarget(state, w)) fireWeapon(state, id, 0, null, fx, audio);
      continue;
    }
    const target = nearestEnemy(state, p.x, p.y, w.range);
    if (target) fireWeapon(state, id, Math.atan2(target.y - p.y, target.x - p.x), target, fx, audio);
  }
}

export function hurtPlayer(state, dmg, fx, audio) {
  const p = state.player;
  if (p.iframes > 0 || state.phase !== 'play') return;
  const soaked = Math.min(4, state.ups.shell * 1);
  const real = Math.max(1, Math.round((dmg - soaked) * modOf(state, 'taken')));
  const absorbed = Math.min(p.armor, real);
  p.armor -= absorbed;
  const toHp = real - absorbed;
  p.hp -= toHp; p.iframes = PLAYER.iframes; p.flash = 0.25;
  state.stats.taken += real;
  state.stageTaken += real;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < 60 + e.r) {
      const ka = Math.atan2(e.y - p.y, e.x - p.x);
      e.x += Math.cos(ka) * 20; e.y += Math.sin(ka) * 20;
    }
  }
  fx.shake(0.15); fx.text(p.x, p.y - 30, toHp > 0 ? `-${toHp}` : 'BLOCKED', toHp > 0 ? PAL.hp : PAL.armor, true);
  fx.burst(p.x, p.y, PAL.hp, 8, 160);
  audio.hurt();
  if (p.hp <= 0) { p.hp = 0; state.phase = 'over'; state.result = 'lost'; audio.lose(); }
}
