// Fetching snippet sources, reading and rewriting their PARAMS line, and wrapping them as standalone pages.
import { srcOf } from '../anims/registry.js';

const cache = new Map();
export async function source(anim) {
  if (!cache.has(anim.id)) cache.set(anim.id, fetch(srcOf(anim)).then(r => { if (!r.ok) throw new Error(`Could not load ${srcOf(anim)}`); return r.text(); }));
  return cache.get(anim.id);
}

const PARAMS_RE = /^const PARAMS = \{([^\n]*)\};/m;
const PAIR_RE = /(\w+)\s*:\s*(-?\d*\.?\d+(?:e-?\d+)?)/g;

export function readParams(src) {
  const m = PARAMS_RE.exec(src); if (!m) return {};
  const out = {}; for (const [, k, v] of m[1].matchAll(PAIR_RE)) out[k] = parseFloat(v);
  return out;
}
export function paramsLineIndex(src) {
  const m = PARAMS_RE.exec(src); return m ? src.slice(0, m.index).split('\n').length - 1 : -1;
}
const decimals = step => { const s = String(step); return s.includes('e-') ? +s.split('e-')[1] : (s.split('.')[1] || '').length; };
export const formatValue = (v, step) => String(+Number(v).toFixed(decimals(step)));

export function writeParams(src, values, ranges) {
  return src.replace(PARAMS_RE, (line, body) => {
    // only touch numbers that actually changed, so untouched values keep their original spelling
    const next = body.replace(PAIR_RE, (pair, k, v) => {
      if (!(k in values)) return pair;
      const step = ranges[k]?.step ?? 0.01, out = formatValue(values[k], step);
      return out === formatValue(parseFloat(v), step) ? pair : `${k}: ${out}`;
    });
    return `const PARAMS = {${next}};`;
  });
}

// Share links carry tuned values as "pieces=300&gravity=0.6": only the keys that differ from the defaults.
export function encodeParams(values, defaults, ranges) {
  return Object.keys(ranges).filter(k => k in values && formatValue(values[k], ranges[k].step) !== formatValue(defaults[k], ranges[k].step))
    .map(k => `${k}=${formatValue(values[k], ranges[k].step)}`).join('&');
}
// The safety gate: URL values end up in code that runs. Only the animation's own slider keys pass, only finite
// numbers, clamped to the slider's range and snapped to its step, so nothing but a number can reach the PARAMS line.
export function parseParams(query, ranges) {
  const out = {};
  for (const [k, raw] of new URLSearchParams(query || '')) {
    const r = Object.hasOwn(ranges, k) ? ranges[k] : null;
    if (!r || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(raw.trim())) continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const snapped = r.min + Math.round((Math.min(r.max, Math.max(r.min, v)) - r.min) / r.step) * r.step;
    out[k] = +formatValue(Math.min(r.max, Math.max(r.min, snapped)), r.step);
  }
  return out;
}

// "Copy as prompt": everything an AI coding assistant needs to fit the effect into someone's project: what it is, why
// it works, the numbers worth tuning (with their current values) and the exact code, plus the mount/cleanup contract.
const KIND = { dom: 'DOM elements and CSS/WAAPI', canvas: 'a 2D canvas', webgl: 'a WebGL canvas' };
export function promptFor(anim, code, catName = anim.cat) {
  const now = readParams(code);
  const settings = Object.entries(anim.params).filter(([k]) => k in now)
    .map(([k, r]) => r.options ? `- ${k}: ${now[k]} (${r.options.map((o, i) => `${i} ${o}`).join(', ')}) · ${r.label}`
      : `- ${k}: ${formatValue(now[k], r.step)} (range ${r.min}–${r.max}, step ${r.step}) · ${r.label}`);
  return [
    `Help me fit this animation into my project. Adapt it to my stack and my design; keep the motion itself as it is unless I ask.`,
    ``,
    `Animation: ${anim.title} (Motion Library, ${catName})`,
    `The trick: ${anim.trick}`,
    `Draws with: ${KIND[anim.kind] || anim.kind}`,
    ``,
    `How it works:`,
    ...anim.notes.map(n => `- ${n}`),
    ...(settings.length ? [``, `Settings in the PARAMS line (current value):`, ...settings] : []),
    ``,
    `How the code is built:`,
    `- Plain JavaScript, no libraries. The default export takes a container element, draws into it, sizes itself to it, and returns a cleanup function.`,
    `- Keep that contract: mount it when the component mounts (useEffect, onMounted, connectedCallback…) and call the cleanup when it unmounts.`,
    `- Give the container a size. Respect prefers-reduced-motion in my project (show a still frame or skip it).`,
    `- Licence: MIT-0, free to use and change without credit.`,
    ``,
    `My project: [say where it goes and what it should fit, e.g. "behind the hero heading of my Next.js landing page, in our brand colours"]`,
    ``,
    '```js',
    code.trimEnd(),
    '```',
    ``,
  ].join('\n');
}

// A runnable single-file page: the module's default export becomes a plain function called on #stage.
export function standalone(src, title) {
  const body = src.replace(/export default function\s*\(/, 'function mount(');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, '&lt;')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@75..125,200..900&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; }
  body { font-family: "Mona Sans", system-ui, sans-serif; }
  #stage { position: fixed; inset: 0; overflow: hidden; }
</style>
</head>
<body>
<div id="stage"></div>
<script type="module">
${body}
document.fonts.ready.then(() => mount(document.getElementById('stage')));
</script>
</body>
</html>
`;
}

export function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/html' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
