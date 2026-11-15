// First-30-seconds tutorial: sequential, contextual, non-blocking hints.
// v1's verdict was "game ko hiểu gì cả" — a new player never learned the goal or
// the verbs. Each hint shows once, fades after a few seconds, and only fires when
// its moment arrives (an enemy approaches, a pearl drops, a crowd closes in).
// Criterion 1: the goal and the controls are taught inside the game, not in a manual.
export const HINTS = [
  { id: 'move', text: 'WASD / ARROWS — move your crab', show: 5.0,
    cond: (s) => s.time > 0.5 },
  { id: 'claws', text: 'Your claws swing on their own — just walk close!', show: 4.5,
    cond: (s) => s.enemies.some((e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 240) },
  { id: 'bolt', text: 'CLICK — fire a bubble bolt at the mouse', show: 4.5,
    cond: (s) => s.time > 7 },
  { id: 'pearls', text: 'Collect pearls to LEVEL UP and grow stronger', show: 4.5,
    cond: (s) => s.pearls.length > 0 || s.pearlsCollected > 0 },
  { id: 'dash', text: 'SPACE — dash out of danger! (briefly invincible)', show: 4.5,
    cond: (s) => s.enemies.filter((e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 130).length >= 3 },
];

export function updateHints(state, dt) {
  const h = state.hints;
  if (!h || h.idx >= HINTS.length) return;
  if (h.cur) {
    h.t -= dt;
    if (h.t <= 0) { h.done[h.idx] = true; h.idx += 1; h.cur = null; h.wait = 0; }
    return;
  }
  // Hints fire in order; a later one waits until the earlier ones have shown.
  // But a hint whose moment never comes is skipped after 8 s, so one stuck
  // hint can never block the rest of the tutorial. The LAST hint is never
  // skipped — there is nothing after it to unblock, and its moment (being
  // crowded) may come long after the first 30 s.
  const def = HINTS[h.idx];
  if (def && def.cond(state)) { h.cur = def; h.t = def.show; h.wait = 0; return; }
  h.wait += dt;
  if (h.idx < HINTS.length - 1 && h.wait > 8) { h.done[h.idx] = true; h.idx += 1; h.wait = 0; }
}

// How far through the tutorial the player is (0–5), for the playtest report.
export function hintsShown(state) {
  return state.hints ? state.hints.done.filter(Boolean).length : 0;
}
