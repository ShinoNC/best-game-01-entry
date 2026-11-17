import { FEAT_IDS } from './config.js';

const BESTS_KEY = 'tidekeeper-bests';
const FEATS_KEY = 'tidekeeper-feats';
const RUNS_KEY = 'tidekeeper-runs';
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
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function readMeta() {
  let best = readJson(BESTS_KEY, 0);
  if (typeof best !== 'number') best = 0;
  if (best === 0) {
    try { best = Number.parseInt(window.localStorage.getItem(LEGACY_BEST_KEY) ?? '0', 10) || 0; } catch {}
  }
  const feats = readJson(FEATS_KEY, []);
  const runs = readJson(RUNS_KEY, []);
  return {
    best,
    bestStage: readJson('tidekeeper-best-stage', 0) || 0,
    bestLevel: readJson('tidekeeper-best-level', 0) || 0,
    feats: Array.isArray(feats) ? feats.filter((id) => FEAT_IDS.includes(id)) : [],
    runs: Array.isArray(runs) ? runs.slice(0, 9) : [],
  };
}

export function featsEarnedThisRun(state, unlocked) {
  const have = new Set(unlocked);
  const earned = [];
  const test = (id, ok) => { if (ok && !have.has(id)) earned.push(id); };
  test('firstblood', state.kills >= 1);
  test('arsenal', ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser', 'trident'].every((w) => state.weapons[w] > 0));
  test('beast', (state.stats.bossesDown || 0) >= 1);
  test('untouched', !!state.stats.cleanStage);
  test('rich', (state.stats.maxCoins || 0) >= 500);
  test('combo', (state.stats.bestCombo || 0) >= 8);
  return earned;
}

export function recordRun(state, meta) {
  const best = Math.max(meta.best || 0, state.score);
  const bestStage = Math.max(meta.bestStage || 0, state.stage);
  const bestLevel = Math.max(meta.bestLevel || 0, state.level);
  const earned = featsEarnedThisRun(state, meta.feats);
  const feats = [...new Set([...meta.feats, ...earned])];
  const run = { stage: state.stage, score: state.score, level: state.level, time: Math.round(state.time) };
  const runs = [run, ...meta.runs].slice(0, 9);
  const next = { best, bestStage, bestLevel, feats, runs };
  writeJson(BESTS_KEY, best);
  writeJson('tidekeeper-best-stage', bestStage);
  writeJson('tidekeeper-best-level', bestLevel);
  writeJson(FEATS_KEY, feats);
  writeJson(RUNS_KEY, runs);
  try { window.localStorage.setItem(LEGACY_BEST_KEY, String(best)); } catch {}
  return { meta: next, earned };
}
