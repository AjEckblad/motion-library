// Hearting: with one group a heart saves instantly; with more, a small popover anchored to the heart asks
// which group the design lives in (and offers moving it or removing the heart).
import { store } from './store.js';

const pop = document.getElementById('popover');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let closeFn = null;
const tick = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';

export function closePicker() { if (closeFn) closeFn(); }

export function heartIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.6-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.7 4.6-9.3 9.2-9.3 9.2z"/></svg>';
}

export function onHeartPress(btn, id, celebrate) {
  if (store.groups.length === 1) {
    if (store.isHearted(id)) store.unheart(id);
    else { store.heart(id); celebrate(btn); }
    return;
  }
  openPicker(btn, id, celebrate);
}

function openPicker(anchor, id, celebrate) {
  closePicker();
  const was = store.isHearted(id), current = store.groupOf(id);
  pop.innerHTML = `<h3>${was ? 'Move to group' : 'Save to group'}</h3>
    ${store.groups.map(g => `<button class="pop-item" type="button" role="menuitemradio" aria-checked="${g.id === current}" data-g="${g.id}">${tick}<span></span></button>`).join('')}
    <div class="pop-sep"></div>
    <form class="pop-new"><input type="text" maxlength="60" placeholder="New group" aria-label="New group name"><button type="submit">Add</button></form>
    ${was ? '<div class="pop-sep"></div><button class="pop-item danger" type="button" data-remove>Remove heart</button>' : ''}`;
  pop.querySelectorAll('[data-g]').forEach((b, i) => { b.querySelector('span').textContent = store.groups[i].name; b.title = store.groups[i].name; });
  pop.hidden = false;
  // place it under the heart, kept on screen; scale from the corner nearest the heart
  const r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = r.right - pw, top = r.bottom + 8, ox = 'right', oy = 'top';
  if (left < 12) { left = Math.max(12, r.left); ox = 'left'; }
  if (top + ph > innerHeight - 12) { top = r.top - ph - 8; oy = 'bottom'; }
  pop.style.left = left + 'px'; pop.style.top = Math.max(12, top) + 'px';
  pop.style.setProperty('--origin', `${oy} ${ox}`);
  // grows from the corner nearest the heart; under reduced motion it only fades
  pop.animate(reduce.matches ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  (pop.querySelector('[aria-checked="true"]') || pop.querySelector('[data-g]')).focus();

  const finish = gid => { const fresh = !store.isHearted(id); store.heart(id, gid); if (fresh) celebrate(anchor); close(); };
  pop.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => finish(b.dataset.g)));
  pop.querySelector('.pop-new').addEventListener('submit', e => { e.preventDefault(); const name = e.target.querySelector('input').value; if (!name.trim()) return; finish(store.addGroup(name)); });
  pop.querySelector('[data-remove]')?.addEventListener('click', () => { store.unheart(id); close(); });
  const outside = e => { if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) close(); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); anchor.focus(); } };
  setTimeout(() => document.addEventListener('pointerdown', outside), 0);
  document.addEventListener('keydown', key, true);
  function close() {
    document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key, true);
    pop.hidden = true; closeFn = null;
  }
  closeFn = close;
}
