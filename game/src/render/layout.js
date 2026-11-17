import { DIFF_ORDER, VIEW_W } from '../config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const MENU_CARD_W = 200, MENU_CARD_H = 240, MENU_CARD_GAP = 16, MENU_CARDS_Y = 240;
export const SKILL_SLOT_W = 96, SKILL_SLOT_H = 64, SKILL_SLOT_GAP = 12, SKILL_SLOTS_Y = 632;
export const SKILL_SLOT_IDS = ['claws', 'tempo', 'reach', 'legs', 'bubbles', 'magnet'];
export function stageMenuLayout(state) {
  const hand = state.hand || [];
  const n = hand.length;
  const rowW = n * MENU_CARD_W + Math.max(0, n - 1) * MENU_CARD_GAP;
  const x0 = (VIEW_W - rowW) / 2;
  const cards = hand.map((c, i) => ({ x: x0 + i * (MENU_CARD_W + MENU_CARD_GAP), y: MENU_CARDS_Y, w: MENU_CARD_W, h: MENU_CARD_H }));
  const sRowW = SKILL_SLOT_IDS.length * SKILL_SLOT_W + (SKILL_SLOT_IDS.length - 1) * SKILL_SLOT_GAP;
  const sx0 = (VIEW_W - sRowW) / 2;
  const skills = SKILL_SLOT_IDS.map((id, i) => ({ id, x: sx0 + i * (SKILL_SLOT_W + SKILL_SLOT_GAP), y: SKILL_SLOTS_Y, w: SKILL_SLOT_W, h: SKILL_SLOT_H }));
  return {
    cards,
    skills,
    reroll: { x: 368, y: 520, w: 240, h: 52 },
    next: { x: 632, y: 520, w: 280, h: 52 },
  };
}

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
