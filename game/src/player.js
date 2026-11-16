// The crab: WASD/arrows move, ALL owned weapons attack AUTOMATICALLY, each on
// its own cooldown, each aimed at the nearest creature in ITS range (the laser
// fires fixed horizontal beams instead); Space/Shift dashes (with i-frames).
// The player's job is movement, positioning and dodging — swarms WILL hit you
// if you cannot dodge, which is why weapons must grow stronger. Criterion 2:
// move + six auto-weapons + dash.
import { PAL, PLAYER, POOL, WEAPON_ORDER } from './config.js';
import { weaponStatsFor } from './weapons.js';

function clampToPool(p) {
  const dx = (p.x - POOL.cx) / POOL.rx, dy = (p.y - POOL.cy) / POOL.ry;
  const d = Math.hypot(dx, dy);
  if (d > 1) { p.x = POOL.cx + (dx / d) * POOL.rx; p.y = POOL.cy + (dy / d) * POOL.ry; }
}

// Slide along the pool's edge: near the rim, the outward part of the velocity
// is removed, so the crab glides along the boundary instead of sticking to it.
// The ellipse's outward normal is its gradient ((x-cx)/rx^2, (y-cy)/ry^2).
function slideAtEdge(p, vx, vy) {
  const ex = (p.x - POOL.cx) / POOL.rx, ey = (p.y - POOL.cy) / POOL.ry;
  if (Math.hypot(ex, ey) < 0.97) return { vx, vy };
  let nx = (p.x - POOL.cx) / (POOL.rx * POOL.rx), ny = (p.y - POOL.cy) / (POOL.ry * POOL.ry);
  const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  const out = vx * nx + vy * ny;
  if (out <= 0) return { vx, vy }; // already moving inward — leave it alone
  return { vx: vx - nx * out, vy: vy - ny * out };
}

export function nearestEnemy(state, x, y, range) {
  let best = null, bd = range * range;
  for (const e of state.enemies) {
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 < bd) { bd = d2; best = e; }
  }
  return best;
}

// One weapon attack, aimed at `aim` (the direction of the nearest creature in
// that weapon's range). Claw: a cleaving arc centred on the aim. Bow: a volley
// of parallel piercing arrows (Lv1 = 1 arrow). Blaster: a pellet spread (Lv1 =
// 1 pellet). Shell: one homing shell that steers toward its target. Spin: a
// ring blast hitting everything nearby. Laser: fixed horizontal beam(s) — one
// to the right, two (left + right) at max level — hitting everything on the line.
function fireWeapon(state, id, aim, target, fx, audio) {
  const p = state.player, w = weaponStatsFor(state, id);
  p.weapCd[id] = w.rate;
  if (id === 'claw') {
    p.angle = aim; // the crab faces its claw target, so the arc reads clearly
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
      e.hp -= dmg; e.flash = 0.12; state.stats.damage += dmg;
      // Knockback: the claw shoves creatures away, so the crab is never simply swarmed.
      const ka = Math.atan2(e.y - p.y, e.x - p.x);
      const kb = e.elite ? 8 : 26;
      e.x += Math.cos(ka) * kb; e.y += Math.sin(ka) * kb;
      if (hits < 4) fx.text(e.x, e.y - e.r - 6, `${dmg}`, '#ffd166');
      fx.burst(e.x, e.y, '#ffd166', 5, 150); // a visible puff on every claw hit
      hits += 1;
    }
    audio.snap();
  } else if (id === 'bow') { // a volley of parallel piercing arrows
    for (let i = 0; i < w.arrows; i += 1) {
      const off = (i - (w.arrows - 1) / 2) * 14;
      state.bolts.push({ x: p.x + Math.cos(aim) * 28 - Math.sin(aim) * off,
        y: p.y + Math.sin(aim) * 28 + Math.cos(aim) * off,
        vx: Math.cos(aim) * 640, vy: Math.sin(aim) * 640, dmg: Math.round(w.dmg),
        pierce: w.pierce, r: 7, life: 1.1, kind: 'arrow' });
    }
    fx.bubbles(p.x + Math.cos(aim) * 28, p.y + Math.sin(aim) * 28, 2);
    audio.bolt();
  } else if (id === 'laser') { // hitscan beams, fixed horizontal directions
    p.laser = 0.15; p.laserLen = w.range; p.laserBeams = w.beams;
    const dirs = w.beams >= 2 ? [1, -1] : [1];
    let hits = 0;
    for (const dir of dirs) {
      for (const e of state.enemies) {
        const dx = (e.x - p.x) * dir, dy = Math.abs(e.y - p.y);
        if (dx < 0 || dx > w.range + e.r || dy > 16 + e.r) continue;
        const dmg = Math.round(w.dmg * (0.9 + state.rng.next() * 0.2));
        e.hp -= dmg; e.flash = 0.12; state.stats.damage += dmg;
        if (hits < 4) fx.text(e.x, e.y - e.r - 6, `${dmg}`, '#ff2e88');
        hits += 1;
      }
    }
    fx.burst(p.x, p.y, '#ff2e88', 6, 120);
    audio.bolt();
  } else if (id === 'shell') { // homing: one shell that steers toward its target
    state.bolts.push({ x: p.x + Math.cos(aim) * 28, y: p.y + Math.sin(aim) * 28,
      vx: Math.cos(aim) * w.speed, vy: Math.sin(aim) * w.speed, dmg: Math.round(w.dmg),
      pierce: 0, r: 9, life: 2.0, kind: 'homing', target, turn: w.turn, speed: w.speed });
    fx.bubbles(p.x + Math.cos(aim) * 28, p.y + Math.sin(aim) * 28, 2);
    audio.bolt();
  } else if (id === 'spin') { // ring blast: everything nearby takes damage + a shove
    p.spin = 0.3;
    fx.burst(p.x, p.y, '#7fe0c3', 18, 260, 'bubble');
    let hits = 0;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > w.range + e.r) continue;
      const dmg = Math.round(w.dmg * (0.9 + state.rng.next() * 0.2));
      e.hp -= dmg; e.flash = 0.12; state.stats.damage += dmg;
      const ka = Math.atan2(e.y - p.y, e.x - p.x);
      const kb = e.elite ? 8 : 30;
      e.x += Math.cos(ka) * kb; e.y += Math.sin(ka) * kb;
      if (hits < 4) fx.text(e.x, e.y - e.r - 6, `${dmg}`, '#7fe0c3');
      hits += 1;
    }
    audio.pop();
  } else { // blaster: a tight spread of ink pellets
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

// Is any creature on the laser's beam line? The beams are fixed horizontal
// directions (right; left + right at max level), so the laser only fires when
// something is actually in the way.
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
  p.moving = (mv.x || mv.y || p.dashT > 0) ? 1 : Math.max(0, p.moving - dt * 5); // drives the walk cycle
  if (p.dashT > 0) { // dashing: keep the burst direction, ignore steering
    p.dashT -= dt;
    const s = slideAtEdge(p, p.dashVx, p.dashVy);
    p.x += s.vx * dt; p.y += s.vy * dt;
    fx.bubbles(p.x, p.y, 1); // a bubble trail marks the dash path
    if (state.ups.ink > 0 && state.rng.chance(0.7)) {
      state.inks.push({ x: p.x, y: p.y, r: 26 + state.ups.ink * 6, life: 2.2, dmg: 6 + state.ups.ink * 4 });
    }
  } else if (mv.x || mv.y) {
    const s = slideAtEdge(p, mv.x * p.speed, mv.y * p.speed);
    p.x += s.vx * dt; p.y += s.vy * dt;
    p.angle = Math.atan2(mv.y, mv.x);
  }
  clampToPool(p); // safety net — the slide above already keeps the crab inside
  // Dash on Space/Shift, with a burst, i-frames and a whoosh.
  if (input.dashHeld() && p.dashCd <= 0 && (mv.x || mv.y)) {
    p.dashCd = PLAYER.dashCd; p.dashT = PLAYER.dashTime;
    p.dashVx = mv.x * PLAYER.dashSpeed; p.dashVy = mv.y * PLAYER.dashSpeed;
    p.iframes = Math.max(p.iframes, 0.3);
    state.stats.dashes += 1;
    fx.bubbles(p.x, p.y, 8); audio.dash();
  }
  // Auto-attack: EVERY owned weapon fires on its own, each on its own
  // cooldown, each aimed at the nearest creature in ITS range — the claw
  // cleaves, the bow looses, the blaster bursts, the shell homes, the spin
  // blasts, the laser beams. The crab turns to face the nearest creature overall.
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
  // A sturdier shell soaks a flat slice of every hit.
  const soaked = Math.min(4, state.ups.shell * 1);
  const real = Math.max(1, dmg - soaked);
  p.hp -= real; p.iframes = PLAYER.iframes; p.flash = 0.25;
  state.stats.taken += real;
  fx.shake(0.35); fx.text(p.x, p.y - 30, `-${real}`, PAL.hp, true);
  fx.burst(p.x, p.y, PAL.hp, 8, 160);
  audio.hurt();
  if (p.hp <= 0) { p.hp = 0; state.phase = 'over'; state.result = 'lost'; audio.lose(); }
}
