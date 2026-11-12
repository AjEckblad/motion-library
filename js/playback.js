// Playback controls shared by the detail and compare views. They drive the virtual clock inside each
// stage iframe: speed, pause, single-frame step and replay. The readout is the stage's own clock.
const icons = {
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>',
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4a.6.6 0 00.9.5l8.2-5.2a.6.6 0 000-1L5.4 2.3a.6.6 0 00-.9.5z"/></svg>',
  step: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.2v9.6a.5.5 0 00.8.4l6.4-4.8a.5.5 0 000-.8L3.8 2.8a.5.5 0 00-.8.4z"/><rect x="11.2" y="3" width="2" height="10" rx=".8"/></svg>',
  replay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="stroke" d="M3.2 8a4.8 4.8 0 108.6-2.9"/><path d="M12.9 2.2v3.6H9.3z"/></svg>',
};

// startPaused: open stopped on the first frame (the detail view does this); onState(paused) fires on every change.
export function createPlaybar(frames, { startPaused = false, onState } = {}) {
  const el = document.createElement('div');
  el.className = 'playbar';
  el.innerHTML = `
    <button class="pb-btn pb-play" type="button" aria-label="${startPaused ? 'Play' : 'Pause'}">${startPaused ? icons.play : icons.pause}</button>
    <div class="seg" role="group" aria-label="Speed">
      <button type="button" data-rate="0.25" aria-pressed="false">0.25×</button>
      <button type="button" data-rate="0.5" aria-pressed="false">0.5×</button>
      <button type="button" data-rate="1" aria-pressed="true">1×</button>
    </div>
    <button class="pb-btn pb-step" type="button" aria-label="Step one frame">${icons.step}<span>Frame</span></button>
    <button class="pb-btn pb-replay" type="button" aria-label="Replay from the start">${icons.replay}<span>Replay</span></button>
    <span class="clock" aria-label="Animation time">00:00.00</span>`;
  const playBtn = el.querySelector('.pb-play'), clock = el.querySelector('.clock');
  let paused = startPaused, rate = 1, starts = new WeakMap(), raf = 0;

  const each = fn => frames().forEach(f => { try { const c = f.contentWindow?.__clock; if (c) fn(c, f); } catch {} });
  const post = msg => frames().forEach(f => f.contentWindow?.postMessage(msg, '*'));
  const mark = f => { try { starts.set(f, f.contentWindow.performance.now()); } catch {} };
  function setPaused(p) {
    paused = p;
    each(c => p ? c.pause() : c.play());
    playBtn.innerHTML = p ? icons.play : icons.pause;
    playBtn.setAttribute('aria-label', p ? 'Play' : 'Pause');
    onState?.(p);
  }
  playBtn.addEventListener('click', () => setPaused(!paused));
  el.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => {
    rate = +b.dataset.rate; each(c => c.setRate(rate));
    el.querySelectorAll('[data-rate]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  el.querySelector('.pb-step').addEventListener('click', () => { if (!paused) setPaused(true); each(c => c.step()); });
  // replay restarts and plays, like a video player
  el.querySelector('.pb-replay').addEventListener('click', () => { if (paused) setPaused(false); post({ type: 'replay' }); requestAnimationFrame(() => frames().forEach(mark)); });

  function tick() {
    const f = frames()[0];
    try {
      if (f && starts.has(f)) {
        const s = Math.max(0, (f.contentWindow.performance.now() - starts.get(f)) / 1000), fr = Math.floor((s % 1) * 60);
        clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(fr).padStart(2, '0')}`;
      }
    } catch {}
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    el,
    // call when a stage has (re)mounted: re-applies the current speed and pause state and restarts the readout
    ready(f) { mark(f); try { const c = f.contentWindow.__clock; c.setRate(rate); paused ? c.pause() : c.play(); } catch {} },
    play() { if (paused) setPaused(false); },
    destroy() { cancelAnimationFrame(raf); },
  };
}
