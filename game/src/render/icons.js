import { px } from './polish.js';

// Pixel heart (7x6 bitmap).
const HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
export function heart(ctx, x, y, r, c) {
  const cell = (r * 2) / 7;
  ctx.fillStyle = c;
  for (let row = 0; row < HEART_ROWS.length; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      if (HEART_ROWS[row][col] === 'X') {
        ctx.fillRect(x - r + col * cell, y - r + row * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x - r + cell, y - r + cell, cell, cell);
}

// Bitmap icons: 12x12 grid. 'k' = outline, 'w' = white, 'a'/'b'/'c' = palette.
function bitmap(ctx, rows, pal, x, y, s) {
  const n = rows.length;
  const cell = s / n;
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = ch === 'k' ? '#1a2230' : ch === 'w' ? '#ffffff' : pal[ch];
      ctx.fillRect(x + c * cell, y + r * cell, cell + 0.5, cell + 0.5);
    }
  }
}

const WEAPONS = {
  claw: { p: { a: '#ff7a3c', b: '#ffb35c', c: '#d94f1e' }, rows: [
    '..kk....kk..',
    '.kaak..kaak.',
    '.kabk..kabk.',
    '.kabk..kabk.',
    '..kak..kak..',
    '..kaakkaak..',
    '...kaakka...',
    '....kkkk....',
    '...kabkak...',
    '...kaakak...',
    '....kaak....',
    '.....kk.....',
  ] },
  bow: { p: { a: '#c98a3a', b: '#ffd166', c: '#8a5a20' }, rows: [
    '.kk.........',
    '.kaak.......',
    '..kabk..k...',
    '...kabk.k...',
    '...kabk.k...',
    '...kabkwwwwk',
    '...kabkwwwwk',
    '...kabk.k...',
    '...kabk.k...',
    '..kabk..k...',
    '.kaak.......',
    '.kk.........',
  ] },
  blaster: { p: { a: '#7b5cff', b: '#a78bff', c: '#3a2d5e' }, rows: [
    '............',
    '..kkkkk.....',
    '.kaabbbk....',
    '.kaabbbbk...',
    '.kabbbbbkkkk',
    '.kabbbbbkkkk',
    '.kaabbbbk...',
    '..kkkkk.....',
    '....kkk.....',
    '....kck.....',
    '....kck.....',
    '....kkk.....',
  ] },
  shell: { p: { a: '#d8cfe8', b: '#f2ecff', c: '#a894c4' }, rows: [
    '....kkkk....',
    '..kkaaaakk..',
    '..kabbbbak..',
    '..kbkbbkbk..',
    '..kbkbkbak..',
    '..kbkbbkbk..',
    '..kabbbbak..',
    '..kkaaaakk..',
    '....kkkk....',
    '............',
    '............',
    '............',
  ] },
  spin: { p: { a: '#7fe0c3', b: '#c8f5e6', c: '#2f8f6b' }, rows: [
    '.....kk.....',
    '....kaak....',
    '....kaak....',
    '....kaakkkk.',
    '....kaakaaak',
    '.kkkkaabbaak',
    '.kaakaabbaak',
    '.kaaakkaak..',
    '.kkkkaak....',
    '....kaak....',
    '....kaak....',
    '.....kk.....',
  ] },
  laser: { p: { a: '#ff2e88', b: '#ff8fb0', c: '#a3134f' }, rows: [
    '............',
    '.kkkk.......',
    '.kaak.......',
    '.kabk.kkkkkk',
    '.kabk.kwwkwk',
    '.kabk.kwwkwk',
    '.kaak.kkkkkk',
    '.kkkk.......',
    '............',
    '............',
    '............',
    '............',
  ] },
  trident: { p: { a: '#c8d8e0', b: '#e8f4ff', c: '#7a93a3' }, rows: [
    '.k...k...k..',
    '.kk..k..kk..',
    '.kk..k..kk..',
    '.kk.kkk.kk..',
    '.kkkaakkaak.',
    '..k.kaak.k..',
    '....kaak....',
    '....kbbk....',
    '....kaak....',
    '....kaak....',
    '....kaak....',
    '.....kk.....',
  ] },
};

const SKILLS = {
  claws: { p: { a: '#dfe8f0', b: '#ffffff', c: '#ffd166' }, rows: [
    '.k........k.',
    '.kk......kk.',
    '.akk....akk.',
    '..akk..akk..',
    '...akkakk...',
    '....kbbk....',
    '...akkakk...',
    '..akk..akk..',
    '.akk....akk.',
    '.ckk....ckk.',
    '.c........c.',
    '............',
  ] },
  tempo: { p: { a: '#ffd166', b: '#fff3c4', c: '#e8a020' }, rows: [
    '.....kkkk...',
    '....kbbak...',
    '....kbbk....',
    '...kbbk.....',
    '..kkkkkkk...',
    '....kbbk....',
    '...kbbk.....',
    '...kbbk.....',
    '..kbbk......',
    '..kkkk......',
    '............',
    '............',
  ] },
  reach: { p: { a: '#ffd166', b: '#fff3c4', c: '#e8a020' }, rows: [
    '............',
    '..k......k..',
    '.akk....akk.',
    'aabba..aabba',
    '.akkkaakkka.',
    '..kkkkkkkk..',
    '.akkkaakkka.',
    'aabba..aabba',
    '.akk....akk.',
    '..k......k..',
    '............',
    '............',
  ] },
  shell: { p: { a: '#7fe0c3', b: '#c8f5e6', c: '#2f8f6b' }, rows: [
    '..kkkkkkkk..',
    '.kbbbbbbbk..',
    '.kbaaaaabk..',
    '.kbaaaaabk..',
    '.kbaaaaabk..',
    '.kbaaaaabk..',
    '..kbaaaabk..',
    '..kbaaaabk..',
    '...kbaaak...',
    '....kbbk....',
    '.....kk.....',
    '............',
  ] },
  legs: { p: { a: '#bfe8e0', b: '#e8fffa', c: '#5aa897' }, rows: [
    '.kk.........',
    '.kbbk.......',
    '.kbbk.......',
    '.kbbk.......',
    '.kbbk.......',
    '.kbbk.......',
    '.kbbk.......',
    '.kbbk.......',
    '.kbbbbbbk...',
    '.kbbbbbbbbk.',
    '.kccccccccc.',
    '.kkkkkkkkkk.',
  ] },
  bubbles: { p: { a: '#ffd166', b: '#fff3c4', c: '#c9962e' }, rows: [
    '....kkkk....',
    '...kaaaak...',
    '...kabbbk...',
    '...kaaaak...',
    '....kkkk....',
    '..kkkkkk....',
    '..kabbbbk...',
    '..kaaaabk...',
    '..kkkkkk....',
    '.kkkkkkkk...',
    '.kabbbbbbk..',
    '.kkkkkkkk...',
  ] },
  magnet: { p: { a: '#ffffff', b: '#ff5d73', c: '#c22e44' }, rows: [
    '..kk....kk..',
    '.kaaak.kaaak',
    '.kbbak.kbbak',
    '.kbbak.kbbak',
    '.kbbak.kbbak',
    '.kbbak.kbbak',
    '.kbbak.kbbak',
    '..kbbk.kbbk.',
    '..kbbbbbbk..',
    '...kkkkkk...',
    '............',
    '............',
  ] },
  gold: { p: { a: '#ffd166', b: '#fff3c4', c: '#c9962e' }, rows: [
    '....kkkk....',
    '...kaaaak...',
    '..kabbbbak..',
    '..kabccak..',
    '..kacccck..',
    '..kabccak..',
    '..kabbbbak..',
    '...kaaaak...',
    '....kkkk....',
    '............',
    '............',
    '............',
  ] },
};

export function drawWeaponIcon(ctx, id, x, y, s, owned) {
  const d = WEAPONS[id];
  if (!d) return;
  ctx.save();
  if (!owned) ctx.globalAlpha = 0.35;
  bitmap(ctx, d.rows, d.p, x - s / 2, y - s / 2, s);
  ctx.restore();
}

export function drawSkillIcon(ctx, id, x, y, s, owned) {
  if (id === 'heal') { heart(ctx, x, y, s * 0.36, '#ff5d73'); return; }
  const d = SKILLS[id];
  if (!d) return;
  ctx.save();
  if (!owned) ctx.globalAlpha = 0.4;
  bitmap(ctx, d.rows, d.p, x - s / 2, y - s / 2, s);
  ctx.restore();
}

// Round pixel coin (stepped circle + $).
const COIN_ROWS = [
  '....kkkk....',
  '..kkaaaakk..',
  '.kaabbbbaak.',
  '.kabbbbbbak.',
  '.kabbbwbbak.',
  '.kabbbbbbak.',
  '.kabbbbbbak.',
  '.kabbbwbbak.',
  '.kaabbbbaak.',
  '..kkaaaakk..',
  '....kkkk....',
  '............',
];
export function drawCoin(ctx, x, y, r) {
  ctx.save();
  bitmap(ctx, COIN_ROWS, { a: '#c9962e', b: '#ffd166' }, x - r, y - r, r * 2);
  ctx.fillStyle = '#7a5a17'; ctx.font = px(Math.max(8, Math.round(r * 0.72)));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', x, y + r * 0.08);
  ctx.restore();
}

// Health potion flask.
const POTION_ROWS = [
  '.....kk.....',
  '.....kk.....',
  '....kaak....',
  '....kaak....',
  '...kbbbbk...',
  '..kbbbbbbk..',
  '..kbwwbbbk..',
  '..kbbbbbbk..',
  '..kbbbbbbk..',
  '..kbbbbbbk..',
  '...kbbbbk...',
  '....kkkk....',
];
export function drawPotion(ctx, x, y, s) {
  bitmap(ctx, POTION_ROWS, { a: '#bfe8e0', b: '#ff5d73' }, x - s / 2, y - s / 2, s);
}

export function drawPips(ctx, cx, y, lv, next) {
  ctx.save();
  ctx.font = px(11);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7fe0c3';
  ctx.fillText(next ? (lv === 0 ? 'Lv1' : `Lv${lv} > Lv${lv + 1}`) : `Lv${lv}`, cx, y);
  ctx.restore();
}
