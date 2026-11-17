// Meta-progression.
import { AWARD_TIERS, AWARD_TITLES, DIFF_ORDER, FEATS } from './config.js';

const BESTS_KEY = 'tidekeeper-bests';
const FEATS_KEY = 'tidekeeper-feats';
const RUNS_KEY = 'tidekeeper-runs';
const WINS_KEY = 'tidekeeper-wins';
const LAST_DIFF_KEY = 'tidekeeper-last-diff';
export const LEGACY_BEST_KEY = 'tidekeeper-best';

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch { return fallback; }
}
function writeJson(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

// Meta record: { bests, feats, runs, wins }. A legacy single best
// (pre-v8) is adopted as the NORMAL best once.
export function readMeta() {
  const bests = readJson(BESTS_KEY, {});
  for (const d of DIFF_ORDER) if (typeof bests[d] !== 'number') bests[d] = 0;
  if (bests.normal === 0) {
    try { bests.normal = Number.parseInt(window.localStorage.getItem(LEGACY_BEST_KEY) ?? '0', 10) || 0; } catch { /* ignore */ }
  }
  const feats = readJson(FEATS_KEY, []);
  const runs = readJson(RUNS_KEY, []);
  const wins = readJson(WINS_KEY, {});
  for (const d of DIFF_ORDER) if (typeof wins[d] !== 'number') wins[d] = 0;
  return {
    bests,
    feats: Array.isArray(feats) ? feats.filter((id) => FEATS.some((f) => f.id === id)) : [],
    runs: Array.isArray(runs) ? runs.slice(0, 9) : [], // 3 per difficulty for HISTORY
    wins,
  };
}

// Award tier for a win count: 0/1/2 for 3/10/20, -1 below 3.
export function awardTier(w) { return w >= 20 ? 2 : w >= 10 ? 1 : w >= 3 ? 0 : -1; }
// The player's HARD title (highest tier earned) or null.
export function bestTitle(wins) {
  const t = awardTier((wins || {}).hard || 0);
  return t < 0 ? null : AWARD_TITLES[t];
}

// Last difficulty chosen — the screen opens on it.
export function readLastDiff() {
  try {
    const d = window.localStorage.getItem(LAST_DIFF_KEY);
    return DIFF_ORDER.includes(d) ? d : 'normal';
  } catch { return 'normal'; }
}
export function writeLastDiff(d) {
  try { window.localStorage.setItem(LAST_DIFF_KEY, d); } catch { /* private mode */ }
}

// Which feats did THIS run earn?
// it never writes; the caller writes the union.
export function featsEarnedThisRun(state, unlocked) {
  const have = new Set(unlocked);
  const won = state.result === 'won';
  const earned = [];
  const test = (id, ok) => { if (ok && !have.has(id)) earned.push(id); };
  test('firstblood', state.kills >= 1);
  test('arsenal', ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser', 'trident'].every((w) => state.weapons[w] > 0));
  test('beast', (state.stats.bossesDown || 0) >= 1);
  test('king', won);
  test('untouched', !!state.stats.cleanStage);
  test('rich', (state.stats.maxCoins || 0) >= 500);
  test('combo', (state.stats.bestCombo || 0) >= 8);
  return earned;
}

// Record a finished run.
// meta record, feats earned, and award earned (win hit 3/10/20).
export function recordRun(state, meta) {
  const diff = state.difficulty || 'normal';
  const bests = { ...meta.bests };
  if (state.score > (bests[diff] || 0)) bests[diff] = state.score;
  const earned = featsEarnedThisRun(state, meta.feats);
  const feats = [...new Set([...meta.feats, ...earned])];
  const wins = { ...(meta.wins || {}) };
  let award = null;
  if (state.result === 'won') {
    wins[diff] = (wins[diff] || 0) + 1;
    const tier = AWARD_TIERS.findIndex((t) => t.wins === wins[diff]);
    if (tier >= 0) award = { diff, tier };
  }
  const run = {
    won: state.result === 'won', stage: state.stage, score: state.score,
    diff, time: Math.round(state.time),
  };
  const runs = [run, ...meta.runs].slice(0, 9); // keep 3 per difficulty for HISTORY
  const next = { bests, feats, runs, wins };
  writeJson(BESTS_KEY, bests);
  writeJson(FEATS_KEY, feats);
  writeJson(RUNS_KEY, runs);
  writeJson(WINS_KEY, wins);
  // Keep the legacy single best in step.
  try { window.localStorage.setItem(LEGACY_BEST_KEY, String(Math.max(...DIFF_ORDER.map((d) => bests[d] || 0)))); } catch { /* ignore */ }
  return { meta: next, earned, award };
}
