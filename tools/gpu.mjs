// GPU frame time of one WebGL piece, measured with EXT_disjoint_timer_query_webgl2 on the paused stage's virtual clock.
//   node tools/gpu.mjs anims/chrome/terrain-flyover.js [1440x620] [--dpr 2] [--p "points=0.4&background=1"] [--warm 240]
// Prints canvas size, wall and GPU median / p90 (ms). Other test runs share the GPU: if numbers jump, compare
// variants in interleaved A/B runs rather than trusting one reading. Budget: about 8 ms at 1440x620, DPR 2.
import { serve, launch } from './lib.mjs';
const args = process.argv.slice(2);
const src = args[0];
if (!src) { console.log('usage: node tools/gpu.mjs anims/<cat>/<id>.js [WxH] [--dpr 2] [--p "k=v&k=v"] [--warm 240]'); process.exit(1); }
const opt = k => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : null; };
const size = (args.find(a => /^\d+x\d+$/.test(a)) || '1440x620').split('x').map(Number);
const dpr = Number(opt('--dpr') || 2), warm = Number(opt('--warm') || 240), p = opt('--p');
const { server, base } = await serve(); const browser = await launch();
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: dpr });
page.on('pageerror', e => console.log('page error:', e.message));
await page.goto(`${base}/stage.html?src=${src}&mode=detail&paused=1${p ? '&p=' + encodeURIComponent(p) : ''}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
await page.waitForTimeout(2500);   // pieces may spread their start-up over a few idle frames
const r = await page.evaluate(async warm => {
  const cv = document.querySelector('canvas');
  const gl = cv && (cv.getContext('webgl2'));
  if (!gl) return { error: 'no WebGL2 canvas on the stage' };
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return { error: 'EXT_disjoint_timer_query_webgl2 not available' };
  const px = new Uint8Array(4), c = window.__clock, now = c.realNow;
  for (let i = 0; i < warm; i++) c.step();
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const wall = [], qs = [];
  for (let k = 0; k < 100; k++) {
    const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    const t0 = now(); c.step(); gl.endQuery(ext.TIME_ELAPSED_EXT); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    wall.push(now() - t0); qs.push(q);
  }
  await new Promise(res => c.realSetTimeout(res, 600));
  const g = qs.map(q => gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) ? gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6 : NaN).filter(Number.isFinite);
  const pct = (a, f) => { a = [...a].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * f))].toFixed(2) : 'n/a'; };
  return { canvas: `${cv.width}x${cv.height}`, wallMed: pct(wall, .5), wallP90: pct(wall, .9), gpuMed: pct(g, .5), gpuP90: pct(g, .9), samples: g.length, disjoint: gl.getParameter(ext.GPU_DISJOINT_EXT) };
}, warm);
console.log(r.error ? r.error : `${src} at ${size.join('x')} DPR ${dpr}: canvas ${r.canvas}, GPU ${r.gpuMed} ms median / ${r.gpuP90} p90 (${r.samples} samples${r.disjoint ? ', disjoint: rerun' : ''}), wall ${r.wallMed} / ${r.wallP90}`);
await browser.close(); server.close();
