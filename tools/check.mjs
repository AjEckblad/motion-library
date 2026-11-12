// End-to-end checks of the catalogue UI in GPU Chromium. Prints PASS/FAIL per check.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { ROOT, serve, launch } from './lib.mjs';
import { animById, ANIMS } from '../anims/registry.js';
import { standalone } from '../js/code.js';

const { server, base } = await serve();
const browser = await launch();
const results = [];
const check = (name, ok, info = '') => { results.push([ok, name, info]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  · ' + info : ''}`); };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'], ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) page.errors.push(m.text()); });
  return page;
}

const page = await newPage();
await page.goto(`${base}/index.html`);
await page.waitForTimeout(800);
check(`grid shows all ${ANIMS.length} cards`, (await page.locator('#grid .card').count()) === ANIMS.length);
check('sound is off by default', (await page.getAttribute('#sound', 'aria-pressed')) === 'false');

// hover preview
const first = page.locator('#grid .card').first();
await first.hover();
await page.waitForTimeout(900);
check('hovering a card mounts a live preview', await first.locator('iframe.live').count() === 1);
await page.mouse.move(5, 500); await page.waitForTimeout(400);
check('leaving the card removes the preview', await page.locator('#grid iframe').count() === 0);
// a playing card hands the pointer to the effect: no click needed to steer it (regression: the 2px lift once put the
// preview under the card's hit button, so no pointer event ever reached it), and a click inside still opens the card
{
  const mb = page.locator('.card[data-id="metaballs"]'); await mb.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  const b = await mb.locator('.card-media').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(1200);
  const fr = page.frames().find(f => f.url().includes('metaballs') && f.url().includes('preview'));
  await fr?.evaluate(() => { window.__moves = 0; addEventListener('pointermove', () => window.__moves++, true); });
  await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.3, { steps: 6 }); await page.waitForTimeout(200);
  check('hovering a pointer card steers it without a click', (await fr?.evaluate(() => window.__moves)) > 0);
  await page.mouse.click(b.x + b.width * 0.2, b.y + b.height * 0.3); await page.waitForTimeout(900);
  check('a click inside a playing preview opens the card', await page.evaluate(() => location.hash === '#/a/metaballs' && !document.querySelector('#detail').hidden));
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
}
// keyboard focus still plays a card (a mouse press must not: see js/app.js focusin)
await page.mouse.move(5, 500);
await page.evaluate(() => document.querySelector('#grid .card .card-hit').blur());
await page.focus('#grid .card .card-hit'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(900);
check('keyboard focus on a card plays its preview', await page.locator('#grid .card.is-live').count() === 1);
await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(400);

// dial
await page.locator('.dial-item[data-id="text"]').click();
await page.waitForTimeout(700);
// the full list is one page of sections: a category scrolls its section to the top, the rest stay on the page
const secTop = await page.evaluate(() => document.querySelector('#sec-text')?.getBoundingClientRect().top ?? -1);
check('dial scrolls to the category section', secTop >= 0 && secTop < 140 && (await page.locator('#sec-text .card').count()) === ANIMS.filter(a => a.cat === 'text').length && page.url().endsWith('#/c/text'), `section top ${Math.round(secTop)}px`);
await page.mouse.wheel(0, 3000); await page.waitForTimeout(500);
check('the dial follows the scroll', (await page.getAttribute('.dial-item[data-id="text"]', 'aria-checked')) === 'false');
await page.locator('.dial-item[data-id="text"]').click(); await page.waitForTimeout(900);
check('dial marks the chosen entry', (await page.getAttribute('.dial-item[data-id="text"]', 'aria-checked')) === 'true');
// a magnified dial word never crosses into the grid, however long it is
{
  let worst = Infinity, at = '', least = Infinity, small = '';
  for (const id of await page.$$eval('.dial-item', els => els.map(e => e.dataset.id))) {
    const b = await page.locator(`.dial-item[data-id="${id}"] .lbl`).boundingBox();
    await page.mouse.move(b.x + b.width - 8, b.y + b.height / 2); await page.waitForTimeout(450);
    const [gap, sc] = await page.evaluate(id => { const l = document.querySelector(`.dial-item[data-id="${id}"] .lbl`), m = getComputedStyle(l).transform; return [l.getBoundingClientRect().left - document.querySelector('#dial').getBoundingClientRect().left, m === 'none' ? 1 : +m.match(/matrix\(([^,]+)/)[1]]; }, id);
    if (gap < worst) { worst = gap; at = id; }
    if (sc < least) { least = sc; small = id; }
  }
  check('hovered dial words stay inside the dial column', worst >= 0, `closest: ${at} at ${Math.round(worst)}px`);
  // and they still swell fully: a long word slides right rather than being held back (held back, it ends up smaller than its neighbours)
  check('every hovered dial word swells fully, long ones too', least > 1.3, `smallest: ${small} at ${least.toFixed(2)}`);
  await page.mouse.move(5, 500); await page.waitForTimeout(300);
}
// the interactive hint sits in the control row, not over the animation
await page.evaluate(() => { location.hash = '#/a/magnetic'; }); await page.waitForTimeout(1500);
check('the interactive hint sits in the control row, not on the stage', await page.locator('#detail .playbar .pb-hint').count() === 1 && await page.locator('#detail .d-stage .pb-hint, #detail .d-stage .d-hint').count() === 0);
await page.keyboard.press('Escape'); await page.waitForTimeout(600);

check('there is no search field', await page.locator('#search').count() === 0);

// detail view, sliders, code
await page.evaluate(() => { location.hash = '#/a/vf-wave'; });
await page.waitForTimeout(1500);
check('detail view opens with a live stage', await page.locator('#detail .d-stage iframe.live').count() === 1);
const codeBefore = await page.locator('#detail .code').innerText();
check('code panel shows the snippet source', codeBefore.includes('const PARAMS = {') && codeBefore.includes('export default function'));
await page.evaluate(() => { const i = document.querySelector('#detail .knob input'); i.value = i.min; i.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(500);
const codeAfter = await page.locator('#detail .code').innerText();
check('a slider rewrites the PARAMS line', /amplitude: 0\b/.test(codeAfter) && /spread: 0.5\b/.test(codeAfter), (codeAfter.match(/const PARAMS = .*/) || [''])[0]);
check('changed numbers are highlighted', await page.locator('#detail .tk-hot').count() > 0);
await page.waitForTimeout(400);
check('tweaked code runs in the stage without errors', page.errors.length === 0, page.errors.join(' | '));

// playback: virtual clock inside the stage
const frame = page.frameLocator('#detail .d-stage iframe');
void frame;
const stageFrame = page.frames().find(f => f.url().includes('stage.html') && f.url().includes('vf-wave'));
const measure = async ms => { const a = await stageFrame.evaluate(() => performance.now()); await page.waitForTimeout(ms); const b = await stageFrame.evaluate(() => performance.now()); return b - a; };
const idle = await measure(500);
check('the detail view opens paused until play is pressed', idle < 5, `${idle.toFixed(1)} ms`);
check('the live stage sits above the loading poster', await page.evaluate(() => { const s = document.querySelector('#detail .d-stage'), r = s.getBoundingClientRect(); return document.elementFromPoint(r.left + 30, r.top + 30)?.tagName === 'IFRAME'; }));
await page.click('#detail .d-start'); await page.waitForTimeout(350);
check('the big play button starts it and goes away', await page.locator('#detail .d-start').count() === 0 && (await measure(300)) > 200);
await page.click('#detail [data-rate="0.5"]');
const half = await measure(1000);
check('0.5× runs the stage clock at half speed', half > 380 && half < 620, `${Math.round(half)} ms in 1 s`);
await page.click('#detail [data-rate="1"]');
await page.click('#detail .pb-play');
const paused = await measure(500);
check('pause holds the clock', paused < 5, `${paused.toFixed(1)} ms`);
const before = await stageFrame.evaluate(() => performance.now());
await page.click('#detail .pb-step');
const after = await stageFrame.evaluate(() => performance.now());
check('frame step advances exactly one frame', Math.abs(after - before - 1000 / 60) < 0.5, `${(after - before).toFixed(2)} ms`);
await page.click('#detail .pb-play');

// copy
await page.click('#detail .d-copy'); await page.waitForTimeout(300);
const clip = await page.evaluate(() => navigator.clipboard.readText());
check('Copy puts the tuned code on the clipboard', clip === (await page.locator('#detail .code').innerText()).replace(/\n$/, '') || clip.includes('const PARAMS = {'), `${clip.length} chars`);

// download .html
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#detail .d-dl')]);
check('Download .html offers a file', dl.suggestedFilename() === 'vf-wave.html');

// close
// keyboard-initiated: no fade and no ghost, the view is gone right away
await page.keyboard.press('Escape'); await page.waitForTimeout(60);
check('Esc closes the detail view instantly', await page.locator('#detail').isHidden() && await page.evaluate(() => !document.querySelector('body > img')));
await page.waitForTimeout(540);
// regression: the close fade used fill:forwards and stayed on #detail, so every later open was invisible
await page.evaluate(() => { location.hash = '#/a/confetti'; }); await page.waitForTimeout(900);
const reopen = await page.evaluate(() => { const d = document.querySelector('#detail'); return { hidden: d.hidden, opacity: getComputedStyle(d).opacity }; });
check('a detail view opened after closing one is visible', !reopen.hidden && reopen.opacity === '1', JSON.stringify(reopen));
await page.keyboard.press('Escape'); await page.waitForTimeout(600);
// a piece that answers the pointer runs at once: no play button to press first
await page.evaluate(() => { location.hash = '#/a/metaballs'; }); await page.waitForTimeout(1500);
const mbFrame = page.frames().find(f => f.url().includes('stage.html') && f.url().includes('metaballs'));
const mbRun = mbFrame ? await (async () => { const a = await mbFrame.evaluate(() => performance.now()); await page.waitForTimeout(300); return (await mbFrame.evaluate(() => performance.now())) - a; })() : 0;
check('a pointer piece opens running, with no play button', mbRun > 200 && await page.locator('#detail .d-start').count() === 0, `${Math.round(mbRun)} ms in 300 ms`);
check('How it works comes before Install', await page.evaluate(() => { const n = document.querySelector('#detail .notes'), x = document.querySelector('#detail .npx'); return !!(n && x && n.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING); }));
await page.keyboard.press('Escape'); await page.waitForTimeout(600);

// hearts with one group
const firstId = await page.locator('#grid .card').nth(0).getAttribute('data-id');
await page.locator('#grid .card').nth(0).hover();
await page.locator('#grid .card').nth(0).locator('.heart').click();
await page.waitForTimeout(300);
check('one group: a heart saves instantly', await page.evaluate(id => JSON.parse(localStorage.getItem('motion-library.v1')).items[id] !== undefined, firstId));
// add a group in the Hearted view, then heart another card: the picker should appear
await page.locator('.dial-item[data-id="hearted"]').click(); await page.waitForTimeout(700);
await page.locator('#head-tools .btn').first().click(); await page.waitForTimeout(300);
await page.keyboard.type(' — moodboard'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
check('a new group can be created and named', await page.evaluate(() => JSON.parse(localStorage.getItem('motion-library.v1')).groups.length === 2));
await page.locator('.dial-item[data-id="all"]').click(); await page.waitForTimeout(700);
const fourthId = await page.locator('#grid .card').nth(3).getAttribute('data-id');
await page.locator('#grid .card').nth(3).hover();
await page.locator('#grid .card').nth(3).locator('.heart').click(); await page.waitForTimeout(300);
check('two groups: hearting asks which group', await page.locator('#popover:not([hidden]) [data-g]').count() === 2);
await page.locator('#popover [data-g]').nth(1).click(); await page.waitForTimeout(300);
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('motion-library.v1')));
check('the design lands in the chosen group', st.items[fourthId] === st.groups[1].id);
await page.reload(); await page.waitForTimeout(800);
await page.locator('.dial-item[data-id="hearted"]').click(); await page.waitForTimeout(700);
check('hearts and groups survive a reload', (await page.locator('#grid .card').count()) === 2 && (await page.locator('#grid .group').count()) === 2);

// export
const [exp] = await Promise.all([page.waitForEvent('download'), page.locator('#head-tools .btn').nth(1).click()]);
const expPath = path.join(ROOT, 'tools/.export.html'); await exp.saveAs(expPath);
const ep = await newPage();
await ep.goto(pathToFileURL(expPath).href); await ep.waitForTimeout(1500);
check('exported file opens and runs every design', (await ep.locator('iframe').count()) === 2 && ep.errors.length === 0, ep.errors.join(' | '));
await ep.screenshot({ path: path.join(ROOT, 'tools/export.png') });
await ep.context().close();

// compare
await page.evaluate(() => { location.hash = '#/a/squash-bounce'; }); await page.waitForTimeout(900);
await page.click('#detail .d-compare');
await page.evaluate(() => { location.hash = '#/a/anticipation'; }); await page.waitForTimeout(900);
await page.click('#detail .d-compare');
check('tray shows two pinned designs', await page.locator('#tray:not([hidden]) .chip').count() === 2);
await page.click('#tray .btn'); await page.waitForTimeout(1500);
check('compare view shows two live stages', await page.locator('#compare iframe.live').count() === 2);
await page.screenshot({ path: path.join(ROOT, 'tools/compare.png') });
await page.keyboard.press('Escape'); await page.waitForTimeout(500);

// surprise me
await page.locator('.dial-item[data-id="all"]').click(); await page.waitForTimeout(600);
await page.click('#surprise'); await page.waitForTimeout(1600);
check('Surprise me opens a random design', /#\/a\//.test(page.url()));
await page.keyboard.press('Escape'); await page.waitForTimeout(500);
check('no page errors during the run', page.errors.length === 0, [...new Set(page.errors)].join(' | '));
await page.context().close();

// reduced motion: nothing autoplays on hover
const rm = await newPage({ reducedMotion: 'reduce' });
await rm.goto(`${base}/index.html`); await rm.waitForTimeout(700);
await rm.locator('#grid .card').first().hover(); await rm.waitForTimeout(800);
check('reduced motion: hover does not autoplay', await rm.locator('#grid iframe').count() === 0);
await rm.context().close();

// share links and embeds: values travel in the URL, are clamped to the slider ranges, and only the parent may run code
const sh = await newPage();
await sh.goto(`${base}/index.html#/a/confetti?pieces=300&gravity=0.6`); await sh.waitForTimeout(1500);
const shared = await sh.evaluate(() => ({ pieces: document.querySelector('#detail input[data-k="pieces"]')?.value, gravity: document.querySelector('#detail input[data-k="gravity"]')?.value, code: document.querySelector('#detail .code')?.innerText || '' }));
check('a shared link restores the sliders and the code', shared.pieces === '300' && shared.gravity === '0.6' && /const PARAMS = \{ pieces: 300, gravity: 0\.6 \}/.test(shared.code), JSON.stringify({ p: shared.pieces, g: shared.gravity }));
check('a shared link puts its values in the live stage', await sh.evaluate(() => JSON.stringify(document.querySelector('#detail .d-stage iframe')?.contentWindow?.__params || null)) === '{"pieces":300,"gravity":0.6}');
await sh.fill('#detail input[data-k="pieces"]', '120'); await sh.waitForTimeout(300);
check('sliding keeps the address bar in sync', sh.url().endsWith('#/a/confetti?pieces=120&gravity=0.6'), sh.url().split('#')[1]);
await sh.click('#detail .d-share'); await sh.waitForTimeout(200);
const link = await sh.evaluate(() => navigator.clipboard.readText());
check('Share copies a link with the changed values', link === `${base}/index.html#/a/confetti?pieces=120&gravity=0.6`, link);
check('the npx line carries the slider values as flags', await sh.evaluate(() => document.querySelector('#detail .npx-cmd')?.textContent) === 'npx motion-library add confetti --pieces 120 --gravity 0.6');
await sh.click('#detail .d-npx'); await sh.waitForTimeout(200);
check('Copy next to Install copies that command', (await sh.evaluate(() => navigator.clipboard.readText())) === 'npx motion-library add confetti --pieces 120 --gravity 0.6');
await sh.click('#detail .d-embed'); await sh.waitForTimeout(200);
const snippet = await sh.evaluate(() => navigator.clipboard.readText());
const embedSrc = (snippet.match(/<iframe[^>]* src="([^"]+)"/) || [])[1] || '';
check('Embed copies an iframe snippet pointing at the stage', embedSrc.startsWith(`${base}/stage.html?`) && embedSrc.includes('mode=embed') && embedSrc.includes('p=pieces%3D120%26gravity%3D0.6'), embedSrc);
await sh.click('#detail .d-prompt'); await sh.waitForTimeout(200);
const prompt = await sh.evaluate(() => navigator.clipboard.readText());
check('Copy as prompt carries the notes, the tuned settings and the code', prompt.includes('3D paper confetti') && prompt.includes('heavy drag and flutter') && /pieces: 120 \(range 40.400, step 10\)/.test(prompt) && prompt.includes('const PARAMS = { pieces: 120, gravity: 0.6 };') && prompt.includes('export default function') && prompt.includes('MIT-0'), prompt.slice(0, 160).replace(/\n/g, ' / '));
await sh.click('#detail .d-reset'); await sh.waitForTimeout(300);
check('Reset returns the address to the plain link', sh.url().endsWith('#/a/confetti'), sh.url().split('#')[1]);
check('Reset returns the npx line to the plain command', await sh.evaluate(() => document.querySelector('#detail .npx-cmd')?.textContent) === 'npx motion-library add confetti');
await sh.goto(`${base}/index.html#/a/confetti?pieces=99999&gravity=-4&bogus=1&pieces2=alert(1)`); await sh.reload(); await sh.waitForTimeout(1500);
const clamped = await sh.evaluate(() => ({ pieces: document.querySelector('#detail input[data-k="pieces"]')?.value, gravity: document.querySelector('#detail input[data-k="gravity"]')?.value, line: (document.querySelector('#detail .code')?.innerText || '').split('\n').find(l => l.startsWith('const PARAMS')) }));
check('out-of-range and unknown URL values are clamped or dropped', clamped.pieces === '400' && clamped.gravity === '0.2' && clamped.line === 'const PARAMS = { pieces: 400, gravity: 0.2 };', JSON.stringify(clamped));
await sh.context().close();

const em = await newPage({ viewport: { width: 640, height: 400 } });
await em.goto(`${base}/stage.html?src=anims/flow/confetti.js&mode=embed&p=${encodeURIComponent('pieces=300&gravity=0.6')}`); await em.waitForTimeout(1200);
check('an embed applies its values', await em.evaluate(() => JSON.stringify(window.__params)) === '{"pieces":300,"gravity":0.6}');
const badge = await em.evaluate(() => { const a = document.querySelector('.ml-badge'); return a ? { text: a.textContent.trim(), href: a.getAttribute('href'), target: a.target } : null; });
check('an embed links back to the tuned animation', badge?.text === 'Motion Library' && /index\.html#\/a\/confetti\?pieces=300&gravity=0\.6$/.test(badge.href) && badge.target === '_blank', JSON.stringify(badge));
// a page that frames the stage from another origin must not be able to run code in it
const evil = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(`<iframe id="f" src="${base}/stage.html?src=anims/flow/confetti.js&mode=embed" width="400" height="300"></iframe>`); });
await new Promise(r => evil.listen(0, '127.0.0.1', r));
await em.goto(`http://localhost:${evil.address().port}/`); await em.waitForTimeout(1500);
const evilFrame = em.frames().find(f => f.url().includes('stage.html'));
await em.evaluate(() => document.getElementById('f').contentWindow.postMessage({ type: 'run', code: 'export default s => { window.__pwned = 1; }' }, '*'));
await em.waitForTimeout(500);
check('the stage ignores code sent from another origin', evilFrame && (await evilFrame.evaluate(() => window.__pwned)) === undefined);
evil.close();

await em.goto(`${base}/stage.html?src=${encodeURIComponent('data:text/javascript,window.__pwned=1;export default()=>{}')}&mode=detail`); await em.waitForTimeout(600);
check('the stage only loads the library\'s own animation files', (await em.evaluate(() => window.__pwned)) === undefined);
await em.context().close();

const er = await newPage({ viewport: { width: 640, height: 400 }, reducedMotion: 'reduce' });
await er.goto(`${base}/stage.html?src=anims/flow/confetti.js&mode=embed`); await er.waitForTimeout(1000);
check('an embed starts paused under reduced motion', await er.evaluate(() => window.__clock.paused) && await er.locator('.ml-play').isVisible());
await er.context().close();

// phone: no sideways scroll
const ph = await newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ph.goto(`${base}/index.html`); await ph.waitForTimeout(1200);
check('phone: no horizontal overflow', await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
await ph.evaluate(() => scrollTo(0, 400)); await ph.waitForTimeout(900);
check('phone: the centred card plays without hover', await ph.locator('#grid iframe').count() === 1);
await ph.context().close();

// standalone downloads run from file:// (one of each kind)
for (const id of ['letter-rise', 'curl-flow', 'liquid-metal']) {
  const a = animById[id];
  const html = standalone(fs.readFileSync(path.join(ROOT, `anims/${a.cat}/${a.id}.js`), 'utf8'), a.title);
  const f = path.join(ROOT, `tools/.standalone-${id}.html`); fs.writeFileSync(f, html);
  const sp = await newPage({ viewport: { width: 800, height: 600 } });
  await sp.goto(pathToFileURL(f).href); await sp.waitForTimeout(1500);
  const filled = await sp.evaluate(() => document.getElementById('stage').children.length > 0);
  check(`standalone ${a.kind} file runs from disk (${id})`, filled && sp.errors.length === 0, sp.errors.join(' | '));
  await sp.context().close();
}

// the npm command line tool (cli/): a draft build, run from a throwaway project
{
  const { execFileSync, spawnSync } = await import('node:child_process');
  const os = await import('node:os');
  execFileSync(process.execPath, [path.join(ROOT, 'cli/build.mjs')], { env: { ...process.env, ALLOW_DRAFT: '1' }, stdio: 'ignore' });
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'ml-cli-')); fs.mkdirSync(path.join(proj, 'src'));
  const cli = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'cli/bin.mjs'), ...args], { cwd: proj, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  const r1 = cli('add', 'confetti', '--pieces', '300', '--gravity', '9', '--evil', '1;alert(1)');
  const out = fs.existsSync(path.join(proj, 'src/animations/confetti.js')) ? fs.readFileSync(path.join(proj, 'src/animations/confetti.js'), 'utf8') : '';
  check('cli: add writes the tuned file into src/animations', r1.status === 0 && out.includes('const PARAMS = { pieces: 300, gravity: 2 };') && out.startsWith('// 3D paper confetti · Motion Library') && out.includes('export default function'), r1.stderr.trim().split('\n')[0]);
  check('cli: out-of-range and unknown settings are clamped or ignored, with a note', /gravity 9 became 2/.test(r1.stderr) && /ignored --evil/.test(r1.stderr) && !out.includes('alert'));
  const r2 = cli('add', 'confetti');
  check('cli: add refuses to overwrite without --force', r2.status === 1 && /already there/.test(r2.stderr));
  const r3 = cli('add', 'confeti');
  check('cli: a typo suggests the right id', r3.status === 1 && /Did you mean: confetti/.test(r3.stderr));
  const r4 = cli('prompt', 'confetti', '--pieces', '120');
  check('cli: prompt prints the same prompt as the site', r4.status === 0 && r4.stdout.includes('pieces: 120 (range 40–400, step 10)') && r4.stdout.includes('MIT-0'));
  const r5 = cli('list');
  check(`cli: list shows all ${ANIMS.length} animations`, r5.stdout.includes(`${ANIMS.length} animations`));
  fs.rmSync(proj, { recursive: true, force: true });
}

// language switch, FAQ, three across
{
  const lp = await newPage();
  await lp.goto(`${base}/index.html`); await lp.waitForTimeout(1200);
  const cols = await lp.evaluate(() => getComputedStyle(document.querySelector('.cat-sec .grid')).gridTemplateColumns.split(' ').length);
  check('the grid is three across on a desktop', cols === 3, `${cols} columns`);
  check('the FAQ sits under the full list', await lp.locator('#faq .faq-item').count() >= 6 && await lp.locator('#faq').isVisible());
  await lp.click('#lang [data-lang="zh"]'); await lp.waitForTimeout(1500);
  const zh = await lp.evaluate(() => ({ lang: document.documentElement.lang, title: document.querySelector('#view-title').textContent, faq: document.querySelector('#faq h2').textContent, dial: document.querySelector('.dial-item[data-id="flow"]').textContent }));
  check('中文 switches the page and is remembered', zh.lang === 'zh-Hans' && zh.title === '全部动画' && zh.faq === '常见问题' && zh.dial.includes('流动'), JSON.stringify(zh));
  await lp.click('#lang [data-lang="en"]'); await lp.waitForTimeout(1500);
  check('EN switches back', await lp.evaluate(() => document.documentElement.lang === 'en' && document.querySelector('#view-title').textContent === 'All animations'));
  await lp.context().close();
}

// crawlers and readers without JavaScript get the same text (tools/build-static.mjs)
{
  const nj = await newPage({ javaScriptEnabled: false });
  await nj.goto(`${base}/index.html`); await nj.waitForTimeout(400);
  const links = await nj.locator('#grid .card-link').count();
  check('with JavaScript off, the catalogue is real HTML', links === ANIMS.length, `${links} links`);
  check('with JavaScript off, the FAQ questions are headings', await nj.locator('#faq summary h3').count() >= 6);
  const ld = await nj.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent).map(x => x['@type']).join(','); } catch { return 'BAD'; } }).join('|'));
  check('the JSON-LD parses (WebSite, ItemList, FAQPage)', ld === 'WebSite,ItemList,FAQPage', ld);
  const one = ANIMS[0];
  await nj.goto(`${base}/fx/${one.id}.html`); await nj.waitForTimeout(300);
  const pg = await nj.evaluate(() => ({ h1: document.querySelector('h1')?.textContent, tldr: document.querySelector('h1 + .tldr')?.textContent || '', qs: [...document.querySelectorAll('h2')].filter(h => h.textContent.endsWith('?')).length, code: document.querySelector('pre code')?.textContent.length || 0 }));
  check('an effect page leads with a TL;DR, asks its questions and carries the code', pg.h1 === one.title && pg.tldr.includes('npx motion-library add') && pg.qs >= 4 && pg.code > 500, JSON.stringify({ ...pg, tldr: pg.tldr.slice(0, 40) }));
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  check('robots.txt lets AI crawlers in', /User-agent: GPTBot\nAllow: \//.test(robots) && /User-agent: ClaudeBot\nAllow: \//.test(robots) && !/Disallow: \/\s/.test(robots));
  check('llms.txt lists every effect', ((await (await fetch(`${base}/llms.txt`)).text()).match(/^- \[[^\]]+\]\([^)]*fx\//gm) || []).length === ANIMS.length);
  await nj.context().close();
}

const failed = results.filter(r => !r[0]).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close(); server.close();
process.exit(failed ? 1 : 0);
