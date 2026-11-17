// TIDEKEEPER — boot and the one loop. Fixed 60 Hz sim, renderer interpolates.
import { AWARD_KIND, AWARD_TIERS, BEST_KEY, DIFF_ORDER } from './config.js';
import { createRandom } from './random.js';
import { createState } from './state.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { MENU_ITEMS, createRenderer, difficultyLayout, overLayout, stageMenuLayout, titleLayout } from './render.js';
import { STEP, nextStage, stepWorld } from './world.js';
import { REROLL_COST, autoBuy, buyCard, rerollHand } from './cards.js';
import { stageShot } from './shots.js';
import { overlayLayout } from './render/overlays.js';
import { featsEarnedThisRun, readLastDiff, readMeta, recordRun, writeLastDiff } from './meta.js';

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

// Attach the meta record (bests, feats, last runs) to a state.
function attachMeta(s) {
  s.meta = readMeta();
  s.best = Math.max(0, ...DIFF_ORDER.map((d) => s.meta.bests[d] || 0), readBest());
  s.audio = audio; // the settings overlay reads the live mute/music state
  return s;
}

// Mouse mapping goes through the renderer's view transform.
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
  if (state.phase === 'over') state.featsEarned = featsEarnedThisRun(state, state.meta.feats);
  state.shotMode = true; // staged frames always show the blinking prompts, never a blank blink
  renderer.render(state, fx, state.time);
  renderer.render(state, fx, state.time);
  window.__shotReady = true;
} else {
  state = attachMeta(createState(createRandom(seed), seed, readLastDiff()));
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
// The harness fast-forward steps the world itself; the loop must not ALSO step.
      if (!window.__ffActive) {
        let steps = 0;
        while (acc >= STEP && steps < 4) { stepWorld(state, input, STEP, fx, audio); acc -= STEP; steps += 1; if (state.phase !== 'play') break; }
      }
      if (acc >= STEP) acc = 0;
      if (state.phase === 'over' && !state.recorded) {
        state.recorded = true;
        const res = recordRun(state, state.meta || readMeta());
        state.meta = res.meta;
        state.featsEarned = res.earned;
        if (res.award) state.awardEarned = `${AWARD_TIERS[res.award.tier].metal} ${AWARD_KIND[res.award.diff]}`;
        state.best = Math.max(0, ...DIFF_ORDER.map((d) => res.meta.bests[d] || 0));
      }
    }
    fx.update(dt);
    const alpha = state.phase === 'play' ? Math.min(1, acc / STEP) : 1;
    const hover = state.phase === 'stageclear' ? toLogical(input.mouse().x, input.mouse().y) : null;
    renderer.render(state, fx, state.time, alpha, hover);
    input.endFrame();
  }
  requestAnimationFrame(frame);
}

function inBox(m, b) { return m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h; }

// The menu opens with a 250 ms input cooldown.
let menuCooldown = 0, menuPhase = 'title';

function buyMenuCard(i) {
  const card = (state.hand || [])[i];
  if (!card) return;
  const res = buyCard(state, card);
  if (res === 'ok') { audio.buy(); status.textContent = `Bought ${card.name}!`; }
  else if (res === 'poor') {
    state.menuMsg = `NOT ENOUGH COINS — NEED ${card.price - state.coins} MORE`;
    state.menuMsgT = 1.5;
    status.textContent = state.menuMsg;
  }
}

function doReroll() {
  if (rerollHand(state)) { audio.reroll(); status.textContent = 'New cards!'; }
  else {
    state.menuMsg = `REROLL COSTS ${REROLL_COST} — NOT ENOUGH COINS`;
    state.menuMsgT = 1.5;
    status.textContent = state.menuMsg;
  }
}

// An open overlay swallows its own input. True while an overlay is open.
function handleOverlay() {
  if (!state.overlay) return false;
  const L = overlayLayout(state);
  if (input.helpPressed() || input.pausePressed()) { state.overlay = null; return true; }
  if (input.click()) {
    const m = toLogical(input.mouse().x, input.mouse().y);
    if (inBox(m, L.close) || !inBox(m, L.panel)) { state.overlay = null; return true; }
    if (L.sound && inBox(m, L.sound)) { audio.toggleMute(); return true; }
    if (L.music && inBox(m, L.music)) { audio.toggleMusic(); return true; }
  }
  return true;
}

function startRun() {
  audio.unlock();
  writeLastDiff(state.difficulty);
  state.phase = 'play';
  state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
  status.textContent = 'Clear 30 stages. A heron waits at every fifth stage!';
}

// The title menu: START opens the difficulty select; the rest open overlays.
function activateMenu(item) {
  if (item === 'start') { state.phase = 'difficulty'; status.textContent = 'Choose your tide'; }
  else state.overlay = item;
}

function handleMenus() {
  if (input.mutePressed()) { const m = audio.toggleMute(); status.textContent = m ? 'Muted' : 'Sound on'; }
  if (state.phase === 'title') {
    if (handleOverlay()) { menuPhase = 'title'; return; }
    if (input.wasPressed('arrowup')) {
      state.menuSel = (state.menuSel + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
      menuPhase = 'title'; return;
    }
    if (input.wasPressed('arrowdown')) {
      state.menuSel = (state.menuSel + 1) % MENU_ITEMS.length;
      menuPhase = 'title'; return;
    }
    if (input.helpPressed()) { state.overlay = 'help'; menuPhase = 'title'; return; }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      const TL = titleLayout();
      for (let i = 0; i < MENU_ITEMS.length; i += 1) {
        if (inBox(m, TL[MENU_ITEMS[i]])) { state.menuSel = i; activateMenu(MENU_ITEMS[i]); menuPhase = 'title'; return; }
      }
      menuPhase = 'title';
      return;
    }
    if (input.confirmPressed()) activateMenu(MENU_ITEMS[state.menuSel]);
    menuPhase = 'title';
    return;
  }
  if (state.phase === 'difficulty') {
    const n = input.numberPressed();
    if (n >= 1 && n <= DIFF_ORDER.length) { state.difficulty = DIFF_ORDER[n - 1]; startRun(); return; }
    if (input.wasPressed('arrowleft') || input.wasPressed('arrowup')) {
      const i = DIFF_ORDER.indexOf(state.difficulty);
      state.difficulty = DIFF_ORDER[(i + DIFF_ORDER.length - 1) % DIFF_ORDER.length];
      return;
    }
    if (input.wasPressed('arrowright') || input.wasPressed('arrowdown')) {
      const i = DIFF_ORDER.indexOf(state.difficulty);
      state.difficulty = DIFF_ORDER[(i + 1) % DIFF_ORDER.length];
      return;
    }
    if (input.wasPressed('escape')) { state.phase = 'title'; menuPhase = 'title'; return; }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      const DL = difficultyLayout();
      const hit = DL.diffs.find((b) => inBox(m, b));
      if (hit) { state.difficulty = hit.id; startRun(); return; }
      if (inBox(m, DL.back)) { state.phase = 'title'; menuPhase = 'title'; return; }
      return;
    }
    if (input.confirmPressed()) startRun();
    menuPhase = 'difficulty';
    return;
  }
  if (state.phase === 'play') {
    if (input.pausePressed()) { state.phase = 'paused'; status.textContent = 'Paused'; return; }
    menuPhase = 'play';
    return;
  }
  if (state.phase === 'paused') {
    if (handleOverlay()) { menuPhase = 'paused'; return; }
    if (input.helpPressed()) { state.overlay = 'help'; menuPhase = 'paused'; return; }
    if (input.pausePressed() || input.confirmPressed() || input.click()) state.phase = 'play';
    if (input.restartPressed()) restart();
    menuPhase = 'paused';
    return;
  }
  if (state.phase === 'stageclear') {
    if (menuPhase !== 'stageclear') { menuCooldown = 0.25; menuPhase = 'stageclear'; }
    if (menuCooldown > 0) { menuCooldown -= 1 / 60; return; }
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
    if (input.wasPressed('escape')) { toTitle(); menuPhase = 'title'; return; }
    if (input.restartPressed()) { restart(); menuPhase = 'play'; return; }
    if (input.click()) {
      const m = toLogical(input.mouse().x, input.mouse().y);
      if (inBox(m, overLayout().menu)) { toTitle(); menuPhase = 'title'; return; }
      restart(); // any other click (incl. PLAY AGAIN) restarts
      menuPhase = 'play';
    }
    menuPhase = 'over';
  }
}

// A fresh state for a new run or a return to the title — meta survives.
function freshState(phase) {
  const best = state.best;
  const meta = state.meta;
  const difficulty = state.difficulty || 'normal';
  const fresh = Math.floor(Math.random() * 4294967296);
  state = createState(createRandom(fresh), fresh, difficulty);
  state.best = best;
  state.meta = meta;
  state.audio = audio;
  state.phase = phase;
  fx.clear();
  window.__tide = { state, fx, audio, step: (inp) => stepWorld(state, inp, STEP, fx, audio), STEP,
    menuLayout: () => stageMenuLayout(state), toScreen, toLogical, viewTransform: () => renderer.viewTransform(),
    autoBuy: () => autoBuy(state) };
}

function restart() {
  freshState('play');
  state.banner = 'STAGE 1 — SLAY THEM ALL'; state.bannerT = 3;
  status.textContent = 'A new tide. Clear 30 stages!';
}

function toTitle() {
  freshState('title');
  status.textContent = 'TIDEKEEPER — clear 30 stages, beat the herons!';
}
