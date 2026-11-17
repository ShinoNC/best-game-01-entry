// Particles, floating numbers, screen shake — the juice.
const TEXT_TOP = 200, TEXT_BOTTOM = 560, TEXT_LEFT = 40, TEXT_RIGHT = 1240;
const TEXT_MAX = 5;
export function createParticles() {
  const parts = [], texts = [];
  let trauma = 0;
  return {
    add(p) { if (parts.length < 420) parts.push(p); },
    text(x, y, str, color, big, key) {
      // Same-target merge: a live number absorbs the new hit.
      if (key != null) {
        const old = texts.find((t) => t.key === key);
        if (old) {
          old.total = (old.total ?? Number(old.str) ?? 0) + Number(str);
          old.str = `${old.total}`;
          old.life = Math.max(old.life, 0.55);
          return;
        }
      }
      // At the cap, a small number evicts the oldest small one.
      if (texts.length >= TEXT_MAX) {
        const i = texts.findIndex((t) => !t.big);
        if (i >= 0) texts.splice(i, 1);
        else if (!big) return;
        else texts.shift();
      }
      // Each number gets its own floor + x nudge — no overlaps.
      const floor = TEXT_TOP + Math.floor(Math.random() * 3) * 13;
      const cy = Math.max(floor, Math.min(TEXT_BOTTOM, y));
      const moved = cy !== y;
      let tx = Math.max(TEXT_LEFT, Math.min(TEXT_RIGHT, x + (moved ? (Math.random() * 2 - 1) * 14 : 0)));
      const clashes = (v) => texts.some((t) => t.floor === floor && Math.abs(t.x - v) < 30);
      if (clashes(tx)) {
        for (const d of [30, -30, 60, -60, 90, -90]) {
          const v = Math.max(TEXT_LEFT, Math.min(TEXT_RIGHT, tx + d));
          if (!clashes(v)) { tx = v; break; }
        }
      }
      texts.push({ x: tx, y: cy, floor, str, color, life: 0.7, big: !!big, key: key ?? null });
    },
    burst(x, y, color, n, speed, kind) {
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
        this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (kind === 'bubble' ? 40 : 0),
          life: 0.5 + Math.random() * 0.5, max: 1, r: 2 + Math.random() * 4, color, kind: kind || 'dot' });
      }
    },
    bubbles(x, y, n) { this.burst(x, y, '#bfe8e0', n, 50, 'bubble'); },
    // Spawn telegraph: an expanding ripple ring at the edge.
    ring(x, y) { this.add({ x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, r: 6, color: '#bfe8e0', kind: 'ring' }); },
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
        const t = texts[i]; t.life -= dt; t.y -= 60 * dt;
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
        } else if (p.kind === 'ring') {
          ctx.strokeStyle = p.color; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (1 - p.life / p.max) * 24, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      for (const t of texts) {
        ctx.globalAlpha = Math.min(1, t.life / 0.3);
        ctx.font = `bold ${t.big ? 22 : 14}px sans-serif`;
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
