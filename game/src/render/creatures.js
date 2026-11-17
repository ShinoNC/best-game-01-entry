// The creatures: the crab (with weapon effects) and seven enemy types.
import { PAL } from '../config.js';
import { star } from './icons.js';
import { txt } from './polish.js';

// Outline the just-filled path dark — creatures pop against bright and dark water.
function ol(ctx, c, w = 2) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke(); }

export function drawCrab(ctx, p, t, clawStats, spinStats) {
  const s = p.radius / 20; // every part scales with the radius
  ctx.fillStyle = 'rgba(4,26,32,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 1.05, p.radius * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(p.x, p.y);
  const blink = p.iframes > 0 && Math.floor(t * 20) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.45;
  ctx.rotate(p.angle);
  ctx.scale(s, s);
  const mv = p.moving || 0;
  const wig = Math.sin(t * 16) * (2 + 4 * mv);
  ctx.translate(0, Math.sin(t * 16) * 1.5 * mv);
  ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let sgn = -1; sgn <= 1; sgn += 1) {
    ctx.beginPath(); ctx.moveTo(-6 + sgn * 8, -14); ctx.lineTo(-10 + sgn * 8, -22 - wig * sgn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6 + sgn * 8, 14); ctx.lineTo(-10 + sgn * 8, 22 + wig * sgn); ctx.stroke();
  }
  const snap = p.swing > 0 ? -0.5 : 0;
  for (const sgn of [-1, 1]) {
    ctx.save(); ctx.translate(16, sgn * 13); ctx.rotate(sgn * (0.5 + snap));
    ctx.fillStyle = PAL.crab; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.crabDark;
    ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(16, -1); ctx.lineTo(6, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // The shell's colour IS the armour tier, so upgrades are visible.
  ctx.fillStyle = PAL.crab; ctx.beginPath(); ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
  ol(ctx, PAL.crabDark, 2.5);
  const shellColors = [PAL.shell0, PAL.shell1, PAL.shell2, PAL.shell3];
  ctx.fillStyle = shellColors[p.shellTier] || PAL.shell0;
  ctx.beginPath(); ctx.arc(-4, 0, 14, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-4, 0, 9, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(10, -5); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill();
  for (const sgn of [-1, 1]) {
    ctx.strokeStyle = PAL.crabDark; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(12, sgn * 6); ctx.lineTo(19, sgn * 10); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(20, sgn * 10, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(21.5, sgn * 10, 2.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
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
  if (p.laser > 0) { // the beam: soft glow + thick magenta body + white-hot core
    const a = (p.laser / 0.15) * 0.75;
    const dirs = p.laserBeams >= 2 ? [1, -1] : [1];
    ctx.save(); ctx.lineCap = 'round';
    for (const dir of dirs) {
      ctx.strokeStyle = `rgba(255,46,136,${a * 0.28})`; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * p.laserLen, p.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,46,136,${a})`; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * p.laserLen, p.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2;
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
    ctx.rotate(face + Math.PI / 2);
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.08;
    ctx.scale(1 / pu, pu);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.r, Math.PI, 0); ctx.fill();
    ol(ctx, flash ? '#fff' : e.dark, 2);
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
    ol(ctx, flash ? '#fff' : e.dark, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(-e.r * 0.2, -e.r * 0.2, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'starfish' || e.type === 'mini') {
    const rock = Math.sin(t * 2 + e.wob) * 0.15;
    const pu = 1 + Math.sin(t * 3 + e.wob) * 0.05;
    ctx.rotate(rock); ctx.scale(pu, pu);
    star(ctx, 0, 0, e.r, 0, flash ? '#fff' : e.color);
    ol(ctx, flash ? '#fff' : e.dark, 2);
    ctx.fillStyle = flash ? '#fff' : e.dark;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'eel') {
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
    ol(ctx, flash ? '#fff' : e.dark, 2);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 1.3, -e.r * 0.18, 2.4, 0, Math.PI * 2); ctx.fill();
    if (e.lungeT > 0) { // mid-lunge: a white streak sells the burst
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * 2.2, 0); ctx.lineTo(-e.r * 1.2, 0); ctx.stroke();
    }
    if (e.windup > 0) { // winding up: a bright ring warns the player
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.r * 1.9, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (e.type === 'archer') { // spitter: tube snout + dark band; droplet swells while aiming
    ctx.rotate(face);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ol(ctx, flash ? '#fff' : e.dark, 2);
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
    // Herons must read as BIRDS: dangling legs, feathered wings, S-neck, dagger beak.
    // Legs hang DOWN in screen space (drawn before the facing rotation).
    const s = e.type === 'gull' ? 1 : e.r / 26; // herons scale with their radius
    const heron = e.type.endsWith('heron');
    ctx.fillStyle = 'rgba(4,26,32,0.22)';
    ctx.beginPath(); ctx.ellipse(0, e.r * (heron ? 3.4 : 2.4), e.r * 1.1, e.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    if (heron) { // long legs dangle below the body, with splayed toes
      ctx.save(); ctx.scale(s, s);
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const sgn of [-1, 1]) {
        const lx = sgn * e.r * 0.25, ly = e.r * 1.15;
        ctx.beginPath(); ctx.moveTo(lx, e.r * 0.3); ctx.lineTo(lx + sgn * 3, ly); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx + sgn * 3, ly); ctx.lineTo(lx + sgn * 3 - 6, ly + 7);
        ctx.moveTo(lx + sgn * 3, ly); ctx.lineTo(lx + sgn * 3 + 6, ly + 7); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.rotate(face);
    ctx.scale(s, s);
    const flap = Math.sin(t * 10 + e.wob) * 0.7; // wings sweep up and down
    ctx.fillStyle = flash ? '#fff' : e.color;
    for (const sgn of [-1, 1]) { // feathered wings: 3 pointed primaries, not smooth fins
      ctx.save(); ctx.translate(-2, sgn * 4); ctx.rotate(sgn * (0.5 + flap * 0.5));
      ctx.beginPath();
      ctx.moveTo(e.r * 0.3, -8);
      ctx.lineTo(-e.r * 1.0, -12); ctx.lineTo(-e.r * 0.75, -4);
      ctx.lineTo(-e.r * 1.45, 0); ctx.lineTo(-e.r * 0.75, 4);
      ctx.lineTo(-e.r * 1.0, 12); ctx.lineTo(e.r * 0.3, 8);
      ctx.closePath(); ctx.fill();
      ol(ctx, flash ? '#fff' : e.dark, 2);
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, e.r * 0.9, e.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ol(ctx, flash ? '#fff' : e.dark, 2);
    // S-neck: rises from the body front, curves to the head.
    const neck = new Path2D();
    neck.moveTo(e.r * 0.45, -e.r * 0.15);
    neck.quadraticCurveTo(e.r * 0.9, -e.r * 0.85, e.r * 1.25, -e.r * 0.55);
    ctx.lineCap = 'round';
    ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = e.r * 0.2 + 4; ctx.stroke(neck);
    ctx.strokeStyle = flash ? '#fff' : e.color; ctx.lineWidth = e.r * 0.2; ctx.stroke(neck);
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.beginPath(); ctx.arc(e.r * 1.3, -e.r * 0.55, e.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ol(ctx, flash ? '#fff' : e.dark, 2);
    ctx.fillStyle = flash ? '#fff' : '#ffd166'; // long dagger beak
    ctx.beginPath();
    ctx.moveTo(e.r * 1.42, -e.r * 0.62); ctx.lineTo(e.r * 2.15, -e.r * 0.5); ctx.lineTo(e.r * 1.42, -e.r * 0.38);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 1.28, -e.r * 0.62, 2.5, 0, Math.PI * 2); ctx.fill();
    if (heron && e.type !== 'heron') { // crest: a dark plume on the head
      ctx.strokeStyle = flash ? '#fff' : e.dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.r * 1.1, -e.r * 0.72); ctx.lineTo(e.r * 0.75, -e.r * 1.05); ctx.stroke();
    }
    if (e.type === 'kingheron') { // the Heron King wears a gold crown
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(e.r * 1.05, -e.r * 0.72); ctx.lineTo(e.r * 1.2, -e.r * 1.05); ctx.lineTo(e.r * 1.35, -e.r * 0.74);
      ctx.lineTo(e.r * 1.5, -e.r * 1.05); ctx.lineTo(e.r * 1.6, -e.r * 0.7); ctx.closePath(); ctx.fill();
    }
  } else { // guppy: a little fish with a wagging tail
    ctx.rotate(face);
    const wag = Math.sin(t * 11 + e.wob) * 0.4;
    ctx.fillStyle = flash ? '#fff' : e.color;
    ctx.save(); ctx.translate(-e.r * 0.8, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-e.r * 0.7, -e.r * 0.6); ctx.lineTo(-e.r * 0.7, e.r * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ol(ctx, flash ? '#fff' : e.dark, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-e.r * 0.2, -e.r * 0.2, e.r * 0.4, e.r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(e.r * 0.5, -2, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (e.elite) { // gold ring + star: elites are worth hunting
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    txt(ctx, '★', e.x, e.y - e.r - 26, '#ffd166');
  }
// HP bars on DAMAGED enemies: thin for regulars, larger for elites/boss.
  if (e.hp < e.maxHp) {
    const big = e.elite || e.boss;
    const w = big ? e.r * 2 : 22, h = big ? 5 : 3;
    const y = e.y - e.r - (big ? 10 : 8);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, y, w, h);
    ctx.fillStyle = '#ff5d73'; ctx.fillRect(e.x - w / 2, y, w * (e.hp / e.maxHp), h);
  }
}
