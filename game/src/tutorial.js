// First-30-seconds tutorial: sequential, contextual, non-blocking hints.
// Each hint shows once, fades after a few seconds, and only fires when its
// moment arrives (an enemy approaches, a pearl drops, a crowd closes in).
// Every hint is an icon plus a short line — the picture carries the meaning.
// Criterion 1: the goal and the controls are taught inside the game, not in a manual.
export const HINTS = [
  { id: 'move', icon: '✥', text: 'WASD / ARROWS — move', show: 5.0,
    cond: (s) => s.time > 0.5 },
  { id: 'weapons', icon: '✂', text: 'ALL WEAPONS FIRE ON THEIR OWN — DODGE!', show: 4.5,
    cond: (s) => s.enemies.some((e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 240) },
  { id: 'pearls', icon: '○', text: 'PEARLS = LEVEL UP', show: 4.5,
    cond: (s) => s.pearls.some((pe) => pe.kind !== 'coin') || s.pearlsCollected > 0 },
  { id: 'coins', icon: '◉', text: 'COINS = SHOP AFTER EACH STAGE', show: 4.5,
    cond: (s) => s.coins > 0 || s.pearls.some((pe) => pe.kind === 'coin') },
  { id: 'dash', icon: '»', text: 'SPACE — DASH OUT OF DANGER!', show: 4.5,
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
  // A banner owns the screen while it shows — a new hint waits its turn
  // instead of stacking a second text block over the first. The wait clock
  // pauses too, so the 8 s skip never fires during a banner.
  if (state.bannerT > 0) return;
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
