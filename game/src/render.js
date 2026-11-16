// Everything the judge sees: the pool, the crab, the creatures, the HUD and the screens.
// Criterion 1: goal, timer, score, HP, level, controls and restart are all VISIBLE here.
// Criterion 4: one palette, big readable shapes, a scene that reads at a glance.
import { PAL, POOL, STAGES, STAGE_COUNT, VIEW_H, VIEW_W, WEAPON_MAX, WEAPON_ORDER, bossForStage, xpNeed } from './config.js';
import { UPGRADE_DEFS } from './upgrades.js';
import { shopOffers, weaponStatsFor } from './weapons.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// The level-up card row slides to the half of the screen the crab (and the
// boss, if it is in the way) is NOT on, so the cards never cover either of
// them. Centered when the middle is clear. Shared with main.js so the click
// hit-boxes always match the drawn cards.
export function levelUpRowX(state) {
  const inZone = (e) => e && e.x > 250 && e.x < 1030 && e.y > 230 && e.y < 530;
  const crab = state.player, boss = state.boss;
  const leftIn = (inZone(crab) && crab.x < 640) || (inZone(boss) && boss.x < 640);
  const rightIn = (inZone(crab) && crab.x >= 640) || (inZone(boss) && boss.x >= 640);
  if (leftIn && !rightIn) return 560; // crab/boss on the left — cards go right
  if (rightIn && !leftIn) return 30; // crab/boss on the right — cards go left
  if (leftIn && rightIn) return crab.x < 640 ? 560 : 30; // both sides busy: keep the crab clear
  return 290; // middle clear — centred
}

// The stage-clear screen's hit-boxes, shared with main.js so clicks always
// match the drawn cards, shop offers and NEXT button. Cards: y 140–330.
// Shop: two rows of three, y 372–468 and y 484–580. NEXT: y 606–650.
export function stageClearLayout(state) {
  const rowX = levelUpRowX(state);
  const cards = (state.levelChoices || []).map((c, i) => ({ x: rowX + i * 240, y: 140, w: 210, h: 190 }));
  const shop = [];
  for (let i = 0; i < 6; i += 1) {
    shop.push({ x: 140 + (i % 3) * 340, y: 372 + Math.floor(i / 3) * 112, w: 320, h: 96 });
  }
  return { cards, shop, next: { x: 480, y: 606, w: 320, h: 44 } };
}

function star(ctx, x, y, r, rot, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

// Drawn weapon icons — pictures, not letters. Each weapon has its own shape,
// drawn in a 40-unit box centred on (x, y) at size s: a pincer (claw), a bow
// with an arrow (bow), a burst of ink (blaster), a spiral shell (shell), a
// whirlpool arrow (spin), a gun with a beam (laser). Unowned weapons draw
// dimmed. Used in the HUD arsenal row, the cards, the shop and the end screen.
function drawWeaponIcon(ctx, id, x, y, s, owned) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  if (!owned) ctx.globalAlpha = 0.35;
  if (id === 'claw') {
    ctx.fillStyle = '#ff7a3c'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#062a33';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, -7); ctx.lineTo(15, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d94f1e'; ctx.beginPath(); ctx.arc(-4, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bow') {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-6, 0, 16, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = '#f4f9ff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(2, -15); ctx.lineTo(2, 15); ctx.stroke();
    ctx.strokeStyle = '#bfe8e0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(14, 0); ctx.stroke();
    ctx.fillStyle = '#e8fffa'; ctx.beginPath(); ctx.arc(15, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'blaster') {
    ctx.fillStyle = '#7b5cff';
    for (const [bx, by, br] of [[-6, -9, 6], [4, -2, 7], [-6, 9, 6]]) {
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#3a2d5e'; ctx.fillRect(-18, -4, 9, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(2, -4, 2, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'shell') {
    ctx.strokeStyle = '#d8cfe8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const r of [14, 10, 6]) { ctx.beginPath(); ctx.arc(0, 0, r, 0.4, Math.PI * 1.8); ctx.stroke(); }
    ctx.fillStyle = '#a894c4'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'laser') {
    ctx.fillStyle = '#3a2d5e'; ctx.fillRect(-18, -5, 14, 10);
    ctx.fillStyle = '#8a7fb8'; ctx.fillRect(-6, -2, 10, 4);
    ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.fillStyle = '#ff2e88'; ctx.beginPath(); ctx.arc(19, 0, 3, 0, Math.PI * 2); ctx.fill();
  } else { // spin: a whirlpool arrow
    ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0.4, 4.8); ctx.stroke();
    ctx.fillStyle = '#7fe0c3';
    ctx.beginPath(); ctx.moveTo(13, -6); ctx.lineTo(18, 2); ctx.lineTo(9, 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(127,224,195,0.6)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 6.5, 2.2, 5.6); ctx.stroke();
  }
  ctx.restore();
}

// Level pips: five dots, filled = owned levels, gold = the next level (the
// one a card or shop buy would add), empty = the rest. Centred on (cx, y).
function drawPips(ctx, cx, y, lv, next) {
  for (let i = 0; i < WEAPON_MAX; i += 1) {
    ctx.fillStyle = i < lv ? '#7fe0c3' : (next && i === lv ? '#ffd166' : 'rgba(255,255,255,0.25)');
    ctx.beginPath(); ctx.arc(cx - 24 + i * 12, y, 4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCrab(ctx, p, t, clawStats, spinStats) {
  const s = p.radius / 20; // every part scales with the radius
  // Soft shadow under the crab: it sits IN the pool, not on top of it.
  ctx.fillStyle = 'rgba(4,26,32,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 1.05, p.radius * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(p.x, p.y);
  const blink = p.iframes > 0 && Math.floor(t * 20) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.45;
  ctx.rotate(p.angle);
  ctx.scale(s, s);
  // Walk cycle: legs paddle and the body bobs only while moving.
  const mv = p.moving || 0;
  const wig = Math.sin(t * 16) * (2 + 4 * mv);
  ctx.translate(0, Math.sin(t * 16) * 1.5 * mv);
  // Legs: six strokes paddling as it moves.
  ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let sgn = -1; sgn <= 1; sgn += 1) {
    ctx.beginPath(); ctx.moveTo(-6 + sgn * 8, -14); ctx.lineTo(-10 + sgn * 8, -22 - wig * sgn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6 + sgn * 8, 14); ctx.lineTo(-10 + sgn * 8, 22 + wig * sgn); ctx.stroke();
  }
  // Claws: two pincers ahead, snapping shut on the swing.
  const snap = p.swing > 0 ? -0.5 : 0;
  for (const sgn of [-1, 1]) {
    ctx.save(); ctx.translate(16, sgn * 13); ctx.rotate(sgn * (0.5 + snap));
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
  // Facing chevron on the nose: the walking direction reads instantly.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(10, -5); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill();
  // Eyes on stalks, looking where it walks — they are the face.
  for (const sgn of [-1, 1]) {
    ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(12, sgn * 6); ctx.lineTo(19, sgn * 10); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(20, sgn * 10, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(21.5, sgn * 10, 2.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Claw-swing arc: a gold swoosh sweeping the arc the claws just hit. The arc
  // comes from the claw's live stats, so a longer reach reads longer.
  if (p.swing > 0 && clawStats) {
    const prog = 1 - p.swing / 0.18; // 0 -> 1 across the swing
    const r = clawStats.range * 0.8, arc = clawStats.arc || 1.6;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalAlpha = (1 - prog) * 0.16;
    ctx.fillStyle = PAL.gold;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, clawStats.range, p.angle - arc, p.angle + arc); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = (1 - prog) * 0.85;
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 9; ctx.lineCap = 'round';
    const lead = p.angle - arc + prog * arc * 2;
    ctx.beginPath(); ctx.arc(0, 0, r, lead - 0.55, lead + 0.15); ctx.stroke();
    ctx.restore();
  }
  // Whirlpool ring: an expanding teal ring as the spin blast goes off.
  if (p.spin > 0 && spinStats) {
    const prog = 1 - p.spin / 0.3; // 0 -> 1 across the blast
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalAlpha = (1 - prog) * 0.8;
    ctx.strokeStyle = '#7fe0c3'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 30 + prog * (spinStats.range - 30), 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = (1 - prog) * 0.2;
    ctx.fillStyle = '#7fe0c3';
    ctx.beginPath(); ctx.arc(0, 0, 30 + prog * (spinStats.range - 30), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Laser beams: bright horizontal lines, fading fast — one to the right, two
  // (left + right) at max level.
  if (p.laser > 0) {
    const a = (p.laser / 0.15) * 0.9;
    const dirs = p.laserBeams >= 2 ? [1, -1] : [1];
    ctx.save(); ctx.lineCap = 'round';
    for (const dir of dirs) {
      ctx.strokeStyle = `rgba(255,46,136,${a})`; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * p.laserLen, p.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * p.laserLen, p.y); ctx.stroke();
    }
    ctx.restore();
  }
  if (p.flash > 0) { // hurt flash: a red ring
    ctx.strokeStyle = `rgba(255,93,115,${p.flash * 3})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
}

// Every creature faces the crab (ang = direction to the player) and animates its
// own way: jellies pulse, eels wiggle, gulls flap, urchins spin, starfish crawl.
function drawEnemy(ctx, e, t, ang) {
  const face = ang ?? 0;
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.flash > 0) ctx.globalAlpha = 0.6;
  const flash = e.flash > 0;
  if (e.type === 'jelly') {
    // Dome faces the crab, tentacles trail behind; the bell pulses as it swims.
    ctx.rotate(face + Math.PI / 2);
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.08;
    ctx.scale(1 / pu, pu);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r, Math.PI, 0); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : e.dark; // inner bell shading
    ctx.beginPath(); ctx.arc(0, -e.r * 0.25, e.r * 0.55, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * 6, 2);
      ctx.quadraticCurveTo(i * 6 + Math.sin(t * 4 + i) * 5, 12, i * 6, 20 + Math.sin(t * 4 + i * 2) * 4);
      ctx.stroke();
    }
  } else if (e.type === 'urchin') {
    ctx.rotate(e.wob * 0.3); // slow spin
    const pu = 1 + Math.sin(t * 2 + e.wob) * 0.04;
    ctx.scale(pu, pu);
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 3;
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * e.r * 0.4, Math.sin(a) * e.r * 0.4);
      ctx.lineTo(Math.cos(a) * e.r * 1.15, Math.sin(a) * e.r * 1.15); ctx.stroke();
    }
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(-e.r * 0.2, -e.r * 0.2, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'starfish' || e.type === 'mini') {
    // Crawl: the star rocks side to side and breathes as it moves.
    const rock = Math.sin(t * 2 + e.wob) * 0.15;
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.05;
    ctx.rotate(rock); ctx.scale(pu, pu);
    star(ctx, 0, 0, e.r, 0, flash ? '#fff' : e.color);
    ctx.fillStyle = flash ? '#fff' : e.dark;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'eel') {
    // A segmented body that wiggles as it swims; the head leads, fins trail.
    ctx.rotate(face);
    for (let i = 4; i >= 0; i -= 1) {
      const x = -e.r * 1.4 + i * e.r * 0.55;
      const y = Math.sin(t * 7 + e.wob + i * 0.9) * e.r * 0.45;
      ctx.fillStyle = flash ? '#fff' : (i % 2 ? e.color : e.dark);
      ctx.beginPath(); ctx.arc(x, y, e.r * (0.32 + 0.1 * (i / 4)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(e.r * 1.15, 0, e.r * 0.52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 1.3, -e.r * 0.18, 2.4, 0, Math.PI * 2); ctx.fill();
    if (e.lungeT > 0) { // mid-lunge: a white streak sells the burst
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * 2.2, 0); ctx.lineTo(-e.r * 1.2, 0); ctx.stroke();
    }
  } else if (e.type === 'gull' || e.type.endsWith('heron')) {
    // Flying birds cast a soft shadow on the water below — height reads at once.
    ctx.fillStyle = 'rgba(4,26,32,0.22)';
    ctx.beginPath(); ctx.ellipse(0, e.r * 2.4, e.r * 1.1, e.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(face);
    const s = e.type === 'gull' ? 1 : e.r / 26; // herons scale with their radius
    ctx.scale(s, s);
    const flap = Math.sin(t * 10 + e.wob) * 0.7; // wings sweep up and down
    ctx.fillStyle = flash ? '#fff' : e.color;
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.translate(-2, sgn * 4); ctx.rotate(sgn * (0.5 + flap * 0.5));
      ctx.beginPath(); ctx.ellipse(-e.r * 0.7, 0, e.r * 0.95, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, e.r * 0.9, e.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#ffd166';
    ctx.beginPath(); ctx.moveTo(e.r * 0.7, -3); ctx.lineTo(e.r * 1.5, 0); ctx.lineTo(e.r * 0.7, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    if (e.type.endsWith('heron')) { // long legs trailing behind
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * 0.7, -6); ctx.lineTo(-e.r * 1.4, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-e.r * 0.7, 6); ctx.lineTo(-e.r * 1.4, 2); ctx.stroke();
    }
    if (e.type.endsWith('heron') && e.type !== 'heron') { // crest: a dark plume on the head
      ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.r * 0.3, -e.r * 0.5); ctx.lineTo(-e.r * 0.3, -e.r * 0.9); ctx.stroke();
    }
    if (e.type === 'kingheron') { // the Heron King wears a gold crown
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(e.r * 0.1, -e.r * 0.55); ctx.lineTo(e.r * 0.3, -e.r * 0.95); ctx.lineTo(e.r * 0.5, -e.r * 0.6);
      ctx.lineTo(e.r * 0.7, -e.r * 0.95); ctx.lineTo(e.r * 0.9, -e.r * 0.55); ctx.closePath(); ctx.fill();
    }
  } else { // guppy: a little fish with a wagging tail
    ctx.rotate(face);
    const wag = Math.sin(t * 11 + e.wob) * 0.4;
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.save(); ctx.translate(-e.r * 0.8, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-e.r * 0.7, -e.r * 0.6); ctx.lineTo(-e.r * 0.7, e.r * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-e.r * 0.2, -e.r * 0.2, e.r * 0.4, e.r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -2, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (e.elite) { // gold ring + star: elites are worth hunting
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7, 0, Math.PI * 2); ctx.stroke();
    // The star sits ABOVE the HP bar, so the bar never cuts through it.
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', e.x, e.y - e.r - 26);
  }
  if (e.hp < e.maxHp && (e.elite || e.boss || e.maxHp > 40)) {
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

  // Ambient bubbles: fixed pseudo-random table, positions a pure function of
  // time — deterministic, no state, they just rise forever.
  const ambBubbles = [];
  { let s = 1234567; for (let i = 0; i < 14; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; ambBubbles.push({ fx: (s % 1000) / 1000, fy: ((s >> 9) % 1000) / 1000, r: 2 + ((s >> 5) % 4), sp: 14 + ((s >> 7) % 22) }); } }

  function drawPool(state, t) {
    // Layered sand: a beach ellipse under the water, darker at the edges.
    ctx.fillStyle = '#8a6f4d';
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 74, POOL.ry + 58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.sand;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 46, POOL.ry + 34, 0, 0, Math.PI * 2); ctx.fill();
    // Water gradient + sandy rim + foam ring: the arena reads as a rockpool.
    const g = ctx.createRadialGradient(POOL.cx, POOL.cy, 60, POOL.cx, POOL.cy, POOL.rx);
    g.addColorStop(0, PAL.water2); g.addColorStop(1, PAL.water);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PAL.sand; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx + 4, POOL.ry + 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(191,232,224,${0.35 + 0.15 * Math.sin(t * 1.4)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx - 8, POOL.ry - 8, 0, 0, Math.PI * 2); ctx.stroke();
    // Ripples: concentric rings breathing slowly inside the pool.
    ctx.strokeStyle = 'rgba(191,232,224,0.10)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const rr = 0.35 + i * 0.28 + Math.sin(t * 0.5 + i * 2) * 0.02;
      ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx * rr, POOL.ry * rr, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Light rays from the surface, clipped to the pool, swaying gently.
    ctx.save();
    ctx.beginPath(); ctx.ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 4; i += 1) {
      const x0 = 200 + i * 260 + Math.sin(t * 0.25 + i * 1.7) * 24;
      ctx.fillStyle = 'rgba(220,255,245,0.05)';
      ctx.beginPath();
      ctx.moveTo(x0, POOL.cy - POOL.ry - 10); ctx.lineTo(x0 + 70, POOL.cy - POOL.ry - 10);
      ctx.lineTo(x0 + 170, POOL.cy + POOL.ry + 10); ctx.lineTo(x0 + 60, POOL.cy + POOL.ry + 10);
      ctx.closePath(); ctx.fill();
    }
    // Drifting caustic light patches.
    for (let i = 0; i < 2; i += 1) {
      const cx = POOL.cx + Math.sin(t * 0.11 + i * 2.4) * 260;
      const cy = POOL.cy + Math.cos(t * 0.09 + i * 1.3) * 130;
      ctx.fillStyle = 'rgba(200,255,240,0.05)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 150, 70, 0.3 * i, 0, Math.PI * 2); ctx.fill();
    }
    // Ambient bubbles rising from the sand.
    ctx.strokeStyle = 'rgba(191,232,224,0.35)'; ctx.lineWidth = 1.5;
    for (const b of ambBubbles) {
      const x = POOL.cx + (b.fx - 0.5) * POOL.rx * 1.7;
      const y = POOL.cy + POOL.ry - ((t * b.sp + b.fy * 500) % (POOL.ry * 2));
      const inside = ((x - POOL.cx) / POOL.rx) ** 2 + ((y - POOL.cy) / POOL.ry) ** 2 < 0.95;
      if (inside) { ctx.beginPath(); ctx.arc(x, y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
    // Decor: rocks, weed, shells, starfish — placed by the seeded RNG.
    for (const d of state.decor) {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = 0.85;
      // Soft shadow grounds each piece of decor.
      ctx.fillStyle = 'rgba(4,26,32,0.28)';
      ctx.beginPath(); ctx.ellipse(3, 6, 15 * d.s, 7 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      if (d.kind === 'rock') {
        ctx.fillStyle = '#5a6b66'; ctx.beginPath(); ctx.ellipse(0, 0, 16 * d.s, 11 * d.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.beginPath(); ctx.ellipse(-4 * d.s, -3 * d.s, 7 * d.s, 4 * d.s, 0, 0, Math.PI * 2); ctx.fill();
      } else if (d.kind === 'weed') {
        // Taller blades that sway with the current.
        ctx.strokeStyle = '#2f8f6b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath(); ctx.moveTo(i * 6, 0);
          ctx.quadraticCurveTo(i * 8, -16 * d.s, i * 4 + Math.sin(t * 1.2 + i + d.rot) * 6, -32 * d.s); ctx.stroke();
        }
        ctx.strokeStyle = '#4fae7d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(4, -20 * d.s, Math.sin(t * 1.2 + d.rot) * 8, -38 * d.s); ctx.stroke();
      } else if (d.kind === 'shell') {
        // Pale lavender, never gold — a gold shell would read as a fat pearl.
        ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.arc(0, 0, 7 * d.s, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#a894c4'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 4 * d.s, Math.PI, 0); ctx.stroke();
      } else {
        // A sand dollar, not a starfish — a pink decor star would read as a
        // (motionless) enemy starfish at a glance. Pale disc, dark centre dot.
        ctx.fillStyle = 'rgba(224,196,143,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 8 * d.s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(138,111,77,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 2.5 * d.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawHud(state, t) {
    // HUD layout (VIEW 1280x720) — every element owns one region, none overlap:
    //   top bar y 14–94: HP panel (left, now taller: HP + shell + arsenal row,
    //     y 14–166) / timer+WIN-LOSE panel (centre) / score panel (right)
    //   boss strip y 100–134: boss bar (boss alive) OR countdown pill (15 s before) — never both
    //   banner zone y 146–186: one banner at a time, dark backdrop, skipped on level-up
    //   playfield y 200–610: damage numbers live here and nowhere else (see particles.js)
    //   hint pill y 564–608, centred, play phase only, never while a banner shows
    //   bottom bar y 620–704: level/XP left, cooldowns right, controls strip centre
    const p = state.player;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // Top-left: HP bar with a heart + shell tier + the arsenal row — every
    // owned weapon as a drawn icon with its level pips, all firing at once.
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(18, 14, 290, 152);
    ctx.fillStyle = PAL.hp; ctx.font = 'bold 26px sans-serif';
    ctx.fillText('♥', 28, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(58, 26, 190, 18);
    ctx.fillStyle = PAL.hp; ctx.fillRect(58, 26, 190 * (p.hp / p.maxHp), 18);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp} HP`, 58, 64);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`SHELL ${'●'.repeat(p.shellTier + 1)}${'○'.repeat(3 - p.shellTier)}`, 58, 86);
    for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
      const id = WEAPON_ORDER[i];
      const lv = state.weapons[id];
      const bx = 33 + i * 44, by = 96;
      ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(bx, by, 40, 44);
      ctx.strokeStyle = lv > 0 ? 'rgba(127,224,195,0.6)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1; ctx.strokeRect(bx, by, 40, 44);
      drawWeaponIcon(ctx, id, bx + 20, by + 17, 28, lv > 0);
      for (let j = 0; j < WEAPON_MAX; j += 1) {
        ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(bx + 8 + j * 6, by + 38, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Top-centre: the stage, always visible — the stage number AND the goal,
    // written as an explicit WIN/LOSE line (the top entries all do this).
    const remaining = (STAGES[state.stage - 1].budget - state.stageSpawned) + state.enemies.length;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W / 2 - 170, 14, 340, 80);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`STAGE ${state.stage} / ${STAGE_COUNT}`, VIEW_W / 2, 40);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('WIN: CLEAR STAGE 30 · LOSE: HP = 0', VIEW_W / 2, 62);
    ctx.fillStyle = PAL.dim; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(state.boss ? `${state.boss.name} — DRIVE IT OFF!` : `${remaining} creatures left`, VIEW_W / 2, 82);
    // Boss warning on a boss stage, before the heron arrives — never a surprise.
    // Its own dark pill in the boss strip, so it reads over any background.
    if (STAGES[state.stage - 1].boss && !state.bossSpawned && !state.boss) {
      const boss = bossForStage(state.stage);
      const warn = `⚠ ${boss ? boss.name : 'THE HERON'} IS COMING ⚠`;
      ctx.font = 'bold 17px sans-serif';
      const ww = ctx.measureText(warn).width + 40;
      ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(VIEW_W / 2 - ww / 2, 100, ww, 32);
      ctx.fillStyle = `rgba(255,93,115,${0.6 + 0.4 * Math.sin(t * 6)})`;
      ctx.fillText(warn, VIEW_W / 2, 122);
    }
    // Boss bar under the timer while a heron lives.
    if (state.boss) {
      ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W / 2 - 190, 104, 380, 26);
      ctx.fillStyle = '#e8e4d8'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(state.boss.name, VIEW_W / 2, 122);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(VIEW_W / 2 - 180, 126, 360, 8);
      ctx.fillStyle = '#ff5d73'; ctx.fillRect(VIEW_W / 2 - 180, 126, 360 * (state.boss.hp / state.boss.maxHp), 8);
    }
    // Top-right: score, coins (the shop money — always visible), kills, best.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W - 268, 14, 250, 88);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, VIEW_W - 28, 40);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`◉ ${state.coins} COINS`, VIEW_W - 28, 64);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`BEST ${state.best}  •  ${state.kills} slain`, VIEW_W - 28, 86);
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
    // Bottom-right: dash cooldown.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(VIEW_W - 268, VIEW_H - 60, 250, 44);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(p.dashCd <= 0 ? 'DASH READY  [Space]' : `DASH ${p.dashCd.toFixed(1)}s`, VIEW_W - 28, VIEW_H - 32);
    // Wave / elite banner in its own zone (y 146–186) with a dark backdrop and a
    // gold frame, so damage numbers and the heron never cross the text.
    // Skipped on the level-up screen, whose own title lives here.
    if (state.bannerT > 0 && state.phase !== 'levelup') {
      ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, state.bannerT);
      ctx.font = 'bold 30px sans-serif';
      const bw = ctx.measureText(state.banner).width + 56;
      ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - bw / 2, 146, bw, 40);
      ctx.fillStyle = PAL.gold;
      ctx.fillText(state.banner, VIEW_W / 2, 175);
      ctx.globalAlpha = 1;
    }
    // Controls strip, bottom centre — a dark bar between the two bottom panels,
    // so the line reads over the bright sand rim (bare dim text washes out).
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(6,42,51,0.75)'; ctx.fillRect(446, 676, 558, 24);
    ctx.fillStyle = PAL.foam; ctx.font = '13px sans-serif';
    ctx.fillText('WASD move  ·  SPACE dash  ·  P pause  ·  M mute', VIEW_W / 2, 693);
    // Tutorial hint pill, bottom centre: an icon plus one short line, fading
    // out. Play phase only — on the level-up screen the cards own the player's
    // attention.
    const hint = state.phase === 'play' && state.hints && state.hints.cur;
    if (hint) {
      const remain = state.hints.t;
      const alpha = Math.min(1, remain / 0.5) * Math.min(1, (hint.show - remain) / 0.25);
      ctx.font = 'bold 19px sans-serif';
      const tw = ctx.measureText(hint.text).width;
      const w = tw + 44 + 30; // text + padding + icon slot
      const y = VIEW_H - 132;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(6,42,51,0.88)'; ctx.fillRect(VIEW_W / 2 - w / 2, y - 24, w, 44);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - w / 2, y - 24, w, 44);
      ctx.fillStyle = PAL.gold; ctx.textAlign = 'center';
      ctx.fillText(hint.icon, VIEW_W / 2 - w / 2 + 24, y + 5);
      ctx.fillStyle = PAL.text;
      ctx.fillText(hint.text, VIEW_W / 2 + 15, y + 5);
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle(state) {
    ctx.fillStyle = 'rgba(6,42,51,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.crab; ctx.font = 'bold 84px sans-serif';
    ctx.fillText('TIDEKEEPER', VIEW_W / 2, 170);
    // Goal first, in gold: a new player reads the goal + controls in under 5 s.
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 23px sans-serif';
    ctx.fillText('★ CLEAR 30 STAGES — BEAT THE HERONS, WIN THE POOL ★', VIEW_W / 2, 222);
    ctx.fillStyle = PAL.text; ctx.font = '19px sans-serif';
    ctx.fillText('Slay creatures. Gather pearls and coins. Collect six auto-weapons.', VIEW_W / 2, 256);
    // The four controls as chips, side by side.
    const chips = ['WASD — MOVE', 'WEAPONS — ALL AUTO-FIRE', 'SPACE — DASH', 'P — PAUSE · M — MUTE'];
    ctx.font = 'bold 16px sans-serif';
    const widths = chips.map((c) => ctx.measureText(c).width + 36);
    const gap = 16;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
    let x = VIEW_W / 2 - total / 2;
    for (let i = 0; i < chips.length; i += 1) {
      ctx.fillStyle = 'rgba(6,42,51,0.85)'; ctx.fillRect(x, 292, widths[i], 40);
      ctx.strokeStyle = PAL.foam; ctx.lineWidth = 2; ctx.strokeRect(x, 292, widths[i], 40);
      ctx.fillStyle = PAL.text; ctx.fillText(chips[i], x + widths[i] / 2, 318);
      x += widths[i] + gap;
    }
    ctx.fillStyle = PAL.dim; ctx.font = '16px sans-serif';
    ctx.fillText('All your weapons attack on their own — dodge, position, and buy better gear.', VIEW_W / 2, 366);
    // Scope line: what the game contains, in numbers (the top titles all list theirs).
    ctx.fillStyle = PAL.foam; ctx.font = '15px sans-serif';
    ctx.fillText('30 stages · 6 boss herons · 6 weapons · shop after every stage · 8 upgrades', VIEW_W / 2, 396);
    const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PAL.gold; ctx.font = 'bold 30px sans-serif';
      ctx.fillText('CLICK  or  PRESS ENTER  to begin', VIEW_W / 2, 480);
    }
    ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif';
    ctx.fillText(state.best > 0 ? `BEST SCORE ${state.best}` : 'No best score yet — be the first crab to hold the pool.', VIEW_W / 2, 540);
    // A crab and a jellyfish flank the title, so the cover shows the game at once.
    drawCrab(ctx, { ...state.player, x: 330, y: 470, angle: 0.3, iframes: 0, flash: 0, swing: 0, spin: 0 }, 0, null, null);
    drawEnemy(ctx, { type: 'jelly', x: 950, y: 470, r: 26, color: '#ff8fb0', dark: '#c94f78', hp: 1, maxHp: 1, flash: 0, wob: 0.5, elite: false }, 0, Math.PI);
  }

  // One card, drawn for both the level-up screen and the stage-clear screen.
  // Pictures first: a weapon card shows its drawn icon, an upgrade card its
  // glyph; the level reads as pips (filled = owned, gold = the level this
  // card adds), not as a sentence. Compact cards are the stage-clear size.
  function drawCard(d, x, y, w, h, i, state, opts) {
    const { compact = false, dimmed = false, picked = false } = opts || {};
    const wid = d.isWeapon ? d.id.split(':')[1] : null;
    const lv = wid ? state.weapons[wid] : (state.ups[d.id] || 0);
    ctx.save();
    if (dimmed) ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#0e5566'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = picked ? 5 : 3;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    const cy = compact ? y + 48 : y + 60;
    if (wid) drawWeaponIcon(ctx, wid, x + w / 2, cy, compact ? 46 : 52, true);
    else {
      ctx.fillStyle = PAL.xp; ctx.font = `bold ${compact ? 40 : 44}px sans-serif`;
      ctx.fillText(d.icon, x + w / 2, cy + 14);
    }
    // The name shrinks one step if it would overflow the card.
    ctx.fillStyle = PAL.text;
    ctx.font = 'bold 18px sans-serif';
    if (ctx.measureText(d.name).width > w - 20) ctx.font = 'bold 15px sans-serif';
    ctx.fillText(d.name, x + w / 2, compact ? y + 86 : y + 104);
    ctx.fillStyle = PAL.dim; ctx.font = `${compact ? 15 : 16}px sans-serif`;
    ctx.fillText(d.desc, x + w / 2, compact ? y + 110 : y + 130);
    drawPips(ctx, x + w / 2, compact ? y + 136 : y + 158, lv, !picked);
    ctx.fillStyle = PAL.gold; ctx.font = `bold ${compact ? 15 : 16}px sans-serif`;
    ctx.fillText(picked ? '✓ PICKED' : d.isWeapon ? '★ NEW WEAPON ★' : '', x + w / 2, compact ? y + 162 : y + 182);
    ctx.fillStyle = PAL.text; ctx.font = `bold ${compact ? 14 : 18}px sans-serif`;
    if (compact) ctx.fillText(`[${i + 1}]`, x + w - 22, y + 22);
    else ctx.fillText(`[ ${i + 1} ]`, x + w / 2, y + 208);
    ctx.restore();
  }

  function drawLevelUp(state) {
    // A lighter dim (0.62) so the fight behind the cards stays visible —
    // the crab, the boss bar and the heron are part of the shot.
    ctx.fillStyle = 'rgba(6,42,51,0.62)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    // The title sits at y=180 so its 40 px glyphs clear the boss bar
    // (y 104–134). Cards sit below it (y 270).
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`LEVEL ${state.level} — CHOOSE AN UPGRADE`, VIEW_W / 2, 180);
    ctx.fillStyle = PAL.dim; ctx.font = '18px sans-serif';
    ctx.fillText('Press 1, 2 or 3 — or click a card.', VIEW_W / 2, 212);
    const cards = state.levelChoices || [];
    const rowX = levelUpRowX(state); // the row slides away from the crab/boss
    cards.forEach((d, i) => drawCard(d, rowX + i * 240, 270, 210, 220, i, state));
  }

  // The stage-clear screen: pick 1 of 3 cards, then the shop, then the next
  // stage. One screen, no HUD behind it — the title owns the top of the frame
  // (the HUD's top panels would collide with it). The empty pool and the
  // crab still show through the dim.
  function drawStageClear(state) {
    const L = stageClearLayout(state);
    ctx.fillStyle = 'rgba(6,42,51,0.62)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 38px sans-serif';
    ctx.fillText(`★ STAGE ${state.stage} CLEAR! ★`, VIEW_W / 2, 64);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`◉ ${state.coins} COINS — spend them before the next stage`
      + (state.pickedCard ? `  ·  PICKED: ${state.pickedCard.name}` : ''), VIEW_W / 2, 96);
    ctx.fillStyle = PAL.dim; ctx.font = '17px sans-serif';
    ctx.fillText(state.stagePicked ? 'CARD PICKED — now shop, then head on!'
      : 'PICK A CARD — press 1, 2 or 3, or click', VIEW_W / 2, 124);
    const cards = state.levelChoices || [];
    cards.forEach((d, i) => {
      const b = L.cards[i];
      drawCard(d, b.x, b.y, b.w, b.h, i, state,
        { compact: true, dimmed: state.stagePicked && state.pickedCard !== d, picked: state.pickedCard === d });
    });
    // The shop: six real offers with real prices. Buyable = gold border,
    // too poor = red price, maxed/full = grey. Every offer owns fixed slots:
    // icon left, name + description + level pips in the middle, price alone
    // on the right — no two texts share a line, so nothing runs together.
    ctx.textAlign = 'left';
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SHOP — click to buy', 140, 360);
    const offers = shopOffers(state);
    offers.forEach((o, i) => {
      const b = L.shop[i];
      ctx.fillStyle = o.state === 'buy' ? '#0e5566' : 'rgba(14,85,102,0.55)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = o.state === 'buy' ? PAL.gold : 'rgba(159,196,189,0.4)';
      ctx.lineWidth = o.state === 'buy' ? 2 : 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      drawWeaponIcon(ctx, o.id, b.x + 34, b.y + 48, 44, o.state !== 'max');
      ctx.textAlign = 'left';
      ctx.fillStyle = o.state === 'max' ? PAL.dim : PAL.text;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(o.name, b.x + 64, b.y + 30);
      ctx.fillStyle = PAL.dim; ctx.font = '13px sans-serif';
      ctx.fillText(o.desc, b.x + 64, b.y + 54);
      drawPips(ctx, b.x + 64 + 24, b.y + 78, state.weapons[o.id], o.state === 'buy');
      ctx.textAlign = 'right';
      ctx.fillStyle = o.state === 'buy' ? PAL.gold : o.state === 'poor' ? '#ff8fa0' : PAL.dim;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(o.label, b.x + b.w - 14, b.y + 40);
    });
    // NEXT STAGE: dim until a card is picked — the card choice is the point
    // of the screen, and skipping it by accident would waste the reward.
    const n = L.next;
    ctx.fillStyle = state.stagePicked ? 'rgba(255,209,102,0.2)' : 'rgba(6,42,51,0.85)';
    ctx.fillRect(n.x, n.y, n.w, n.h);
    ctx.strokeStyle = state.stagePicked ? PAL.gold : 'rgba(159,196,189,0.5)';
    ctx.lineWidth = 2; ctx.strokeRect(n.x, n.y, n.w, n.h);
    ctx.fillStyle = state.stagePicked ? PAL.gold : PAL.dim;
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(state.stagePicked ? `NEXT STAGE ${state.stage + 1} →  [Enter]` : 'PICK A CARD FIRST', VIEW_W / 2, n.y + 29);
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
    // Letter grade: the top entries all grade the run, and the grade gives the
    // player a reason to run again. S = win with 60+ HP, A = win, B = win nearly
    // dead, C = lost at stage 24+, D = lost earlier.
    const hp = Math.ceil(state.player.hp);
    let grade, gradeColor, nextGoal;
    if (won && hp >= 60) { grade = 'S'; gradeColor = '#ffd166'; nextGoal = 'NEXT GOAL: beat your best score'; }
    else if (won && hp > 25) { grade = 'A'; gradeColor = '#7fe0c3'; nextGoal = 'NEXT GOAL: finish with 60+ HP for grade S'; }
    else if (won) { grade = 'B'; gradeColor = '#8fb8ff'; nextGoal = 'NEXT GOAL: finish with 26+ HP for grade A'; }
    else if (state.stage >= 24) { grade = 'C'; gradeColor = '#ffab5e'; nextGoal = 'NEXT GOAL: clear stage 30 to win'; }
    else { grade = 'D'; gradeColor = '#ff5d73'; nextGoal = 'NEXT GOAL: reach stage 24 for grade C'; }
    ctx.fillStyle = 'rgba(6,42,51,0.86)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? PAL.gold : PAL.hp; ctx.font = 'bold 64px sans-serif';
    ctx.fillText(won ? 'HIGH TIDE!' : 'THE TIDE TOOK YOU', VIEW_W / 2, 150);
    ctx.fillStyle = gradeColor; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`★ GRADE ${grade} ★`, VIEW_W / 2, 210);
    ctx.fillStyle = PAL.text; ctx.font = 'bold 22px sans-serif';
    ctx.fillText(won ? 'You held the rockpool. The crab keeps its shell.' : 'The creatures feast tonight. Try again, little crab.', VIEW_W / 2, 248);
    ctx.fillStyle = PAL.gold; ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, 305);
    // Run stats in three short icon rows — no single overlong line.
    const mins = Math.floor(state.time / 60), secs = Math.floor(state.time % 60);
    ctx.fillStyle = PAL.text; ctx.font = '20px sans-serif';
    ctx.fillText(`${state.kills} slain  •  ○ ${state.pearlsCollected} pearls  •  ◉ ${state.coinsEarned} coins`, VIEW_W / 2, 340);
    ctx.fillText(`Stage ${state.stage}/${STAGE_COUNT}  •  Level ${state.level}  •  ${mins}:${String(secs).padStart(2, '0')}`, VIEW_W / 2, 368);
    ctx.fillText(`Damage dealt ${state.stats.damage}  •  Damage taken ${state.stats.taken}  •  Dashes ${state.stats.dashes}  •  Spent ${state.stats.spent} ◉`, VIEW_W / 2, 396);
    // Weapons recap: the arsenal as drawn icons with level pips, centred.
    const totalW = WEAPON_ORDER.length * 44 - 4;
    for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
      const id = WEAPON_ORDER[i];
      const lv = state.weapons[id];
      const bx = VIEW_W / 2 - totalW / 2 + i * 44;
      ctx.fillStyle = lv > 0 ? 'rgba(127,224,195,0.22)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(bx, 412, 40, 44);
      drawWeaponIcon(ctx, id, bx + 20, 429, 28, lv > 0);
      for (let j = 0; j < WEAPON_MAX; j += 1) {
        ctx.fillStyle = j < lv ? '#7fe0c3' : 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(bx + 8 + j * 6, 450, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Build recap — the upgrades this run picked, in the HUD's own
    // icon+level language (the top entries' victory screens show one too).
    const built = UPGRADE_DEFS.filter((d) => state.ups[d.id] > 0)
      .map((d) => `${d.icon} Lv${state.ups[d.id]}`).join('  ·  ');
    ctx.fillStyle = PAL.foam; ctx.font = '17px sans-serif';
    ctx.fillText(built ? `UPGRADES: ${built}` : 'UPGRADES: none yet', VIEW_W / 2, 486);
    ctx.fillStyle = PAL.xp; ctx.font = 'bold 19px sans-serif';
    ctx.fillText(nextGoal, VIEW_W / 2, 514);
    ctx.fillStyle = state.score >= state.best && state.score > 0 ? PAL.gold : PAL.dim;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(state.score >= state.best && state.score > 0 ? '★ NEW BEST SCORE ★' : `BEST ${state.best}`, VIEW_W / 2, 544);
    const blink = state.shotMode || Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PAL.text; ctx.font = 'bold 28px sans-serif';
      ctx.fillText('PRESS R  or  CLICK  to play again', VIEW_W / 2, 587);
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
        if (pe.kind === 'coin') { // coins are gold discs with a darker rim — shop money, not XP
          ctx.fillStyle = PAL.gold;
          ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, 7, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#c9962e'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#c9962e';
          ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
          continue;
        }
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
        if (b.kind === 'arrow') { // bow arrow: a long bubble dart with a bright head
          const a = Math.atan2(b.vy, b.vx);
          ctx.strokeStyle = 'rgba(191,232,224,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 16, b.y - Math.sin(a) * 16);
          ctx.lineTo(b.x + Math.cos(a) * 8, b.y + Math.sin(a) * 8); ctx.stroke();
          ctx.fillStyle = '#e8fffa'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
        } else if (b.kind === 'pellet') { // blaster pellet: a violet ink blob
          ctx.fillStyle = '#7b5cff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x - 1.5, b.y - 1.5, 2, 0, Math.PI * 2); ctx.fill();
        } else if (b.kind === 'homing') { // homing shell: a lavender spiral shell, spinning
          const a = Math.atan2(b.vy, b.vx);
          ctx.strokeStyle = 'rgba(216,207,232,0.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 18, b.y - Math.sin(a) * 18);
          ctx.lineTo(b.x - Math.cos(a) * 8, b.y - Math.sin(a) * 8); ctx.stroke();
          ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#a894c4'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.55, t * 6, t * 6 + Math.PI * 1.5); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const e of state.enemies) drawEnemy(ctx, e, t, Math.atan2(state.player.y - e.y, state.player.x - e.x));
      if (state.phase !== 'title') {
        drawCrab(ctx, state.player, t, weaponStatsFor(state, 'claw'),
          state.weapons.spin > 0 ? weaponStatsFor(state, 'spin') : null);
      }
      fx.draw(ctx);
      // Hurt vignette: red edges while the crab is flashing from a hit.
      if (state.player.flash > 0 && state.phase === 'play') {
        const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
        vg.addColorStop(0, 'rgba(255,45,85,0)');
        vg.addColorStop(1, `rgba(255,45,85,${state.player.flash * 1.6})`);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      // Level-up flash: a gold wash as the new level lands.
      if (state.levelFlash > 0) {
        ctx.fillStyle = `rgba(255,209,102,${state.levelFlash * 0.16})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      if (state.phase === 'play' || state.phase === 'paused' || state.phase === 'levelup') drawHud(state, t);
      if (state.phase === 'title') drawTitle(state);
      if (state.phase === 'levelup') drawLevelUp(state);
      if (state.phase === 'stageclear') drawStageClear(state); // no HUD here — its own title owns the top
      if (state.phase === 'paused') drawPaused();
      if (state.phase === 'over') drawOver(state);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
