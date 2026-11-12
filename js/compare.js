// Compare: pin up to two designs (from their detail view) and watch them side by side with one set of controls.
import { animById, catById, srcOf } from '../anims/registry.js';
import { createPlaybar } from './playback.js';

export function createCompare({ toast, onClose }) {
  const tray = document.getElementById('tray'), root = document.getElementById('compare');
  let pinned = [], frames = [], playbar = null;
  const x = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"/></svg>';

  function renderTray() {
    tray.hidden = !pinned.length || !root.hidden;
    tray.innerHTML = `<span class="tray-label">Compare</span>${pinned.map(id => `<span class="chip" data-id="${id}"><span></span><button type="button" aria-label="Unpin">${x}</button></span>`).join('')}
      <button class="btn" type="button" ${pinned.length < 2 ? 'disabled' : ''}>${pinned.length < 2 ? 'Pin one more' : 'Compare'}</button>`;
    tray.querySelectorAll('.chip').forEach(c => {
      c.querySelector('span').textContent = animById[c.dataset.id].title;
      c.querySelector('button').addEventListener('click', () => toggle(c.dataset.id));
    });
    tray.querySelector('.btn').addEventListener('click', () => { if (pinned.length === 2) location.hash = `#/compare/${pinned.join(',')}`; });
  }
  function toggle(id) {
    if (pinned.includes(id)) pinned = pinned.filter(p => p !== id);
    else { if (pinned.length === 2) pinned.shift(); pinned.push(id); toast(pinned.length === 2 ? 'Two pinned: press Compare' : 'Pinned. Pin one more to compare'); }
    renderTray();
    document.dispatchEvent(new Event('compare-change'));
  }

  function open(ids) {
    close(true);
    root.hidden = false; tray.hidden = true; document.documentElement.style.overflow = 'hidden';
    root.innerHTML = `<div class="d-top"><button class="icon-btn d-close" type="button" aria-label="Close"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5"/></svg></button>
      <div class="d-crumb"><h1>Compare</h1></div></div>
      <div class="cmp-body"><div class="cmp-stages"></div><div class="cmp-bar"></div></div>`;
    const stages = root.querySelector('.cmp-stages');
    frames = ids.map(id => {
      const a = animById[id], col = document.createElement('div'); col.className = 'cmp-col';
      col.innerHTML = `<h2><i class="cat-dot" style="--hue:${catById[a.cat].hue}"></i><span></span></h2><div class="d-stage"><img alt="" src="posters/${a.id}.webp"></div>`;
      col.querySelector('h2 span').textContent = a.title;
      const f = document.createElement('iframe'); f.src = `stage.html?src=${srcOf(a)}&mode=detail`; f.title = `Live animation: ${a.title}`;
      col.querySelector('.d-stage').prepend(f); stages.append(col);
      return f;
    });
    playbar = createPlaybar(() => frames);
    root.querySelector('.cmp-bar').append(playbar.el);
    root.querySelector('.d-close').addEventListener('click', () => onClose());
    root.querySelector('.d-close').focus({ preventScroll: true });
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });   // the --ease-out token, as the detail view uses
  }
  addEventListener('message', e => {
    const f = frames.find(fr => fr.contentWindow === e.source);
    if (f && (e.data?.type === 'stage-ready' || e.data?.type === 'stage-ran')) {
      if (!f.classList.contains('live')) { f.classList.add('live'); const img = f.parentElement?.querySelector('img'); setTimeout(() => img?.remove(), 260); }
      playbar?.ready(f);
    }
  });
  function close() {
    if (root.hidden) return;
    playbar?.destroy(); playbar = null; frames = [];
    root.replaceChildren(); root.hidden = true; document.documentElement.style.overflow = '';
    renderTray();
  }
  renderTray();
  return { toggle, open, close, requestClose: () => onClose(), isPinned: id => pinned.includes(id), get isOpen() { return !root.hidden; } };
}
