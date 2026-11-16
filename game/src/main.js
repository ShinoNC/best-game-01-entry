// TIDEKEEPER — boot and the one loop.
// A hermit crab clears 30 stages of the rockpool, collects six auto-weapons
// and buys better gear in the shop after each stage, and drives off a heron
// at every fifth stage to win. Fixed 60 Hz sim apart from rendering; seeded RNG.
// Criterion 1: title -> play -> level-up -> stage-clear (card + shop) ->
// win/lose -> restart, all real, all visible.
// ?seed=N fixes the run. ?shot=start|play|elite|boss|storm|levelup|stageclear|end
// stages that scene for screenshots.
import { BEST_KEY, VIEW_H, VIEW_W } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createRenderer, levelUpRowX, stageClearLayout } from './render.js';
import { STEP, nextStage, stepWorld } from './world.js';
import { applyUpgrade } from './upgrades.js';
import { applyStageCard, buyOffer } from './weapons.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();
const fx = createParticles();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function writeBest(v) {
  try { window.localStorage.setItem(BEST_KEY, String(v)); } catch { /* private mode */ }
}

let state;
if (shot) {
  state = stageShot(shot, seed, fx, audio);
  state.best = readBest();
  state.shotMode = true; // staged frames always show the blinking prompts, never a blank blink
  renderer.render(state, fx, state.time);
  renderer.render(state, fx, state.time);
  window.__shotReady = true;
} else {
  state = createState(createRandom(seed), seed);
  state.best = readBest();
  // Debug hook for playtests: the sim state, live, plus a manual step.
  window.__tide = { state, fx, audio, step: (inp) => stepWorld(state, inp, STEP, fx, audio), STEP };
  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    handleMenus();
    if (state.levelFlash > 0) state.levelFlash = Math.max(0, state.levelFlash - dt * 1.4);
    if (state.phase === 'play') {
      acc += dt;
      while (acc >= STEP) { stepWorld(state, input, STEP, fx, audio); acc -= STEP; if (state.phase !== 'play') break; }
      if (state.phase === 'over' && state.score > state.best) { state.best = state.score; writeBest(state.best); }
    }
    fx.update(dt);
    renderer.render(state, fx, state.time);
    input.endFrame();
  }
  requestAnimationFrame(frame);
}

function toLogical(mx, my) {
  const scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
  const ox = (canvas.width - VIEW_W * scale) / 2, oy = (canvas.height - VIEW_H * scale) / 2;
  return { x: (mx - ox) / scale, y: (my - oy) / scale };
}

function inBox(m, b) { return m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h; }

function handleMenus() {
  if (input.mutePressed()) { const m = audio.toggleMute(); status.textContent = m ? 'Muted' : 'Sound on'; }
  if (state.phase === 'title') {
    if (input.confirmPressed() || input.click()) {
      audio.unlock();
      state.phase = 'play';
      state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
      status.textContent = 'Clear 30 stages. A heron waits at every fifth stage!';
    }
    return;
  }
  if (state.phase === 'play') {
    if (input.pausePressed()) { state.phase = 'paused'; status.textContent = 'Paused'; return; }
    return;
  }
  if (state.phase === 'paused') {
    if (input.pausePressed() || input.confirmPressed() || input.click()) state.phase = 'play';
    if (input.restartPressed()) restart();
    return;
  }
  if (state.phase === 'levelup') {
    const n = input.numberPressed();
    if (n >= 1 && n <= (state.levelChoices || []).length) { pickCard(n - 1); return; }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      const rowX = levelUpRowX(state); // hit-boxes follow the drawn row (v3: it slides)
      (state.levelChoices || []).forEach((c, i) => {
        const x = rowX + i * 240, y = 270;
        if (m.x >= x && m.x <= x + 210 && m.y >= y && m.y <= y + 220) pickCard(i);
      });
    }
    return;
  }
  if (state.phase === 'stageclear') {
    // 1/2/3 pick a card; Enter/Space advances (only after a card is picked).
    const n = input.numberPressed();
    if (n >= 1 && n <= (state.levelChoices || []).length && !state.stagePicked) { pickStageCard(n - 1); return; }
    if (input.confirmPressed()) {
      if (state.stagePicked) { nextStage(state, audio); status.textContent = `Stage ${state.stage}`; }
      else status.textContent = 'Pick a card first!';
      return;
    }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      const L = stageClearLayout(state); // hit-boxes follow the drawn screen
      if (!state.stagePicked) {
        for (let i = 0; i < L.cards.length; i += 1) {
          if (inBox(m, L.cards[i])) { pickStageCard(i); return; }
        }
      }
      for (let i = 0; i < L.shop.length; i += 1) {
        if (inBox(m, L.shop[i])) {
          if (buyOffer(state, i)) { audio.buy(); status.textContent = 'Bought!'; }
          return;
        }
      }
      if (inBox(m, L.next)) {
        if (state.stagePicked) { nextStage(state, audio); status.textContent = `Stage ${state.stage}`; }
        else status.textContent = 'Pick a card first!';
      }
    }
    return;
  }
  if (state.phase === 'over') {
    if (input.restartPressed() || input.click()) restart();
  }
}

function pickCard(i) {
  const c = state.levelChoices[i];
  if (!c) return;
  applyUpgrade(state, c.id);
  state.levelChoices = null; state.phase = 'play';
  audio.pop();
}

// The stage-clear card: a weapon card adds the weapon to the arsenal, a
// weapon level-up card raises that weapon, an upgrade card applies through
// the normal upgrade path. The screen stays up for the shop afterwards —
// picking the card does not leave the screen.
function pickStageCard(i) {
  const c = state.levelChoices[i];
  if (!c || state.stagePicked) return;
  if (!applyStageCard(state, c)) applyUpgrade(state, c.id);
  state.pickedCard = c; state.stagePicked = true;
  audio.pop();
}

function restart() {
  const best = state.best;
  const fresh = Math.floor(Math.random() * 4294967296);
  state = createState(createRandom(fresh), fresh);
  state.best = best;
  state.phase = 'play';
  state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
  fx.clear();
  window.__tide = { state, fx, audio, step: (inp) => stepWorld(state, inp, STEP, fx, audio), STEP };
  status.textContent = 'A new tide. Clear 30 stages!';
}
