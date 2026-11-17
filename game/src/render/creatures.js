// The creatures: the crab (with weapon effects) and the seven enemy types, each
// drawn and animated its own way — jellies pulse, eels wiggle, gulls flap, archers aim.
import { PAL } from '../config.js';
import { star } from './icons.js';

export function drawCrab(ctx, p, t, clawStats, spinStats) {
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
  // Claw-swing arc: a gold swoosh from the claw's live stats — longer reach reads longer.
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
  // Laser beams: thin horizontal lines, fading fast — one right, two (left + right) at max level.
  if (p.laser > 0) {
    const a = (p.laser / 0.15) * 0.75;
    const dirs = p.laserBeams >= 2 ? [1, -1] : [1];
    ctx.save(); ctx.lineCap = 'round';
    for (const dir of dirs) {
      ctx.strokeStyle = `rgba(255,46,136,${a})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * p.laserLen, p.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * p.laserLen, p.y); ctx.stroke();
    }
    ctx.restore();
  }
  if (p.flash > 0) { // hurt flash: a red ring
    ctx.strokeStyle = `rgba(255,93,115,${p.flash * 3})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
}

export function drawEnemy(ctx, e, t, ang) {
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
    if (e.windup > 0) ctx.translate(Math.sin(t * 60) * 2, Math.cos(t * 47) * 2); // tremble: the lunge is coming
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
    if (e.windup > 0) { // winding up: a bright ring warns the player
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.r * 1.9, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (e.type === 'archer') { // spitter: tube snout + dark band; a droplet swells while it aims
    ctx.rotate(face);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : e.dark;
    ctx.fillRect(-e.r * 0.2, -e.r * 0.55, e.r * 0.3, e.r * 1.1);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.moveTo(e.r * 0.7, -3); ctx.lineTo(e.r * 1.6, -1.5); ctx.lineTo(e.r * 1.6, 1.5); ctx.lineTo(e.r * 0.7, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.45, -3, 2, 0, Math.PI * 2); ctx.fill();
    if (e.windup > 0) { // aiming: droplet swells at the snout tip — move now
      ctx.fillStyle = 'rgba(191,232,224,0.95)';
      ctx.beginPath(); ctx.arc(e.r * 1.85, 0, 3 + (0.35 - e.windup) * 12, 0, Math.PI * 2); ctx.fill();
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
  // HP bars only on elites + boss: regulars flash white when hit, which is
  // enough feedback — fifteen red bars over the pool read as clutter.
  if (e.hp < e.maxHp && (e.elite || e.boss)) {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 5);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * (e.hp / e.maxHp), 5);
  }
}
