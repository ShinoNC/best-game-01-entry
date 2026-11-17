import { POOL } from '../config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const MENU_CARD_W = 200, MENU_CARD_H = 240, MENU_CARD_GAP = 16, MENU_CARDS_Y = 200;
export function stageMenuLayout(state) {
  const hand = state.hand || [];
  const n = hand.length;
  const rowW = n * MENU_CARD_W + Math.max(0, n - 1) * MENU_CARD_GAP;
  const x0 = (POOL.x1 - rowW) / 2;
  const cards = hand.map((c, i) => ({ x: x0 + i * (MENU_CARD_W + MENU_CARD_GAP), y: MENU_CARDS_Y, w: MENU_CARD_W, h: MENU_CARD_H }));
  return {
    cards,
    reroll: { x: 368, y: 485, w: 240, h: 52 },
    next: { x: 624, y: 485, w: 336, h: 52 },
  };
}

export const MENU_BTN_W = 340, MENU_BTN_H = 48, MENU_BTN_GAP = 16;
export const MENU_ITEMS = ['play', 'help', 'feats', 'settings'];
export function titleLayout() {
  const x = POOL.cx - MENU_BTN_W / 2;
  return {
    play: { x, y: 248, w: MENU_BTN_W, h: 66 },
    help: { x, y: 330, w: MENU_BTN_W, h: MENU_BTN_H },
    feats: { x, y: 394, w: MENU_BTN_W, h: MENU_BTN_H },
    settings: { x, y: 458, w: MENU_BTN_W, h: MENU_BTN_H },
  };
}

export function overLayout() {
  return {
    cont: { x: POOL.cx - 150, y: 440, w: 300, h: 56 },
    menu: { x: POOL.cx - 150, y: 516, w: 300, h: 56 },
  };
}

// HUD potion box (bottom strip): click or E to drink. Shared with main.js.
export const POTION_BOX = { x: 800, y: 656, w: 56, h: 56 };

// Slot screen: 3 vertical cards in the overlay panel.
export const SLOT_PANEL = { x: 140, y: 60, w: 1000, h: 580 };
export const SLOT_CLOSE = { x: 560, y: 576, w: 160, h: 44 };
export function slotsLayout() {
  const cards = [0, 1, 2].map((i) => ({ x: 220 + i * 290, y: 150, w: 260, h: 390 }));
  const dels = cards.map((c) => ({ x: c.x + c.w - 48, y: c.y + 12, w: 36, h: 36 }));
  return { panel: SLOT_PANEL, close: SLOT_CLOSE, cards, dels };
}

export const LV_CARD_W = 260, LV_CARD_H = 200, LV_CARD_GAP = 24, LV_CARD_Y = 280;
export function levelupLayout() {
  const total = 3 * LV_CARD_W + 2 * LV_CARD_GAP;
  const x0 = (POOL.x1 - total) / 2;
  return {
    cards: [0, 1, 2].map((i) => ({ x: x0 + i * (LV_CARD_W + LV_CARD_GAP), y: LV_CARD_Y, w: LV_CARD_W, h: LV_CARD_H })),
  };
}
