export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', icon: '✂', max: 10, stat: 'DMG +5%' },
  { id: 'tempo', name: 'QUICK CLAWS', icon: '≫', max: 10, stat: 'FIRE RATE +5%' },
  { id: 'reach', name: 'LONGER REACH', icon: '↔', max: 10, stat: 'RANGE +10%' },
  { id: 'shell', name: 'ENHANCE', icon: '⦿', max: 5, stat: '+15 MAX HP' },
  { id: 'legs', name: 'SWIFT LEGS', icon: '»', max: 10, stat: 'SPEED +6%' },
  { id: 'bubbles', name: 'BUBBLE BURST', icon: '○', max: 10, stat: '+4 BURST DMG' },
  { id: 'magnet', name: 'COIN MAGNET', icon: '◎', max: 10, stat: 'PICKUP +22%' },
];

export const POINT_SKILLS = ['claws', 'tempo', 'reach', 'legs', 'bubbles', 'magnet'];

export const SKILL_PRICES = [20, 35, 50, 65, 85];

export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.06;
  if (id === 'magnet') p.magnet *= 1.22;
}

export function spendSkillPoint(state, id) {
  const d = UPGRADE_DEFS.find((u) => u.id === id);
  if (!d || !POINT_SKILLS.includes(id)) return false;
  if (state.skillPts <= 0 || state.ups[id] >= d.max) return false;
  state.skillPts -= 1;
  applyUpgrade(state, id);
  return true;
}
