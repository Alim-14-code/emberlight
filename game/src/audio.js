// Emberlight — all sound is synthesised with WebAudio at run time; no audio
// files are shipped, so the game stays silent on disk and musical in play.
export function createAudio() {
  let context = null;
  let muted = false;
  let padNodes = null;

  function ensure() {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    return context;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopPad();
      return muted;
    },
    isMuted() {
      return muted;
    },
    pickup(combo) {
      const base = 620 + Math.min(combo, 8) * 45;
      tone(base, 0.12, 'sine', 0.22);
      tone(base * 1.5, 0.14, 'sine', 0.16, 0.05);
    },
    deposit() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, i * 0.07));
    },
    dash() {
      noise(0.18, 0.12);
      tone(300, 0.16, 'sine', 0.1, 0, 90);
    },
    hit() {
      tone(160, 0.3, 'sawtooth', 0.22, 0, 55);
      noise(0.2, 0.16);
    },
    wispSpawn() {
      tone(220, 0.4, 'sine', 0.05, 0, 110);
    },
    tick() {
      tone(880, 0.06, 'square', 0.06);
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.4, 'triangle', 0.2, i * 0.11));
      tone(262, 1.2, 'sine', 0.12, 0.1);
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.5, 'triangle', 0.18, i * 0.16));
    },
    startPad() {
      if (muted || padNodes) return;
      const ctx = ensure();
      if (!ctx) return;
      const gain = ctx.createGain();
      gain.gain.value = 0.035;
      gain.connect(ctx.destination);
      const oscs = [110, 164.8, 220].map((f) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(gain);
        o.start();
        return o;
      });
      padNodes = { gain, oscs };
    },
    stopPad() {
      if (!padNodes) return;
      try {
        padNodes.oscs.forEach((o) => o.stop());
        padNodes.gain.disconnect();
      } catch {
        // already stopped
      }
      padNodes = null;
    },
  };
}
