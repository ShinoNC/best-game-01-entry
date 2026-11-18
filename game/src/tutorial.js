const near = (s, d) => (e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < d;
export const HINTS = [
  { id: 'move', text: 'WASD / ARROWS — move', show: 5, cond: (s) => s.time > 0.5 },
  { id: 'weapons', text: 'WEAPONS FIRE ALONE — DODGE!', show: 4.5, cond: (s) => s.enemies.some(near(s, 240)) },
  { id: 'coins', text: 'COINS BUY CARDS AFTER STAGES', show: 4.5, cond: (s) => s.coins > 0 || s.drops.length > 0 },
  { id: 'dash', text: 'SPACE — DASH!', show: 4.5, cond: (s) => s.enemies.filter(near(s, 130)).length >= 3 },
];
export function updateHints(state, dt) {
  const h = state.hints;
  if (!h || h.idx >= HINTS.length) return;
  const next = () => { h.done[h.idx] = true; h.idx += 1; h.wait = 0; };
  if (h.cur) {
    h.t -= dt;
    if (h.t <= 0) { next(); h.cur = null; }
    return;
  }
  if (state.bannerT > 0) return;
  const def = HINTS[h.idx];
  if (def && def.cond(state)) { h.cur = def; h.t = def.show; h.wait = 0; return; }
  h.wait += dt;
  if (h.idx < HINTS.length - 1 && h.wait > 8) next();
}
