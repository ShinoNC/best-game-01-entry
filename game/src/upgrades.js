export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', icon: '✂', stat: 'DMG +5%' },
  { id: 'tempo', name: 'QUICK CLAWS', icon: '≫', stat: 'FIRE RATE +5%' },
  { id: 'reach', name: 'LONGER REACH', icon: '↔', stat: 'RANGE +10%' },
  { id: 'shell', name: 'ENHANCE', icon: '⦿', max: 5, stat: '+15 MAX HP' },
  { id: 'legs', name: 'SWIFT LEGS', icon: '»', stat: 'SPEED +6%' },
  { id: 'bubbles', name: 'BUBBLE BURST', icon: '○', stat: '+4 BURST DMG' },
  { id: 'magnet', name: 'COIN MAGNET', icon: '◎', stat: 'PICKUP +22%' },
];

export const SKILL_PRICES = [20, 35, 50, 65, 85];

export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.06;
  if (id === 'magnet') p.magnet *= 1.22;
}
