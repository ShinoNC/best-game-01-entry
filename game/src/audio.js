export function createAudio() {
  let ctx = null, master = null, musicGain = null, muted = false;
  let musicOn = false, musicBuf = null, musicSrc = null;
  // ONE master gain for all sound: mute sets it to 0 instantly.
  // Music is a looping MP3 (Pixabay "Sea and Beach") via musicGain.
  function playMusic() {
    const c = ensure(); if (!c || !musicOn || musicSrc) return;
    if (musicBuf) {
      musicSrc = c.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
      musicSrc.connect(musicGain); musicSrc.start();
    } else {
      fetch('audio/sea-and-beach.mp3').then((r) => r.arrayBuffer())
        .then((b) => c.decodeAudioData(b)).then((buf) => { musicBuf = buf; playMusic(); })
        .catch(() => {});
    }
  }
  function startMusic() { if (musicOn) return; musicOn = true; if (musicGain) musicGain.gain.value = 0.35; playMusic(); }
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? 0.35 : 0; musicGain.connect(master);
    }
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
    o.connect(g).connect(master); o.start(); o.stop(c.currentTime + dur);
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
    src.connect(f).connect(g).connect(master); src.start();
  }
  return {
    unlock() { ensure(); startMusic(); },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 1; return muted; },
    get muted() { return muted; },
    toggleMusic() { musicOn = !musicOn; if (musicGain) musicGain.gain.value = musicOn ? 0.35 : 0; if (musicOn) playMusic(); return musicOn; },
    get music() { return musicOn; },
    pop() { tone(880, 0.09, 'sine', 0.12, 1400); },
    coin() { tone(1320, 0.07, 'sine', 0.10, 1760); },
    buy() { tone(660, 0.08, 'triangle', 0.12); setTimeout(() => tone(990, 0.12, 'triangle', 0.12), 70); },
    reroll() { tone(990, 0.06, 'triangle', 0.10); setTimeout(() => tone(1320, 0.08, 'triangle', 0.10), 60); },
    clear() { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.12), i * 80)); },
    snap() { noise(0.06, 0.16, 2600); tone(220, 0.05, 'square', 0.06, 140); },
    bolt() { tone(520, 0.12, 'sine', 0.10, 180); },
    hurt() { tone(140, 0.18, 'sawtooth', 0.16, 70); noise(0.12, 0.12, 500); },
    die() { noise(0.25, 0.18, 900); tone(300, 0.22, 'triangle', 0.10, 60); },
    dash() { noise(0.16, 0.12, 1800); },
    heal() { tone(660, 0.12, 'sine', 0.10, 990); },
    elite() { tone(196, 0.3, 'sawtooth', 0.12, 392); },
    boss() { tone(1200, 0.5, 'sawtooth', 0.12, 300); noise(0.4, 0.10, 700); },
    level() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.12), i * 90)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.12), i * 130)); },
  };
}
