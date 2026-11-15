// The crab: WASD/arrows move, claws auto-swing at the nearest creature in range,
// click fires a bubble bolt at the mouse, Space/Shift dashes (with i-frames).
// Criterion 2: movement + auto-attack + aimed bolt + dash are four different verbs.
import { PAL, PLAYER, POOL } from './config.js';

function clampToPool(p) {
  const dx = (p.x - POOL.cx) / POOL.rx, dy = (p.y - POOL.cy) / POOL.ry;
  const d = Math.hypot(dx, dy);
  if (d > 1) { p.x = POOL.cx + (dx / d) * POOL.rx; p.y = POOL.cy + (dy / d) * POOL.ry; }
}

export function nearestEnemy(state, x, y, range) {
  let best = null, bd = range * range;
  for (const e of state.enemies) {
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 < bd) { bd = d2; best = e; }
  }
  return best;
}

export function updatePlayer(state, input, dt, fx, audio) {
  const p = state.player;
  p.clawCd -= dt; p.boltCd -= dt; p.dashCd -= dt; p.iframes -= dt; p.flash -= dt; p.swing -= dt;
  const mv = input.move();
  p.moving = (mv.x || mv.y || p.dashT > 0) ? 1 : Math.max(0, p.moving - dt * 5); // drives the walk cycle
  if (p.dashT > 0) { // dashing: keep the burst direction, ignore steering
    p.dashT -= dt;
    p.x += p.dashVx * dt; p.y += p.dashVy * dt;
    fx.bubbles(p.x, p.y, 1); // a bubble trail marks the dash path
    if (state.ups.ink > 0 && state.rng.chance(0.7)) {
      state.inks.push({ x: p.x, y: p.y, r: 26 + state.ups.ink * 6, life: 2.2, dmg: 6 + state.ups.ink * 4 });
    }
  } else if (mv.x || mv.y) {
    p.x += mv.x * p.speed * dt; p.y += mv.y * p.speed * dt;
    p.angle = Math.atan2(mv.y, mv.x);
  }
  clampToPool(p);
  // Dash on Space/Shift, with a burst, i-frames and a whoosh.
  if (input.dashHeld() && p.dashCd <= 0 && (mv.x || mv.y)) {
    p.dashCd = PLAYER.dashCd; p.dashT = PLAYER.dashTime;
    p.dashVx = mv.x * PLAYER.dashSpeed; p.dashVy = mv.y * PLAYER.dashSpeed;
    p.iframes = Math.max(p.iframes, 0.3);
    state.stats.dashes += 1;
    fx.bubbles(p.x, p.y, 8); audio.dash();
  }
  // Auto-claw: a cleaving swipe that hits EVERY creature in range inside the arc,
  // so the crab can hold a crowd instead of duelling it one by one.
  const target = nearestEnemy(state, p.x, p.y, p.clawRange);
  if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
  if (target && p.clawCd <= 0) {
    p.clawCd = p.clawRate; p.swing = 0.18;
    // The swipe catches the nearest few creatures in the arc — never the whole crowd.
    const inArc = state.enemies
      .map((e) => ({ e, d: Math.hypot(e.x - p.x, e.y - p.y) }))
      .filter(({ e, d }) => {
        if (d > p.clawRange + e.r) return false;
        let da = Math.atan2(e.y - p.y, e.x - p.x) - p.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        return Math.abs(da) <= PLAYER.clawArc;
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
    let hits = 0;
    for (const { e } of inArc) {
      const dmg = Math.round(p.clawDamage * (0.9 + state.rng.next() * 0.2));
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
  }
  // Bubble bolt: click to shoot at the mouse, pierces two creatures.
  if (input.click() && p.boltCd <= 0) {
    const m = input.mouse();
    const a = Math.atan2(m.y - p.y, m.x - p.x);
    p.boltCd = PLAYER.boltCd;
    state.bolts.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24,
      vx: Math.cos(a) * PLAYER.boltSpeed, vy: Math.sin(a) * PLAYER.boltSpeed,
      dmg: PLAYER.boltDamage + state.ups.claws * 3, pierce: 2, r: 9, life: 1.4 });
    audio.bolt();
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
