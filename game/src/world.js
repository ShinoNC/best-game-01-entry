// The fixed-step simulation: spawn, move, collide, collect, level, win, lose.
// One step is 1/60 s; the renderer never touches this state, so replays are exact.
import { ELITE, ENEMIES, POOL, WAVE_EVERY, WIN_TIME, xpNeed } from './config.js';
import { onEnemyKilled, updateEnemies, updateSpawner } from './enemies.js';
import { hurtPlayer, updatePlayer } from './player.js';
import { rollChoices } from './upgrades.js';

export const STEP = 1 / 60;

function dropPearls(state, e) {
  // Big kills drop a few fat pearls; elites drop a shower; the heron drops a fortune.
  const n = e.elite ? 4 : e.type === 'heron' ? 8 : e.xp;
  for (let i = 0; i < n; i += 1) {
    state.pearls.push({
      x: e.x + state.rng.range(-26, 26), y: e.y + state.rng.range(-26, 26),
      v: e.type === 'heron' ? 3 : e.elite ? 2 : 1, vx: state.rng.range(-30, 30),
      vy: state.rng.range(-30, 30), life: 25, bob: state.rng.angle(),
    });
  }
  // Elites also drop a heal; the heron drops a bomb.
  if (e.elite) state.pickups.push({ x: e.x, y: e.y, kind: 'heal', life: 20 });
  if (e.type === 'heron') state.pickups.push({ x: e.x, y: e.y, kind: 'bomb', life: 20 });
}

function killEnemy(state, e, fx, audio) {
  state.kills += 1; state.score += e.score;
  fx.burst(e.x, e.y, e.color, e.elite ? 18 : 10, e.elite ? 220 : 150);
  fx.bubbles(e.x, e.y, e.elite ? 10 : 4);
  fx.text(e.x, e.y - e.r - 4, `+${e.score}`, '#f4f9ff');
  audio.die();
  onEnemyKilled(state, e, fx);
  dropPearls(state, e);
}

export function gainXp(state, n, fx, audio) {
  state.xp += n;
  state.score += n * 5;
  while (state.xp >= xpNeed(state.level)) {
    state.xp -= xpNeed(state.level); state.level += 1;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 15); // levelling up mends the shell
    state.levelChoices = rollChoices(state);
    state.phase = 'levelup';
    fx.burst(state.player.x, state.player.y, '#7fe0c3', 20, 200);
    audio.level();
    return; // one level-up at a time; the rest waits for the next pearl
  }
}

export function stepWorld(state, input, dt, fx, audio) {
  if (state.phase !== 'play') return;
  state.time += dt;
  const p = state.player;

  // Wave banners every 30 s — the tide visibly rising.
  if (Math.floor(state.time / WAVE_EVERY) + 1 > state.wave) {
    state.wave = Math.floor(state.time / WAVE_EVERY) + 1;
    state.banner = `WAVE ${state.wave} — THE TIDE RISES`; state.bannerT = 2.5;
  }
  state.bannerT -= dt;

  updateSpawner(state, dt, fx, audio);
  updatePlayer(state, input, dt, fx, audio);
  updateEnemies(state, dt);

  // Bubble Burst upgrade: a damaging ring around the crab every 6 s.
  state.bubbleT -= dt;
  if (state.ups.bubbles > 0 && state.bubbleT <= 0) {
    state.bubbleT = Math.max(3.2, 6 - state.ups.bubbles * 0.5);
    const r = 110 + state.ups.bubbles * 22, dmg = 14 + state.ups.bubbles * 8;
    fx.burst(p.x, p.y, '#bfe8e0', 22, 260, 'bubble');
    for (const e of state.enemies) {
      if (Math.hypot(e.x - p.x, e.y - p.y) < r + e.r) {
        e.hp -= dmg; e.flash = 0.12; state.stats.damage += dmg;
        const ka = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(ka) * 30; e.y += Math.sin(ka) * 30;
      }
    }
    audio.pop();
  }

  // Bubble bolts fly, pierce, and pop.
  for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
    const b = state.bolts[i]; b.life -= dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    let dead = b.life <= 0;
    for (const e of state.enemies) {
      if (b.pierce < 0) break;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
        e.hp -= b.dmg; e.flash = 0.12; state.stats.damage += b.dmg;
        const ka = Math.atan2(e.y - b.y, e.x - b.x);
        e.x += Math.cos(ka) * 14; e.y += Math.sin(ka) * 14;
        fx.text(e.x, e.y - e.r - 6, `${b.dmg}`, '#bfe8e0');
        b.pierce -= 1; fx.burst(b.x, b.y, '#bfe8e0', 4, 100, 'bubble');
        if (b.pierce < 0) dead = true;
      }
    }
    if (dead || Math.hypot(b.x - POOL.cx, b.y - POOL.cy) > 700) state.bolts.splice(i, 1);
  }

  // Ink pools burn and slow whatever swims through them.
  for (let i = state.inks.length - 1; i >= 0; i -= 1) {
    const ink = state.inks[i]; ink.life -= dt;
    if (ink.life <= 0) { state.inks.splice(i, 1); continue; }
    for (const e of state.enemies) {
      if (Math.hypot(e.x - ink.x, e.y - ink.y) < ink.r + e.r) {
        e.hp -= ink.dmg * dt; e.flash = Math.max(e.flash, 0.05);
      }
    }
  }

  // Contact damage: an enemy that touches the crab bites, then waits before biting again.
  for (const e of state.enemies) {
    if (e.hitCd > 0) continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.radius - 4) {
      e.hitCd = 0.9;
      hurtPlayer(state, e.dmg, fx, audio);
      if (state.phase !== 'play') return;
    }
  }

  // Deaths: score, pearls, splits.
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    if (state.enemies[i].hp <= 0) { killEnemy(state, state.enemies[i], fx, audio); state.enemies.splice(i, 1); }
  }

  // Pearls drift toward the crab inside the magnet radius, then get eaten.
  for (let i = state.pearls.length - 1; i >= 0; i -= 1) {
    const pe = state.pearls[i]; pe.life -= dt; pe.bob += dt * 3;
    pe.x += pe.vx * dt; pe.y += pe.vy * dt; pe.vx *= 0.96; pe.vy *= 0.96;
    const d = Math.hypot(p.x - pe.x, p.y - pe.y);
    if (d < p.magnet) { pe.x += ((p.x - pe.x) / (d || 1)) * 340 * dt; pe.y += ((p.y - pe.y) / (d || 1)) * 340 * dt; }
    if (d < p.radius + 10) {
      state.pearls.splice(i, 1); state.pearlsCollected = (state.pearlsCollected || 0) + pe.v;
      gainXp(state, pe.v, fx, audio); audio.pop();
      if (state.phase !== 'play') return;
    } else if (pe.life <= 0) state.pearls.splice(i, 1);
  }

  // Pickups: heal star, bomb bubble, magnet shell.
  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pk = state.pickups[i]; pk.life -= dt;
    if (Math.hypot(p.x - pk.x, p.y - pk.y) < p.radius + 16) {
      if (pk.kind === 'heal') { p.hp = Math.min(p.maxHp, p.hp + 25); fx.text(p.x, p.y - 30, '+25 ♥', '#ff8fb0', true); audio.heal(); }
      if (pk.kind === 'bomb') {
        fx.burst(p.x, p.y, '#ffd166', 30, 320); fx.shake(0.5); audio.die();
        for (const e of state.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 180) { e.hp -= 70; e.flash = 0.15; }
      }
      if (pk.kind === 'magnet') { for (const pe of state.pearls) { pe.x = p.x; pe.y = p.y; } }
      state.pickups.splice(i, 1);
    } else if (pk.life <= 0) state.pickups.splice(i, 1);
  }
  // A starfish heal drifts in every 50 s so long runs stay fair.
  if (state.time > 50 && !state.healDroppedAt50) {
    state.healDroppedAt50 = true;
    state.pickups.push({ x: POOL.cx + 200, y: POOL.cy - 120, kind: 'heal', life: 30 });
  }

  // Win: the tide comes in at 5:00. Lose: handled in hurtPlayer.
  if (state.time >= WIN_TIME && state.phase === 'play') {
    state.phase = 'over'; state.result = 'won';
    state.score += 1000 + state.level * 100;
    audio.win();
  }
}
