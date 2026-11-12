// Marker highlighter, in an e-reader: a highlight sweeps behind three key phrases of a page of Walden, one stroke per line, slightly uneven like a real marker.
// The highlight is revealed with a clip-path wipe, so the text never moves and stays readable while the colour arrives behind it; the wobbly edges, the skew and a little less ink where the pen lands are what sell it as a hand-made mark.
const PARAMS = { speed: 0.5, gap: 450, wobble: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400;
  const text = 'I went to the woods because I wished [to live deliberately], to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, [discover that I had not lived].|I wanted to live deep and [suck out all the marrow of life], to live so sturdily and Spartan-like as to put to rout all that was not life.';
  const inks = ['#ffd94a', '#9ee6a8', '#ffb3c7'];
  const root = document.createElement('div');
  root.className = 'hl-root';
  root.innerHTML = `<style>
    .hl-root { position: absolute; inset: 0; overflow: hidden; background: #e9e4da; color: #24211c; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .hl-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .hl-page { position: absolute; left: 50%; top: 0; bottom: 0; width: min(100% - 24px, 520px); transform: translateX(-50%); background: #fbf9f4; box-shadow: 0 0 0 1px #ddd6c8, 0 20px 40px -26px rgba(60,45,20,.5); }
    .hl-bar { height: 40px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid #ece6da; font-size: 11.5px; font-weight: 560; color: #6d665a; }
    .hl-bar b { font-weight: 650; color: #24211c; }
    .hl-count { display: inline-flex; gap: 5px; align-items: center; }
    .hl-count i { display: inline-block; width: 12px; height: 8px; border-radius: 2px; background: var(--ink); transform: skewX(-12deg); }
    .hl-n { display: inline-block; min-width: .6em; font-variant-numeric: tabular-nums; }
    .hl-body { padding: 18px 26px 0; }
    .hl-body h3 { margin: 0 0 4px; font: 600 11px/1 "Mona Sans", system-ui, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #9a907f; }
    .hl-body h2 { margin: 0 0 12px; font: 600 21px/1.15 ui-serif, "Iowan Old Style", Georgia, serif; letter-spacing: -0.01em; }
    .hl-p p { margin: 0 0 9px; text-indent: 0; }
    .hl-p p + p { text-indent: 1.4em; }
    .hl-p { position: relative; isolation: isolate; margin: 0; font: 400 15px/1.62 ui-serif, "Iowan Old Style", Georgia, serif; text-wrap: pretty; }
    .hl-marks { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    .hl-marks svg { position: absolute; overflow: visible; mix-blend-mode: multiply; }
    .hl-foot { position: absolute; left: 26px; right: 26px; bottom: 14px; display: flex; justify-content: space-between; font-size: 10.5px; color: #8b8273; }
    .hl-toast { position: absolute; left: 50%; bottom: 40px; padding: 8px 12px; border-radius: 10px; background: #24211c; color: #fbf9f4; font-size: 11.5px; font-weight: 600; white-space: nowrap; opacity: 0; transform: translateX(-50%); }
  </style>
  <div class="hl-art"><div class="hl-page">
    <div class="hl-bar"><span>‹ Library</span><b>Walden</b><span class="hl-count"><i></i><span class="hl-n">0</span> highlights</span></div>
    <div class="hl-body"><h3>Chapter 2</h3><h2>Where I Lived, and What I Lived For</h2><div class="hl-p"><span class="hl-marks"></span></div></div>
    <div class="hl-foot"><span>Henry David Thoreau, 1854</span><span>34% · 9 min left in chapter</span></div>
    <div class="hl-toast">Saved to your notes</div>
  </div></div>`;
  stage.append(root);
  const art = root.querySelector('.hl-art'), p = root.querySelector('.hl-p'), head = root.querySelector('.hl-body h2'), marks = root.querySelector('.hl-marks');
  const nEl = root.querySelector('.hl-n'), toast = root.querySelector('.hl-toast');
  const phrases = [];
  text.split('|').forEach(par => {
    const el = document.createElement('p'); p.append(el);
    par.split(/(\[[^\]]+\])/).forEach(part => {
      if (part.startsWith('[')) { const s = document.createElement('span'); s.textContent = part.slice(1, -1); el.append(s); phrases.push(s); }
      else el.append(document.createTextNode(part));
    });
  });
  let scale = 1;
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight; scale = Math.min(H / AH, W / MINW) || 1;
    art.style.width = W / scale + 'px'; art.style.top = (H - AH * scale) / 2 + 'px'; art.style.transform = `scale(${scale})`;
    // narrow pages get slightly smaller type so the page still fits above the footer
    const k = Math.min(1, Math.max(0, (W / scale - 425) / 120));
    p.style.fontSize = (13 + 2 * k).toFixed(2) + 'px'; head.style.fontSize = (18.5 + 2.5 * k).toFixed(2) + 'px';
    if (done.length) { marks.replaceChildren(); done.forEach(i => draw(i, false)); }
  };
  // seeded so each stroke keeps its own wobble when it is redrawn
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)', easeInOut = 'cubic-bezier(0.77, 0, 0.175, 1)';
  let ink = inks[0], done = [], timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function stroke(w, h) {
    // a marker band: wavy top and bottom edges, slanted ends, a few px of overshoot
    const wb = PARAMS.wobble, n = Math.max(3, Math.round(w / 26)), top = [], bot = [];
    for (let i = 0; i <= n; i++) { const x = 3 + (w - 6) * i / n; top.push(`${x.toFixed(1)},${(1.5 + (rand() - 0.5) * 2.4 * wb).toFixed(1)}`); bot.push(`${x.toFixed(1)},${(h - 1.5 + (rand() - 0.5) * 2.4 * wb).toFixed(1)}`); }
    const sl = 2 + rand() * 2 * wb;
    return `M${top[0]} L${top.join(' L')} Q${w + 1},${h * 0.3} ${w - sl},${h - 1} L${bot.reverse().join(' L')} Q${-1},${h * 0.7} ${top[0]}Z`;
  }
  function draw(i, animate) {
    const base = p.getBoundingClientRect(), rects = [...phrases[i].getClientRects()];
    let delay = 0;
    const id = 'hl' + i + Math.round(rand() * 1e6);
    rects.forEach(r => {
      const x = (r.left - base.left) / scale - 3, w = r.width / scale + 6, lh = r.height / scale, h = lh * 0.82, y = (r.top - base.top) / scale + lh * 0.12;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', w); svg.setAttribute('height', h);
      svg.style.cssText = `left:${x}px;top:${y}px;transform:rotate(${((rand() - 0.5) * 0.8 * PARAMS.wobble).toFixed(2)}deg)`;
      svg.innerHTML = `<defs><linearGradient id="${id}"><stop offset="0" stop-color="${ink}" stop-opacity=".7"/><stop offset=".08" stop-color="${ink}" stop-opacity=".95"/><stop offset=".85" stop-color="${ink}" stop-opacity=".9"/><stop offset="1" stop-color="${ink}" stop-opacity=".75"/></linearGradient></defs><path d="${stroke(w, h)}" fill="url(#${id})"/>`;
      marks.append(svg);
      if (animate) {
        // the pen moves at the same speed whatever the length, so long phrases take longer, like a real stroke
        const dur = Math.max(160, w / PARAMS.speed);
        svg.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: dur, delay, easing: easeInOut, fill: 'backwards' });
        delay += dur + 40;
      }
    });
    return delay;
  }
  function bump(n) {
    nEl.textContent = n;
    nEl.animate([{ transform: reduce ? 'none' : 'translateY(-5px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: easeOut });
  }
  function cycle(round) {
    ink = inks[round % inks.length]; root.style.setProperty('--ink', ink);
    marks.replaceChildren(); done = []; bump(0);
    let t = 700;
    phrases.forEach((_, i) => {
      later(() => { const d = draw(i, true); done.push(i); later(() => bump(i + 1), d * 0.6); }, t);
      t += 900 + PARAMS.gap;
    });
    later(() => toast.animate([{ opacity: 0, transform: reduce ? 'translate(-50%, 0)' : 'translate(-50%, 8px) scale(0.95)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 260, easing: easeOut, fill: 'forwards' }), t);
    later(() => toast.animate([{ opacity: 1, transform: 'translate(-50%, 0)' }, { opacity: 0, transform: reduce ? 'translate(-50%, 0)' : 'translate(-50%, 4px)' }], { duration: 180, easing: easeOut, fill: 'forwards' }), t + 1700);
    later(() => marks.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: easeOut, fill: 'forwards' }), t + 2400);
    later(() => { marks.getAnimations().forEach(a => a.cancel()); cycle(round + 1); }, t + 2800);
  }
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  cycle(0);
  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
