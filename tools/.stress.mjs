import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';
import { ANIMS } from '../anims/registry.js';
const { server, base } = await serve();
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
// worst case: 6 groups incl. a very long name, one empty group, 40 hearted
const groups = [['g1','Hearted'],['g2','Client pitch — Northwind Industries holdings rebrand, spring campaign 2027 (v3 final final)'],['g3','Loaders'],['g4','x'],['g5','Ideas for the jungle site'],['g6','Empty group']].map(([id,name])=>({id,name}));
const items = {}; ANIMS.slice(0, 40).forEach((a, i) => { items[a.id] = groups[i % 5].id; });
await page.addInitScript(s => localStorage.setItem('motion-library.v1', s), JSON.stringify({ groups, items, sound: false }));
await page.goto(`${base}/index.html#/hearted`); await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(ROOT, 'tools/stress-hearted.png') });
await page.evaluate(() => { location.hash = '#/'; }); await page.waitForTimeout(900);
const b = await page.locator('.dial-item[data-id="scroll"] .dot').boundingBox();
await page.mouse.move(b.x - 60, b.y + 4); await page.waitForTimeout(500);
await page.screenshot({ path: path.join(ROOT, 'tools/stress-fisheye.png'), clip: { x: 900, y: 60, width: 540, height: 840 } });
// heart picker with 6 groups near the bottom of the screen
await page.locator('#grid .card').nth(5).scrollIntoViewIfNeeded();
await page.locator('#grid .card').nth(45).hover(); await page.locator('#grid .card').nth(45).locator('.heart').click(); await page.waitForTimeout(300);
await page.screenshot({ path: path.join(ROOT, 'tools/stress-picker.png') });
console.log('errors:', errors);
await browser.close(); server.close();
