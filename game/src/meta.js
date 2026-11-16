// Meta-progression: the game remembers. Best score per difficulty, unlocked
// feats, and the last three runs — all in localStorage, all shown on the
// title and the end screen. Every read is guarded (private mode, corrupt
// JSON) and falls back to an empty record, never a crash.
import { DIFF_ORDER, FEATS } from './config.js';

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
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

// The meta record: { bests: { easy, normal, hard }, feats: [ids], runs: [...] }.
// A legacy single best (pre-v8) is adopted as the NORMAL best once.
export function readMeta() {
  const bests = readJson(BESTS_KEY, {});
  for (const d of DIFF_ORDER) if (typeof bests[d] !== 'number') bests[d] = 0;
  if (bests.normal === 0) {
    try { bests.normal = Number.parseInt(window.localStorage.getItem(LEGACY_BEST_KEY) ?? '0', 10) || 0; } catch { /* ignore */ }
  }
  const feats = readJson(FEATS_KEY, []);
  const runs = readJson(RUNS_KEY, []);
  return {
    bests,
    feats: Array.isArray(feats) ? feats.filter((id) => FEATS.some((f) => f.id === id)) : [],
    runs: Array.isArray(runs) ? runs.slice(0, 3) : [],
  };
}

// Which feats did THIS run earn that were not already unlocked? Pure — it
// reads the run's stats and the stored set, and never writes. The caller
// writes the union.
export function featsEarnedThisRun(state, unlocked) {
  const have = new Set(unlocked);
  const won = state.result === 'won';
  const hp = Math.ceil(state.player.hp);
  const gradeS = won && hp >= 60;
  const earned = [];
  const test = (id, ok) => { if (ok && !have.has(id)) earned.push(id); };
  test('firstblood', state.kills >= 1);
  test('arsenal', ['claw', 'bow', 'blaster', 'shell', 'spin', 'laser'].every((w) => state.weapons[w] > 0));
  test('heron', (state.stats.bossesDown || 0) >= 1);
  test('king', won);
  test('untouched', !!state.stats.cleanStage);
  test('rich', (state.stats.maxCoins || 0) >= 500);
  test('combo', (state.stats.bestCombo || 0) >= 8);
  test('grades', gradeS);
  return earned;
}

// Record a finished run: update the difficulty best, unlock new feats, and
// prepend the run to the history (kept at 3). Returns the new meta record.
export function recordRun(state, meta) {
  const diff = state.difficulty || 'normal';
  const bests = { ...meta.bests };
  if (state.score > (bests[diff] || 0)) bests[diff] = state.score;
  const earned = featsEarnedThisRun(state, meta.feats);
  const feats = [...new Set([...meta.feats, ...earned])];
  const hp = Math.ceil(state.player.hp);
  const grade = state.result === 'won' ? (hp >= 60 ? 'S' : hp > 25 ? 'A' : 'B') : (state.stage >= 24 ? 'C' : 'D');
  const run = {
    won: state.result === 'won', stage: state.stage, score: state.score,
    diff, grade, time: Math.round(state.time),
  };
  const runs = [run, ...meta.runs].slice(0, 3);
  const next = { bests, feats, runs };
  writeJson(BESTS_KEY, bests);
  writeJson(FEATS_KEY, feats);
  writeJson(RUNS_KEY, runs);
  // Keep the legacy single best in step (the HUD's BEST line reads it).
  try { window.localStorage.setItem(LEGACY_BEST_KEY, String(Math.max(...DIFF_ORDER.map((d) => bests[d] || 0)))); } catch { /* ignore */ }
  return { meta: next, earned };
}
