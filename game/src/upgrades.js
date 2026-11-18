import { PLAYER } from './config.js';
export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', stat: 'DMG +5%' },
  { id: 'tempo', name: 'QUICK CLAWS', stat: 'FASTER FIRE' },
  { id: 'reach', name: 'LONGER REACH', stat: 'LONGER RANGE' },
  { id: 'legs', name: 'SWIFT LEGS', stat: 'SPEED +6%' },
  { id: 'bubbles', name: 'BUBBLE BURST', stat: '+4 BURST DMG' },
  { id: 'magnet', name: 'PET CRAB', stat: 'PET RANGE +5% COINS' },
];
export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.06;
  if (id === 'magnet') p.magnet = PLAYER.magnet * (1 + 1.5 * (1 - 0.9 ** u.magnet));
}
