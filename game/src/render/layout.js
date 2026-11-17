// Screen layouts the game and the click handling share: the stage-clear
// menu's card/button boxes and the title screen's difficulty buttons.
// FIXED and CENTRED, so the drawn boxes and the hit-boxes can never drift
// apart — main.js hit-tests with these same functions.
import { DIFF_ORDER, VIEW_W } from '../config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// Stage-clear menu: 5 × 200×240 cards, 16px gaps, y 140–380; buttons
// REROLL 240×52 + 24 + NEXT 280×52, y 404–456. The card row centres on the
// hand size; the buttons centre as a pair.
export const MENU_CARD_W = 200, MENU_CARD_H = 240, MENU_CARD_GAP = 16, MENU_CARDS_Y = 140;
export function stageMenuLayout(state) {
  const hand = state.hand || [];
  const n = hand.length;
  const rowW = n * MENU_CARD_W + Math.max(0, n - 1) * MENU_CARD_GAP;
  const x0 = (VIEW_W - rowW) / 2;
  const cards = hand.map((c, i) => ({ x: x0 + i * (MENU_CARD_W + MENU_CARD_GAP), y: MENU_CARDS_Y, w: MENU_CARD_W, h: MENU_CARD_H }));
  return {
    cards,
    reroll: { x: 368, y: 404, w: 240, h: 52 },
    next: { x: 632, y: 404, w: 280, h: 52 },
  };
}

// Title screen difficulty buttons: 3 × 220×64, 16px gaps, y 196–260, centred.
export const DIFF_BTN_W = 220, DIFF_BTN_H = 64, DIFF_BTN_Y = 196;
export function titleLayout() {
  const total = DIFF_ORDER.length * DIFF_BTN_W + (DIFF_ORDER.length - 1) * 16;
  const x0 = (VIEW_W - total) / 2;
  return {
    diffs: DIFF_ORDER.map((id, i) => ({ id, x: x0 + i * (DIFF_BTN_W + 16), y: DIFF_BTN_Y, w: DIFF_BTN_W, h: DIFF_BTN_H })),
  };
}
