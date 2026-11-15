// TIDEKEEPER — a hermit crab holds the rockpool until high tide.
// Placeholder boot (scaffold only); the full game is written in this session.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();
ctx.fillStyle = '#0b3d4a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffd9a0'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
ctx.fillText('TIDEKEEPER', canvas.width / 2, canvas.height / 2);
window.__shotReady = true;
