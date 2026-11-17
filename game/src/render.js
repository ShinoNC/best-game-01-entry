import { PAL, POOL, VIEW_H, VIEW_W } from './config.js';
import { weaponStatsFor } from './weapons.js';
import { drawCrab, drawEnemy } from './render/creatures.js';
import { drawPool } from './render/pool.js';
import { drawHud, drawPaused } from './render/hud.js';
import { drawTitle } from './render/title.js';
import { drawAchievements, drawHelp, drawSettings, drawSlots } from './render/overlays.js';
import { drawStageMenu } from './render/menu.js';
import { drawLevelUp } from './render/levelup.js';
import { drawOver } from './render/over.js';
import { heart } from './render/icons.js';
import {txt, px, vt} from './render/polish.js';

export { MENU_ITEMS, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, levelupLayout, overLayout, stageMenuLayout, titleLayout } from './render/layout.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let cssW = 0, cssH = 0, dpr = 1;
  function resize() {
    cssW = window.innerWidth; cssH = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', resize);
  resize();

  function viewTransform() {
    const scale = Math.min((cssW - 8) / VIEW_W, (cssH - 8) / VIEW_H);
    return { scale, ox: (cssW - VIEW_W * scale) / 2, oy: (cssH - VIEW_H * scale) / 2, cssW, cssH, dpr };
  }

  return {
    viewTransform,
    render(state, fx, t, alpha = 1, hover = null) {
      if (window.innerWidth !== cssW || window.innerHeight !== cssH) resize();
      const { scale, ox, oy } = viewTransform();
      const s = scale * dpr;
      const oxd = ox * dpr, oyd = oy * dpr;
      // Re-assert every frame: resizing the canvas resets ALL context state,
      // including imageSmoothingEnabled (sprites would silently go blurry).
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAL.deep; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const a = Math.max(0, Math.min(1, alpha));
      const lerp = (prev, cur) => prev + (cur - prev) * a;
      ctx.setTransform(s, 0, 0, s, oxd + fx.shakeX * s, oyd + fx.shakeY * s);

      const rt = state.shotMode ? t : performance.now() / 1000;
      drawPool(ctx, state, rt);
      const bb = state.boss;
      if (bb && bb.atkState === 'tele' && bb.atk === 'line') {
        let L = 900;
        if (bb.atkDx > 0) L = Math.min(L, (POOL.x1 - bb.x) / bb.atkDx);
        if (bb.atkDx < 0) L = Math.min(L, (POOL.x0 - bb.x) / bb.atkDx);
        if (bb.atkDy > 0) L = Math.min(L, (POOL.y1 - bb.y) / bb.atkDy);
        if (bb.atkDy < 0) L = Math.min(L, (POOL.y0 - bb.y) / bb.atkDy);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,93,115,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(bb.x, bb.y);
        ctx.lineTo(bb.x + bb.atkDx * L, bb.y + bb.atkDy * L); ctx.stroke();
        ctx.restore();
      }
      if (bb && bb.atkState === 'tele' && bb.atk === 'slam' && bb.slamSpots) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 12);
        for (const s of bb.slamSpots) {
          ctx.save();
          ctx.fillStyle = `rgba(255,93,115,${0.15 + 0.1 * pulse})`;
          ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
          ctx.strokeStyle = `rgba(255,93,115,${0.6 + 0.3 * pulse})`; ctx.lineWidth = 3;
          ctx.strokeRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
          ctx.restore();
        }
      }
      for (const e of state.enemies) {
        if ((e.type === 'squid' || e.boss) && e.state === 'circle' && e.diveT < 0.6) {
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
          const tr = 44 + pulse * 6;
          ctx.strokeRect(jx - tr, jy - tr, tr * 2, tr * 2);
          ctx.font = px(15); ctx.textAlign = 'center';
          txt(ctx, '!', ix, iy - e.r - 10, '#ff5d73');
          ctx.restore();
        }
      }
      for (const pe of state.drops) {
        const bobY = Math.sin(pe.bob) * 3;
        ctx.fillStyle = '#c9962e';
        ctx.fillRect(pe.x - 7, pe.y + bobY - 7, 14, 14);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(pe.x - 5, pe.y + bobY - 5, 10, 10);
        ctx.fillStyle = '#c9962e';
        ctx.fillRect(pe.x - 2, pe.y + bobY - 2, 4, 4);
      }
      for (const pk of state.pickups) {
        if (pk.kind === 'heal') heart(ctx, pk.x, pk.y + Math.sin(t * 3) * 2, 13, PAL.hp);
        else if (pk.kind === 'bomb') {
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(pk.x - 13, pk.y - 13, 26, 26);
          // Pixel starburst: 4 dark arms from the centre.
          ctx.fillStyle = '#062a33';
          ctx.fillRect(pk.x - 2, pk.y - 9, 4, 18); ctx.fillRect(pk.x - 9, pk.y - 2, 18, 4);
          ctx.fillRect(pk.x - 7, pk.y - 7, 4, 4); ctx.fillRect(pk.x + 3, pk.y - 7, 4, 4);
          ctx.fillRect(pk.x - 7, pk.y + 3, 4, 4); ctx.fillRect(pk.x + 3, pk.y + 3, 4, 4);
        } else {
          // Magnet pickup: concentric pixel squares, teal.
          ctx.fillStyle = '#7fe0c3';
          ctx.fillRect(pk.x - 12, pk.y - 12, 24, 4); ctx.fillRect(pk.x - 12, pk.y + 8, 24, 4);
          ctx.fillRect(pk.x - 12, pk.y - 8, 4, 16); ctx.fillRect(pk.x + 8, pk.y - 8, 4, 16);
          ctx.fillRect(pk.x - 4, pk.y - 4, 8, 8);
        }
      }
      for (const b of state.bolts) {
        if (b.kind === 'arrow') {
          const ba = Math.atan2(b.vy, b.vx);
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ba);
          ctx.fillStyle = '#1a2230';
          ctx.fillRect(-18, -4, 28, 8);
          ctx.fillStyle = 'rgba(191,232,224,0.9)';
          ctx.fillRect(-16, -3, 24, 6);
          ctx.fillStyle = '#e8fffa';
          ctx.fillRect(4, -5, 10, 10);
          ctx.restore();
        } else if (b.kind === 'pellet') {
          const s = Math.max(6, b.r * 2);
          ctx.fillStyle = '#1a2230';
          ctx.fillRect(b.x - s / 2 - 2, b.y - s / 2 - 2, s + 4, s + 4);
          ctx.fillStyle = '#7b5cff';
          ctx.fillRect(b.x - s / 2, b.y - s / 2, s, s);
          ctx.fillStyle = '#c4b5fd';
          ctx.fillRect(b.x - s / 2, b.y - s / 2, 3, 3);
        } else if (b.kind === 'homing') {
          const ba = Math.atan2(b.vy, b.vx);
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ba);
          ctx.fillStyle = 'rgba(216,207,232,0.6)';
          ctx.fillRect(-18, -1, 10, 2);
          ctx.restore();
          const s = Math.max(6, b.r * 2);
          ctx.fillStyle = '#1a2230';
          ctx.fillRect(b.x - s / 2 - 2, b.y - s / 2 - 2, s + 4, s + 4);
          ctx.fillStyle = '#d8cfe8';
          ctx.fillRect(b.x - s / 2, b.y - s / 2, s, s);
          const oa = t * 6;
          ctx.fillStyle = '#a894c4';
          ctx.fillRect(b.x + Math.cos(oa) * b.r * 0.55 - 2, b.y + Math.sin(oa) * b.r * 0.55 - 2, 4, 4);
          ctx.fillStyle = '#fff';
          ctx.fillRect(b.x - s / 2, b.y - s / 2, 3, 3);
        } else if (b.kind === 'harpoon') {
          const ba = Math.atan2(b.vy, b.vx);
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ba);
          ctx.fillStyle = '#1a2230';
          ctx.fillRect(-16, -4, 34, 8);
          ctx.fillStyle = '#c8d8e0';
          ctx.fillRect(-14, -3, 20, 6);
          ctx.fillStyle = '#e8f4ff';
          ctx.fillRect(6, -6, 10, 12);
          ctx.fillRect(16, -3, 4, 6);
          ctx.restore();
        }
      }
      for (const s of state.spits) {
        const sz = Math.max(6, s.r * 2);
        ctx.fillStyle = '#1a2230';
        ctx.fillRect(s.x - sz / 2 - 2, s.y - sz / 2 - 2, sz + 4, sz + 4);
        ctx.fillStyle = s.color || '#a8e6ff';
        ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz);
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x - sz / 2, s.y - sz / 2, 3, 3);
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
      if (state.player.flash > 0 && state.phase === 'play') {
        const a = state.player.flash * 0.7;
        ctx.fillStyle = `rgba(255,45,85,${a})`;
        ctx.fillRect(0, 0, VIEW_W, 18);
        ctx.fillRect(0, VIEW_H - 18, VIEW_W, 18);
        ctx.fillRect(0, 0, 18, VIEW_H);
        ctx.fillRect(VIEW_W - 18, 0, 18, VIEW_H);
      }
      ctx.setTransform(s, 0, 0, s, oxd, oyd);
      if (state.phase === 'play' || state.phase === 'paused' || state.phase === 'levelup') drawHud(ctx, state, t);
      if (state.phase === 'title') drawTitle(ctx, state);
      if (state.phase === 'stageclear') drawStageMenu(ctx, state, hover);
      if (state.phase === 'levelup') drawLevelUp(ctx, state, hover);
      if (state.phase === 'paused') drawPaused(ctx);
      if (state.phase === 'over') drawOver(ctx, state);
      if (state.overlay === 'help') drawHelp(ctx, state);
      else if (state.overlay === 'feats') drawAchievements(ctx, state);
      else if (state.overlay === 'settings') drawSettings(ctx, state);
      else if (state.overlay === 'slots') drawSlots(ctx, state);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
