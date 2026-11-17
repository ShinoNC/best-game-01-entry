// WebAudio SFX + a soft music loop, synthesised — no audio files. M toggles mute.
export function createAudio() {
  let ctx = null, muted = false;
  // Music: a slow C-major pentatonic arpeggio, one soft note every 0.9 s —
  // calm tidewater under the SFX. tone() checks muted, so M silences it.
  const MELODY = [523, 659, 784, 880, 784, 659, 587, 659];
  let musicOn = false, musicStep = 0;
  function musicTick() {
    if (!musicOn) return;
    tone(MELODY[musicStep % MELODY.length], 1.6, 'sine', 0.045);
    musicStep += 1;
    setTimeout(musicTick, 900);
  }
  function startMusic() { if (musicOn) return; musicOn = true; musicTick(); }
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return; const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol, low) {
    if (muted) return; const c = ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = low || 1200;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination); src.start();
  }
  return {
    unlock() { ensure(); startMusic(); }, // game start = the one user gesture: audio + music on
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    toggleMusic() { musicOn = !musicOn; if (musicOn) musicTick(); return musicOn; },
    get music() { return musicOn; },
    pop() { tone(880, 0.09, 'sine', 0.12, 1400); },           // bubble burst / spin blast
    coin() { tone(1320, 0.07, 'sine', 0.10, 1760); },         // coin collected
    buy() { tone(660, 0.08, 'triangle', 0.12); setTimeout(() => tone(990, 0.12, 'triangle', 0.12), 70); }, // card purchase
    reroll() { tone(990, 0.06, 'triangle', 0.10); setTimeout(() => tone(1320, 0.08, 'triangle', 0.10), 60); }, // reroll the hand
    clear() { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.12), i * 80)); }, // stage clear
    snap() { noise(0.06, 0.16, 2600); tone(220, 0.05, 'square', 0.06, 140); }, // claw hit
    bolt() { tone(520, 0.12, 'sine', 0.10, 180); },          // bubble bolt
    hurt() { tone(140, 0.18, 'sawtooth', 0.16, 70); noise(0.12, 0.12, 500); }, // player hit
    die() { noise(0.25, 0.18, 900); tone(300, 0.22, 'triangle', 0.10, 60); },  // enemy pops
    dash() { noise(0.16, 0.12, 1800); },                     // dash whoosh
    heal() { tone(660, 0.12, 'sine', 0.10, 990); },          // heal pickup
    elite() { tone(196, 0.3, 'sawtooth', 0.12, 392); },      // elite warning
    boss() { tone(1200, 0.5, 'sawtooth', 0.12, 300); noise(0.4, 0.10, 700); }, // heron screech
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.12), i * 130)); },
  };
}
