// Paper fold: a printed sheet folded by hand in real CSS 3D, one of four ways (`fold`, the Fold picker in the detail
// view): 0 a letter, in thirds and then in half; 1 a gate fold, both sides swung in to meet at the middle, then shut like
// a book; 2 an accordion, six panels pleated back and forth; 3 a map, pleated side to side and then folded in half. Each
// fold is a tree of hinges: the crease folded last is the outermost hinge and carries everything already folded, so the
// stack lands the way paper does, its layers in the right order. Every panel is shaded from its true 3D normal, turned
// through its hinges, against a desk lamp; creases darken on the inside, catch the light on the outside and stay faintly
// marked; the shadow on the mat follows the folded footprint, and the sheet slides to keep that footprint centred.
const PARAMS = { fold: 0, cycle: 9, tilt: 46, crease: 1 };

export default function (stage) {
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#13201f';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paper = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .3 0 0 0 0 .22 0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`;
  root.innerHTML = `
  <style>
    .pf-scene{position:absolute;left:50%;top:51%;width:0;height:0;transform-style:preserve-3d}
    .pf-mat{position:absolute;transform:translateZ(-3px);
      background:linear-gradient(rgba(220,255,240,.11) 1px,transparent 1px) 0 0/calc(var(--g)*5) calc(var(--g)*5),
      linear-gradient(90deg,rgba(220,255,240,.11) 1px,transparent 1px) 0 0/calc(var(--g)*5) calc(var(--g)*5),
      linear-gradient(rgba(220,255,240,.045) 1px,transparent 1px) 0 0/var(--g) var(--g),
      linear-gradient(90deg,rgba(220,255,240,.045) 1px,transparent 1px) 0 0/var(--g) var(--g),#1c3633}
    .pf-shadow{position:absolute;background:rgba(4,10,9,.9);filter:blur(calc(var(--h)*.025));border-radius:2px;transform-origin:0 0}
    .pf-n,.pf-p{position:absolute;transform-style:preserve-3d}
    .pf-face{position:absolute;inset:-.5px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:${paper},#f3efe6}
    .pf-back{transform:rotateY(180deg);background:repeating-linear-gradient(45deg,rgba(60,90,140,.07) 0 1px,transparent 1px 4px),repeating-linear-gradient(-45deg,rgba(60,90,140,.05) 0 1px,transparent 1px 4px),${paper},#ebe7de}
    .pf-art{position:absolute;width:var(--w);height:var(--h);font-family:"Mona Sans",system-ui,sans-serif;color:#1b2233}
    .pf-o{position:absolute;inset:0;opacity:0;pointer-events:none}
    .pf-dk{background:#1a120c}.pf-lt{background:#fff8ec}
    .pf-c{position:absolute;opacity:0;pointer-events:none}
    .pf-band{position:absolute;left:0;right:0;top:0;height:1.3%;background:#d8452b}
    .pf-kick{position:absolute;left:9%;top:6.5%;font:650 calc(var(--h)*.017)/1 "Mona Sans";letter-spacing:.16em;text-transform:uppercase;color:#d8452b}
    .pf-title{position:absolute;left:9%;top:10%;width:74%;font:760 calc(var(--h)*.054)/1 "Mona Sans";font-stretch:112%;letter-spacing:-.025em}
    .pf-date{position:absolute;left:9%;top:25.5%;font:500 calc(var(--h)*.016)/1 "Mona Sans";color:#717480}
    .pf-txt{position:absolute;left:9%;right:9%;font:430 calc(var(--h)*.0172)/1.6 "Mona Sans";color:#2e3342;margin:0}
    .pf-tick{position:absolute;background:#d8452b;opacity:.55}
    .pf-sig{position:absolute;left:8%;top:85.5%;width:24%}
    .pf-diag{position:absolute;right:9%;top:82%;width:14%}
    .pf-num{position:absolute;top:13%;font:760 calc(var(--h)*.2)/1 "Mona Sans";font-stretch:112%;letter-spacing:-.04em;color:#1b2233}
    .pf-word{position:absolute;top:43%;font:650 calc(var(--h)*.03)/1 "Mona Sans";letter-spacing:.12em;text-transform:uppercase;color:#d8452b}
    .pf-map{position:absolute;inset:0;width:100%;height:100%}
    .pf-lamp{position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 55% at 42% 36%,rgba(255,236,205,.13),transparent 70%),radial-gradient(130% 110% at 50% 45%,transparent 38%,rgba(0,0,0,.62))}
  </style>
  <div class="pf-scene"><div class="pf-mat"></div><div class="pf-shadow"></div></div><div class="pf-lamp"></div>`;
  stage.append(root);
  const scene = root.querySelector('.pf-scene'), mat = root.querySelector('.pf-mat'), shadow = root.querySelector('.pf-shadow');

  // ── the printed side of each sheet: one full-size layout, cropped into every panel
  const sig = `<svg class="pf-sig" viewBox="0 0 120 40" fill="none" stroke="#24304f" stroke-width="1.6" stroke-linecap="round"><path d="M4 28c8-14 14-22 18-20s-6 22-2 22 10-16 14-15-3 13 1 13 7-9 11-9-2 8 2 8 9-12 14-12c4 0-3 11 2 11 6 0 14-9 22-9s14 4 30 2"/></svg>`;
  const ticks = (xs, ys) => xs.map(x => `<i class="pf-tick" style="left:${x}%;top:1.8%;width:1px;height:2.2%"></i><i class="pf-tick" style="left:${x}%;bottom:1.5%;width:1px;height:2.2%"></i>`).join('')
    + ys.map(y => `<i class="pf-tick" style="left:2.5%;top:${y}%;width:3%;height:1px"></i><i class="pf-tick" style="right:2.5%;top:${y}%;width:3%;height:1px"></i>`).join('');
  const LETTER = `<div class="pf-band"></div><div class="pf-kick">Notes on folding</div><div class="pf-title">In thirds, then in half</div><div class="pf-date">9 November</div>
    <p class="pf-txt" style="top:38.5%">A sheet becomes an envelope of itself. The bottom third lifts and lies flat on the middle, the top third closes over it, and the whole strip folds once more down the centre. Each panel is a flat plane hinged at a crease; nothing bends, so the light has to do the work.</p>
    <p class="pf-txt" style="top:68.5%">Where a panel turns away from the lamp it darkens, and where two panels meet the crease holds a little shadow. Open it again and the creases stay, faintly, like a memory of the shape.</p>
    ${sig}<svg class="pf-diag" viewBox="0 0 60 76" fill="none" stroke="#2e3342" stroke-width="1.2"><rect x="6" y="4" width="48" height="66" rx="1"/><path d="M6 26h48M6 48h48M30 4v66" stroke-dasharray="3 3" stroke="#d8452b"/></svg>
    ${ticks([50], [33.33, 66.67])}`;
  const GATE = `<div class="pf-band"></div><div class="pf-kick" style="left:4%;top:9%">Notes on folding</div>
    <div class="pf-title" style="left:27%;top:19%;width:46%;text-align:center;font-size:calc(var(--h)*.15)">Gate fold</div>
    <p class="pf-txt" style="left:30%;right:30%;top:45%;text-align:center;font-size:calc(var(--h)*.03)">Both outer panels swing in and meet at the middle, like a pair of doors. Then the whole sheet closes once, down the centre, with the doors inside.</p>
    <p class="pf-txt" style="left:4%;right:79%;top:22%;font-size:calc(var(--h)*.027)">The left door turns on its crease and lies flat across the panel beside it.</p>
    <p class="pf-txt" style="left:79%;right:4%;top:22%;font-size:calc(var(--h)*.027)">The right door does the same from the other side, and the two edges meet.</p>
    <svg class="pf-sig" style="left:4%;top:78%;width:13%" viewBox="0 0 120 40" fill="none" stroke="#24304f" stroke-width="1.6" stroke-linecap="round"><path d="M4 28c8-14 14-22 18-20s-6 22-2 22 10-16 14-15-3 13 1 13 7-9 11-9-2 8 2 8 9-12 14-12c4 0-3 11 2 11 6 0 14-9 22-9s14 4 30 2"/></svg>
    <svg class="pf-diag" style="right:4%;top:74%;width:13%" viewBox="0 0 84 54" fill="none" stroke="#2e3342" stroke-width="1.2"><rect x="2" y="2" width="80" height="50" rx="1"/><path d="M22 2v50M42 2v50M62 2v50" stroke-dasharray="3 3" stroke="#d8452b"/></svg>
    ${ticks([25, 50, 75], [])}`;
  const CREASE = ['Valley', 'Mountain', 'Valley', 'Mountain', 'Valley'], HOW = ['folds toward you', 'folds away', 'folds toward you', 'folds away', 'folds toward you'];
  const ACCORDION = `<div class="pf-band"></div><div class="pf-kick" style="left:2.2%;top:9%">Notes on folding</div>
    <div class="pf-title" style="left:2.2%;top:16%;width:13%;font-size:calc(var(--h)*.052);line-height:1.02">Accordion</div>
    <p class="pf-txt" style="left:2.2%;right:85%;top:40%;font-size:calc(var(--h)*.027)">Six panels pleated back and forth, every crease the opposite way to the last.</p>
    ${CREASE.map((w, i) => { const x = (i + 1) / 6 * 100 + 2.2; return `<div class="pf-num" style="left:${x}%">${i + 1}</div><div class="pf-word" style="left:${x}%">${w}</div><p class="pf-txt" style="left:${x}%;right:${100 - x - 12.3}%;top:51%;font-size:calc(var(--h)*.027)">The crease on this panel’s left ${HOW[i]}.</p>`; }).join('')}
    ${ticks([16.67, 33.33, 50, 66.67, 83.33], [])}`;
  const MAP = (() => {
    const ring = (cx, cy, r, k, s) => { let d = ''; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, q = r * (1 + 0.15 * Math.sin(3 * a + s + k * 0.6) + 0.07 * Math.sin(5 * a - k * 0.9 + s * 2)); d += (i ? 'L' : 'M') + (cx + Math.cos(a) * q * 1.3).toFixed(1) + ' ' + (cy + Math.sin(a) * q).toFixed(1); } return d + 'Z'; };
    let lines = ''; for (let k = 0; k < 9; k++) lines += `<path d="${ring(460, 560, 26 + k * 34, k, 1.3)}"/>`; for (let k = 0; k < 6; k++) lines += `<path d="${ring(1020, 300, 22 + k * 30, k, 4.1)}"/>`;
    let grid = ''; for (let i = 1; i < 8; i++) grid += `<path d="M${i * 176.75} 0V1000"/>`; for (let j = 1; j < 5; j++) grid += `<path d="M0 ${j * 200}H1414"/>`;
    return `<svg class="pf-map" viewBox="0 0 1414 1000" preserveAspectRatio="none" font-family="Mona Sans, system-ui, sans-serif">
      <path d="M1414 640c-90 10-150 60-230 50s-110-80-190-70-120 90-110 170 70 120 40 210h490z" fill="#cbdde4"/>
      <path d="M640 230c40-30 110-20 130 20s-20 80-70 80-100-60-60-100z" fill="#cbdde4"/>
      <g fill="none" stroke="#b98d5c" stroke-opacity=".5" stroke-width="1.7">${lines}</g>
      <g fill="none" stroke="#24304f" stroke-opacity=".1" stroke-width="1.2">${grid}</g>
      <path d="M0 860C150 830 230 720 350 712S560 790 664 724 820 520 930 486 1060 470 1110 560" fill="none" stroke="#7fa9bf" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 1000C170 870 300 870 420 905S700 965 860 885 1180 735 1414 770" fill="none" stroke="#d8452b" stroke-width="8"/>
      <path d="M720 0C740 160 660 290 712 430S850 640 862 884" fill="none" stroke="#e7a33e" stroke-width="5"/>
      <path d="M170 330C300 360 370 450 460 560S760 640 1020 300" fill="none" stroke="#24304f" stroke-width="3.5" stroke-dasharray="11 9" stroke-linecap="round"/>
      <g fill="#24304f"><rect x="160" y="320" width="20" height="20"/><rect x="1010" y="290" width="20" height="20"/><path d="M460 532l20 34h-40z"/><path d="M1020 272l18 30h-36z"/></g>
      <g fill="#24304f" font-size="24" font-weight="600"><text x="190" y="314">Stone hut</text><text x="1046" y="282">Upper tarn camp</text><text x="490" y="552" font-size="20" font-weight="500">1 142 m</text><text x="1050" y="320" font-size="20" font-weight="500">986 m</text></g>
      <g font-size="26" font-weight="500" fill="#4f7d93" font-style="italic"><text x="1150" y="880">Long Water</text><text x="650" y="285" font-size="20">Birch tarn</text></g>
      <g transform="translate(56 50)"><rect width="388" height="168" fill="#f6f2e8" stroke="#24304f" stroke-width="2.5"/><rect y="0" width="388" height="12" fill="#d8452b"/>
        <text x="26" y="78" font-size="50" font-weight="760" fill="#1b2233" letter-spacing="-1">Northern Trail</text><text x="26" y="118" font-size="23" fill="#2e3342">Hiking map · 1 : 50 000</text><text x="26" y="148" font-size="19" font-weight="600" fill="#d8452b" letter-spacing="2">SHEET 4 OF 9</text></g>
      <g transform="translate(1310 120)" fill="#24304f"><circle r="46" fill="none" stroke="#24304f" stroke-width="2"/><path d="M0-40 13 12 0 4-13 12z"/><text y="-56" text-anchor="middle" font-size="26" font-weight="700">N</text></g>
    </svg>${ticks([25, 50, 75], [50])}`;
  })();

  // ── the four folds, in units of the sheet (x across, y down). A node is a part of the sheet that turns on one crease
  // and carries its children: r its rectangle; h its hinge [axis ('v' a vertical crease, 'h' a horizontal one), where,
  // crease id, +1 a valley fold (toward you) or -1 a mountain fold, lift in px that keeps stacked layers apart, and
  // optionally how far it turns in half turns (else the fold's own amount)]; p its panels; k its children
  const pleat = (xs, i, y0, y1, ids, dirs, lift) => ({ r: [xs[i], y0, 1, y1], h: ['v', xs[i], ids[i - 1], dirs[i - 1], i % 2 ? lift : -lift],
    p: [[xs[i], y0, xs[i + 1], y1]], k: i + 2 < xs.length ? [pleat(xs, i + 1, y0, y1, ids, dirs, lift)] : [] });
  // the accordion is a W standing on the table: the first panel tilts up from its outer edge by β and every crease after it
  // turns 2β the other way to the last, so each valley stays on the table while the peaks rise and the pleats close up
  const zig = (xs, i) => ({ r: [xs[i], 0, 1, 1], h: ['v', xs[i], 0, i % 2 ? -1 : 1, 0, 0.8], p: [[xs[i], 0, xs[i + 1], 1]], k: i + 2 < xs.length ? [zig(xs, i + 1)] : [] });
  const T = 1 / 3, X6 = [0, 1, 2, 3, 4, 5, 6].map(i => i / 6), X4 = [0, 0.25, 0.5, 0.75, 1];
  const FOLDS = [
    { aspect: 0.773, amount: 1, steps: [[0], [1], [2]], gap: 0.85, art: LETTER,              // bottom up, top down, in half
      root: { r: [0, 0, 1, 1], p: [[0, T, 0.5, 2 * T]], k: [
        { r: [0, 0, 0.5, T], h: ['h', T, 1, 1, 1], p: [[0, 0, 0.5, T]] },
        { r: [0, 2 * T, 0.5, 1], h: ['h', 2 * T, 0, 1, 0.5], p: [[0, 2 * T, 0.5, 1]] },
        { r: [0.5, 0, 1, 1], h: ['v', 0.5, 2, 1, 3], p: [[0.5, T, 1, 2 * T]], k: [
          { r: [0.5, 0, 1, T], h: ['h', T, 1, 1, 1], p: [[0.5, 0, 1, T]] },
          { r: [0.5, 2 * T, 1, 1], h: ['h', 2 * T, 0, 1, 0.5], p: [[0.5, 2 * T, 1, 1]] }] }] } },
    { aspect: 1.55, amount: 1, steps: [[0], [1], [2]], gap: 0.7, art: GATE,                  // left door, right door, shut
      root: { r: [0, 0, 1, 1], p: [[0.25, 0, 0.5, 1]], k: [
        { r: [0, 0, 0.25, 1], h: ['v', 0.25, 0, 1, 1], p: [[0, 0, 0.25, 1]] },
        { r: [0.5, 0, 1, 1], h: ['v', 0.5, 2, 1, 3], p: [[0.5, 0, 0.75, 1]], k: [
          { r: [0.75, 0, 1, 1], h: ['v', 0.75, 1, 1, 1.6], p: [[0.75, 0, 1, 1]] }] }] } },
    { aspect: 1.85, amount: 1, steps: [[0]], gap: 1, art: ACCORDION,                          // the pleats close up together
      root: { r: [0, 0, 1, 1], h: ['v', 0, 0, 1, 0, 0.4], p: [[0, 0, X6[1], 1]], k: [zig(X6, 1)] } },
    { aspect: 1.414, amount: 1, steps: [[0, 1, 2], [3]], gap: 1, art: MAP,                    // pleat side to side, then in half
      root: { r: [0, 0, 1, 1], p: [[0, 0, 0.25, 0.5]], k: [pleat(X4, 1, 0, 0.5, [0, 1, 2], [1, -1, 1], 0.8),
        { r: [0, 0.5, 1, 1], h: ['h', 0.5, 3, 1, 6], p: [[0, 0.5, 0.25, 1]], k: [pleat(X4, 1, 0.5, 1, [0, 1, 2], [1, -1, 1], 0.8)] }] } },
  ];
  const F = FOLDS[Math.max(0, Math.min(FOLDS.length - 1, Math.round(PARAMS.fold)))];

  // ── build the hinge tree: a node per hinge, a panel per rectangle with a printed front and a tinted back
  const creases = new Map(), key = (ax, v) => ax + v.toFixed(4);
  const amt = h => h[5] ?? F.amount, creaseAmt = [];
  (function walk(nd) { if (nd.h && nd.h[1] > 1e-6 && nd.h[1] < 1 - 1e-6) { creases.set(key(nd.h[0], nd.h[1]), nd.h[2]); creaseAmt[nd.h[2]] = amt(nd.h); } (nd.k || []).forEach(walk); })(F.root);
  const NC = Math.max(...F.steps.flat()) + 1, e = new Float32Array(NC), memory = new Float32Array(NC);
  const nodes = [], panels = [], faces = [];
  const edgeFill = { top: 'linear-gradient(to bottom,C,transparent)', bottom: 'linear-gradient(to top,C,transparent)', left: 'linear-gradient(to right,C,transparent)', right: 'linear-gradient(to left,C,transparent)' };
  function build(nd, parentEl, parent) {
    const el = document.createElement('div'); el.className = 'pf-n'; parentEl.append(el);
    // which way this part turns to fold toward the viewer: down for a part below its crease, and so on
    const side = !nd.h ? 0 : nd.h[0] === 'h' ? (nd.r[1] >= nd.h[1] - 1e-6 ? 1 : -1) : (nd.r[0] >= nd.h[1] - 1e-6 ? -1 : 1);
    const node = { nd, el, parent, side, ang: 0 }; nodes.push(node);
    const chain = []; for (let q = node; q; q = q.parent) if (q.nd.h) chain.push(q);              // innermost hinge first
    for (const pr of nd.p) {
      const p = document.createElement('div'); p.className = 'pf-p'; el.append(p);
      const sides = [];
      for (const [ax, v, s] of [['h', pr[1], 'top'], ['h', pr[3], 'bottom'], ['v', pr[0], 'left'], ['v', pr[2], 'right']]) { const id = creases.get(key(ax, v)); if (id !== undefined) sides.push([s, id]); }
      for (const back of [false, true]) {
        const f = document.createElement('div'); f.className = 'pf-face' + (back ? ' pf-back' : '');
        let art = null; if (!back) { art = document.createElement('div'); art.className = 'pf-art'; art.innerHTML = F.art; f.append(art); }
        const strips = sides.map(([sd0, id]) => {
          const s = document.createElement('div'); s.className = 'pf-c';
          const sd = back && (sd0 === 'left' || sd0 === 'right') ? (sd0 === 'left' ? 'right' : 'left') : sd0;   // the back is mirrored left to right
          const horiz = sd === 'top' || sd === 'bottom';
          s.style.cssText = `${sd}:0;${horiz ? 'left:0;right:0;height:26%' : 'top:0;bottom:0;width:30%'};background:${edgeFill[sd].replace('C', back ? 'rgba(255,250,240,.75)' : 'rgba(45,30,18,.6)')}`;
          f.append(s); return { s, id };
        });
        const dk = document.createElement('div'); dk.className = 'pf-o pf-dk'; const lt = document.createElement('div'); lt.className = 'pf-o pf-lt'; f.append(dk, lt);
        p.append(f); faces.push({ back, dk, lt, strips, chain });
      }
      panels.push({ p, pr, node, chain, art: p.querySelector('.pf-art') });
    }
    (nd.k || []).forEach(c => build(c, el, node));
  }
  build(F.root, scene, null);
  const sheet = nodes[0].el;

  let W = 0, H = 0, Wp = 0, Hp = 0;
  const resize = () => {
    W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    Wp = Math.min(W * (F.aspect > 1 ? 0.74 : 0.66), H * (F.aspect > 1 ? 0.72 : 0.8) * F.aspect); Hp = Wp / F.aspect;
    const M = Math.max(W, H) * 2.6;
    root.style.setProperty('--w', Wp + 'px'); root.style.setProperty('--h', Hp + 'px');
    root.style.setProperty('--g', (Math.min(H * 0.8, W * 0.66 / 0.773) / 26).toFixed(2) + 'px');   // the same mat for every fold
    root.style.perspective = Math.max(W, H) * 1.5 + 'px'; root.style.perspectiveOrigin = '50% 30%';
    Object.assign(mat.style, { width: M + 'px', height: M + 'px', left: -M / 2 + 'px', top: -M / 2 + 'px' });
    for (const n of nodes) {
      const r = n.nd.r, pr = n.parent ? n.parent.nd.r : [r[0] + 0.5, r[1] + 0.5];
      Object.assign(n.el.style, { left: (r[0] - pr[0]) * Wp + 'px', top: (r[1] - pr[1]) * Hp + 'px', width: (r[2] - r[0]) * Wp + 'px', height: (r[3] - r[1]) * Hp + 'px' });
      if (n.nd.h) n.el.style.transformOrigin = n.nd.h[0] === 'v' ? `${(n.nd.h[1] - r[0]) * Wp}px 50%` : `50% ${(n.nd.h[1] - r[1]) * Hp}px`;
    }
    for (const { p, pr, node, art } of panels) {
      const r = node.nd.r;
      Object.assign(p.style, { left: (pr[0] - r[0]) * Wp + 'px', top: (pr[1] - r[1]) * Hp + 'px', width: (pr[2] - pr[0]) * Wp + 'px', height: (pr[3] - pr[1]) * Hp + 'px' });
      art.style.left = -pr[0] * Wp + 'px'; art.style.top = -pr[1] * Hp + 'px';
    }
    Object.assign(shadow.style, { width: Wp + 'px', height: Hp + 'px' });
    if (reduce) draw(0.16, 0);
  };

  // strong ease-in-out, cubic-bezier(0.77, 0, 0.175, 1), solved by Newton steps
  const bez = (x1, y1, x2, y2) => x => { let t = x; for (let i = 0; i < 8; i++) { const fx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x, dx = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t; if (Math.abs(fx) < 1e-5 || dx < 1e-6) break; t = Math.min(1, Math.max(0, t - fx / dx)); } return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3; };
  const ease = bez(0.77, 0, 0.175, 1), seg = (c, a, b) => ease(Math.min(1, Math.max(0, (c - a) / (b - a))));
  // rotations in CSS axes (y down, z toward the viewer)
  const rx = (a, v) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
  const ry = (a, v) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
  const rz = (a, v) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
  const Ll = Math.hypot(-0.35, -0.75, 0.56), L = [-0.35 / Ll, -0.75 / Ll, 0.56 / Ll];
  // the timetable: the steps fold in one after another over the first half of the cycle, rest, and open in reverse
  const S = F.steps.length, D = 0.44 / (1 + (S - 1) * F.gap), Du = 0.31 / (1 + (S - 1) * F.gap);
  // a point of the flat sheet (px), carried through a chain of hinges to where it is now
  const carry = (pt, chain) => { let p = pt; for (const n of chain) { const h = n.nd.h, at = h[1] * (h[0] === 'v' ? Wp : Hp), lift = h[4] * e[h[2]];
    p = h[0] === 'v' ? ry(n.ang, [p[0] - at, p[1], p[2]]) : rx(n.ang, [p[0], p[1] - at, p[2]]); if (h[0] === 'v') p[0] += at; else p[1] += at; p[2] += lift; } return p; };

  function draw(c, t) {
    F.steps.forEach((ids, j) => { const a = 0.07 + j * D * F.gap, u = 0.62 + (S - 1 - j) * Du * F.gap, v = c < 0.565 ? seg(c, a, a + D) : 1 - seg(c, u, u + Du); for (const id of ids) e[id] = v; });
    for (let i = 0; i < NC; i++) memory[i] = Math.max(memory[i], e[i]);
    const tilt = (PARAMS.tilt + Math.sin(t * 0.19) * 4) * Math.PI / 180, spin = (-16 + Math.sin(t * 0.23) * 9) * Math.PI / 180;
    scene.style.transform = `rotateX(${tilt}rad) rotateZ(${spin}rad)`;
    for (const n of nodes) {
      if (!n.nd.h) { n.tf = ''; continue; }
      const h = n.nd.h, v = e[h[2]];
      n.ang = h[3] * n.side * Math.PI * amt(h) * v;
      n.tf = `translateZ(${(h[4] * v).toFixed(3)}px) ${h[0] === 'v' ? 'rotateY' : 'rotateX'}(${n.ang.toFixed(5)}rad)`;
      if (n !== nodes[0]) n.el.style.transform = n.tf;
    }
    // shading: each face's normal through its hinges and the view tilt, against the lamp
    const flat = rx(tilt, [0, 0, 1]), base = flat[0] * L[0] + flat[1] * L[1] + flat[2] * L[2], K = PARAMS.crease;
    for (const f of faces) {
      let n = [0, 0, f.back ? -1 : 1];
      for (const q of f.chain) n = q.nd.h[0] === 'v' ? ry(q.ang, n) : rx(q.ang, n);
      n = rx(tilt, rz(spin, n));
      const d = n[0] * L[0] + n[1] * L[1] + n[2] * L[2] - base;
      f.dk.style.opacity = Math.min(0.62, Math.max(0, -d * 0.75)).toFixed(3); f.lt.style.opacity = Math.min(0.35, Math.max(0, d * 0.9)).toFixed(3);
      for (const { s, id } of f.strips) {
        const a = creaseAmt[id], v = f.back ? Math.sin(Math.PI * a * e[id] / 2) * 0.55 : Math.sin(Math.PI * a * e[id]) * 0.85;
        s.style.opacity = Math.min(1, K * (v + memory[id] * (f.back ? 0.1 : 0.16))).toFixed(3);
      }
    }
    // the footprint of the folded sheet on the table: the shadow fills it, and the sheet slides to keep it centred
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const { pr, chain } of panels) for (const [u, w] of [[pr[0], pr[1]], [pr[2], pr[1]], [pr[0], pr[3]], [pr[2], pr[3]]]) {
      const q = carry([u * Wp, w * Hp, 0], chain); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
    const sx = -0.7 * ((x0 + x1) / 2 - Wp / 2), sy = -0.7 * ((y0 + y1) / 2 - Hp / 2);
    sheet.style.transform = `translate3d(${sx.toFixed(2)}px,${sy.toFixed(2)}px,0) ${nodes[0].tf}`;
    let thick = 0; for (let i = 0; i < NC; i++) thick += e[i]; thick = Math.min(2, thick * 0.5);
    shadow.style.transform = `translate3d(${(x0 - Wp / 2 + sx + Hp * 0.012 * (1 + thick)).toFixed(2)}px,${(y0 - Hp / 2 + sy + Hp * 0.018 * (1 + thick)).toFixed(2)}px,-1px) scale(${((x1 - x0) / Wp).toFixed(4)},${((y1 - y0) / Hp).toFixed(4)})`;
    shadow.style.opacity = (0.42 + thick * 0.14).toFixed(3);
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let raf = 0; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, cyc = Math.max(3, PARAMS.cycle);
    draw((t % cyc) / cyc, t);
    raf = requestAnimationFrame(frame);
  }
  if (reduce) draw(0.16, 0); else raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.remove(); };
}
