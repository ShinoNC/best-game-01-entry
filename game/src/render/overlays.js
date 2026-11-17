// The title overlays: HOW TO PLAY, ACHIEVEMENTS, HISTORY, SETTINGS. One shared panel style.
import { AWARD_KIND, AWARD_TIERS, BOSSES, CREATURE_NAMES, CREATURE_ORDER, DIFFICULTIES, DIFF_ORDER, ENEMIES, FEATS, PAL, VIEW_W } from '../config.js';
import { bestTitle } from '../meta.js';
import { drawEnemy } from './creatures.js';
import { drawAwardIcon } from './icons.js';
import { bevel, lift, txt } from './polish.js';

const BIG = { x: 140, y: 60, w: 1000, h: 580 }; // the help panel
const BIG_CLOSE = { x: 560, y: 576, w: 160, h: 44 };
const HIST_PANEL = { x: 140, y: 60, w: 1000, h: 360 }; // history: 3 short tables
const HIST_CLOSE = { x: 560, y: 356, w: 160, h: 44 };
const FEAT_PANEL = { x: 140, y: 60, w: 1000, h: 580 }; // feats + awards: two columns
const FEAT_CLOSE = { x: 560, y: 576, w: 160, h: 44 };
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

// One line per creature: what it does, in five words or fewer.
const BEHAVIOUR = {
  guppy: 'swims straight at you', jelly: 'drifts in, wobbling', urchin: 'slow and tough',
  starfish: 'splits into two minis', eel: 'winds up, then lunges', gull: 'circles, then dives',
  archer: 'spits water jets at you',
};

export function drawHelp(ctx, state) {
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, BIG);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  txt(ctx, 'HOW TO PLAY', VIEW_W / 2, 100, PAL.gold);
  // Controls, two columns.
  ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'CONTROLS', 180, 132, PAL.gold);
  ctx.font = '14px sans-serif';
  const left = ['WASD / ARROWS — move', 'SPACE — dash', '↑ ↓ — menu · ENTER — choose', 'P / ESC — pause'];
  const right = ['1–5 — buy a card', 'R — reroll the hand', 'ENTER — continue', 'M — mute · H — help'];
  left.forEach((s, i) => txt(ctx, s, 180, 156 + i * 22, PAL.text));
  right.forEach((s, i) => txt(ctx, s, 700, 156 + i * 22, PAL.text));
  // Bestiary: icon + name + one behaviour line each.
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'THE POOL — 7 CREATURES', 180, 252, PAL.gold);
  for (let i = 0; i < CREATURE_ORDER.length; i += 1) {
    const type = CREATURE_ORDER[i];
    const def = ENEMIES[type];
    const cx = 210 + i * 135;
    drawEnemy(ctx, { type, x: cx, y: 282, r: 13, color: def.color, dark: def.dark,
      hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI / 2);
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, CREATURE_NAMES[type], cx, 310, PAL.text);
    ctx.font = '11px sans-serif';
    txt(ctx, BEHAVIOUR[type], cx, 328, PAL.dim);
    ctx.textAlign = 'left';
  }
  // Herons: name + stage + HP.
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'HERONS — ONE EVERY 5 STAGES', 180, 356, PAL.gold);
  for (let i = 0; i < BOSSES.length; i += 1) {
    const b = BOSSES[i];
    const hx = 180 + i * 158;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(hx + 5, 380, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 12px sans-serif';
    txt(ctx, b.name, hx + 16, 384, PAL.text);
    ctx.font = '12px sans-serif';
    txt(ctx, `STAGE ${b.stage} · ${b.hp} HP`, hx + 16, 402, PAL.dim);
  }
  // Tips: three lines, no more.
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'TIPS', 180, 430, PAL.gold);
  ctx.font = '14px sans-serif';
  txt(ctx, 'Weapons fire on their own — dodge and position.', 180, 454, PAL.text);
  txt(ctx, 'Coins buy cards after every stage. A new weapon beats a small upgrade.', 180, 478, PAL.text);
  txt(ctx, 'Archers shoot from stage 12 — never stand still.', 180, 502, PAL.text);
  closeButton(ctx, BIG_CLOSE);
  dimHint(ctx, 664);
}

export function drawAchievements(ctx, state) {
  const meta = state.meta || { feats: [], wins: {} };
  const unlocked = new Set(meta.feats || []);
  const wins = meta.wins || {};
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, FEAT_PANEL);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  txt(ctx, 'ACHIEVEMENTS', VIEW_W / 2, 100, PAL.gold);
  // Left column: the 7 feats, as before.
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, `FEATS — ${unlocked.size} of ${FEATS.length}`, 180, 132, PAL.gold);
  for (let i = 0; i < FEATS.length; i += 1) {
    const f = FEATS[i];
    const got = unlocked.has(f.id);
    const y = 164 + i * 52;
    ctx.font = 'bold 17px sans-serif';
    txt(ctx, `${got ? '★' : '☆'} ${f.name}`, 180, y, got ? PAL.gold : PAL.dim);
    ctx.font = '13px sans-serif';
    txt(ctx, f.desc, 180, y + 19, PAL.dim);
  }
  // Right column: the 9 completion awards — 3 rows (difficulty) x 3 tiers.
  ctx.font = 'bold 15px sans-serif';
  txt(ctx, 'COMPLETION AWARDS', 620, 132, PAL.gold);
  const title = bestTitle(wins);
  if (title) {
    ctx.font = 'bold 15px sans-serif';
    txt(ctx, `YOUR TITLE: ${title}`, 620, 158, PAL.gold);
  }
  for (let d = 0; d < DIFF_ORDER.length; d += 1) {
    const diff = DIFF_ORDER[d];
    const w = wins[diff] || 0;
    const y = 196 + d * 128;
    ctx.font = 'bold 14px sans-serif';
    txt(ctx, `${DIFFICULTIES[diff].label} — ${w} WIN${w === 1 ? '' : 'S'}`, 620, y, PAL.text);
    for (let t = 0; t < AWARD_TIERS.length; t += 1) {
      const tier = AWARD_TIERS[t];
      const got = w >= tier.wins;
      const cx = 660 + t * 160;
      drawAwardIcon(ctx, AWARD_KIND[diff], cx, y + 40, 44, tier.color, !got);
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      txt(ctx, `${tier.metal} ${AWARD_KIND[diff]}`, cx, y + 74, got ? tier.color : PAL.dim);
      ctx.font = '11px sans-serif';
      txt(ctx, got ? 'EARNED' : `WIN ${tier.wins}×`, cx, y + 90, got ? '#7fe0c3' : PAL.dim);
      ctx.textAlign = 'left';
    }
  }
  closeButton(ctx, FEAT_CLOSE);
  dimHint(ctx, 664);
}

export function drawHistory(ctx, state) {
  const meta = state.meta || { bests: {}, runs: [] };
  const runs = meta.runs || [];
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, HIST_PANEL);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  txt(ctx, 'HISTORY', VIEW_W / 2, 100, PAL.gold);
  // One table per difficulty: its best score + its 3 most recent runs.
  for (let i = 0; i < DIFF_ORDER.length; i += 1) {
    const d = DIFF_ORDER[i];
    const x = 180 + i * 320;
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px sans-serif';
    txt(ctx, DIFFICULTIES[d].label, x, 140, PAL.gold);
    const best = (meta.bests && meta.bests[d]) || 0;
    ctx.font = 'bold 15px sans-serif';
    txt(ctx, `BEST ${best > 0 ? best : '—'}`, x, 166, PAL.text);
    const mine = runs.filter((r) => r.diff === d).slice(0, 3);
    if (mine.length === 0) {
      ctx.font = '13px sans-serif';
      txt(ctx, 'No runs yet.', x, 196, PAL.dim);
    } else {
      mine.forEach((r, j) => {
        const mins = Math.floor((r.time || 0) / 60), secs = Math.floor((r.time || 0) % 60);
        ctx.font = 'bold 13px sans-serif';
        txt(ctx, `${r.won ? 'WON ' : 'LOST'} · ${r.stage}/30 · ${r.score}`, x, 196 + j * 44, r.won ? '#7fe0c3' : '#ff8fa0');
        ctx.font = '12px sans-serif';
        txt(ctx, `${mins}:${String(secs).padStart(2, '0')}`, x, 214 + j * 44, PAL.dim);
      });
    }
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
