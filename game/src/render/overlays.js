import { ARMOR_PER_BOSS, BOSS_STAGES, CREATURE_NAMES, CREATURE_ORDER, ENEMIES, FEAT_DESCS, FEAT_IDS, FEAT_NAMES, MODIFIERS, PAL, VIEW_W, bossForStage } from '../config.js';
import { drawEnemy } from './creatures.js';
import { bevel, lift, txt } from './polish.js';

const BIG = { x: 140, y: 60, w: 1000, h: 580 };
const BIG_CLOSE = { x: 560, y: 576, w: 160, h: 44 };
const HIST_PANEL = { x: 140, y: 60, w: 1000, h: 360 };
const HIST_CLOSE = { x: 560, y: 356, w: 160, h: 44 };
const FEAT_PANEL = { x: 280, y: 60, w: 720, h: 570 };
const FEAT_CLOSE = { x: 560, y: 560, w: 160, h: 44 };
const SET_PANEL = { x: 440, y: 240, w: 400, h: 240 };
const SET_CLOSE = { x: 560, y: 420, w: 160, h: 44 };
const SET_SOUND = { x: 640, y: 300, w: 120, h: 36 };
const SET_MUSIC = { x: 640, y: 350, w: 120, h: 36 };

export function overlayLayout(state) {
  if (state.overlay === 'help') return { close: BIG_CLOSE, panel: BIG };
  if (state.overlay === 'history') return { close: HIST_CLOSE, panel: HIST_PANEL };
  if (state.overlay === 'feats') return { close: FEAT_CLOSE, panel: FEAT_PANEL };
  if (state.overlay === 'settings') return { close: SET_CLOSE, sound: SET_SOUND, music: SET_MUSIC, panel: SET_PANEL };
  return null;
}

function panel(ctx, p) {
  lift(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

function closeButton(ctx, b) {
  bevel(ctx, b.x, b.y, b.w, b.h, 8, '#ffe08a', '#f0b23e', PAL.gold, 2);
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  txt(ctx, 'CLOSE', b.x + b.w / 2, b.y + 29, '#062a33');
}

function dimHint(ctx, y) {
  ctx.textAlign = 'center';
  ctx.font = '13px sans-serif';
  txt(ctx, 'H / ESC / click outside also closes', VIEW_W / 2, y, PAL.dim);
}

const BEHAVIOUR = {
  guppy: 'charges at you', jelly: 'drifts in, wobbling', urchin: 'slow and tough',
  starfish: 'splits in two', eel: 'winds up, then lunges', squid: 'circles, dives',
  archer: 'spits water jets',
};

export function drawHelp(ctx, state) {
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, BIG);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  txt(ctx, 'HOW TO PLAY', VIEW_W / 2, 100, PAL.gold);
  ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'CONTROLS', 180, 128, PAL.gold);
  ctx.font = '14px sans-serif';
  const left = ['WASD / ARROWS — move', 'SPACE — dash', '↑ ↓ — menu · ENTER — choose', 'P / ESC — pause'];
  const right = ['1–5 — buy a card', 'R — reroll the hand', 'ENTER — continue', 'M — mute · H — help'];
  left.forEach((s, i) => txt(ctx, s, 180, 150 + i * 20, PAL.text));
  right.forEach((s, i) => txt(ctx, s, 700, 150 + i * 20, PAL.text));
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'THE REEF — 7 CREATURES', 180, 232, PAL.gold);
  for (let i = 0; i < CREATURE_ORDER.length; i += 1) {
    const type = CREATURE_ORDER[i];
    const def = ENEMIES[type];
    const cx = 210 + i * 135;
    drawEnemy(ctx, { type, x: cx, y: 260, r: 13, color: def.color, dark: def.dark,
      hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI / 2);
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, CREATURE_NAMES[type], cx, 288, PAL.text);
    ctx.font = '11px sans-serif';
    txt(ctx, BEHAVIOUR[type], cx, 304, PAL.dim);
    ctx.textAlign = 'left';
  }
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'SEA BEASTS — ONE EVERY 5 STAGES', 180, 326, PAL.gold);
  for (let i = 0; i < BOSS_STAGES.length; i += 1) {
    const b = bossForStage(BOSS_STAGES[i].stage, state.bossOrder);
    const hx = 180 + i * 158;
    ctx.fillStyle = b.color;
    ctx.fillRect(hx, 339, 10, 10);
    ctx.font = 'bold 12px sans-serif';
    txt(ctx, b.name, hx + 16, 348, PAL.text);
    ctx.font = '12px sans-serif';
    txt(ctx, `STAGE ${b.stage} · ${b.hp} HP`, hx + 16, 364, PAL.dim);
  }
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'TIPS', 180, 384, PAL.gold);
  ctx.font = '14px sans-serif';
  txt(ctx, 'Weapons fire on their own — dodge and position.', 180, 402, PAL.text);
  txt(ctx, 'Coins buy cards after every stage. A new weapon beats a small upgrade.', 180, 419, PAL.text);
  txt(ctx, 'Slain creatures grant XP. Level up to choose 1 of 3 upgrades — skills have no level cap.', 180, 436, PAL.text);
  txt(ctx, 'Archers shoot from stage 12 — never stand still.', 180, 453, PAL.text);
  txt(ctx, `ARMOR absorbs damage before HP. Clear a boss to gain +${ARMOR_PER_BOSS} ARMOR. Armor does not heal.`, 180, 470, PAL.text);
  txt(ctx, 'Stages go on forever — each loop, foes grow stronger. Each stage is generated fresh every run.', 180, 487, PAL.text);
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'EFFECTS — ONE PER 5 STAGES', 180, 508, PAL.gold);
  ctx.font = '11px sans-serif';
  MODIFIERS.forEach((m, i) => {
    txt(ctx, `${m.n} — ${m.d}`, i < 3 ? 180 : 700, 528 + (i % 3) * 18, PAL.text);
  });
  closeButton(ctx, BIG_CLOSE);
  dimHint(ctx, 664);
}

export function drawAchievements(ctx, state) {
  const meta = state.meta || { feats: [] };
  const have = new Set(meta.feats || []);
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, FEAT_PANEL);
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px sans-serif';
  txt(ctx, 'ACHIEVEMENTS', VIEW_W / 2, 105, PAL.gold);
  ctx.font = 'bold 16px sans-serif';
  txt(ctx, `${have.size} / ${FEAT_IDS.length} EARNED`, VIEW_W / 2, 142, PAL.gold);
  for (let i = 0; i < FEAT_IDS.length; i += 1) {
    const id = FEAT_IDS[i];
    const got = have.has(id);
    const y = 185 + i * 62;
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px sans-serif';
    txt(ctx, `${got ? '★' : '☆'} ${FEAT_NAMES[id]}`, 330, y, got ? PAL.gold : PAL.dim);
    ctx.font = '13px sans-serif';
    txt(ctx, FEAT_DESCS[id], 330, y + 22, got ? PAL.text : PAL.dim);
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px sans-serif';
    txt(ctx, got ? 'EARNED' : '—', 950, y, got ? '#7fe0c3' : PAL.dim);
  }
  closeButton(ctx, FEAT_CLOSE);
  dimHint(ctx, 655);
}

export function drawHistory(ctx, state) {
  const meta = state.meta || { best: 0, bestStage: 0, runs: [] };
  const runs = meta.runs || [];
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, HIST_PANEL);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  txt(ctx, 'HISTORY', VIEW_W / 2, 100, PAL.gold);
  ctx.font = 'bold 18px sans-serif';
  txt(ctx, `BEST ${meta.best || 0} · BEST STAGE ${meta.bestStage || 0}`, VIEW_W / 2, 136, PAL.gold);
  if (runs.length === 0) {
    ctx.font = '15px sans-serif';
    txt(ctx, 'No runs yet.', VIEW_W / 2, 200, PAL.dim);
  } else {
    runs.slice(0, 5).forEach((r, j) => {
      const mins = Math.floor((r.time || 0) / 60), secs = Math.floor((r.time || 0) % 60);
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px sans-serif';
      txt(ctx, `STAGE ${r.stage} · LEVEL ${r.level || 1} · ${r.score}`, 220, 180 + j * 36, PAL.text);
      ctx.textAlign = 'right';
      ctx.font = '13px sans-serif';
      txt(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 1060, 180 + j * 36, PAL.dim);
    });
  }
  closeButton(ctx, HIST_CLOSE);
  dimHint(ctx, 444);
}

export function drawSettings(ctx, state) {
  const audio = state.audio || {};
  const soundOn = !audio.muted, musicOn = audio.music !== false;
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, SET_PANEL);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  txt(ctx, 'SETTINGS', VIEW_W / 2, 280, PAL.gold);
  for (const [row, on, label] of [[SET_SOUND, soundOn, 'SOUND'], [SET_MUSIC, musicOn, 'MUSIC']]) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px sans-serif';
    txt(ctx, label, 480, row.y + 25, PAL.text);
    ctx.fillStyle = on ? '#2f8f6b' : 'rgba(255,255,255,0.15)';
    ctx.fillRect(row.x, row.y, row.w, row.h);
    ctx.strokeStyle = PAL.foam; ctx.lineWidth = 1; ctx.strokeRect(row.x, row.y, row.w, row.h);
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, on ? 'ON' : 'OFF', row.x + row.w / 2, row.y + 25, on ? '#fff' : PAL.dim);
  }
  closeButton(ctx, SET_CLOSE);
  ctx.textAlign = 'center';
  ctx.font = '13px sans-serif';
  txt(ctx, 'M mutes everything', VIEW_W / 2, 504, PAL.dim);
}
