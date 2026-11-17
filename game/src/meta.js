import { BOSS_TYPES, FEAT_IDS, FEAT_NAMES, FEAT_TIERS, WEAPON_ORDER } from './config.js';
import { UPGRADE_DEFS } from './upgrades.js';

const META_KEY = 'tidekeeper-meta';
export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch { return fallback; }
}
function writeJson(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function readMeta() {
  const m = readJson(META_KEY, null) || {};
  return {
    kills: m.kills || 0,
    bosses: m.bosses || 0,
    bossTypes: Array.isArray(m.bossTypes) ? m.bossTypes.filter((t) => BOSS_TYPES[t]) : [],
    maxLevel: m.maxLevel || 1,
    maxStage: m.maxStage || 1,
    maxWeapons: m.maxWeapons || 0,
    maxSkills: m.maxSkills || 0,
    maxWeaponLv: m.maxWeaponLv || 0,
    maxSkillLv: m.maxSkillLv || 0,
    bestScore: m.bestScore || 0,
  };
}

// Progress per family: lifetime meta + current run.
export function featProgress(state) {
  const meta = state.meta || {};
  const weapons = WEAPON_ORDER.filter((w) => state.weapons[w] > 0).length;
  const skills = UPGRADE_DEFS.filter((d) => state.ups[d.id] > 0).length;
  return {
    slayer: meta.kills || 0,
    beastslayer: meta.bosses || 0,
    veteran: Math.max(meta.maxLevel || 1, state.level),
    deepdiver: Math.max(meta.maxStage || 1, state.stage),
    bosscollector: (meta.bossTypes || []).length,
    arsenal: Math.max(meta.maxWeapons || 0, weapons),
    skillmaster: Math.max(meta.maxSkills || 0, skills),
    weaponmaster: Math.max(meta.maxWeaponLv || 0, ...WEAPON_ORDER.map((w) => state.weapons[w] || 0)),
    skillexpert: Math.max(meta.maxSkillLv || 0, ...UPGRADE_DEFS.map((d) => state.ups[d.id] || 0)),
  };
}

export function featTier(id, value) {
  const tiers = FEAT_TIERS[id];
  let t = 0;
  while (t < tiers.length && value >= tiers[t]) t += 1;
  return t;
}

export function checkFeats(state, killed) {
  const meta = state.meta;
  if (!meta) return [];
  const oldP = featProgress({ meta, level: 1, stage: 1, weapons: {}, ups: {} });
  if (killed) {
    meta.kills = (meta.kills || 0) + 1;
    if (killed.boss) {
      meta.bosses = (meta.bosses || 0) + 1;
      const types = new Set(meta.bossTypes || []);
      if (killed.type && !types.has(killed.type)) { types.add(killed.type); meta.bossTypes = [...types]; }
    }
  }
  const p = featProgress(state);
  meta.maxLevel = p.veteran; meta.maxStage = p.deepdiver;
  meta.maxWeapons = p.arsenal; meta.maxSkills = p.skillmaster;
  meta.maxWeaponLv = p.weaponmaster; meta.maxSkillLv = p.skillexpert;
  const earned = [];
  let dirty = !!killed;
  if (state.score > (meta.bestScore || 0)) { meta.bestScore = state.score; dirty = true; }
  for (const id of FEAT_IDS) {
    if (featTier(id, p[id]) > featTier(id, oldP[id])) earned.push({ id, tier: featTier(id, p[id]) });
    if (p[id] !== oldP[id]) dirty = true;
  }
  if (dirty) writeJson(META_KEY, meta);
  return earned;
}

export function featBanner(state, earned) {
  if (earned.length === 0) return;
  state.banner = `★ ${earned.map((e) => `${FEAT_NAMES[e.id]} ${ROMAN[e.tier]}`).join(' · ')}!`;
  state.bannerT = 3;
}
