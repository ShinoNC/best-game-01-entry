// Skill tracks: seven tracks, five levels each, bought as cards in the stage-clear menu.
export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', icon: '✂', max: 5 },
  { id: 'tempo', name: 'QUICK CLAWS', icon: '≫', max: 5 },
  { id: 'reach', name: 'LONGER REACH', icon: '↔', max: 5 },
  { id: 'shell', name: 'STURDIER SHELL', icon: '⦿', max: 5 },
  { id: 'legs', name: 'SWIFT LEGS', icon: '»', max: 5 },
  { id: 'bubbles', name: 'BUBBLE BURST', icon: '○', max: 5 },
  { id: 'magnet', name: 'COIN MAGNET', icon: '◎', max: 5 },
];

// Skill card prices by the level the card BUYS (index 0 = Lv1). Cheap early,
// steep late. All 7 tracks × 5 levels = 1,785 coins total.
export const SKILL_PRICES = [20, 35, 50, 65, 85];

export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  // claws/tempo/reach take effect in weaponStatsFor (weapons.js) — no field to mutate.
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.12;
  if (id === 'magnet') p.magnet *= 1.45; // coin drops expire in 25s — the magnet is the economy
  // bubbles takes effect from its level in world.js.
}
