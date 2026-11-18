import { UPGRADE_DEFS, applyUpgrade } from './upgrades.js';
export function xpNeed(level) {
  return 30 + level * 20 + level * level * 2;
}
const CHOICE_POOL = [
  { id: 'claws', name: 'SHARPER CLAWS', desc: 'DMG +5%' },
  { id: 'tempo', name: 'QUICK CLAWS', desc: 'FIRE RATE +5%' },
  { id: 'reach', name: 'LONGER REACH', desc: 'RANGE +10%' },
  { id: 'legs', name: 'SWIFT LEGS', desc: 'SPEED +6%' },
  { id: 'bubbles', name: 'BUBBLE BURST', desc: '+4 BURST DMG' },
  { id: 'magnet', name: 'PET CRAB', desc: 'PET RANGE UP +5% COINS' },
  { id: 'heal', name: 'SHELL MEND', desc: 'HEAL +30 HP NOW' },
];
export function rollLevelChoices(state) {
  const pool = CHOICE_POOL.filter((c) => !c.max || (state.ups[c.id] || 0) < c.max);
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const i = Math.floor(state.rng.next() * pool.length);
    const c = pool.splice(i, 1)[0];
    const lv = state.ups[c.id];
    out.push({ ...c, cur: typeof lv === 'number' ? lv : null });
  }
  return out;
}
export function applyLevelChoice(state, choice) {
  if (!choice) return;
  if (choice.id === 'heal') {
    const p = state.player;
    p.hp = Math.min(p.maxHp, p.hp + 30);
    return;
  }
  applyUpgrade(state, choice.id);
}
export function gainXp(state, amount) {
  state.xp += amount;
  let gained = 0;
  while (state.xp >= state.xpNext) {
    state.xp -= state.xpNext;
    state.level += 1;
    state.xpNext = xpNeed(state.level);
    state.player.maxHp += 5;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5);
    gained += 1;
  }
  return gained;
}
export { UPGRADE_DEFS };
