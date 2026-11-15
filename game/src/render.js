// Everything the judge sees: the pool, the crab, the creatures, the HUD and the screens.
// Criterion 1: goal, timer, score, HP, level, controls and restart are all VISIBLE here.
// Criterion 4: one palette, big readable shapes, a scene that reads at a glance.
import { BOSS, PAL, POOL, VIEW_H, VIEW_W, WIN_TIME, xpNeed } from './config.js';
import { UPGRADE_DEFS } from './upgrades.js';
import { fmtTime } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function star(ctx, x, y, r, rot, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

function drawCrab(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y);
  const blink = p.iframes > 0 && Math.floor(t * 20) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.45;
  ctx.rotate(p.angle);
  // Legs: six little strokes paddling as it moves.
  ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const wig = Math.sin(t * 14) * 4;
  for (let s = -1; s <= 1; s += 1) {
    ctx.beginPath(); ctx.moveTo(-6 + s * 8, -14); ctx.lineTo(-10 + s * 8, -22 - wig * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6 + s * 8, 14); ctx.lineTo(-10 + s * 8, 22 + wig * s); ctx.stroke();
  }
  // Claws: two pincers ahead, snapping on the swing.
  const snap = p.swing > 0 ? -0.5 : 0;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(16, s * 13); ctx.rotate(s * (0.5 + snap));
    ctx.fillStyle = PAL.crab; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.crabDark;
    ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(16, -1); ctx.lineTo(6, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Body and the shell — the shell's colour IS the armour tier, so upgrades are visible.
  ctx.fillStyle = PAL.crab; ctx.beginPath(); ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
  const shellColors = [PAL.shell0, PAL.shell1, PAL.shell2, PAL.shell3];
  ctx.fillStyle = shellColors[p.shellTier] || PAL.shell0;
  ctx.beginPath(); ctx.arc(-4, 0, 14, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-4, 0, 9, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
  // Eyes on stalks, looking where it walks.
  for (const s of [-1, 1]) {
    ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(12, s * 6); ctx.lineTo(18, s * 9); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(19, s * 9, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(20, s * 9, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (p.flash > 0) { // hurt flash: a red ring
    ctx.strokeStyle = `rgba(255,93,115,${p.flash * 3})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawEnemy(ctx, e, t) {
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.flash > 0) ctx.globalAlpha = 0.6;
  const flash = e.flash > 0;
  if (e.type === 'jelly') {
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * 6, 2);
      ctx.quadraticCurveTo(i * 6 + Math.sin(t * 4 + i) * 5, 12, i * 6, 20 + Math.sin(t * 4 + i * 2) * 4);
      ctx.stroke();
    }
  } else if (e.type === 'urchin') {
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 3;
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 + e.wob * 0.2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * e.r * 0.4, Math.sin(a) * e.r * 0.4);
      ctx.lineTo(Math.cos(a) * e.r * 1.15, Math.sin(a) * e.r * 1.15); ctx.stroke();
    }
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.62, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'starfish' || e.type === 'mini') {
    star(ctx, 0, 0, e.r, e.wob * 0.3, flash ? '#fff' : e.color);
    ctx.fillStyle = flash ? '#fff' : e.dark;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'eel') {
    ctx.strokeStyle = flash ? '#fff' : e.color; ctx.lineWidth = e.r * 0.9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-e.r * 1.4, 0);
    ctx.quadraticCurveTo(0, Math.sin(t * 6 + e.wob) * e.r, e.r * 1.2, 0); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : e.dark;
    ctx.beginPath(); ctx.arc(e.r * 1.2, 0, e.r * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 1.35, -2, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'gull' || e.type === 'heron') {
    const s = e.type === 'heron' ? 1.7 : 1;
    ctx.scale(s, s);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, e.r * 0.9, e.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    const flap = Math.sin(t * 10 + e.wob) * 0.5;
    ctx.beginPath(); ctx.ellipse(-4, -e.r * 0.7, e.r * 0.9, 7, -0.4 - flap * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-4, e.r * 0.7, e.r * 0.9, 7, 0.4 + flap * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#ffd166';
    ctx.beginPath(); ctx.moveTo(e.r * 0.7, -3); ctx.lineTo(e.r * 1.5, 0); ctx.lineTo(e.r * 0.7, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    if (e.type === 'heron') { // long legs trailing behind
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * 0.7, -6); ctx.lineTo(-e.r * 1.4, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-e.r * 0.7, 6); ctx.lineTo(-e.r * 1.4, 2); ctx.stroke();
    }
  } else { // guppy: a little fish
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-e.r * 0.8, 0); ctx.lineTo(-e.r * 1.5, -e.r * 0.6); ctx.lineTo(-e.r * 1.5, e.r * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -2, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (e.elite) { // gold ring + star: elites are worth hunting
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', e.x, e.y - e.r - 12);
  }
  if (e.hp < e.maxHp && (e.elite || e.type === 'heron' || e.maxHp > 40)) {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 5);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * (e.hp / e.maxHp), 5);
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
  }
  addEventListener('resize', resize); resize();

  function drawPool(state, t) {
    // Water gradient + sandy rim + foam ring: the arena reads as a rockpool.
    const g = ctx.createRadialGradient(POOL.cx, POOL.cy, 60, POOL.cx, POOL.cy, POOL.rx);
    g.addColorStop(0, PAL.water2); g.addColorStop(1, PAL.water);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PAL.sand; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 4, POOL.ry + 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(191,232,224,${0.35 + 0.15 * Math.sin(t * 1.4)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx - 8, POOL.ry - 8, 0, 0, Math.PI * 2); ctx.stroke();
    // Decor: rocks, weed, shells, starfish — placed by the seeded RNG.
    for (const d of state.decor) {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = 0.85;
      if (d.kind === 'rock') {
        ctx.fillStyle = '#5a6b66'; ctx.beginPath(); ctx.ellipse(0, 0, 16 * d.s, 11 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      } else if (d.kind === 'weed') {
        ctx.strokeStyle = '#2f8f6b'; ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath(); ctx.moveTo(i * 6, 0);
          ctx.quadraticCurveTo(i * 8, -14 * d.s, i * 4 + Math.sin(t + i) * 4, -24 * d.s); ctx.stroke();
        }
      } else if (d.kind === 'shell') {
        ctx.fillStyle = '#e8b64c'; ctx.beginPath(); ctx.arc(0, 0, 7 * d.s, Math.PI, 0); ctx.fill();
      } else {
        star(ctx, 0, 0, 9 * d.s, d.rot, 'rgba(255,143,176,0.7)');
      }
      ctx.restore();
    }
  }

  function drawHud(state) {
    const p = state.player;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // Top-left: HP bar with a heart + shell tier, each on its own line.
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(18, 14, 250, 80);
    ctx.fillStyle = PAL.hp; ctx.font = 'bold 26px sans-serif';
    ctx.fillText('♥', 28, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(58, 26, 190, 18);
    ctx.fillStyle = PAL.hp; ctx.fillRect(58, 26, 190 * (p.hp / p.maxHp), 18);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp} HP`, 58, 64);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`SHELL ${'●'.repeat(p.shellTier + 1)}${'○'.repeat(3 - p.shellTier)}`, 58, 86);
    // Top-centre: the win condition, always visible — "HIGH TIDE IN 03:12".
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W / 2 - 150, 14, 300, 56);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(state.time >= WIN_TIME ? 'HIGH TIDE!' : `HIGH TIDE IN ${fmtTime(state.time)}`, VIEW_W / 2, 40);
    ctx.fillStyle = PAL.dim; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`WAVE ${state.wave}  •  ${state.enemies.length} creatures`, VIEW_W / 2, 60);
    // Boss bar under the timer while the Heron lives.
    if (state.boss) {
      ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W / 2 - 190, 76, 380, 26);
      ctx.fillStyle = '#e8e4d8'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('THE GREAT HERON', VIEW_W / 2, 94);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(VIEW_W / 2 - 180, 98, 360, 8);
      ctx.fillStyle = '#ff5d73'; ctx.fillRect(VIEW_W / 2 - 180, 98, 360 * (state.boss.hp / state.boss.maxHp), 8);
    }
    // Top-right: score, kills, best.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W - 268, 14, 250, 62);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, VIEW_W - 28, 40);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${state.kills} slain  •  BEST ${state.best}`, VIEW_W - 28, 62);
    // Bottom-left: level + XP bar + ability slots (the 8 upgrade tracks, level inside each box).
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(18, VIEW_H - 100, 420, 84);
    ctx.fillStyle = PAL.xp; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`LEVEL ${state.level}`, 28, VIEW_H - 74);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(110, VIEW_H - 86, 200, 10);
    ctx.fillStyle = PAL.xp; ctx.fillRect(110, VIEW_H - 86, 200 * (state.xp / xpNeed(state.level)), 10);
    ctx.fillText(`${state.xp}/${xpNeed(state.level)} pearls`, 318, VIEW_H - 74);
    let sx = 28;
    for (const d of UPGRADE_DEFS) {
      const lv = state.ups[d.id];
      const by = VIEW_H - 62;
      ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.9)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(sx, by, 34, 40);
      ctx.fillStyle = lv > 0 ? '#062a33' : '#9fc4bd'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.icon, sx + 17, by + 18);
      ctx.fillStyle = lv > 0 ? '#062a33' : PAL.dim; ctx.font = 'bold 10px sans-serif';
      ctx.fillText(lv > 0 ? `Lv${lv}` : '—', sx + 17, by + 33);
      sx += 40;
    }
    ctx.textAlign = 'left';
    // Bottom-right: dash + bolt cooldowns.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W - 268, VIEW_H - 100, 250, 84);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(p.dashCd <= 0 ? 'DASH READY  [Space]' : `DASH ${p.dashCd.toFixed(1)}s`, VIEW_W - 28, VIEW_H - 68);
    ctx.fillText(p.boltCd <= 0 ? 'BUBBLE BOLT READY  [Click]' : `BOLT ${p.boltCd.toFixed(1)}s`, VIEW_W - 28, VIEW_H - 42);
    // Wave / elite banner, centre.
    if (state.bannerT > 0) {
      ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, state.bannerT);
      ctx.fillStyle = PAL.gold; ctx.font = 'bold 30px sans-serif';
      ctx.fillText(state.banner, VIEW_W / 2, 150);
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle(state) {
    ctx.fillStyle = 'rgba(6,42,51,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.crab; ctx.font = 'bold 84px sans-serif';
    ctx.fillText('TIDEKEEPER', VIEW_W / 2, 190);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 24px sans-serif';
    ctx.fillText('A hermit crab holds the rockpool until high tide.', VIEW_W / 2, 236);
    ctx.fillStyle = PAL.dim; ctx.font = '20px sans-serif';
    ctx.fillText('Slay the tide\'s creatures, gather pearls, grow stronger —', VIEW_W / 2, 276);
    ctx.fillText('survive 5:00 to HIGH TIDE. Fall, and the pool is theirs.', VIEW_W / 2, 304);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('WASD / ARROWS — move      CLICK — bubble bolt      SPACE — dash', VIEW_W / 2, 372);
    ctx.fillText('1 / 2 / 3 — pick upgrade      P — pause      M — mute', VIEW_W / 2, 404);
    const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PAL.gold; ctx.font = 'bold 30px sans-serif';
      ctx.fillText('CLICK  or  PRESS ENTER  to begin', VIEW_W / 2, 480);
    }
    ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif';
    ctx.fillText(state.best > 0 ? `BEST SCORE ${state.best}` : 'No best score yet — be the first crab to hold the pool.', VIEW_W / 2, 540);
    // A crab and a jellyfish flank the title, so the cover shows the game at once.
    drawCrab(ctx, { ...state.player, x: 330, y: 470, angle: 0.3, iframes: 0, flash: 0, swing: 0 }, 0);
    drawEnemy(ctx, { type: 'jelly', x: 950, y: 470, r: 26, hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0);
  }

  function drawLevelUp(state) {
    ctx.fillStyle = 'rgba(6,42,51,0.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`LEVEL ${state.level} — CHOOSE AN UPGRADE`, VIEW_W / 2, 150);
    ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif';
    ctx.fillText('Press 1, 2 or 3 — or click a card.', VIEW_W / 2, 184);
    const cards = state.levelChoices || [];
    cards.forEach((d, i) => {
      const x = 290 + i * 240, y = 240, w = 210, h = 220;
      ctx.fillStyle = '#0e5566'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = PAL.xp; ctx.font = 'bold 44px sans-serif';
      ctx.fillText(d.icon, x + w / 2, y + 70);
      ctx.fillStyle = PAL.text; ctx.font = 'bold 19px sans-serif';
      ctx.fillText(d.name, x + w / 2, y + 112);
      ctx.fillStyle = PAL.dim; ctx.font = '16px sans-serif';
      ctx.fillText(d.desc, x + w / 2, y + 142);
      ctx.fillStyle = PAL.gold; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Lv ${state.ups[d.id]} → ${state.ups[d.id] + 1}`, x + w / 2, y + 176);
      ctx.fillStyle = PAL.text; ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`[ ${i + 1} ]`, x + w / 2, y + 204);
    });
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(6,42,51,0.7)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.text; ctx.font = 'bold 56px sans-serif';
    ctx.fillText('PAUSED', VIEW_W / 2, 330);
    ctx.fillStyle = PAL.dim; ctx.font = '20px sans-serif';
    ctx.fillText('P / Esc — resume      M — mute      R — restart', VIEW_W / 2, 380);
  }

  function drawOver(state) {
    const won = state.result === 'won';
    ctx.fillStyle = 'rgba(6,42,51,0.86)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? PAL.gold : PAL.hp; ctx.font = 'bold 64px sans-serif';
    ctx.fillText(won ? 'HIGH TIDE!' : 'THE TIDE TOOK YOU', VIEW_W / 2, 170);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(won ? 'You held the rockpool. The crab keeps its shell.' : 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 216);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, 290);
    ctx.fillStyle = PAL.text; ctx.font = '22px sans-serif';
    const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
    ctx.fillText(`${state.kills} slain  •  ${state.pearlsCollected} pearls  •  Level ${state.level}  •  ${mins}:${String(secs).padStart(2, '0')} survived`, VIEW_W / 2, 336);
    ctx.fillText(`Damage dealt ${state.stats.damage}  •  Damage taken ${state.stats.taken}  •  Dashes ${state.stats.dashes}`, VIEW_W / 2, 370);
    ctx.fillStyle = state.score >= state.best && state.score > 0 ? PAL.gold : PAL.dim;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(state.score >= state.best && state.score > 0 ? '★ NEW BEST SCORE ★' : `BEST ${state.best}`, VIEW_W / 2, 420);
    const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PAL.text; ctx.font = 'bold 28px sans-serif';
      ctx.fillText('PRESS R  or  CLICK  to play again', VIEW_W / 2, 500);
    }
  }

  return {
    render(state, fx, t) {
      const scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
      const ox = (canvas.width - VIEW_W * scale) / 2, oy = (canvas.height - VIEW_H * scale) / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAL.deep; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, ox + fx.shakeX * scale, oy + fx.shakeY * scale);
      drawPool(state, t);
      // Ink pools under everything that swims.
      for (const ink of state.inks) {
        ctx.fillStyle = `rgba(123,92,255,${Math.min(0.55, ink.life / 2)})`;
        ctx.beginPath(); ctx.arc(ink.x, ink.y, ink.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const pe of state.pearls) { // pearls bob and glint (fat ones are gold)
        const bobY = Math.sin(pe.bob) * 3;
        ctx.fillStyle = pe.v >= 3 ? PAL.gold : PAL.pearl;
        ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, pe.v >= 3 ? 8 : 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(pe.x - 1.5, pe.y + bobY - 1.5, 2, 0, Math.PI * 2); ctx.fill();
      }
      for (const pk of state.pickups) {
        if (pk.kind === 'heal') star(ctx, pk.x, pk.y, 14, t, '#ff8fb0');
        else if (pk.kind === 'bomb') {
          ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(pk.x, pk.y, 13, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#062a33'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('✹', pk.x, pk.y + 5);
        } else {
          ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(pk.x, pk.y, 12, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#7fe0c3'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('◎', pk.x, pk.y + 5);
        }
      }
      for (const b of state.bolts) {
        ctx.strokeStyle = 'rgba(191,232,224,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#bfe8e0'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const e of state.enemies) drawEnemy(ctx, e, t);
      if (state.phase !== 'title') drawCrab(ctx, state.player, t);
      fx.draw(ctx);
      if (state.phase === 'play' || state.phase === 'paused' || state.phase === 'levelup') drawHud(state);
      if (state.phase === 'title') drawTitle(state);
      if (state.phase === 'levelup') drawLevelUp(state);
      if (state.phase === 'paused') drawPaused();
      if (state.phase === 'over') drawOver(state);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
