// Skill tracks (criterion 2): eight tracks, five levels each; each level is a
// real, visible change. In v6 the tracks are SKILL CARDS in the stage-clear
// menu, bought with coins — there is no level-up screen. Cards show the icon,
// the name and one number line — no paragraphs. The damage / speed / range
// tracks multiply ALL weapons (see weapons.js), so they stay meaningful
// across the whole arsenal.
export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', icon: '✂', desc: '+10% weapon damage', max: 5 },
  { id: 'tempo', name: 'QUICK CLAWS', icon: '≫', desc: '+11% weapon speed', max: 5 },
  { id: 'reach', name: 'LONGER REACH', icon: '↔', desc: '+20% weapon range', max: 5 },
  { id: 'shell', name: 'STURDIER SHELL', icon: '⦿', desc: '+15 max HP, heal 15', max: 5 },
  { id: 'legs', name: 'SWIFT LEGS', icon: '»', desc: '+12% move speed', max: 5 },
  { id: 'bubbles', name: 'BUBBLE BURST', icon: '○', desc: 'A damaging ring every 6s', max: 5 },
  { id: 'ink', name: 'INK TRAIL', icon: '✦', desc: 'Dash leaves burning ink', max: 5 },
  { id: 'magnet', name: 'COIN MAGNET', icon: '◎', desc: '+45% coin pickup radius', max: 5 },
];

// Skill card prices by the level the card BUYS (index 0 = Lv1). Cheap early
// so the first menu always has something affordable, steep late so maxing a
// track is a real decision. All 8 tracks × 5 levels = 2,040 coins total.
export const SKILL_PRICES = [20, 35, 50, 65, 85];

export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  // claws/tempo/reach take effect in weaponStatsFor (weapons.js) — no field to mutate.
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.12;
  if (id === 'magnet') p.magnet *= 1.45;
  // bubbles / ink take effect from their level in world.js.
}
