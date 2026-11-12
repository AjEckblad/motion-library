// node look.mjs anims/flow/x.js 1000,3000,6000 [900x560] [--fps] [--move] [--reduce]
// --reduce emulates prefers-reduced-motion: reduce (shots are then named <name>-reduce-<t>.png)
// Renders the stage at the given times (ms after ready), saves PNGs to tools/.look/<name>-<t>.png, and with more than
// one time also a contact sheet, tools/.look/<name>-sheet.png (3 across, in time order; needs ffmpeg)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { serve, launch } from './lib.mjs';
const args = process.argv.slice(2);
const src = args[0], times = (args[1] || '1500').split(',').map(Number);
const size = (args.find(a => /^\d+x\d+$/.test(a)) || '900x560').split('x').map(Number);
const fps = args.includes('--fps'), move = args.includes('--move'), reduceMotion = args.includes('--reduce');
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '.look');
fs.mkdirSync(OUT, { recursive: true });
const name = path.basename(src, '.js') + (reduceMotion ? '-reduce' : '');
const { server, base } = await serve(); const browser = await launch();
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, reducedMotion: reduceMotion ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
await page.goto(`${base}/stage.html?src=${src}&mode=detail`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 }).catch(() => errors.push('never ready'));
const t0 = Date.now();
if (move) {
  // sweep the pointer across the stage in a slow figure eight during the run
  (async () => { for (let i = 0; i < 4000 && !page.isClosed(); i++) { const a = i / 60; try { await page.mouse.move(size[0] * (0.5 + 0.32 * Math.sin(a)), size[1] * (0.5 + 0.28 * Math.sin(a * 2))); } catch { break; } await new Promise(r => setTimeout(r, 30)); } })();
}
const shots = [];
for (const t of times) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const f = path.join(OUT, `${name}-${t}.png`);
  await page.screenshot({ path: f });
  console.log(f); shots.push(f);
}
if (fps) {
  const r = await page.evaluate(() => new Promise(res => { const raf = window.__clock.realRAF, now = window.__clock.realNow; const ts = []; const f = () => { ts.push(now()); if (ts.length < 90) raf(f); else { const d = ts.slice(1).map((v, i) => v - ts[i]).sort((a, b) => a - b); res({ med: d[d.length >> 1], p95: d[Math.floor(d.length * 0.95)] }); } }; raf(f); }));
  console.log(`fps: median ${r.med.toFixed(1)} ms  p95 ${r.p95.toFixed(1)} ms  (~${Math.round(1000 / r.med)} fps)`);
}
if (shots.length > 1) {
  const C = Math.min(3, shots.length), w = 450, h = Math.round(w * size[1] / size[0]) & ~1;
  const scale = shots.map((_, i) => `[${i}]scale=${w}:${h}[s${i}]`).join(';');
  const layout = shots.map((_, i) => `${(i % C) * w}_${Math.floor(i / C) * h}`).join('|');
  const out = path.join(OUT, `${name}-sheet.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...shots.flatMap(f => ['-i', f]), '-filter_complex',
    `${scale};${shots.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${shots.length}:layout=${layout}:fill=black`, '-frames:v', '1', out]);
  console.log('sheet:', out);
}
if (errors.length) console.log('ERRORS:', [...new Set(errors)].join('\n'));
await browser.close(); server.close();
