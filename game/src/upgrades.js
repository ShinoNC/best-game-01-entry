// Level-up choices (criterion 2): every level the crab picks 1 of 3 upgrades.
// Eight tracks, five levels each; each level is a real, visible change.
// `what` is the plain-language line on the card — a new player must understand
// the upgrade without knowing the numbers (v1 cards were numbers only).
// v4: the damage/speed/range tracks multiply ALL weapons (see weapons.js), so
// they stay meaningful whichever weapon is equipped.
export const UPGRADE_DEFS = [
  { id: 'claws', name: 'SHARPER CLAWS', icon: '✂', desc: '+12% weapon damage', what: 'All your weapons hit harder', max: 5 },
  { id: 'tempo', name: 'QUICK CLAWS', icon: '≫', desc: '+11% weapon speed', what: 'All your weapons fire faster', max: 5 },
  { id: 'reach', name: 'LONGER REACH', icon: '↔', desc: '+20% weapon range', what: 'All your weapons reach further', max: 5 },
  { id: 'shell', name: 'STURDIER SHELL', icon: '⦿', desc: '+15 max HP, heal 15', what: 'More health, tougher shell', max: 5 },
  { id: 'legs', name: 'SWIFT LEGS', icon: '»', desc: '+12% move speed', what: 'You move faster', max: 5 },
  { id: 'bubbles', name: 'BUBBLE BURST', icon: '○', desc: 'A damaging ring every 6s', what: 'Bubbles burst around you', max: 5 },
  { id: 'ink', name: 'INK TRAIL', icon: '✦', desc: 'Dash leaves burning ink', what: 'Dashing leaves burning ink', max: 5 },
  { id: 'magnet', name: 'PEARL MAGNET', icon: '◎', desc: '+45% pearl pickup radius', what: 'Pearls fly to you', max: 5 },
];

export function applyUpgrade(state, id) {
  const p = state.player, u = state.ups;
  u[id] += 1;
  // claws/tempo/reach take effect in weaponStats (weapons.js) — no field to mutate.
  if (id === 'shell') { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); p.shellTier = Math.min(3, u.shell); }
  if (id === 'legs') p.speed *= 1.12;
  if (id === 'magnet') p.magnet *= 1.45;
  // bubbles / ink take effect from their level in world.js.
}

// Roll 3 distinct upgrades that are not maxed yet; weighted to favour the weakest track.
export function rollChoices(state) {
  const avail = UPGRADE_DEFS.filter((d) => state.ups[d.id] < d.max);
  const pool = [];
  for (const d of avail) {
    const w = 3 - Math.min(2, state.ups[d.id]); // weaker tracks appear more often
    for (let i = 0; i < w; i += 1) pool.push(d);
  }
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const d = state.rng.pick(pool);
    if (!out.includes(d)) out.push(d);
    for (let i = pool.length - 1; i >= 0; i -= 1) if (pool[i] === d) pool.splice(i, 1);
  }
  return out;
}
