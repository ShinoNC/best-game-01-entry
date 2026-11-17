import { VIEW_W } from '../config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const MENU_CARD_W = 200, MENU_CARD_H = 240, MENU_CARD_GAP = 16, MENU_CARDS_Y = 200;
export function stageMenuLayout(state) {
  const hand = state.hand || [];
  const n = hand.length;
  const rowW = n * MENU_CARD_W + Math.max(0, n - 1) * MENU_CARD_GAP;
  const x0 = (VIEW_W - rowW) / 2;
  const cards = hand.map((c, i) => ({ x: x0 + i * (MENU_CARD_W + MENU_CARD_GAP), y: MENU_CARDS_Y, w: MENU_CARD_W, h: MENU_CARD_H }));
  return {
    cards,
    reroll: { x: 368, y: 485, w: 240, h: 52 },
    next: { x: 632, y: 485, w: 280, h: 52 },
  };
}

export const MENU_BTN_W = 340, MENU_BTN_H = 48, MENU_BTN_GAP = 16;
export const MENU_ITEMS = ['start', 'help', 'feats', 'history', 'settings'];
export function titleLayout() {
  const x = VIEW_W / 2 - MENU_BTN_W / 2;
  return {
    start: { x, y: 248, w: MENU_BTN_W, h: 66 },
    help: { x, y: 330, w: MENU_BTN_W, h: MENU_BTN_H },
    feats: { x, y: 394, w: MENU_BTN_W, h: MENU_BTN_H },
    history: { x, y: 458, w: MENU_BTN_W, h: MENU_BTN_H },
    settings: { x, y: 522, w: MENU_BTN_W, h: MENU_BTN_H },
  };
}

export function overLayout() {
  return {
    playAgain: { x: VIEW_W / 2 - 150, y: 440, w: 300, h: 56 },
    menu: { x: VIEW_W / 2 - 100, y: 516, w: 200, h: 44 },
  };
}

export const LV_CARD_W = 260, LV_CARD_H = 200, LV_CARD_GAP = 24, LV_CARD_Y = 280;
export function levelupLayout() {
  const total = 3 * LV_CARD_W + 2 * LV_CARD_GAP;
  const x0 = (VIEW_W - total) / 2;
  return {
    cards: [0, 1, 2].map((i) => ({ x: x0 + i * (LV_CARD_W + LV_CARD_GAP), y: LV_CARD_Y, w: LV_CARD_W, h: LV_CARD_H })),
  };
}
