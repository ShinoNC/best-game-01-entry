// Seven skill tracks, five levels each, bought as shop cards.
// stat = per-level gain, shown on the card.
export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', icon: '✂', max: 5, stat: 'DMG +10%' },
  { id: 'tempo', name: 'QUICK CLAWS', icon: '≫', max: 5, stat: 'FIRE RATE +11%' },
  { id: 'reach', name: 'LONGER REACH', icon: '↔', max: 5, stat: 'RANGE +20%' },
  { id: 'shell', name: 'ENHANCE', icon: '⦿', max: 5, stat: '+15 MAX HP' },
  { id: 'legs', name: 'SWIFT LEGS', icon: '»', max: 5, stat: 'SPEED +12%' },
  { id: 'bubbles', name: 'BUBBLE BURST', icon: '○', max: 5, stat: '+8 BURST DMG' },
  { id: 'magnet', name: 'COIN MAGNET', icon: '◎', max: 5, stat: 'PICKUP +45%' },
];

// Skill card prices by the level bought (index 0 = Lv1). Cheap early,
// steep late. All 7 tracks × 5 = 1,785 coins total.
export const SKILL_PRICES = [20, 35, 50, 65, 85];

export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  // claws/tempo/reach take effect in weaponStatsFor — no field to mutate.
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.12;
  if (id === 'magnet') p.magnet *= 1.45; // coin drops expire in 25s — the magnet is the economy
  // bubbles takes effect from its level in world.js.
}
