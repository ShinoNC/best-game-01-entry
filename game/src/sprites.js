const SPRITE_NAMES = ['crab', 'guppy', 'jelly', 'eel', 'squid', 'archerfish',
  'starfish', 'urchin', 'turtle', 'octopus', 'hammerhead', 'angler', 'stingray',
  'kraken', 'kraken2', 'octopus2', 'coral', 'water-tile', 'sand-tile'];
const TYPE_IMG = { archer: 'archerfish', mini: 'starfish' };
const SPR = {};
let readyPromise = null;
export function imgFor(type) {
  const img = SPR[TYPE_IMG[type] || type];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}
export function loadSprites() {
  if (readyPromise) return readyPromise;
  if (typeof Image === 'undefined') { readyPromise = Promise.resolve(); return readyPromise; }
  const jobs = SPRITE_NAMES.map((n) => new Promise((res) => {
    const img = new Image();
    img.onload = res; img.onerror = res;
    img.src = `assets/${n}.png`;
    SPR[n] = img;
  }));
  readyPromise = Promise.all(jobs).then(() => undefined);
  return readyPromise;
}
loadSprites();
