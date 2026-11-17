// The renderer: canvas, letterbox transform, draw layers. Drawing lives in render/.
import { PAL, VIEW_H, VIEW_W } from './config.js';
import { weaponStatsFor } from './weapons.js';
import { drawCrab, drawEnemy } from './render/creatures.js';
import { drawPool } from './render/pool.js';
import { drawHud, drawPaused } from './render/hud.js';
import { drawTitle } from './render/title.js';
import { drawAchievements, drawHelp, drawHistory, drawSettings } from './render/overlays.js';
import { drawStageMenu } from './render/menu.js';
import { drawOver } from './render/over.js';
import { heart } from './render/icons.js';

export { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, stageMenuLayout, titleLayout } from './render/layout.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // DPR-aware sizing (capped 2x): crisp on HiDPI, 4px safety inset, letterboxes never crops.
  let cssW = 0, cssH = 0, dpr = 1;
  function resize() {
    cssW = window.innerWidth; cssH = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', resize);
  resize();

  // The letterbox transform in CSS pixels — shared with main.js for mouse mapping.
  function viewTransform() {
    const scale = Math.min((cssW - 8) / VIEW_W, (cssH - 8) / VIEW_H);
    return { scale, ox: (cssW - VIEW_W * scale) / 2, oy: (cssH - VIEW_H * scale) / 2, cssW, cssH, dpr };
  }

  return {
    viewTransform,
    render(state, fx, t, alpha = 1, hover = null) {
      // Re-measure if the window changed since the last resize event.
      if (window.innerWidth !== cssW || window.innerHeight !== cssH) resize();
      const { scale, ox, oy } = viewTransform();
      const s = scale * dpr; // device-pixel scale for the transform
      const oxd = ox * dpr, oyd = oy * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAL.deep; ctx.fillRect(0, 0, canvas.width, canvas.height);
      // L0–L20: the world, with screen shake; positions interpolate between sim steps.
      const a = Math.max(0, Math.min(1, alpha));
      const lerp = (prev, cur) => prev + (cur - prev) * a;
      ctx.setTransform(s, 0, 0, s, oxd + fx.shakeX * s, oyd + fx.shakeY * s);
      drawPool(ctx, state, t);
      // Dive telegraph: a swooper about to dive shows a dashed line to the crab, a ring on the crab, "!" over the bird.
      for (const e of state.enemies) {
        if ((e.type === 'gull' || e.type.endsWith('heron')) && e.state === 'circle' && e.diveT < 0.6) {
          const ix = lerp(e.px ?? e.x, e.x), iy = lerp(e.py ?? e.y, e.y);
          const jx = lerp(state.player.px ?? state.player.x, state.player.x);
          const jy = lerp(state.player.py ?? state.player.y, state.player.y);
          const pulse = 0.5 + 0.5 * Math.sin(t * 10);
          ctx.save();
          ctx.strokeStyle = `rgba(255,93,115,${0.25 + 0.2 * pulse})`;
          ctx.lineWidth = 1.5; ctx.setLineDash([8, 8]);
          ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(jx, jy); ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = `rgba(255,93,115,${0.45 + 0.3 * pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(jx, jy, 44 + pulse * 6, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ff5d73'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('!', ix, iy - e.r - 10);
          ctx.restore();
        }
      }
      // Ink pools under everything that swims.
      for (const ink of state.inks) {
        ctx.fillStyle = `rgba(123,92,255,${Math.min(0.55, ink.life / 2)})`;
        ctx.beginPath(); ctx.arc(ink.x, ink.y, ink.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const pe of state.drops) { // coins bob and glint — the menu money
        const bobY = Math.sin(pe.bob) * 3;
        ctx.fillStyle = PAL.gold;
        ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c9962e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#c9962e';
        ctx.beginPath(); ctx.arc(pe.x, pe.y + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      for (const pk of state.pickups) {
        if (pk.kind === 'heal') heart(ctx, pk.x, pk.y + Math.sin(t * 3) * 2, 13, PAL.hp);
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
          const ba = Math.atan2(b.vy, b.vx);
          ctx.strokeStyle = 'rgba(191,232,224,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(b.x - Math.cos(ba) * 16, b.y - Math.sin(ba) * 16);
          ctx.lineTo(b.x + Math.cos(ba) * 8, b.y + Math.sin(ba) * 8); ctx.stroke();
          ctx.fillStyle = '#e8fffa'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
        } else if (b.kind === 'pellet') { // blaster pellet: a violet ink blob
          ctx.fillStyle = '#7b5cff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x - 1.5, b.y - 1.5, 2, 0, Math.PI * 2); ctx.fill();
        } else if (b.kind === 'homing') { // homing shell: a lavender spiral shell, spinning
          const ba = Math.atan2(b.vy, b.vx);
          ctx.strokeStyle = 'rgba(216,207,232,0.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(b.x - Math.cos(ba) * 18, b.y - Math.sin(ba) * 18);
          ctx.lineTo(b.x - Math.cos(ba) * 8, b.y - Math.sin(ba) * 8); ctx.stroke();
          ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#a894c4'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.55, t * 6, t * 6 + Math.PI * 1.5); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const s of state.spits) { // enemy spit: a bright droplet, easy to see and dodge
        ctx.fillStyle = '#a8e6ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x - 2, s.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      }
      for (const e of state.enemies) {
        const ix = lerp(e.px ?? e.x, e.x), iy = lerp(e.py ?? e.y, e.y);
        drawEnemy(ctx, { ...e, x: ix, y: iy }, t, Math.atan2(state.player.y - iy, state.player.x - ix));
      }
      if (state.phase !== 'title') {
        const p = state.player;
        drawCrab(ctx, { ...p, x: lerp(p.px ?? p.x, p.x), y: lerp(p.py ?? p.y, p.y) }, t,
          weaponStatsFor(state, 'claw'),
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
      // L30–L70: the HUD and the screens, on the CLEAN transform — no shake,
      // so nothing the player reads ever jumps.
      ctx.setTransform(s, 0, 0, s, oxd, oyd);
      if (state.phase === 'play' || state.phase === 'paused') drawHud(ctx, state, t);
      if (state.phase === 'title') drawTitle(ctx, state);
      if (state.phase === 'stageclear') drawStageMenu(ctx, state, hover); // no HUD here — its own title owns the top
      if (state.phase === 'paused') drawPaused(ctx);
      if (state.phase === 'over') drawOver(ctx, state);
      if (state.overlay === 'help') drawHelp(ctx, state);
      else if (state.overlay === 'feats') drawAchievements(ctx, state);
      else if (state.overlay === 'history') drawHistory(ctx, state);
      else if (state.overlay === 'settings') drawSettings(ctx, state);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
