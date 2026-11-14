// Renders every animation (or one category) in GPU Chromium, saves its poster frame, logs errors,
// checks that it actually moves, and writes a contact sheet.
//   node tools/posters.mjs            all
//   node tools/posters.mjs text fluid only these categories
//   node tools/posters.mjs --leak     also mount/unmount each 3x and watch for errors
//   node tools/posters.mjs hero       only the front page's hero poster (also made with "all" and with the hero's id)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, serve, launch } from './lib.mjs';
import { ANIMS, catById, srcOf } from '../anims/registry.js';
import { HERO, HERO_PARAMS, HERO_POSTER } from '../js/hero.js';

const args = process.argv.slice(2);
const leak = args.includes('--leak');
const cats = args.filter(a => !a.startsWith('--'));
const list = ANIMS.filter(a => !cats.length || cats.includes(a.cat) || cats.includes(a.id));   // categories or single ids
// cards are about 380 CSS px wide at three across: render at 560x448 and 2x, so posters stay sharp on retina screens
const W = 560, H = 448;

const { server, base } = await serve();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
let errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
fs.mkdirSync(path.join(ROOT, 'posters'), { recursive: true });

const report = [];
for (const a of list) {
  errors = [];
  const t0 = Date.now();
  await page.goto(`${base}/stage.html?src=${srcOf(a)}&mode=poster`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 }).catch(() => errors.push('never ready'));
  await page.waitForTimeout(Math.max(200, a.posterAt - 300));
  const shotA = await page.screenshot({ type: 'jpeg', quality: 70 });
  await page.waitForTimeout(300);
  const file = path.join(ROOT, 'posters', `${a.id}.webp`), png = file.replace(/\.webp$/, '.png');
  const raw = await page.screenshot({ type: 'png' });
  fs.writeFileSync(png, raw);
  execFileSync('cwebp', ['-quiet', '-q', '82', '-m', '6', png, '-o', file]);
  fs.rmSync(png);
  const shot = fs.readFileSync(file);
  const moving = Buffer.compare(shotA, shot) !== 0;
  if (leak) {
    for (let i = 0; i < 3; i++) { await page.evaluate(() => window.postMessage({ type: 'replay' }, '*')); await page.waitForTimeout(250); }
  }
  const glContexts = await page.evaluate(() => document.querySelectorAll('canvas').length);
  report.push({ id: a.id, cat: a.cat, ms: Date.now() - t0, kb: Math.round(shot.length / 1024), moving, canvases: glContexts, errors: [...new Set(errors)].filter(e => !e.includes('favicon') && !e.startsWith('Failed to load resource')) });
  const r = report.at(-1);
  console.log(`${r.errors.length ? 'ERR ' : r.moving ? 'ok  ' : 'STILL'} ${a.cat.padEnd(12)} ${a.id.padEnd(20)} ${String(r.kb).padStart(4)}KB${r.errors.length ? '  ' + r.errors.join(' | ') : ''}`);
}

// the front page's hero poster: the live hero's own settings (HERO_PARAMS, light only on a transparent background) as a
// WebP with alpha, shown until the live stage takes over and under reduced motion. The live hero starts from t = 0, so
// the poster is its frame one second in (stepped on the stage's clock, so it is the same every time). The page fits it
// with object-fit: contain, and the attractor fits its shape to 90% of the stage's limiting side: at that moment the
// shape is as wide as it is tall, so a square poster lines up with the live picture in any box, wide or phone-shaped.
if (!cats.length || cats.includes('hero') || list.some(a => a.id === HERO)) {
  const a = ANIMS.find(x => x.id === HERO), S = 620;
  const hp = await browser.newPage({ viewport: { width: S, height: S }, deviceScaleFactor: 2 });
  errors = []; hp.on('pageerror', e => errors.push(e.message));
  await hp.goto(`${base}/stage.html?src=${srcOf(a)}&mode=hero&paused=1&p=${encodeURIComponent(HERO_PARAMS)}`);
  await hp.waitForFunction(() => window.__ready === true, null, { timeout: 15000 }).catch(() => errors.push('never ready'));
  await hp.waitForTimeout(600);                                        // the stage's first resize has cleared the buffer
  await hp.evaluate(() => { for (let i = 0; i < 60; i++) window.__clock.step(); });
  await hp.waitForTimeout(200);
  const file = path.join(ROOT, HERO_POSTER), png = file.replace(/\.webp$/, '.png');
  fs.writeFileSync(png, await hp.screenshot({ type: 'png', omitBackground: true }));
  // rendered at 1240 px and stored at 900: a grainy filigree's alpha is costly (about 110 KB this way, 450 KB at full
  // size with lossless alpha), and the picture is shown at most about 600 CSS px tall
  execFileSync('cwebp', ['-quiet', '-q', '80', '-alpha_q', '60', '-alpha_filter', 'best', '-m', '6', '-resize', '900', '900', png, '-o', file]);
  fs.rmSync(png);
  console.log(`${errors.length ? 'ERR ' : 'ok  '} hero         ${HERO_POSTER}  ${Math.round(fs.statSync(file).size / 1024)}KB${errors.length ? '  ' + errors.join(' | ') : ''}`);
  await hp.close();
}

// contact sheet
if (list.length) {
  const tiles = list.map(a => `<figure><img src="../posters/${a.id}.webp"><figcaption><i style="background:${catById[a.cat].hue}"></i>${a.title}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#eef1f3;font:600 13px system-ui;display:grid;grid-template-columns:repeat(5,1fr);gap:12px}img{width:100%;display:block;border-radius:6px}figure{margin:0}figcaption{margin-top:6px;display:flex;gap:6px;align-items:center}i{width:8px;height:8px;border-radius:50%}</style>${tiles}`;
  fs.writeFileSync(path.join(ROOT, 'tools/.sheet.html'), html);
  const sheet = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  await sheet.goto(`${base}/tools/.sheet.html`);
  await sheet.waitForLoadState('networkidle');
  const out = path.join(ROOT, 'tools', `sheet${cats.length ? '-' + cats.join('-') : ''}.png`);
  await sheet.screenshot({ path: out, fullPage: true });
  console.log('\nsheet:', out);
  const bad = report.filter(r => r.errors.length || !r.moving);
  console.log(bad.length ? `${bad.length} need attention: ${bad.map(b => b.id).join(', ')}` : 'all clean and moving');
}
await browser.close(); server.close();
