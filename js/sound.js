// Tiny synthesised sounds (no files): dial ticks, a heart pop, a copy pip, dice rattle. Off until enabled.
let ctx = null, master = null, enabled = false;

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function setEnabled(on) { enabled = on; if (on) ensure(); }

function click(freq, dur, gain, when = 0) {
  const t = ctx.currentTime + when;
  // a filtered noise burst plus a short sine: the "tk" of a detent
  const len = Math.ceil(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const noise = ctx.createBufferSource(); noise.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq * 2; bp.Q.value = 2.5;
  const g = ctx.createGain(); g.gain.value = gain;
  noise.connect(bp).connect(g).connect(master); noise.start(t);
  const osc = ctx.createOscillator(), og = ctx.createGain();
  osc.frequency.value = freq; og.gain.setValueAtTime(gain * 0.5, t); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(og).connect(master); osc.start(t); osc.stop(t + dur + 0.02);
}

export const sfx = {
  tick() { if (!enabled) return; ensure(); click(1900 + Math.random() * 200, 0.025, 0.18); },
  pop() {
    if (!enabled) return; ensure();
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.18);
  },
  pip() {
    if (!enabled) return; ensure();
    [0, 0.07].forEach((w, i) => { const t = ctx.currentTime + w, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = i ? 1320 : 990; g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.1); });
  },
  roll() { if (!enabled) return; ensure(); for (let i = 0; i < 6; i++) click(900 + Math.random() * 700, 0.03, 0.14, i * 0.06 + Math.random() * 0.02); },
};
