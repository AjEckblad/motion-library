// The crawler-readable side of the site, generated from the registry: run it after every catalogue change.
//   node tools/build-static.mjs                    (SITE_URL=https://example.com node tools/build-static.mjs for absolute URLs + sitemap)
// Writes:
//   index.html      the catalogue and the FAQ as real HTML (app.js replaces them when it runs) + JSON-LD in <head>
//   fx/<id>.html    one static page per effect: answer first, question headings, a spec table, the code, JSON-LD
//   llms.txt, llms-full.txt, fx-index.json, robots.txt, sitemap.xml (only with SITE_URL)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANIMS, CATEGORIES, catById, srcOf } from '../anims/registry.js';
import { ZH } from '../anims/i18n-zh.js';
import { FAQ } from '../js/faq.js';
import { readParams, formatValue } from '../js/code.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const abs = p => (SITE ? `${SITE}/${p}` : p);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const KIND = { dom: 'DOM (CSS and the Web Animations API)', canvas: 'Canvas 2D', webgl: 'WebGL' };
const KIND_SHORT = { dom: 'DOM', canvas: 'Canvas', webgl: 'WebGL' };
// sentence-case a clause after a colon, but keep acronyms and names (SDF, CMYK, Voronoi)
const lowerFirst = t => /^[A-Z](?![A-Z0-9])/.test(t) && !/^I\b/.test(t) && !/^(Voronoi|Truchet|Julia|Mandelbrot|Langton|Conway|Lissajous|Chladni|Kelvin|Roche|Verlet|Bézier|Perlin|Worley|Möbius|Escher|Barnsley|Sierpinski|Heighway|Clifford|Brian|Doom|Bauhaus|Memphis|Gielis)/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
const json = o => JSON.stringify(o, null, 1).replace(/</g, '\\u003c');
const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); fs.writeFileSync(path.join(ROOT, rel), text); };
const replaceBetween = (src, start, end, inner) => {
  const a = src.indexOf(start), b = src.indexOf(end);
  if (a < 0 || b < 0) throw new Error(`markers ${start} … ${end} missing`);
  return src.slice(0, a + start.length) + inner + src.slice(b);
};

// everything about one effect that the pages, llms.txt and the index share
const fx = ANIMS.map(a => {
  const code = fs.readFileSync(path.join(ROOT, srcOf(a)), 'utf8');
  const defaults = readParams(code);
  const settings = Object.entries(a.params).filter(([k]) => k in defaults).map(([k, r]) => ({ key: k, flag: `--${k}`, label: r.label, default: defaults[k], min: r.min, max: r.max, step: r.step }));
  const cat = catById[a.cat];
  return {
    a, cat, code, settings,
    bytes: Buffer.byteLength(code),
    reduced: /prefers-reduced-motion/.test(code),
    page: `fx/${a.id}.html`, live: `index.html#/a/${a.id}`,
    npx: `npx motion-library add ${a.id}`,
    tldr: `${a.title} is a ${KIND_SHORT[a.kind]} effect: ${lowerFirst(a.trick.replace(/\.$/, ''))}. One plain JavaScript file with no dependencies; add it with npx motion-library add ${a.id}.`,
  };
});

/* ───────── fx/<id>.html ───────── */
for (const f of fx) {
  const { a, cat } = f;
  const [what, ...how] = a.notes;
  const example = f.settings[0] ? `${f.npx} ${f.settings[0].flag} ${formatValue(f.settings[0].max, f.settings[0].step)}` : f.npx;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: a.title, description: a.trick,
    programmingLanguage: 'JavaScript', runtimePlatform: 'Web browser', license: 'https://spdx.org/licenses/MIT-0.html',
    codeSampleType: 'full solution', keywords: [cat.name, KIND_SHORT[a.kind], 'web animation', 'JavaScript'].join(', '),
    url: abs(f.page), image: abs(`posters/${a.id}.webp`), isPartOf: { '@type': 'WebSite', name: 'Motion Library', url: abs('index.html') },
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Motion Library', item: abs('index.html') },
      { '@type': 'ListItem', position: 2, name: cat.name, item: abs(`index.html#/c/${cat.id}`) },
      { '@type': 'ListItem', position: 3, name: a.title, item: abs(f.page) },
    ],
  }];
  const rows = f.settings.map(s => `<tr><td>${esc(s.label)}</td><td><code>${esc(s.flag)}</code></td><td>${esc(formatValue(s.default, s.step))}</td><td>${esc(s.min)} to ${esc(s.max)}</td><td>${esc(s.step)}</td></tr>`).join('\n');
  write(f.page, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(a.title)}: ${esc(a.trick)} · Motion Library</title>
<meta name="description" content="${esc(f.tldr)}">
${SITE ? `<link rel="canonical" href="${esc(abs(f.page))}">\n` : ''}<meta name="theme-color" content="#0c0c0e">
<meta property="og:title" content="${esc(a.title)} · Motion Library">
<meta property="og:description" content="${esc(a.trick)}">
<meta property="og:image" content="${esc(abs(`posters/${a.id}.webp`))}">
<link rel="stylesheet" href="../css/static.css">
<script type="application/ld+json">${json(ld)}</script>
</head>
<body>
<header class="s-bar"><a href="../index.html">Motion Library</a><span>/</span><a href="../index.html#/c/${cat.id}">${esc(cat.name)}</a></header>
<main class="s-page">
<article>
<h1>${esc(a.title)}</h1>
<p class="tldr">${esc(f.tldr)}</p>
<figure><img src="../posters/${a.id}.webp" alt="${esc(`${a.title}: ${a.trick}`)}" width="1120" height="896"></figure>
<p><a class="s-btn" href="../${f.live}">Open it live, tune it and copy the code</a></p>

<h2>What is ${esc(a.title)}?</h2>
<p>${esc(what || a.trick)}</p>

<h2>How does ${esc(a.title)} work?</h2>
${(how.length ? how : [a.trick]).map(n => `<p>${esc(n)}</p>`).join('\n')}

<h2>How do I add ${esc(a.title)} to my website?</h2>
<ol>
<li>In your project folder, run <code>${esc(f.npx)}</code>. It writes <code>animations/${a.id}.js</code>. Needs Node 18 or newer.</li>
<li>Import it and call it with a container element that has a size: <code>import fx from './animations/${a.id}.js'; const stop = fx(document.querySelector('#hero'));</code></li>
<li>Call <code>stop()</code> to clean up, for example when a component unmounts.</li>
</ol>
<p>Every setting below is also a flag, so you can install it already tuned: <code>${esc(example)}</code>.</p>

<h2>What settings can I tweak?</h2>
${f.settings.length ? `<table>
<thead><tr><th>Setting</th><th>Flag</th><th>Default</th><th>Range</th><th>Step</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>` : '<p>This one has no settings: it is tuned in the code.</p>'}

<h2>Specifications</h2>
<dl>
<dt>Renderer</dt><dd>${esc(KIND[a.kind])}</dd>
<dt>Category</dt><dd>${esc(cat.name)}</dd>
<dt>Dependencies</dt><dd>None</dd>
<dt>File size</dt><dd>${(f.bytes / 1024).toFixed(1)} KB, unminified</dd>
<dt>Interactive</dt><dd>${a.pointer ? 'Yes: it responds to the pointer' : a.scroll ? 'Yes: it follows scrolling' : 'No: it plays on its own'}</dd>
<dt>Reduced motion</dt><dd>${f.reduced ? 'Respects prefers-reduced-motion' : 'Plays the same for everyone'}</dd>
<dt>Licence</dt><dd>MIT-0: use it anywhere, no credit needed</dd>
</dl>

<h2>Source code</h2>
<pre><code>${esc(f.code)}</code></pre>
</article>
</main>
</body>
</html>
`);
}

/* ───────── index.html: the catalogue and the FAQ as real HTML, plus JSON-LD ───────── */
const sections = CATEGORIES.map(c => {
  const items = fx.filter(f => f.a.cat === c.id); if (!items.length) return '';
  return `<section class="cat-sec" id="sec-${c.id}" data-cat="${c.id}" style="--hue:${c.hue}"><div class="cat-head"><h2>${esc(c.name)}</h2><span class="cat-count">${items.length} animations</span></div><div class="grid">
${items.map(f => `<article class="card" style="--hue:${c.hue}"><a class="card-link" href="${f.page}"><div class="card-media"><img src="posters/${f.a.id}.webp" alt="" loading="lazy" decoding="async"></div><div class="card-meta"><h3 class="card-title"><i class="cat-dot" aria-hidden="true"></i><span>${esc(f.a.title)}</span></h3><span class="kind">${KIND_SHORT[f.a.kind]}</span><p class="trick">${esc(f.a.trick)}</p></div></a></article>`).join('\n')}
</div></section>`;
}).join('\n');
const faqHtml = `<h2 id="faq-title">Questions</h2><div class="faq-list">
${FAQ.en.map(([q, ans]) => `<details class="faq-item"><summary><h3>${esc(q)}</h3><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5"/></svg></summary><p>${esc(ans)}</p></details>`).join('\n')}
</div>`;
const siteLd = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Motion Library', url: abs('index.html'), inLanguage: ['en', 'zh-Hans', 'es', 'fr'],
    description: `${ANIMS.length} hand-made web animations and effects. Each one is a single plain JavaScript file with no dependencies, tunable live and installable with npx.` },
  { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Motion Library effects', numberOfItems: fx.length,
    itemListElement: fx.map((f, i) => ({ '@type': 'ListItem', position: i + 1, name: f.a.title, url: abs(f.page) })) },
  { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.en.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })) },
];
let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
index = replaceBetween(index, '<!--static:grid-->', '<!--/static:grid-->', `\n${sections}\n`);
index = replaceBetween(index, '<!--static:faq-->', '<!--/static:faq-->', faqHtml);
index = replaceBetween(index, '<!--static:ld-->', '<!--/static:ld-->', `<script type="application/ld+json">${json(siteLd)}</script>`);
write('index.html', index);

/* ───────── llms.txt, llms-full.txt, fx-index.json ───────── */
const intro = `# Motion Library

> ${ANIMS.length} hand-made web animations and effects. Each one is a single plain JavaScript file with no dependencies: watch it live, read how it works, tune it with sliders, then copy the code or install it with \`npx motion-library add <id>\`. Every slider is also a CLI flag, so \`npx motion-library add confetti --pieces 300\` installs it already tuned. Licence: MIT-0.

## Install

- \`npx motion-library list\` lists every effect.
- \`npx motion-library add <id> [--setting value ...]\` writes \`animations/<id>.js\` into the current project (Node 18+).
- Each file's default export takes a sized container element, draws into it and returns a cleanup function.
- \`npx motion-library prompt <id>\` prints a prompt for an AI coding assistant with the notes, settings and code.
`;
const byCat = (line) => CATEGORIES.map(c => {
  const items = fx.filter(f => f.a.cat === c.id); if (!items.length) return '';
  return `\n## ${c.name}\n\n${items.map(line).join('\n')}\n`;
}).join('');
write('llms.txt', `${intro}${byCat(f => `- [${f.a.title}](${abs(f.page)}): ${f.a.trick}. \`${f.npx}\``)}
## Optional

- [llms-full.txt](${abs('llms-full.txt')}): every effect's notes and settings in one file
- [fx-index.json](${abs('fx-index.json')}): the catalogue as JSON
- [compare.html](${abs('compare.html')}): how Motion Library compares with Magic UI, Aceternity UI, React Bits, Animata and fx-lab
`);
write('llms-full.txt', `${intro}${byCat(f => `### ${f.a.title}\n\n${f.tldr}\n\n${f.a.notes.join('\n\n')}\n\nSettings: ${f.settings.map(s => `${s.flag} ${formatValue(s.default, s.step)} (${s.min} to ${s.max}, step ${s.step}; ${s.label})`).join('; ') || 'none'}.\nRenderer: ${KIND[f.a.kind]}. Size: ${(f.bytes / 1024).toFixed(1)} KB. Reduced motion: ${f.reduced ? 'yes' : 'no'}. Page: ${abs(f.page)}\n`)}`);
write('fx-index.json', JSON.stringify({
  name: 'Motion Library', count: fx.length, license: 'MIT-0', install: 'npx motion-library add <id> [--setting value]',
  effects: fx.map(f => ({
    id: f.a.id, title: f.a.title, titleZh: ZH[f.a.id]?.title ?? null, category: f.cat.name, categoryId: f.cat.id,
    renderer: KIND_SHORT[f.a.kind], description: f.a.trick, descriptionZh: ZH[f.a.id]?.trick ?? null,
    page: abs(f.page), live: abs(f.live), npx: f.npx, interactive: !!(f.a.pointer || f.a.scroll), reducedMotion: f.reduced, bytes: f.bytes,
    settings: f.settings,
  })),
}, null, 1));

/* ───────── compare.html: verified facts only, each with its source, checked on the date below ───────── */
const CHECKED = '2026-11-11';
const LIBS = [
  { name: 'Motion Library', url: 'index.html', framework: 'None: plain JavaScript, one file per effect', install: '<code>npx motion-library add &lt;id&gt;</code>, Copy, or Download .html', tune: 'Yes: sliders on every effect, carried into the install command as flags', price: 'Free', licence: 'MIT-0', count: `${ANIMS.length} effects`, lang: 'JavaScript', src: [] },
  { name: 'Magic UI', url: 'https://magicui.design/', framework: 'React, TypeScript, Tailwind CSS and Motion', install: 'Copy and paste', tune: 'Not stated', price: 'Free; Magic UI Pro $199 once', licence: 'MIT', count: '150+ components and effects', lang: 'TypeScript',
    src: ['https://magicui.design/', 'https://magicui.design/docs', 'https://github.com/magicuidesign/magicui'] },
  { name: 'Aceternity UI', url: 'https://ui.aceternity.com/', framework: 'React 19, Tailwind CSS v4 and Motion', install: 'Copy and paste, or <code>npx shadcn@latest add @aceternity/…</code>', tune: 'Not stated', price: 'Free components; All-Access from $169 (1 year) or $199 (lifetime)', licence: 'Free components: not stated; Pro: Aceternity License', count: '100+ to 118+ free components (both stated)', lang: 'TypeScript (.tsx)',
    src: ['https://ui.aceternity.com/', 'https://ui.aceternity.com/pricing', 'https://ui.aceternity.com/installation', 'https://ui.aceternity.com/licence'] },
  { name: 'React Bits', url: 'https://reactbits.dev/', framework: 'React (plain CSS or Tailwind)', install: '<code>npx shadcn@latest add @react-bits/…</code>, jsrepo, or copy', tune: 'Yes: live demo with controls', price: 'Free; React Bits Pro (price not stated)', licence: 'MIT + Commons Clause', count: '215+ components and backgrounds', lang: 'JavaScript or TypeScript',
    src: ['https://reactbits.dev/', 'https://reactbits.dev/get-started/installation', 'https://github.com/DavidHDev/react-bits'] },
  { name: 'Animata', url: 'https://animata.design/', framework: 'React and Tailwind CSS (Framer Motion optional)', install: 'Copy the file into your project', tune: 'Not stated', price: 'Free', licence: 'MIT', count: '157+ components', lang: 'TypeScript',
    src: ['https://animata.design/', 'https://animata.design/docs', 'https://github.com/codse/animata'] },
  { name: 'fx-lab', url: 'https://fx.rosuh.me/', framework: 'None: zero-dependency WebGL2, Canvas 2D and DOM', install: 'Copy one self-contained snippet', tune: 'Not stated', price: 'Not stated', licence: 'MIT', count: '99 effects', lang: 'Not stated',
    src: ['https://github.com/rosuh/fx-lab', 'https://fx.rosuh.me/'] },
];
const rowsC = [['Framework', 'framework'], ['How you install', 'install'], ['Tune before you take it', 'tune'], ['Price', 'price'], ['Licence', 'licence'], ['Size', 'count'], ['Language', 'lang']];
write('compare.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Motion Library vs Magic UI, Aceternity UI, React Bits, Animata and fx-lab</title>
<meta name="description" content="How Motion Library compares with Magic UI, Aceternity UI, React Bits, Animata and fx-lab: framework, install, tuning, price, licence and size, from each project’s own pages (checked ${CHECKED}).">
${SITE ? `<link rel="canonical" href="${esc(abs('compare.html'))}">\n` : ''}<meta name="theme-color" content="#0c0c0e">
<link rel="stylesheet" href="css/static.css">
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@type': 'Article', headline: 'Motion Library compared with Magic UI, Aceternity UI, React Bits, Animata and fx-lab', dateModified: CHECKED, about: LIBS.map(l => ({ '@type': 'SoftwareApplication', name: l.name, url: l.url.startsWith('http') ? l.url : abs(l.url) })) })}</script>
<style>.cmp-wrap{overflow-x:auto}.cmp th:first-child{position:sticky;left:0;background:var(--frame)}.cmp td,.cmp th{min-width:170px;font-size:14px}.src{font-size:13px;color:var(--muted)}.src a{color:var(--muted)}</style>
</head>
<body>
<header class="s-bar"><a href="index.html">Motion Library</a><span>/</span><span>Compare</span></header>
<main class="s-page" style="max-width:1100px">
<article>
<h1>How does Motion Library compare with other animation libraries?</h1>
<p class="tldr">Of these six, Motion Library is the only one that both runs without a framework and lets you tune an effect on the site, then install it already tuned with one npx command. Magic UI, Aceternity UI, React Bits and Animata are React component libraries; fx-lab is, like Motion Library, framework-free plain code.</p>
<p class="src">Facts below come only from each project’s own website or repository, checked on ${CHECKED}. “Not stated” means those pages don’t say.</p>

<h2>Side by side</h2>
<div class="cmp-wrap"><table class="cmp">
<thead><tr><th></th>${LIBS.map(l => `<th><a href="${esc(l.url)}">${esc(l.name)}</a></th>`).join('')}</tr></thead>
<tbody>
${rowsC.map(([label, k]) => `<tr><th>${label}</th>${LIBS.map(l => `<td>${l[k]}</td>`).join('')}</tr>`).join('\n')}
</tbody>
</table></div>

<h2>Which animation library works without React?</h2>
<p>Motion Library and fx-lab. Every Motion Library effect is one plain JavaScript file whose default export takes a container element, so it runs in plain HTML, React, Vue, Svelte or Astro alike. Magic UI, Aceternity UI, React Bits and Animata are built for React.</p>

<h2>Which one lets me install an effect already tuned?</h2>
<p>Motion Library: every slider on the site is also a CLI flag, so <code>npx motion-library add confetti --pieces 300</code> writes the file with your values in it. React Bits has live controls on its demos; its pages don’t say whether the install command carries them.</p>

<h2>Which ones are completely free?</h2>
<p>Motion Library (MIT-0) and Animata (MIT) state no paid tier. Magic UI, Aceternity UI and React Bits keep free components and sell a Pro tier. fx-lab’s pages don’t mention price; its licence is MIT.</p>

<h2>Where do these facts come from?</h2>
<ul class="src">
${LIBS.filter(l => l.src.length).map(l => `<li>${esc(l.name)}: ${l.src.map(u => `<a href="${esc(u)}">${esc(u.replace(/^https:\/\//, ''))}</a>`).join(', ')}</li>`).join('\n')}
</ul>
</article>
</main>
</body>
</html>
`);

/* ───────── robots.txt, sitemap.xml ───────── */
const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'DuckAssistBot'];
write('robots.txt', `# Every crawler is welcome, AI crawlers included. Start with /llms.txt for a clean overview.
User-agent: *
Allow: /

${bots.map(b => `User-agent: ${b}\nAllow: /`).join('\n\n')}
${SITE ? `\nSitemap: ${SITE}/sitemap.xml\n` : ''}`);
if (SITE) write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['index.html', 'compare.html', 'llms.txt', ...fx.map(f => f.page)].map(u => `<url><loc>${esc(abs(u))}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`static: index.html, compare.html, ${fx.length} pages in fx/, llms.txt, llms-full.txt, fx-index.json, robots.txt${SITE ? ', sitemap.xml' : ' (no SITE_URL: relative links, no sitemap)'}`);
