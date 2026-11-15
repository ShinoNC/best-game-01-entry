// The fixed-step simulation: spawn, move, collide, collect, level, win, lose.
// One step is 1/60 s; the renderer never touches this state, so replays are exact.
import { ELITE, ENEMIES, POOL, STAGES, STAGE_COUNT, xpNeed } from './config.js';
import { onEnemyKilled, updateEnemies, updateSpawner } from './enemies.js';
import { hurtPlayer, updatePlayer } from './player.js';
import { rollChoices } from './upgrades.js';
import { rollStageChoices } from './weapons.js';
import { updateHints } from './tutorial.js';

export const STEP = 1 / 60;

function dropPearls(state, e) {
  // Big kills drop a few fat pearls; elites drop a shower; a boss drops a fortune.
  const n = e.elite ? 4 : e.boss ? 8 : e.xp;
  for (let i = 0; i < n; i += 1) {
    state.pearls.push({
      kind: 'pearl', x: e.x + state.rng.range(-26, 26), y: e.y + state.rng.range(-26, 26),
      v: e.boss ? 3 : e.elite ? 2 : 1, vx: state.rng.range(-30, 30),
      vy: state.rng.range(-30, 30), life: 25, bob: state.rng.angle(),
    });
  }
  // Coins are the shop currency: every kill pays, elites pay more, the heron pays most.
  for (let i = 0; i < e.coins; i += 1) {
    state.pearls.push({
      kind: 'coin', x: e.x + state.rng.range(-30, 30), y: e.y + state.rng.range(-30, 30),
      v: 1, vx: state.rng.range(-40, 40), vy: state.rng.range(-40, 40),
      life: 25, bob: state.rng.angle(),
    });
  }
  // Elites also drop a heal; a boss drops a bomb.
  if (e.elite) state.pickups.push({ x: e.x, y: e.y, kind: 'heal', life: 20 });
  if (e.boss) state.pickups.push({ x: e.x, y: e.y, kind: 'bomb', life: 20 });
}

function killEnemy(state, e, fx, audio) {
  state.kills += 1; state.score += e.score;
  fx.burst(e.x, e.y, e.color, e.elite ? 24 : 14, e.elite ? 260 : 190); // bigger death burst
  fx.bubbles(e.x, e.y, e.elite ? 12 : 6);
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
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10); // levelling up mends the shell a little
    state.levelChoices = rollChoices(state);
    state.cardSource = 'level'; state.phase = 'levelup'; state.levelFlash = 1; // a gold flash marks the level-up
    fx.burst(state.player.x, state.player.y, '#7fe0c3', 20, 200);
    audio.level();
    return; // one level-up at a time; the rest waits for the next pearl
  }
}

// Creatures left in this stage: unspawned budget + live enemies (minis count).
export function stageRemaining(state) {
  return (STAGES[state.stage - 1].budget - state.stageSpawned) + state.enemies.length;
}

// Advance to the next stage after the shop. Called from main.js; the sim calls
// it too. Resets the stage counters and announces the stage.
export function nextStage(state, audio) {
  state.stage += 1;
  state.stageSpawned = 0; state.stageEliteDone = false;
  state.spawnT = 0.8; state.stagePicked = false; state.pickedCard = null;
  state.levelChoices = null;
  // The boss flags are per-stage: without this reset the stage-5 boss would
  // suppress the stage-10 boss (bossSpawned stays true otherwise).
  state.bossSpawned = false; state.boss = null;
  state.phase = 'play';
  if (state.stage === STAGE_COUNT) {
    state.banner = '⚠ STAGE 10 — THE STORM HERON RETURNS! ⚠'; state.bannerT = 3;
    if (audio) audio.elite();
  } else if (state.stage === 5) {
    state.banner = '⚠ STAGE 5 — THE GREAT HERON! ⚠'; state.bannerT = 3;
    if (audio) audio.elite();
  } else {
    state.banner = `STAGE ${state.stage} — THE TIDE RISES`; state.bannerT = 2.5;
  }
}

export function stepWorld(state, input, dt, fx, audio) {
  if (state.phase !== 'play') return;
  state.time += dt;
  const p = state.player;

  updateHints(state, dt); // the first-30-seconds tutorial, contextual and once-only

  // The stage-clear beat: the budget is spent and the pool is empty. The crab
  // keeps moving (the beat must not feel like a freeze), the banner plays for
  // 1.2 s (the "STAGE CLEAR!" moment), then the card+shop screen.
  if (state.stageClearT > 0) {
    updatePlayer(state, input, dt, fx, audio);
    state.stageClearT -= dt;
    state.bannerT -= dt;
    if (state.stageClearT <= 0) {
      if (state.stage >= STAGE_COUNT) {
        state.phase = 'over'; state.result = 'won';
        state.score += 1000 + state.level * 100;
        audio.win();
      } else {
        state.levelChoices = rollStageChoices(state);
        state.cardSource = 'stage'; state.stagePicked = false;
        state.phase = 'stageclear'; state.levelFlash = 1;
        audio.clear();
      }
    }
    return;
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

  // Bolts fly, pierce, and pop — arrows and pellets use the same flight code.
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
        fx.text(e.x, e.y - e.r - 6, `${b.dmg}`, b.kind === 'pellet' ? '#c9a7ff' : '#bfe8e0');
        b.pierce -= 1; fx.burst(b.x, b.y, b.kind === 'pellet' ? '#7b5cff' : '#bfe8e0', 4, 100, 'bubble');
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

  // Deaths: score, pearls, coins, splits.
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    if (state.enemies[i].hp <= 0) { killEnemy(state, state.enemies[i], fx, audio); state.enemies.splice(i, 1); }
  }

  // Pearls and coins drift toward the crab inside the magnet radius, then get eaten.
  for (let i = state.pearls.length - 1; i >= 0; i -= 1) {
    const pe = state.pearls[i]; pe.life -= dt; pe.bob += dt * 3;
    pe.x += pe.vx * dt; pe.y += pe.vy * dt; pe.vx *= 0.96; pe.vy *= 0.96;
    const d = Math.hypot(p.x - pe.x, p.y - pe.y);
    if (d < p.magnet) { pe.x += ((p.x - pe.x) / (d || 1)) * 340 * dt; pe.y += ((p.y - pe.y) / (d || 1)) * 340 * dt; }
    if (d < p.radius + 10) {
      state.pearls.splice(i, 1);
      if (pe.kind === 'coin') {
        state.coins += pe.v; state.coinsEarned += pe.v; state.score += pe.v * 2;
        audio.coin();
      } else {
        state.pearlsCollected = (state.pearlsCollected || 0) + pe.v;
        gainXp(state, pe.v, fx, audio); audio.pop();
        if (state.phase !== 'play') return;
      }
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

  // Stage clear: the budget is spent and the pool is empty. Start the clear beat.
  if (state.stageSpawned >= STAGES[state.stage - 1].budget && state.enemies.length === 0
      && state.stageClearT <= 0) {
    state.stageClearT = 1.2;
    state.score += 100 + state.stage * 50;
    // Vacuum the leftovers: pearls and coins on the ground are collected at
    // once, so a stage never ends with money left behind. (A vacuum level-up
    // interrupts the beat with the level-up screen; the beat resumes after.)
    let vacuumedCoins = 0;
    for (const pe of state.pearls) {
      if (pe.kind === 'coin') { state.coins += pe.v; state.coinsEarned += pe.v; state.score += pe.v * 2; vacuumedCoins += pe.v; }
      else { state.pearlsCollected += pe.v; gainXp(state, pe.v, fx, audio); }
    }
    state.pearls.length = 0;
    if (vacuumedCoins > 0) audio.coin();
    if (state.stage >= STAGE_COUNT) {
      state.banner = 'THE STORM HERON FALLS — HIGH TIDE!'; state.bannerT = 1.2;
    } else if (state.stage === 5) {
      state.banner = '★ STAGE 5 CLEAR — THE HERON IS DRIVEN OFF! ★'; state.bannerT = 1.2;
    } else {
      state.banner = `★ STAGE ${state.stage} CLEAR! ★`; state.bannerT = 1.2;
    }
    audio.clear();
  }
}
