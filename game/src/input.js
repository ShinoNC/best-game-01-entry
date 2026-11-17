// Keyboard + mouse, read once per frame. WASD move, Space dash, 1-5 buy, R reroll, P/Esc pause, M mute, H help.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered keys, consumed each frame
  let mouseX = 640, mouseY = 360, mouseClicked = false;
  const down = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (!e.repeat) pressed.add(e.key.toLowerCase());
    keys.add(e.key.toLowerCase());
  };
  const up = (e) => keys.delete(e.key.toLowerCase());
  const clearAll = () => { keys.clear(); pressed.clear(); };
  addEventListener('keydown', down);
  addEventListener('keyup', up);
  // Losing focus (alt-tab, a notification) clears BOTH sets: a movement key
  // held across the blur must not stick, and a key pressed while blurred must
  // not fire a menu action when focus returns.
  addEventListener('blur', clearAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearAll(); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    mouseClicked = true;
  });
  return {
    // Held movement vector, normalised.
    move() {
      let x = 0, y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    dashHeld() { return keys.has(' ') || keys.has('shift'); },
    // Edge-triggered: true once per physical press.
    wasPressed(...names) { return names.some((n) => pressed.has(n)); },
    confirmPressed() { return this.wasPressed('enter', ' '); },
    pausePressed() { return this.wasPressed('p', 'escape'); },
    mutePressed() { return this.wasPressed('m'); },
    helpPressed() { return this.wasPressed('h'); },
    restartPressed() { return this.wasPressed('r'); },
    rerollPressed() { return this.wasPressed('r'); },
    numberPressed() {
      for (const n of ['1', '2', '3', '4', '5']) if (pressed.has(n)) return Number(n);
      return 0;
    },
    mouse() { return { x: mouseX, y: mouseY }; },
    click() { const c = mouseClicked; mouseClicked = false; return c; },
    // A click is an edge event like a keypress: visible to exactly one frame's
    // menu handling, then discarded — otherwise a click made during play would
    // linger and instantly unpause the game (or buy a card) much later.
    endFrame() { pressed.clear(); mouseClicked = false; },
  };
}
