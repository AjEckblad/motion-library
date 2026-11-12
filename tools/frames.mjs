// node tools/frames.mjs anims/chrome/portal.js 9000,9050,9100 [900x560] [--reduce] [--tag x]
// Frame-exact (tools/look.mjs is real time, ±50 ms): loads the stage paused and steps the virtual clock 1/60 s at a
// time to each time (ms), then shoots to tools/.look/<name>-<t>.png, plus <name>-sheet.png with more than one time.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { serve, launch } from './lib.mjs';
const args = process.argv.slice(2);
const src = args[0], times = args[1].split(',').map(Number).sort((a, b) => a - b);
const size = (args.find(a => /^\d+x\d+$/.test(a)) || '900x560').split('x').map(Number);
const reduce = args.includes('--reduce'), ti = args.indexOf('--tag'), tag = ti > 0 ? args[ti + 1] : '';
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '.look');
fs.mkdirSync(OUT, { recursive: true });
const name = path.basename(src, '.js') + (reduce ? '-reduce' : '') + (tag ? '-' + tag : '');
const { server, base } = await serve(); const browser = await launch();
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}/stage.html?src=${src}&mode=detail&paused=1`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
await page.waitForTimeout(300);
const shots = []; let done = 0;
for (const t of times) {
  const n = Math.round(t / (1000 / 60)) - done;
  await page.evaluate(async n => { for (let i = 0; i < n; i++) { window.__clock.step(); if (i % 30 === 29) await new Promise(r => window.__clock.realRAF(r)); } await new Promise(r => window.__clock.realRAF(() => window.__clock.realRAF(r))); }, n);
  done += n;
  const f = path.join(OUT, `${name}-${t}.png`);
  await page.screenshot({ path: f }); shots.push(f);
}
const C = Math.min(3, shots.length), w = 450, h = Math.round(w * size[1] / size[0]) & ~1;
if (shots.length > 1) {
  const out = path.join(OUT, `${name}-sheet.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...shots.flatMap(f => ['-i', f]), '-filter_complex',
    `${shots.map((_, i) => `[${i}]scale=${w}:${h}[s${i}]`).join(';')};${shots.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${shots.length}:layout=${shots.map((_, i) => `${(i % C) * w}_${Math.floor(i / C) * h}`).join('|')}:fill=black`, '-frames:v', '1', out]);
  console.log('sheet:', out);
} else console.log(shots[0]);
if (errors.length) console.log('ERRORS:', [...new Set(errors)].join('\n'));
await browser.close(); server.close();
