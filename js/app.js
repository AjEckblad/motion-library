import { CATEGORIES, ANIMS, catById, animById, srcOf } from '../anims/registry.js';
import { store } from './store.js';
import { createDial } from './dial.js';
import { Creature, PALETTES } from './creatures.js';
import { createCrew } from './critters.js';
import { onHeartPress, heartIcon, closePicker } from './hearts.js';
import { createDetail } from './detail.js';
import { exportGroup } from './export.js';
import { LANG, LANGS, setLang, t, tr, catName, countText, FAQ } from './i18n.js';

const $ = s => document.querySelector(s);
const grid = $('#grid'), emptyEl = $('#empty'), titleEl = $('#view-title'), countEl = $('#count'), toolsEl = $('#head-tools');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');
const KIND = { dom: 'DOM', canvas: 'Canvas', webgl: 'WebGL' };
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';

let view = 'all', viewReady = false, kbNav = false;   // kbNav: the dial was moved with the keyboard; route() reads and clears it

/* ───────── toast ───────── */
const toastEl = $('#toast'); let toastT;
export function toast(text) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1700); }

/* ───────── creatures ───────── */
// the crew floats over the whole page, behind the cards and around every word (js/critters.js)
let crew = null;

/* ───────── dial ───────── */
const entries = [
  { id: 'all', name: t('All'), hue: '#f2f2f3' },
  { id: 'hearted', name: t('Hearted'), hue: '#ffb3c8' },
  ...CATEGORIES.map(c => ({ id: c.id, name: catName(c), hue: c.hue })),
];
const dial = createDial({
  root: $('#dial'), list: $('#dial-items'), entries,
  onSelect: (id, kb) => {
    const hash = id === 'all' ? '#/' : id === 'hearted' ? '#/hearted' : `#/c/${id}`;
    // already on the full list: a category just scrolls to its section (the hash follows without a history entry)
    if (catById[id] && view === 'all') { history.replaceState(history.state, '', hash); scrollToCat(id, kb); return; }
    if (id === 'all' && view === 'all') { history.replaceState(history.state, '', hash); scrollTo({ top: 0, behavior: kb || reduce.matches ? 'instant' : 'smooth' }); return; }
    if (hash !== location.hash) { kbNav = kb; location.hash = hash; }
  },
  onLayout: () => crew?.refresh(),
});
const detailEl = $('#detail');
crew = createCrew({
  bar: $('.bar'), dial: $('#dial'), sheet: $('.sheet'), grid,
  covered: () => !detailEl.hidden,                               // paused under the detail view
});
const refreshCounts = () => dial.setCounts({ all: ANIMS.length, hearted: store.count(), ...Object.fromEntries(CATEGORIES.map(c => [c.id, ANIMS.filter(a => a.cat === c.id).length])) });
refreshCounts();

/* ───────── cards ───────── */
function cardEl(a) {
  const cat = catById[a.cat];
  const el = document.createElement('article');
  el.className = 'card'; el.dataset.id = a.id; el.style.setProperty('--hue', cat.hue);
  el.innerHTML = `<div class="card-media"><img alt="" loading="lazy" decoding="async"><span class="timecode">00:00.00</span></div>
    <div class="card-meta"><h3 class="card-title"><i class="cat-dot" aria-hidden="true"></i><span></span></h3><span class="kind"></span><p class="trick"></p></div>
    <button class="card-hit" type="button"></button>
    <button class="heart" type="button">${heartIcon()}</button>`;
  el.querySelector('img').src = `posters/${a.id}.webp`;
  el.querySelector('.card-title span').textContent = tr(a, 'title');
  el.querySelector('.kind').textContent = KIND[a.kind];
  el.querySelector('.trick').textContent = tr(a, 'trick');
  el.querySelector('.card-hit').setAttribute('aria-label', tr(a, 'title'));
  const h = el.querySelector('.heart');
  h.setAttribute('aria-label', `♥ ${tr(a, 'title')}`);
  h.setAttribute('aria-pressed', String(store.isHearted(a.id)));
  return el;
}

function listFor(v) {
  if (v === 'hearted') return ANIMS.filter(a => store.isHearted(a.id));
  return v === 'all' ? ANIMS : ANIMS.filter(a => a.cat === v);
}

let swapToken = 0;
async function render(animate = true) {
  const token = ++swapToken;
  stopPreview();
  const old = [...grid.children];
  if (animate && old.length && !reduce.matches) {
    // the old view leaves all at once in 120 ms: a staggered exit would hold the new view back for nothing
    await Promise.all(old.slice(0, 12).map(c => c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }],
      { duration: 120, easing: ease, fill: 'forwards' }).finished.catch(() => {})));
    if (token !== swapToken) return;
  }
  const name = view === 'all' ? t('All animations') : view === 'hearted' ? t('Hearted') : catName(catById[view]);
  titleEl.textContent = name;
  document.title = view === 'all' ? 'Motion Library' : `${name} · Motion Library`;
  grid.replaceChildren(); toolsEl.replaceChildren(); emptyEl.hidden = true;
  const list = listFor(view);
  countEl.textContent = countText(list.length);
  const sectioned = view === 'all';
  if (view === 'hearted') renderHearted(list);
  else if (sectioned) renderSections(list);
  else list.forEach(a => grid.append(cardEl(a)));
  grid.style.display = view === 'hearted' || sectioned ? 'block' : '';
  faqEl.hidden = !sectioned;
  watchSections();
  crew?.refresh();                                                // new words on the page: the crew re-reads where they are
  if (animate && !reduce.matches) {
    // the first screen settles in reading order, 30 ms apart. The stagger stops growing at the 8th card, so the whole
    // screen has landed by 450 ms and nothing pops in ahead of the cards above it. Cards below the first screen don't animate.
    const first = [...grid.querySelectorAll('.card, .group-head')].filter(c => c.getBoundingClientRect().top + scrollY < innerHeight);
    first.forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(12px) scale(.985)' }, { opacity: 1, transform: 'none' }],
      { duration: 240, delay: Math.min(i, 7) * 30, easing: ease, fill: 'backwards' }));
  }
  if (!canHover.matches) watchCentre();
}

// the full list: one section per category, in dial order, each with its own heading; the dial follows the scroll
function renderSections(list) {
  for (const c of CATEGORIES) {
    const items = list.filter(a => a.cat === c.id); if (!items.length) continue;
    const sec = document.createElement('section'); sec.className = 'cat-sec'; sec.id = `sec-${c.id}`; sec.dataset.cat = c.id;
    sec.style.setProperty('--hue', c.hue);
    sec.innerHTML = `<div class="cat-head"><h2></h2><span class="cat-count"></span></div><div class="grid"></div>`;
    sec.querySelector('h2').textContent = catName(c);
    sec.querySelector('.cat-count').textContent = countText(items.length);
    const g = sec.querySelector('.grid'); items.forEach(a => g.append(cardEl(a)));
    grid.append(sec);
  }
}
function scrollToCat(id, instant = false) {
  const sec = document.getElementById(`sec-${id}`); if (!sec) return;
  const y = sec.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h') || 60) - 12;
  spyLock = performance.now() + 900;                              // the smooth scroll passes other sections: keep the chosen one lit
  clearTimeout(spyT); spyT = setTimeout(() => { spyLock = 0; watchSections(); }, 920);   // then read the page again
  dial.select(id);
  const target = Math.max(0, y);
  if (instant || reduce.matches) { scrollTo({ top: target, behavior: 'instant' }); return; }
  // a long way off: jump to most of a screen short of it, then glide the rest, so a far category arrives in about 300 ms
  const lead = innerHeight * 0.6;
  if (Math.abs(target - scrollY) > lead * 2) scrollTo({ top: target - Math.sign(target - scrollY) * lead, behavior: 'instant' });
  scrollTo({ top: target, behavior: 'smooth' });
}
// scrollspy: the dial lights the category whose section holds the line just under the top bar
let spyLock = 0, spyRaf = 0, spyT = 0;
function spy() {
  spyRaf = 0;
  if (view !== 'all' || detail.isOpen || performance.now() < spyLock) return;
  const line = innerHeight * 0.3; let cur = 'all';
  for (const sec of grid.querySelectorAll('.cat-sec')) { if (sec.getBoundingClientRect().top <= line) cur = sec.dataset.cat; else break; }
  if (scrollY < 40) cur = 'all';
  if (dial.selected !== cur) dial.select(cur);
}
function watchSections() { if (!spyRaf) spyRaf = requestAnimationFrame(spy); }
addEventListener('scroll', watchSections, { passive: true });
addEventListener('scrollend', watchSections);

function renderHearted(list) {
  const add = document.createElement('button');
  add.className = 'btn'; add.type = 'button'; add.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke-linecap="round"/></svg><span>${t('New group')}</span>`;
  add.addEventListener('click', () => { const id = store.addGroup(`Group ${store.groups.length + 1}`); render(false); requestAnimationFrame(() => startRename(id)); });
  const all = document.createElement('button');
  all.className = 'btn'; all.type = 'button'; all.disabled = !store.count();
  all.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10M6 9l4 4 4-4M4 16h12" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${t('Export all')}</span>`;
  all.addEventListener('click', () => exportGroup('All hearted', ANIMS.filter(a => store.isHearted(a.id))).then(() => toast('Exported your hearted animations')));
  toolsEl.append(add, all);
  if (!store.count() && store.groups.length === 1) { showEmpty(); return; }
  for (const g of store.groups) {
    const items = list.filter(a => store.groupOf(a.id) === g.id);
    const sec = document.createElement('section'); sec.className = 'group'; sec.dataset.g = g.id;
    sec.innerHTML = `<div class="group-head"><h2 class="group-name"></h2><span class="group-count"></span><div class="group-actions">
      <button class="link-btn" type="button" data-act="rename">${t('Rename')}</button>
      <button class="link-btn" type="button" data-act="export"${items.length ? '' : ' disabled'}>${t('Export')}</button>
      ${store.groups.length > 1 ? `<button class="link-btn danger" type="button" data-act="delete">${t('Delete')}</button>` : ''}</div></div>
      <div class="grid"></div>`;
    sec.querySelector('.group-name').textContent = g.name;
    sec.querySelector('.group-count').textContent = String(items.length);
    const gGrid = sec.querySelector('.grid');
    if (items.length) items.forEach(a => gGrid.append(cardEl(a)));
    else { const p = document.createElement('p'); p.className = 'group-empty'; p.textContent = t('Empty for now. Open the heart menu on any design to move it here.'); gGrid.replaceWith(p); }
    sec.querySelector('[data-act="rename"]').addEventListener('click', () => startRename(g.id));
    sec.querySelector('[data-act="export"]').addEventListener('click', () => exportGroup(g.name, items).then(() => toast(`Exported “${g.name}”`)));
    sec.querySelector('[data-act="delete"]')?.addEventListener('click', () => { store.deleteGroup(g.id); toast(`Deleted “${g.name}”; its designs moved to “${store.groups[0].name}”`); });
    grid.append(sec);
  }
}
function startRename(gid) {
  const h = grid.querySelector(`.group[data-g="${gid}"] .group-name`); if (!h) return;
  const g = store.groups.find(x => x.id === gid);
  const input = Object.assign(document.createElement('input'), { value: g.name, maxLength: 60, ariaLabel: 'Group name' });
  h.replaceChildren(input); input.focus(); input.select();
  const done = save => { if (save) store.renameGroup(gid, input.value); else render(false); };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') { e.stopPropagation(); done(false); } });
  input.addEventListener('blur', () => done(true), { once: true });
}

let emptyCreature = null;
function showEmpty() {
  emptyEl.hidden = false;
  emptyEl.innerHTML = `<canvas aria-hidden="true"></canvas><h2>${t('No hearted animations yet')}</h2><p>${t('Hover any card and press the heart to keep it here. You can sort them into groups later.')}</p>`;
  emptyCreature?.destroy();
  emptyCreature = new Creature(emptyEl.querySelector('canvas'), { size: 150, palette: PALETTES.mint, seed: 5 });
  emptyCreature.react('sleep');
}

/* ───────── live preview on hover ───────── */
let live = null, intent = 0;
function startPreview(card) {
  if (reduce.matches || detail.isOpen) return;
  if (live?.card === card) return;
  stopPreview();
  const a = animById[card.dataset.id], media = card.querySelector('.card-media');
  const f = document.createElement('iframe');
  f.src = `stage.html?src=${srcOf(a)}&mode=preview`; f.title = tr(a, 'title'); f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
  media.append(f);
  live = { card, iframe: f, t0: 0 };
  card.classList.add('is-live');
  crew?.hush(true);
  tickTimecode();
}
function stopPreview() {
  clearTimeout(intent);
  if (!live) return;
  const { card, iframe } = live; live = null;
  crew?.hush(false);
  card.classList.remove('is-live');
  iframe.classList.remove('live');
  setTimeout(() => iframe.remove(), 170);
}
function tickTimecode() {
  if (!live) return;
  const tc = live.card.querySelector('.timecode');
  if (live.t0) { const s = (performance.now() - live.t0) / 1000, fr = Math.floor((s % 1) * 60); tc.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(fr).padStart(2, '0')}`; }
  requestAnimationFrame(tickTimecode);
}
addEventListener('message', e => {
  if (e.data?.type === 'stage-ready' && live && e.source === live.iframe.contentWindow) { live.iframe.classList.add('live'); live.t0 = performance.now(); }
  if (e.data?.type === 'stage-click' && live && e.source === live.iframe.contentWindow) openAnim(live.card.dataset.id);
});
grid.addEventListener('pointerover', e => {
  const card = e.target.closest('.card'); if (!card || !canHover.matches || live?.card === card) return;
  clearTimeout(intent); intent = setTimeout(() => startPreview(card), 110);
});
grid.addEventListener('pointerout', e => {
  const card = e.target.closest('.card'); if (!card || card.contains(e.relatedTarget)) return;
  clearTimeout(intent); if (live?.card === card) stopPreview();
});
// keyboard focus plays the card (hover does it for the mouse). A mouse press also focuses the button, but it must not start a
// preview mid-click: the playing preview sits above the button, so the release would land inside it and the click would be lost
grid.addEventListener('focusin', e => { const card = e.target.closest('.card'); if (card && e.target.matches('.card-hit:focus-visible')) startPreview(card); });
grid.addEventListener('focusout', e => { const card = e.target.closest('.card'); if (card && !card.contains(e.relatedTarget) && live?.card === card) stopPreview(); });
grid.addEventListener('click', e => {
  const heart = e.target.closest('.heart'); const card = e.target.closest('.card');
  if (heart && card) { onHeartPress(heart, card.dataset.id, celebrate); return; }
  if (e.target.closest('.card-hit') && card) openAnim(card.dataset.id);
});

// Phones have no hover: play the card nearest the middle of the screen once scrolling settles.
let centreT;
function watchCentre() {
  clearTimeout(centreT);
  centreT = setTimeout(() => {
    if (canHover.matches) return;
    const mid = innerHeight / 2; let best = null, bd = Infinity;
    for (const c of grid.querySelectorAll('.card')) { const r = c.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = c; } }
    if (best && bd < innerHeight / 2) startPreview(best);
  }, 260);
}
addEventListener('scroll', () => { if (!canHover.matches) watchCentre(); }, { passive: true });

/* ───────── hearts ───────── */
function celebrate(btn) {
  if (!reduce.matches) btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(.82)', offset: .2 }, { transform: 'scale(1.22)', offset: .55 }, { transform: 'scale(1)' }], { duration: 480, easing: ease });
  crew.cheer();
}
store.onChange(() => {
  refreshCounts();
  document.querySelectorAll('.card').forEach(c => c.querySelector('.heart')?.setAttribute('aria-pressed', String(store.isHearted(c.dataset.id))));
  detail.syncHeart();
  if (view === 'hearted' && !detail.isOpen) render(false);
});

/* ───────── surprise me ───────── */
$('#surprise').addEventListener('click', () => {
  const pool = listFor(view === 'hearted' && !store.count() ? 'all' : view);
  const pick = (pool.length ? pool : ANIMS)[Math.floor(Math.random() * (pool.length || ANIMS.length))];
  if (reduce.matches || !crew.visible) { openAnim(pick.id); return; }
  const sheet = $('.sheet').getBoundingClientRect();
  const x1 = sheet.left + sheet.width * 0.5, y1 = Math.max(sheet.top, 0) + Math.min(sheet.bottom - Math.max(sheet.top, 0), innerHeight) * 0.45;
  const start = crew.toss({ x: x1, y: y1 });                      // the creature nearest the target throws it
  const die = document.createElement('div'); die.className = 'die';
  const face = 1 + Math.floor(Math.random() * 6), pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[face];
  die.innerHTML = Array.from({ length: 9 }, (_, i) => pips.includes(i) ? '<i></i>' : '<span></span>').join('');
  document.body.append(die);
  const x0 = start.x - 17, y0 = start.y - 17;
  die.animate([
    { transform: `translate(${x0}px, ${y0}px) rotate(0deg) scale(.6)`, opacity: 0 },
    { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 140}px) rotate(260deg) scale(1)`, opacity: 1, offset: .45 },
    { transform: `translate(${x1}px, ${y1}px) rotate(540deg) scale(1)`, opacity: 1, offset: .85 },
    { transform: `translate(${x1}px, ${y1 - 8}px) rotate(540deg) scale(1.08)`, opacity: 0 },
  ], { duration: 760, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' }).onfinish = () => { die.remove(); openAnim(pick.id); };
});

/* ───────── detail ───────── */
function openAnim(id) { location.hash = `#/a/${id}`; }
const listHash = () => view === 'all' ? '#/' : view === 'hearted' ? '#/hearted' : `#/c/${view}`;
const detail = createDetail({
  celebrate, toast,
  onClose: () => { if (history.state?.fromList) history.back(); else location.hash = listHash(); },
});

/* ───────── routing ───────── */
let viewReadyOnce = false;
function setView(v, animate = true, scroll = animate) {
  const changed = v !== view || !viewReady;
  view = v; viewReady = true;
  if (changed || v !== 'all') dial.select(v);
  if (changed) { render(animate); if (scroll) scrollTo({ top: 0, behavior: animate && !reduce.matches ? 'smooth' : 'instant' }); }
}
function route() {
  const instant = kbNav; kbNav = false;                          // the dial moved by keyboard: swap the grid with no animation
  // a detail link may carry tuned values: #/a/<id>?pieces=300&gravity=0.6
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [kind, arg] = path.split('/');
  closePicker();
  if (kind === 'a' && animById[arg]) {
    if (!viewReady) setView(animById[arg].cat, false);
    stopPreview();
    const card = grid.querySelector(`.card[data-id="${arg}"]`);
    detail.open(animById[arg], card, query);
    return;
  }
  detail.close(kbClose); kbClose = false;
  if (kind === 'c' && catById[arg]) {
    // coming from another view (Hearted): swap to the full list at once, so the section exists to glide to
    setView('all', false, false);
    requestAnimationFrame(() => scrollToCat(arg, instant || !viewReadyOnce));
    viewReadyOnce = true; return;
  }
  viewReadyOnce = true;
  setView(kind === 'hearted' ? 'hearted' : 'all', !instant, true);
}
// remember when a detail view was opened from the list, so closing can go back in history
addEventListener('hashchange', e => {
  if (/#\/a\//.test(location.hash) && !/#\/a\//.test(new URL(e.oldURL).hash)) history.replaceState({ fromList: true }, '');
  route();
});
// keyboard-initiated closes get no animation: Esc sets this, route() reads and clears it
let kbClose = false;
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (detail.isOpen) { kbClose = true; detail.requestClose(); }
});
/* ───────── FAQ ───────── */
const faqEl = $('#faq');
faqEl.innerHTML = `<h2 id="faq-title">${t('Questions')}</h2><div class="faq-list"></div>`;
for (const [q, a] of FAQ[LANG] || FAQ.en) {
  const d = document.createElement('details'); d.className = 'faq-item';
  d.innerHTML = '<summary><h3></h3><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5"/></svg></summary><p></p>';
  d.querySelector('summary h3').textContent = q; d.querySelector('p').textContent = a;
  faqEl.querySelector('.faq-list').append(d);
}

/* ───────── language ───────── */
// a menu under the globe button. Opened with the pointer it grows out of the button's corner (spatial: it came from
// there); opened from the keyboard it appears at once. Choosing a language reloads the page in it.
{
  const btn = $('#lang-btn'), menu = $('#lang-menu'), cur = LANGS.find(l => l.code === LANG);
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  btn.querySelector('.lang-cur').textContent = cur.short;
  btn.setAttribute('aria-label', `${t('Language')}: ${cur.name}`);
  menu.setAttribute('aria-label', t('Language'));
  for (const l of LANGS) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', String(l.code === LANG)); b.lang = l.html; b.dataset.lang = l.code;
    b.innerHTML = `<span></span>${tick}`; b.querySelector('span').textContent = l.name;
    b.addEventListener('click', () => { if (l.code === LANG) close(true); else setLang(l.code); });
    menu.append(b);
  }
  const items = [...menu.querySelectorAll('button')];
  // isOpen, not menu.hidden: during the 120 ms fade-out the menu is still showing, and a click then means "open again"
  let anim = null, isOpen = false;
  function open(animate) {
    // reopened mid-fade: carry on from the opacity it had reached instead of blinking to 0
    const from = anim ? +getComputedStyle(menu).opacity : 0;
    anim?.cancel(); anim = null; isOpen = true; menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (animate) anim = menu.animate(reduce.matches ? [{ opacity: from }, { opacity: 1 }] : [{ opacity: from, transform: from ? 'none' : 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: ease });
    (items.find(b => b.getAttribute('aria-checked') === 'true') || items[0]).focus({ preventScroll: true });
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
  }
  function close(refocus = false, animate = false) {
    if (!isOpen) return;
    isOpen = false; document.removeEventListener('pointerdown', outside); btn.setAttribute('aria-expanded', 'false');
    anim?.cancel(); anim = null;
    if (animate && !reduce.matches) { anim = menu.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: ease }); anim.onfinish = () => { menu.hidden = true; anim = null; }; }
    else menu.hidden = true;
    if (refocus) btn.focus({ preventScroll: true });
  }
  const outside = e => { if (!$('#lang').contains(e.target)) close(false, true); };
  // a click with detail 0 came from the keyboard (Enter or Space on the button)
  btn.addEventListener('click', e => { if (!isOpen) open(e.detail > 0); else close(false, e.detail > 0); });
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' && !isOpen) { e.preventDefault(); open(false); } });
  menu.addEventListener('keydown', e => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'Tab') close(false);
  });
}
$('#surprise span').textContent = t('Surprise me');
$('.skip').textContent = t('Skip to animations');
$('#dial').setAttribute('aria-label', t('Categories'));

route();
