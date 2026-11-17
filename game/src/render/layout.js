// Layouts shared by game and click handling: FIXED and CENTRED.
import { DIFF_ORDER, VIEW_W } from '../config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// Stage-clear menu: 5 × 200×240 cards, 16px gaps, y 240–480
// REROLL 240×52 + 24 + NEXT 280×52, y 520–572.
export const MENU_CARD_W = 200, MENU_CARD_H = 240, MENU_CARD_GAP = 16, MENU_CARDS_Y = 240;
export function stageMenuLayout(state) {
  const hand = state.hand || [];
  const n = hand.length;
  const rowW = n * MENU_CARD_W + Math.max(0, n - 1) * MENU_CARD_GAP;
  const x0 = (VIEW_W - rowW) / 2;
  const cards = hand.map((c, i) => ({ x: x0 + i * (MENU_CARD_W + MENU_CARD_GAP), y: MENU_CARDS_Y, w: MENU_CARD_W, h: MENU_CARD_H }));
  return {
    cards,
    reroll: { x: 368, y: 520, w: 240, h: 52 },
    next: { x: 632, y: 520, w: 280, h: 52 },
  };
}

// Title: vertical menu stack, centred — gold START then
// four dark buttons, all 340 wide, 16px gaps. y 272–594.
export const MENU_BTN_W = 340, MENU_BTN_H = 48, MENU_BTN_GAP = 16;
export const MENU_ITEMS = ['start', 'help', 'feats', 'history', 'settings'];
export function titleLayout() {
  const x = VIEW_W / 2 - MENU_BTN_W / 2;
  return {
    start: { x, y: 272, w: MENU_BTN_W, h: 66 },
    help: { x, y: 354, w: MENU_BTN_W, h: MENU_BTN_H },
    feats: { x, y: 418, w: MENU_BTN_W, h: MENU_BTN_H },
    history: { x, y: 482, w: MENU_BTN_W, h: MENU_BTN_H },
    settings: { x, y: 546, w: MENU_BTN_W, h: MENU_BTN_H },
  };
}

// End screen layout.
export function overLayout() {
  return {
    playAgain: { x: VIEW_W / 2 - 150, y: 440, w: 300, h: 56 },
    menu: { x: VIEW_W / 2 - 100, y: 516, w: 200, h: 44 },
  };
}
export const DIFF_CARD_W = 260, DIFF_CARD_H = 110, DIFF_CARD_GAP = 24, DIFF_CARD_Y = 300;
export function difficultyLayout() {
  const total = DIFF_ORDER.length * DIFF_CARD_W + (DIFF_ORDER.length - 1) * DIFF_CARD_GAP;
  const x0 = (VIEW_W - total) / 2;
  return {
    diffs: DIFF_ORDER.map((id, i) => ({ id, x: x0 + i * (DIFF_CARD_W + DIFF_CARD_GAP), y: DIFF_CARD_Y, w: DIFF_CARD_W, h: DIFF_CARD_H })),
    back: { x: VIEW_W / 2 - 80, y: 470, w: 160, h: 44 },
  };
}
