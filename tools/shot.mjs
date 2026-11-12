// Quick screenshots of the app: node tools/shot.mjs [hash] [width] [height] [name]
import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';
const [hash = '', w = '1440', h = '900', name = 'shot', dsf = '1'] = process.argv.slice(2);
const { server, base } = await serve();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dsf });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}/index.html${hash}`);
await page.waitForTimeout(1500);
const out = path.join(ROOT, 'tools', `${name}.png`);
await page.screenshot({ path: out });
console.log(out); if (errors.length) console.log('errors:', [...new Set(errors)]);
await browser.close(); server.close();
