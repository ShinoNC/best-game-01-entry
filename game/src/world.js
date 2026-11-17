// The fixed-step simulation: spawn, move, collide, collect, win, lose.
// One step is 1/60 s; the renderer never touches this state, so replays are exact.
// Coins are the only pickup: kills drop coins, and the stage-clear menu spends
// them on cards. There is no level or XP — nothing interrupts play mid-stage.
import { COMBO_MAX, COMBO_WINDOW, ENEMIES, POOL, STAGES, STAGE_COUNT, bossForStage } from './config.js';
import { onEnemyKilled, updateEnemies, updateSpawner } from './enemies.js';
import { hurtPlayer, nearestEnemy, updatePlayer } from './player.js';
import { drawHand } from './cards.js';
import { updateHints } from './tutorial.js';

export const STEP = 1 / 60;

// Score multiplier from the current kill chain: every 4 chained kills raise
// it by one, up to ×8. The HUD shows it; the combo is score-only.
export function comboMultFor(chain) {
  return 1 + Math.min(COMBO_MAX - 1, Math.floor(chain / 4));
}
export function comboMult(state) { return comboMultFor(state.combo); }

function noteCoins(state) {
  if (state.coins > state.stats.maxCoins) state.stats.maxCoins = state.coins;
}

function dropCoins(state, e) {
  // Coins are the menu currency: every kill pays, elites pay more, the heron pays most.
  for (let i = 0; i < e.coins; i += 1) {
    state.drops.push({
      kind: 'coin', x: e.x + state.rng.range(-30, 30), y: e.y + state.rng.range(-30, 30),
      v: 1, vx: state.rng.range(-40, 40), vy: state.rng.range(-40, 40),
      life: 25, bob: state.rng.angle(),
    });
  }
  // Elites always drop a heal; any other creature drops one 4% of the time
  // (a boss drops a bomb instead). Heals stay scarce — the menu's SHELL
  // REPAIR card is the reliable heal — but a run needs more than one heal
  // per stage, so the swarm feeds the crab too.
  if (e.elite || (!e.boss && state.rng.chance(0.04))) state.pickups.push({ x: e.x, y: e.y, kind: 'heal', life: 20 });
  if (e.boss) state.pickups.push({ x: e.x, y: e.y, kind: 'bomb', life: 20 });
}

function killEnemy(state, e, fx, audio) {
  // Chain the combo: a kill within the window extends the chain, and the
  // multiplier grows every 4 chained kills. The popup shows the multiplied
  // score — the player sees the combo pay off on every kill.
  state.kills += 1;
  state.combo += 1; state.comboT = COMBO_WINDOW;
  if (state.combo > state.stats.bestCombo) state.stats.bestCombo = state.combo;
  const gained = e.score * comboMult(state);
  state.score += gained;
  fx.burst(e.x, e.y, e.color, e.elite ? 24 : 14, e.elite ? 260 : 190); // bigger death burst
  fx.bubbles(e.x, e.y, e.elite ? 12 : 6);
  fx.text(e.x, e.y - e.r - 4, `+${gained}`, '#f4f9ff');
  audio.die();
  onEnemyKilled(state, e, fx);
  dropCoins(state, e);
}

// Creatures left in this stage: unspawned budget + live enemies (minis count).
export function stageRemaining(state) {
  return (STAGES[state.stage - 1].budget - state.stageSpawned) + state.enemies.length;
}

// Advance to the next stage after the menu. Called from main.js; the sim calls
// it too. Resets the stage counters and announces the stage.
export function nextStage(state, audio) {
  state.stage += 1;
  state.stageSpawned = 0; state.stageEliteDone = false;
  state.spawnT = 0.8;
  state.hand = []; state.rerolls = 0; state.clearBonus = 0; state.menuMsg = ''; state.menuMsgT = 0;
  state.stageTaken = 0; state.combo = 0; state.comboT = 0; // fresh stage, fresh chain
  // The boss flags are per-stage: without this reset the stage-5 boss would
  // suppress the stage-10 boss (bossSpawned stays true otherwise).
  state.bossSpawned = false; state.boss = null;
  state.phase = 'play';
  const boss = bossForStage(state.stage);
  if (boss) {
    state.banner = `⚠ STAGE ${state.stage} — ${boss.name}! ⚠`; state.bannerT = 3;
    if (audio) audio.elite();
  } else {
    state.banner = `STAGE ${state.stage} — THE TIDE RISES`; state.bannerT = 2.5;
  }
}

export function stepWorld(state, input, dt, fx, audio) {
  if (state.phase !== 'play') return;
  state.time += dt;
  const p = state.player;
  // Snapshot positions BEFORE the step: the renderer interpolates between
  // these and the new positions, so motion stays smooth on high-refresh
  // displays where one render frame is shorter than one sim step.
  p.px = p.x; p.py = p.y;
  for (const e of state.enemies) { e.px = e.x; e.py = e.y; }

  updateHints(state, dt); // the first-30-seconds tutorial, contextual and once-only

  // The stage-clear beat: the budget is spent and the pool is empty. The crab
  // keeps moving (the beat must not feel like a freeze), the banner plays for
  // 1.2 s (the "STAGE CLEAR!" moment), then the menu screen.
  if (state.stageClearT > 0) {
    updatePlayer(state, input, dt, fx, audio);
    state.stageClearT -= dt;
    state.bannerT -= dt;
    if (state.stageClearT <= 0) {
      if (state.stage >= STAGE_COUNT) {
        state.phase = 'over'; state.result = 'won';
        state.score += 1000 + state.stage * 100;
        audio.win();
      } else {
        // The clear bonus: every cleared stage pays coins on top of the kills
        // (25 + 5 per stage), so the menu always has something to spend — the
        // early game is the tightest, and a coin-only economy needs the boost
        // there most. Total over a run: ~2,900 coins.
        state.clearBonus = 40 + state.stage * 7;
        state.coins += state.clearBonus; state.coinsEarned += state.clearBonus;
        noteCoins(state);
        state.score += state.clearBonus * 2;
        state.hand = drawHand(state);
        state.rerolls = 0; state.menuMsg = ''; state.menuMsgT = 0;
        state.phase = 'stageclear';
        audio.clear();
      }
    }
    return;
  }
  state.bannerT -= dt;

  // The combo chain decays: 3 s without a kill resets it to ×1.
  if (state.comboT > 0) {
    state.comboT -= dt;
    if (state.comboT <= 0) state.combo = 0;
  }

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

  // Bolts fly, pierce, and pop — arrows, pellets and homing shells share the
  // flight code; a homing shell steers toward its target (re-acquiring the
  // nearest creature if its target died).
  for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
    const b = state.bolts[i]; b.life -= dt;
    if (b.kind === 'homing') {
      if (!b.target || b.target.hp <= 0 || !state.enemies.includes(b.target)) {
        b.target = nearestEnemy(state, b.x, b.y, 500);
      }
      if (b.target) {
        const want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        let cur = Math.atan2(b.vy, b.vx);
        let da = want - cur;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        cur += Math.max(-b.turn * dt, Math.min(b.turn * dt, da));
        b.vx = Math.cos(cur) * b.speed; b.vy = Math.sin(cur) * b.speed;
      }
    }
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

  // Deaths: score, coins, splits.
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    if (state.enemies[i].hp <= 0) { killEnemy(state, state.enemies[i], fx, audio); state.enemies.splice(i, 1); }
  }

  // Coins drift toward the crab inside the magnet radius, then get eaten.
  for (let i = state.drops.length - 1; i >= 0; i -= 1) {
    const pe = state.drops[i]; pe.life -= dt; pe.bob += dt * 3;
    pe.x += pe.vx * dt; pe.y += pe.vy * dt; pe.vx *= 0.96; pe.vy *= 0.96;
    const d = Math.hypot(p.x - pe.x, p.y - pe.y);
    if (d < p.magnet) { pe.x += ((p.x - pe.x) / (d || 1)) * 340 * dt; pe.y += ((p.y - pe.y) / (d || 1)) * 340 * dt; }
    if (d < p.radius + 10) {
      state.drops.splice(i, 1);
      state.coins += pe.v; state.coinsEarned += pe.v; state.score += pe.v * 2;
      noteCoins(state);
      audio.coin();
    } else if (pe.life <= 0) state.drops.splice(i, 1);
  }

  // Pickups: heal star, bomb bubble, magnet shell.
  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pk = state.pickups[i]; pk.life -= dt;
    if (Math.hypot(p.x - pk.x, p.y - pk.y) < p.radius + 16) {
      if (pk.kind === 'heal') { p.hp = Math.min(p.maxHp, p.hp + 25); fx.text(p.x, p.y - 30, '+25 ♥', '#ff8fb0', true); audio.heal(); }
      if (pk.kind === 'bomb') {
        fx.burst(p.x, p.y, '#ffd166', 30, 320); fx.shake(0.5); audio.die();
        for (const e of state.enemies) if (Math.hypot(e.x - p.x, p.y - p.y) < 180) { e.hp -= 70; e.flash = 0.15; }
      }
      if (pk.kind === 'magnet') { for (const pe of state.drops) { pe.x = p.x; pe.y = p.y; } }
      state.pickups.splice(i, 1);
    } else if (pk.life <= 0) state.pickups.splice(i, 1);
  }

  // Stage clear: the budget is spent and the pool is empty. Start the clear beat.
  if (state.stageSpawned >= STAGES[state.stage - 1].budget && state.enemies.length === 0
      && !state.player.grab && state.stageClearT <= 0) {
    state.stageClearT = 1.2;
    state.score += 100 + state.stage * 50;
    // A stage cleared without a scratch counts toward the UNTOUCHED feat.
    if (state.stageTaken === 0) state.stats.cleanStage = true;
    state.combo = 0; state.comboT = 0; // the chain ends with the stage
    // Vacuum the leftovers: coins on the ground are collected at once, so a
    // stage never ends with money left behind.
    let vacuumedCoins = 0;
    for (const pe of state.drops) {
      state.coins += pe.v; state.coinsEarned += pe.v; state.score += pe.v * 2; vacuumedCoins += pe.v;
    }
    state.drops.length = 0;
    noteCoins(state);
    if (vacuumedCoins > 0) audio.coin();
    const clearedBoss = bossForStage(state.stage);
    if (state.stage >= STAGE_COUNT) {
      state.banner = 'THE HERON KING FALLS — HIGH TIDE!'; state.bannerT = 1.2;
    } else if (clearedBoss) {
      state.banner = `★ STAGE ${state.stage} CLEAR — ${clearedBoss.name} IS DRIVEN OFF! ★`; state.bannerT = 1.2;
    } else {
      state.banner = `★ STAGE ${state.stage} CLEAR! ★`; state.bannerT = 1.2;
    }
    audio.clear();
  }
}
