// First-30-seconds tutorial: sequential, contextual hints.
export const HINTS = [
  { id: 'move', icon: '✥', text: 'WASD / ARROWS — move', show: 5.0,
    cond: (s) => s.time > 0.5 },
  { id: 'weapons', icon: '✂', text: 'ALL WEAPONS FIRE ON THEIR OWN — DODGE!', show: 4.5,
    cond: (s) => s.enemies.some((e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 240) },
  { id: 'coins', icon: '$', text: 'COINS — BUY CARDS AFTER EACH STAGE', show: 4.5,
    cond: (s) => s.coins > 0 || s.drops.length > 0 },
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
  // A banner owns the screen; a new hint waits its turn.
  if (state.bannerT > 0) return;
  // Hints fire in order; one whose moment never comes is skipped after 8s,
  // so a stuck hint never blocks the rest. The LAST is never skipped.
  const def = HINTS[h.idx];
  if (def && def.cond(state)) { h.cur = def; h.t = def.show; h.wait = 0; return; }
  h.wait += dt;
  if (h.idx < HINTS.length - 1 && h.wait > 8) { h.done[h.idx] = true; h.idx += 1; h.wait = 0; }
}

// Tutorial progress (0–4), for the playtest report.
export function hintsShown(state) {
  return state.hints ? state.hints.done.filter(Boolean).length : 0;
}
