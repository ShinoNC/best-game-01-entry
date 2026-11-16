// TIDEKEEPER — boot and the one loop.
// A hermit crab clears 30 stages of the rockpool, collects six auto-weapons
// and buys better gear with coins in the stage-clear menu, and drives off a
// heron at every fifth stage to win. Fixed 60 Hz sim apart from rendering;
// the renderer interpolates between sim steps, so motion stays smooth on
// high-refresh displays. Seeded RNG.
// Criterion 1: title -> play -> stage-clear menu (5 cards + reroll) ->
// win/lose -> restart, all real, all visible.
// ?seed=N fixes the run. ?shot=start|play|elite|boss|storm|stageclear|end
// stages that scene for screenshots.
import { BEST_KEY, DIFF_ORDER } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createRenderer, stageMenuLayout, titleLayout } from './render.js';
import { STEP, nextStage, stepWorld } from './world.js';
import { REROLL_COST, autoBuy, buyCard, rerollHand } from './cards.js';
import { stageShot } from './shots.js';
import { featsEarnedThisRun, readMeta, recordRun } from './meta.js';

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

// Attach the meta record (bests per difficulty, feats, last runs) to a state.
// BEST is the max across difficulties — the HUD's single BEST line.
function attachMeta(s) {
  s.meta = readMeta();
  s.best = Math.max(0, ...DIFF_ORDER.map((d) => s.meta.bests[d] || 0), readBest());
  return s;
}

// Mouse mapping goes through the renderer's view transform — the single
// source of truth for the letterbox, so clicks always land where the game drew.
function toLogical(mx, my) {
  const { scale, ox, oy } = renderer.viewTransform();
  return { x: (mx - ox) / scale, y: (my - oy) / scale };
}
function toScreen(lx, ly) {
  const { scale, ox, oy } = renderer.viewTransform();
  return { x: ox + lx * scale, y: oy + ly * scale };
}

let state;
if (shot) {
  state = stageShot(shot, seed, fx, audio);
  attachMeta(state);
  // A staged end screen names the feats the staged run earned — computed
  // against the stored set, never written (staging must not pollute history).
  if (state.phase === 'over') state.featsEarned = featsEarnedThisRun(state, state.meta.feats);
  state.shotMode = true; // staged frames always show the blinking prompts, never a blank blink
  renderer.render(state, fx, state.time);
  renderer.render(state, fx, state.time);
  window.__shotReady = true;
} else {
  state = attachMeta(createState(createRandom(seed), seed));
  // Debug hook for playtests: the sim state, live, plus a manual step and the
  // menu layout / coordinate helpers the harness clicks with.
  window.__tide = { state, fx, audio, step: (inp) => stepWorld(state, inp, STEP, fx, audio), STEP,
    menuLayout: () => stageMenuLayout(state), toScreen, toLogical, viewTransform: () => renderer.viewTransform(),
    autoBuy: () => autoBuy(state) };
  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    handleMenus();
    if (state.phase === 'stageclear' && state.menuMsgT > 0) state.menuMsgT -= dt;
    if (state.phase === 'play') {
      acc += dt;
      // The harness fast-forward steps the world itself (window.__ffActive);
      // the render loop must not ALSO step, or the two step sources interleave
      // and the live run diverges from the Node sim. The backlog line below
      // keeps acc bounded while the fast-forward owns the sim.
      if (!window.__ffActive) {
        // At most 4 catch-up steps per frame; any backlog beyond that is
        // dropped, so one slow frame can never spiral into a catch-up storm.
        let steps = 0;
        while (acc >= STEP && steps < 4) { stepWorld(state, input, STEP, fx, audio); acc -= STEP; steps += 1; if (state.phase !== 'play') break; }
      }
      if (acc >= STEP) acc = 0;
      // A finished run is recorded exactly once: best per difficulty, new
      // feats, and the run history — the end screen reads all three.
      if (state.phase === 'over' && !state.recorded) {
        state.recorded = true;
        const res = recordRun(state, state.meta || readMeta());
        state.meta = res.meta;
        state.featsEarned = res.earned;
        state.best = Math.max(0, ...DIFF_ORDER.map((d) => res.meta.bests[d] || 0));
      }
    }
    fx.update(dt);
    // The render interpolates between sim steps only while playing; a frozen
    // screen (menu, pause, over) renders the final sim state exactly.
    const alpha = state.phase === 'play' ? Math.min(1, acc / STEP) : 1;
    const hover = state.phase === 'stageclear' ? toLogical(input.mouse().x, input.mouse().y) : null;
    renderer.render(state, fx, state.time, alpha, hover);
    input.endFrame();
  }
  requestAnimationFrame(frame);
}

function inBox(m, b) { return m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h; }

// The menu opens with a 250 ms input cooldown: a key or click held from the
// fight must not instantly buy a card or skip the menu.
let menuCooldown = 0, menuPhase = 'title';

function buyMenuCard(i) {
  const card = (state.hand || [])[i];
  if (!card) return;
  const res = buyCard(state, card);
  if (res === 'ok') { audio.buy(); status.textContent = `Bought ${card.name}!`; }
  else if (res === 'poor') {
    state.menuMsg = `NOT ENOUGH COINS — NEED ${card.price - state.coins} MORE ◉`;
    state.menuMsgT = 1.5;
    status.textContent = state.menuMsg;
  }
  // 'bought' is a no-op: an already-bought card does not respond.
}

function doReroll() {
  if (rerollHand(state)) { audio.reroll(); status.textContent = 'New cards!'; }
  else {
    state.menuMsg = `REROLL COSTS ${REROLL_COST} ◉ — NOT ENOUGH COINS`;
    state.menuMsgT = 1.5;
    status.textContent = state.menuMsg;
  }
}

function handleMenus() {
  if (input.mutePressed()) { const m = audio.toggleMute(); status.textContent = m ? 'Muted' : 'Sound on'; }
  if (state.phase === 'title') {
    // 1–3 select a difficulty; a click on a difficulty button selects it
    // instead of starting — the run starts on Enter/Space or a click anywhere else.
    const n = input.numberPressed();
    if (n >= 1 && n <= DIFF_ORDER.length) {
      state.difficulty = DIFF_ORDER[n - 1];
      status.textContent = `Difficulty: ${state.difficulty}`;
      menuPhase = 'title';
      return;
    }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      const TL = titleLayout();
      const hit = TL.diffs.find((b) => inBox(m, b));
      if (hit) {
        state.difficulty = hit.id;
        status.textContent = `Difficulty: ${state.difficulty}`;
        menuPhase = 'title';
        return;
      }
      audio.unlock();
      state.phase = 'play';
      state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
      status.textContent = 'Clear 30 stages. A heron waits at every fifth stage!';
      menuPhase = 'title';
      return;
    }
    if (input.confirmPressed()) {
      audio.unlock();
      state.phase = 'play';
      state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
      status.textContent = 'Clear 30 stages. A heron waits at every fifth stage!';
    }
    menuPhase = 'title';
    return;
  }
  if (state.phase === 'play') {
    if (input.pausePressed()) { state.phase = 'paused'; status.textContent = 'Paused'; return; }
    menuPhase = 'play';
    return;
  }
  if (state.phase === 'paused') {
    if (input.pausePressed() || input.confirmPressed() || input.click()) state.phase = 'play';
    if (input.restartPressed()) restart();
    menuPhase = 'paused';
    return;
  }
  if (state.phase === 'stageclear') {
    if (menuPhase !== 'stageclear') { menuCooldown = 0.25; menuPhase = 'stageclear'; }
    if (menuCooldown > 0) { menuCooldown -= 1 / 60; return; }
    // 1–5 buy a card; R rerolls the hand; Enter/Space advances (always enabled).
    const n = input.numberPressed();
    if (n >= 1 && n <= (state.hand || []).length) { buyMenuCard(n - 1); return; }
    if (input.rerollPressed()) { doReroll(); return; }
    if (input.confirmPressed()) { nextStage(state, audio); status.textContent = `Stage ${state.stage}`; return; }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      const L = stageMenuLayout(state); // hit-boxes follow the drawn screen
      for (let i = 0; i < L.cards.length; i += 1) {
        if (inBox(m, L.cards[i])) { buyMenuCard(i); return; }
      }
      if (inBox(m, L.reroll)) { doReroll(); return; }
      if (inBox(m, L.next)) { nextStage(state, audio); status.textContent = `Stage ${state.stage}`; }
    }
    return;
  }
  if (state.phase === 'over') {
    if (input.restartPressed() || input.click()) restart();
    menuPhase = 'over';
  }
}

function restart() {
  const best = state.best;
  const meta = state.meta;
  const difficulty = state.difficulty || 'normal';
  const fresh = Math.floor(Math.random() * 4294967296);
  state = createState(createRandom(fresh), fresh, difficulty);
  state.best = best;
  state.meta = meta;
  state.phase = 'play';
  state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
  fx.clear();
  window.__tide = { state, fx, audio, step: (inp) => stepWorld(state, inp, STEP, fx, audio), STEP,
    menuLayout: () => stageMenuLayout(state), toScreen, toLogical, viewTransform: () => renderer.viewTransform(),
    autoBuy: () => autoBuy(state) };
  status.textContent = 'A new tide. Clear 30 stages!';
}
