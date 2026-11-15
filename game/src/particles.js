// Particles, floating damage numbers and screen shake — the juice (criterion 3).
// Bubbles rise, shell shards fly, ink spreads; trauma decays and shakes the camera.
// v3 layout rule: floating TEXT lives only in the clear playfield band (y 200–560,
// x 40–1240). It never rises into the top HUD, the boss bar or the banner zone,
// and never sinks into the hint pill (y 564–608) or behind the bottom panels —
// v2 numbers floated over the timer, the boss bar and the banner text, which is
// what "đè lên nhau" meant; the first v3 build still let numbers reach y 610,
// where they showed through the hint pill during its fade-in.
const TEXT_TOP = 200, TEXT_BOTTOM = 560, TEXT_LEFT = 40, TEXT_RIGHT = 1240;
export function createParticles() {
  const parts = [], texts = [];
  let trauma = 0;
  return {
    add(p) { if (parts.length < 420) parts.push(p); },
    text(x, y, str, color, big) {
      if (texts.length < 60) {
        // Each number gets its own floor (200/213/226) and a small x nudge
        // when it was moved: without the stagger, every number from the
        // pool's top edge piled onto one y=200 line and overlapped each other.
        const floor = TEXT_TOP + Math.floor(Math.random() * 3) * 13;
        const cy = Math.max(floor, Math.min(TEXT_BOTTOM, y));
        const moved = cy !== y;
        texts.push({ x: Math.max(TEXT_LEFT, Math.min(TEXT_RIGHT, x + (moved ? (Math.random() * 2 - 1) * 14 : 0))),
          y: cy, floor, str, color, life: 0.9, big: !!big });
      }
    },
    burst(x, y, color, n, speed, kind) {
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
        this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (kind === 'bubble' ? 40 : 0),
          life: 0.5 + Math.random() * 0.5, max: 1, r: 2 + Math.random() * 4, color, kind: kind || 'dot' });
      }
    },
    bubbles(x, y, n) { this.burst(x, y, '#bfe8e0', n, 50, 'bubble'); },
    shake(amount) { trauma = Math.min(1, trauma + amount); },
    get shakeX() { return trauma * trauma * 14 * (Math.random() * 2 - 1); },
    get shakeY() { return trauma * trauma * 14 * (Math.random() * 2 - 1); },
    update(dt) {
      trauma = Math.max(0, trauma - dt * 1.6);
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const p = parts[i]; p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'bubble') { p.vy -= 60 * dt; p.x += Math.sin(p.life * 9) * 12 * dt; }
        else { p.vx *= 0.98; p.vy *= 0.98; }
      }
      for (let i = texts.length - 1; i >= 0; i -= 1) {
        const t = texts[i]; t.life -= dt; t.y -= 46 * dt;
        t.y = Math.max(t.floor, t.y); // rising numbers stop at their own floor
        if (t.life <= 0) texts.splice(i, 1);
      }
    },
    draw(ctx) {
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        if (p.kind === 'bubble') {
          ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      for (const t of texts) {
        ctx.globalAlpha = Math.min(1, t.life / 0.4);
        ctx.font = `bold ${t.big ? 24 : 16}px sans-serif`;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(4,26,32,0.9)'; // dark outline: readable over any background
        ctx.strokeText(t.str, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    },
    clear() { parts.length = 0; texts.length = 0; trauma = 0; },
  };
}
