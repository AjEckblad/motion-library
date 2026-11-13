// Guards the /review-animations fixes (2026-11-10, 2026-11-12) in a real browser: keyboard swaps don't animate, the grid
// entrance is 240 ms with a stagger capped at 210 ms, the heart press shows, hover motion is gated, the language menu reopens mid-fade, a resting mouse keeps the magnet / tank. node tools/motion-check.mjs
import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';
const { server, base } = await serve();
const browser = await launch();
const results = [];
const check = (name, ok, info) => { results.push({ name, ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(info)}`); };

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  window.__anims = [];
  const orig = Element.prototype.animate;
  Element.prototype.animate = function (k, o) {
    if (this.closest?.('#grid')) window.__anims.push({ d: o?.duration, delay: o?.delay ?? 0, easing: o?.easing });
    return orig.call(this, k, o);
  };
});
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(base + '/index.html#/');
await page.waitForSelector('.card');
await page.waitForTimeout(1500);
const take = () => page.evaluate(() => { const a = window.__anims; window.__anims = []; return a; });

// 1. arrow keys on the dial: New -> Hearted swaps instantly to the top; Hearted -> first category jumps straight to its section
//    (starts on New when the dial has it: All, New, Hearted, categories)
await take();
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(150);
await page.focus(await page.$('.dial-item[data-id="new"]') ? '.dial-item[data-id="new"]' : '.dial-item[data-id="all"]');
const h0 = await page.evaluate(() => location.hash);
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(40);
const y1 = await page.evaluate(() => scrollY), hHearted = await page.evaluate(() => location.hash);
await page.waitForTimeout(400);
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(60);
const k = await take();
const h1 = await page.evaluate(() => location.hash), secTop = await page.evaluate(() => Math.round(document.querySelector('.cat-sec')?.getBoundingClientRect().top ?? -999));
check('dial arrow keys change view, then category', h0 !== hHearted && /#\/c\//.test(h1), { h0, hHearted, h1 });
check('dial arrow keys: no grid animation', k.length === 0, { count: k.length });
check('dial arrow keys: instant, no glide', y1 === 0 && secTop >= 0 && secTop < 140, { scrollYAfter40ms: y1, sectionTopAfter60ms: secTop });
await page.waitForTimeout(400);
// 1b. the dial word itself doesn't spring on a key press: two frames later it already sits at its resting scale
{
  const sel = await page.evaluate(() => document.querySelector('.dial-item[aria-checked="true"]').dataset.id);
  await page.keyboard.press('ArrowDown');
  const sc = await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = document.querySelector('.dial-item[aria-checked="true"] .lbl'), m = getComputedStyle(el).transform;
    r(m === 'none' ? 1 : +m.match(/matrix\(([^,]+)/)[1]);
  }))));
  // where it settles (the chosen size scales with the fisheye strength, so read it rather than hard-coding it)
  await page.waitForTimeout(700);
  const settled = await page.evaluate(() => { const m = getComputedStyle(document.querySelector('.dial-item[aria-checked="true"] .lbl')).transform; return m === 'none' ? 1 : +m.match(/matrix\(([^,]+)/)[1]; });
  check('dial arrow keys: the chosen word lands at once, no spring', settled > 1.01 && Math.abs(sc - settled) < 0.002, { twoFramesIn: sc, settled, from: sel });
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(400);
}
// 1c. the fisheye is transform-only: a hover sweep over the dial causes (almost) no layout
{
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
  const lc = async () => (await cdp.send('Performance.getMetrics')).metrics.find(x => x.name === 'LayoutCount').value;
  const b = await (await page.$('#dial')).boundingBox(), before = await lc();
  for (let i = 0; i < 40; i++) { await page.mouse.move(b.x + b.width - 60, b.y + 100 + i * 12); await page.waitForTimeout(16); }
  await page.waitForTimeout(500);
  const n = (await lc()) - before;
  check('dial hover sweep: transform only, no text relayout', n < 10, { layouts: n });
  await page.mouse.move(5, 500); await page.waitForTimeout(300);
}

// 2. inside the full list a category glides to its section (no grid swap); Hearted -> All swaps with exit + entrance
await page.click('.dial-item[data-id="all"]'); await page.waitForTimeout(900); await take();
await page.click('.dial-item:nth-child(6)'); await page.waitForTimeout(1100);
const glide = await take(), id6 = await page.getAttribute('.dial-item:nth-child(6)', 'data-id');
const top6 = await page.evaluate(id => Math.round(document.getElementById('sec-' + id)?.getBoundingClientRect().top ?? -999), id6);
check('a category glides to its section without re-rendering', glide.length === 0 && top6 >= 0 && top6 < 140, { animations: glide.length, sectionTop: top6 });
// heart two cards first, so the Hearted view has cards to send out
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
for (const n of [0, 1]) { const card = page.locator('#grid .card').nth(n); await card.hover(); await card.locator('.heart').click(); await page.waitForTimeout(250); }
await page.click('.dial-item[data-id="hearted"]'); await page.waitForTimeout(900); await take();
await page.click('.dial-item[data-id="all"]'); await page.waitForTimeout(900);
const c = await take();
const ex = c.filter(a => a.d === 120), ent = c.filter(a => a.d !== 120);
const maxDelay = Math.max(...ent.map(a => a.delay)), durs = [...new Set(ent.map(a => a.d))];
check('Hearted to All animates (exit and entrance)', ex.length > 0 && ent.length > 0, { exits: ex.length, entrances: ent.length });
check('entrance: 240 ms, stagger capped at 210 ms', durs.length === 1 && durs[0] === 240 && maxDelay <= 210, { durs, maxDelay });
check('exit uses the strong ease-out token', ex.every(a => a.easing === 'cubic-bezier(0.23, 1, 0.32, 1)'), { exitEasings: [...new Set(ex.map(a => a.easing))] });
check('exit leaves all at once (no stagger holding the new view back)', ex.every(a => !a.delay), { exitDelays: [...new Set(ex.map(a => a.delay))] });
// 2b. All: every card on the first screen gets an entrance, none below it
const all = ent;
const firstScreen = await page.evaluate(() => [...document.querySelectorAll('#grid .card')].filter(c => c.getBoundingClientRect().top + scrollY < innerHeight).length);
check('All: each first-screen card animates, none below', all.length === firstScreen && Math.max(...all.map(a => a.delay)) === Math.min(firstScreen - 1, 7) * 30, { entrances: all.length, firstScreen, maxDelay: Math.max(...all.map(a => a.delay)) });

// 4. pressing a card heart with the mouse shows the press
const heart = await page.$('.card .heart');
const hb = await heart.boundingBox();
await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
await page.waitForTimeout(300);
await page.mouse.down();
await page.waitForTimeout(350);
const tf = await heart.evaluate(el => getComputedStyle(el).transform);
await page.mouse.move(5, 5); await page.mouse.up();
check('card heart press scales to .94', /^matrix\(0\.94, 0, 0, 0\.94/.test(tf), { transform: tf });
// the heart in the detail view too
await page.click('.card .card-hit'); await page.waitForTimeout(1200);
const dh = await page.$('.d-actions .heart'); const db = await dh.boundingBox();
await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2); await page.mouse.down(); await page.waitForTimeout(350);
const dtf = await dh.evaluate(el => getComputedStyle(el).transform);
await page.mouse.move(5, 5); await page.mouse.up();
check('detail heart press scales to .94', /^matrix\(0\.94, 0, 0, 0\.94/.test(dtf), { transform: dtf });
await page.keyboard.press('Escape'); await page.waitForTimeout(500);

// 4b. the card lift: image, heart and text rise together, straight from the pointer (before the 110 ms preview starts),
// on a gentle .25 s ease, so sweeping across a row glides instead of popping
const lc = page.locator('#grid .card').nth(4);
await page.mouse.move(5, 5); await page.waitForTimeout(300);
await lc.hover(); await page.waitForTimeout(70);
const early = await lc.evaluate(c => ({ live: c.classList.contains('is-live'), media: getComputedStyle(c.querySelector('.card-media')).translate }));
await page.waitForTimeout(400);
const lift = await lc.evaluate(c => ({ tr: ['.card-media', '.card-meta', '.heart'].map(s => getComputedStyle(c.querySelector(s)).translate), meta: getComputedStyle(c.querySelector('.card-meta')).transition }));
check('card lift: image, heart and text rise together from the pointer, .25 s ease', !early.live && early.media !== 'none' && lift.tr.every(v => v === '0px -2px') && /^translate 0\.25s( ease)?$/.test(lift.meta), { early, ...lift });
await page.mouse.move(5, 5); await page.waitForTimeout(300);

// 5. every :hover rule in the app stylesheet is gated to fine pointers (touch taps leave :hover stuck)
const hov = await page.evaluate(() => {
  const out = {};
  const scan = (rule, media) => {
    if (rule.cssRules && rule.media) { for (const x of rule.cssRules) scan(x, rule.media.mediaText); return; }
    if (rule.selectorText?.includes(':hover')) out[rule.selectorText] = media;
  };
  for (const sh of document.styleSheets) if (sh.href?.includes('app.css')) for (const r of sh.cssRules) scan(r, null);
  return out;
});
// gated means the condition starts with the fine-pointer gate; it may add more, e.g. `and (prefers-reduced-motion: no-preference)`
const gated = m => m === '(hover: hover) and (pointer: fine)' || m.startsWith('(hover: hover) and (pointer: fine) and ');
check('every hover rule is hover-gated', Object.keys(hov).length >= 10 && Object.values(hov).every(gated), Object.fromEntries(Object.entries(hov).filter(([, m]) => !gated(m))));
const brandT = await page.evaluate(() => getComputedStyle(document.querySelector('.brand-mark path')).transitionDuration);
check('logo turn is .24 s', brandT.split(',')[0].trim() === '0.24s', { brandT });

// 6. the language menu: a click during its 120 ms fade-out opens it again (it used to count as a second close)
{
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
  const b = await (await page.$('#lang-btn')).boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.click(x, y); await page.waitForTimeout(400);
  await page.mouse.click(x, y); await page.waitForTimeout(40);
  await page.mouse.click(x, y); await page.waitForTimeout(400);
  const st = await page.evaluate(() => ({ expanded: document.querySelector('#lang-btn').getAttribute('aria-expanded'), hidden: document.querySelector('#lang-menu').hidden }));
  check('language menu: a click mid-fade reopens it', st.expanded === 'true' && !st.hidden, st);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
}
// 6b. Ferrofluid's magnet and SPH water's tilt stay under a resting mouse (they used to wander off after ~2 s)
{
  const sp = await ctx.newPage(); sp.on('pageerror', e => errors.push('stage: ' + e.message));
  for (const [id, probe] of [['fluid/ferrofluid', 'S.m'], ['fluid/sph-water', 'ang']]) {
    const src = await (await fetch(base + '/anims/' + id + '.js')).text();
    await sp.route('**/anims/' + id + '.js', r => r.fulfill({ body: src.replace('function frame(now) {', `function frame(now) { window.__v = ${probe};`), contentType: 'text/javascript' }));
    await sp.goto(base + '/stage.html?src=anims/' + id + '.js'); await sp.waitForTimeout(1500);
    const c = await sp.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    for (let i = 0; i <= 10; i++) { await sp.mouse.move(c.x + c.w * (0.5 + 0.03 * i), c.y + c.h * 0.6); await sp.waitForTimeout(30); }
    // (the water tank is heavy: a swing of this size takes about 3 s to settle, so read it after 3.5 s)
    await sp.waitForTimeout(3500); const a = await sp.evaluate(() => window.__v);
    await sp.waitForTimeout(2500); const z = await sp.evaluate(() => window.__v);
    check(`${id.split('/')[1]}: a resting mouse keeps control`, Math.abs(a - z) < 0.02, { after3_5s: +a.toFixed(3), after6s: +z.toFixed(3) });
    await sp.unroute('**/anims/' + id + '.js');
  }
  await sp.close();
}

// 6c. Ferrofluid's switch, frame by frame: a click mid-way never makes the film or the needles jump (they used to pop
// when the switch was reversed during a transition), and with the magnet off the puddle stays put while the block
// slides through it (it used to follow the magnet as if the field still pulled it)
{
  const sp = await ctx.newPage(); sp.on('pageerror', e => errors.push('ferro switch: ' + e.message));
  const src = await (await fetch(base + '/anims/fluid/ferrofluid.js')).text();
  const hook = 'gl.drawArrays(gl.TRIANGLES, 0, 3);\n    raf';
  await sp.route('**/anims/fluid/ferrofluid.js', r => r.fulfill({ body: src.replace(hook, '(window.__f ||= []).push([CON, SON, S.m, S.pc]); ' + hook), contentType: 'text/javascript' }));
  await sp.goto(base + '/stage.html?src=anims/fluid/ferrofluid.js&mode=detail&paused=1');
  await sp.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
  const run = (n, act) => sp.evaluate(async ([n, act]) => {
    const c = document.querySelector('canvas'), b = c.getBoundingClientRect();
    if (act === 'click') c.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    for (let i = 0; i < n; i++) {
      if (act) c.dispatchEvent(new PointerEvent('pointermove', { clientX: b.left + b.width * (0.5 + (act === 'drag' ? 0.06 * Math.sin(i * Math.PI / 90) : 0)), clientY: b.top + b.height * 0.55, pointerType: 'mouse', bubbles: true }));
      window.__clock.step(); if (i % 30 === 29) await new Promise(r => window.__clock.realRAF(r));
    }
  }, [n, act]);
  // off; back on while the oil is a third of the way down (where the old switch popped); off again on the way up
  await run(360); await run(132, 'click'); await run(60, 'click'); await run(300, 'click');
  const sw = await sp.evaluate(() => window.__f.slice(360));
  let jc = 0, js = 0; for (let i = 1; i < sw.length; i++) { jc = Math.max(jc, Math.abs(sw[i][0] - sw[i - 1][0])); js = Math.max(js, Math.abs(sw[i][1] - sw[i - 1][1])); }
  check('ferrofluid: reversing the switch mid-way never jumps the film or the needles', jc < 0.05 && js < 0.12, { filmStep: +jc.toFixed(3), needleStep: +js.toFixed(3) });
  // the magnet held over the middle of the puddle with the field on (so the puddle centres under it), switched off,
  // then slid slowly to and fro, 3 s a swing: the old puddle followed it most of the way
  await sp.evaluate(() => { document.querySelector('canvas').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await run(300, 'hold'); await run(300, 'click');
  await run(90, 'drag'); const n0 = await sp.evaluate(() => window.__f.length); await run(360, 'drag');
  const dr = await sp.evaluate(n0 => window.__f.slice(n0), n0), span = k => Math.max(...dr.map(f => f[k])) - Math.min(...dr.map(f => f[k]));
  const mag = span(2), pud = span(3);
  check('ferrofluid: with the magnet off the puddle stays while the block slides', mag > 0.1 && pud < 0.25 * mag, { magnet: +mag.toFixed(3), puddle: +pud.toFixed(3) });
  await sp.close();
}

// 7. touch phone: hearts stay visible without hover
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const mp = await m.newPage(); mp.on('pageerror', e => errors.push('mobile: ' + e.message));
await mp.goto(base + '/index.html#/'); await mp.waitForSelector('.card'); await mp.waitForTimeout(1200);
const mob = await mp.evaluate(() => ({ fine: matchMedia('(hover: hover) and (pointer: fine)').matches, op: getComputedStyle(document.querySelector('.card .heart')).opacity, tf: getComputedStyle(document.querySelector('.card .heart')).transform }));
check('touch: hearts visible at rest', mob.fine === false && mob.op === '1' && mob.tf === 'none', mob);
// ferrofluid on touch: a tap switches the magnet without yanking it to the finger; a drag moves it without switching it
{
  const fp = await m.newPage(); fp.on('pageerror', e => errors.push('ferro touch: ' + e.message));
  const src = await (await fetch(base + '/anims/fluid/ferrofluid.js')).text();
  await fp.route('**/anims/fluid/ferrofluid.js', r => r.fulfill({ body: src.replace('function frame(now) {', 'function frame(now) { window.__s = { on: onTarget, px, py };'), contentType: 'text/javascript' }));
  await fp.goto(base + '/stage.html?src=anims/fluid/ferrofluid.js'); await fp.waitForTimeout(1500);
  const c = await fp.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const st = () => fp.evaluate(() => ({ ...window.__s }));
  const cdp = await m.newCDPSession(fp), touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const s0 = await st(); await fp.touchscreen.tap(c.x + c.w * 0.8, c.y + c.h * 0.8); await fp.waitForTimeout(400); const s1 = await st();
  await touch('touchStart', c.x + 100, c.y + c.h * 0.6);
  for (let i = 1; i <= 12; i++) { await touch('touchMove', c.x + 100 + i * 10, c.y + c.h * 0.6); await fp.waitForTimeout(16); }
  await touch('touchEnd'); await fp.waitForTimeout(400); const s2 = await st();
  check('ferrofluid touch: a tap switches without moving, a drag moves without switching', s1.on !== s0.on && s1.px === s0.px && s2.on === s1.on && s2.px !== s1.px, { s0, s1, s2 });
  await fp.close();
}

// previous / next: a keyboard step (Enter on the focused pager link) swaps the detail view at once; a click softens it
{
  await page.evaluate(() => { location.hash = '#/a/ferrofluid'; }); await page.waitForTimeout(1200);
  await page.focus('.d-next'); await page.keyboard.press('Enter'); await page.waitForTimeout(30);
  const kb = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.target?.classList?.contains('d-body')).length);
  await page.waitForTimeout(600);
  await page.click('.d-next'); await page.waitForTimeout(30);
  const ptr = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.target?.classList?.contains('d-body')).map(a => a.effect.getTiming().duration));
  check('detail previous/next: keyboard steps swap instantly, clicks fade ≤120 ms', kb === 0 && ptr.length === 1 && ptr[0] <= 120, { keyboard: kb, pointer: ptr });
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
}
check('no page errors', errors.length === 0, errors);
const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
