const SLOT_KEYS = ['tidekeeper_slot_0', 'tidekeeper_slot_1', 'tidekeeper_slot_2'];
export const SLOT_COUNT = 3;
function storage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    if (new URLSearchParams(window.location.search).get('shot')) return null;
    return window.localStorage;
  } catch { return null; }
}
export function saveRun(state) {
  if (state.slot == null || state.slot < 0 || state.slot >= SLOT_COUNT) return;
  const ls = storage();
  if (!ls) return;
  try {
    const p = state.player;
    ls.setItem(SLOT_KEYS[state.slot], JSON.stringify({
      v: 1, slot: state.slot, seed: state.seed, stage: state.stage, phase: state.phase,
      level: state.level, xp: state.xp, xpNext: state.xpNext,
      coins: state.coins, coinsEarned: state.coinsEarned, potions: state.potions || 0,
      score: state.score, kills: state.kills, time: state.time,
      hp: p.hp, maxHp: p.maxHp, armor: p.armor, speed: p.speed,
      magnet: p.magnet, shellTier: p.shellTier,
      weapons: { ...state.weapons }, ups: { ...state.ups },
      hand: state.phase === 'stageclear' ? state.hand : [],
      rerolls: state.rerolls, clearBonus: state.clearBonus,
      stats: { ...state.stats },
      playedAt: Date.now(),
    }));
  } catch { /* storage full or blocked: run continues unsaved */ }
}
export function loadSlot(i) {
  const ls = storage();
  if (!ls || i < 0 || i >= SLOT_COUNT) return null;
  try {
    const d = JSON.parse(ls.getItem(SLOT_KEYS[i]) || 'null');
    if (!d || d.v !== 1 || typeof d.seed !== 'number' || typeof d.stage !== 'number'
      || d.stage < 1 || !d.weapons || !d.ups || typeof d.level !== 'number') return null;
    return d;
  } catch { return null; }
}
export function clearSlot(i) {
  const ls = storage();
  if (!ls || i < 0 || i >= SLOT_COUNT) return;
  try { ls.removeItem(SLOT_KEYS[i]); } catch {}
}
export function hasSlotSave(i) { return loadSlot(i) !== null; }
