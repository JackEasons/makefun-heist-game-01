// Tiny synthesized sound effects: no audio files, everything is made with
// the Web Audio API. Created lazily on the first user gesture so browsers
// allow it. Muted automatically in screenshot mode.

export function makeAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function blip(freq, dur, type, gain) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    setMuted(m) { muted = m; },
    get muted() { return muted; },
    pickup() { blip(880, 0.12, 'triangle', 0.09); setTimeout(() => blip(1318, 0.14, 'triangle', 0.07), 70); },
    crack() { blip(520, 0.1, 'square', 0.05); setTimeout(() => blip(780, 0.12, 'square', 0.05), 90); },
    spotted() { blip(196, 0.22, 'sawtooth', 0.07); setTimeout(() => blip(147, 0.3, 'sawtooth', 0.07), 120); },
    alarm() { blip(1046, 0.09, 'square', 0.05); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.09), i * 110));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'sawtooth', 0.06), i * 130));
    },
  };
}
