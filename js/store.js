// Hearts, groups and settings, kept in this browser's localStorage.
const KEY = 'motion-library.v1';
const newId = () => 'g' + Math.random().toString(36).slice(2, 9);
const fresh = () => ({ groups: [{ id: newId(), name: 'Hearted' }], items: {}, sound: false });

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s || !Array.isArray(s.groups) || !s.groups.length || typeof s.items !== 'object') return fresh();
    const ids = new Set(s.groups.map(g => g.id));
    for (const k in s.items) if (!ids.has(s.items[k])) s.items[k] = s.groups[0].id;   // repair orphans
    return { groups: s.groups, items: s.items, sound: !!s.sound };
  } catch { return fresh(); }
}

let state = load();
const listeners = new Set();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} listeners.forEach(fn => fn(state)); };

export const store = {
  get groups() { return state.groups; },
  get sound() { return state.sound; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  isHearted: id => id in state.items,
  groupOf: id => state.items[id],
  count: () => Object.keys(state.items).length,
  itemsIn: gid => Object.keys(state.items).filter(k => state.items[k] === gid),
  heart(id, gid = state.groups[0].id) { state.items[id] = gid; save(); },
  unheart(id) { delete state.items[id]; save(); },
  addGroup(name) {
    const clean = name.trim().slice(0, 60) || `Group ${state.groups.length + 1}`;
    const g = { id: newId(), name: clean }; state.groups.push(g); save(); return g.id;
  },
  renameGroup(gid, name) { const g = state.groups.find(x => x.id === gid); const clean = name.trim().slice(0, 60); if (g && clean) { g.name = clean; save(); } },
  deleteGroup(gid) {
    if (state.groups.length < 2) return;
    state.groups = state.groups.filter(g => g.id !== gid);
    for (const k in state.items) if (state.items[k] === gid) state.items[k] = state.groups[0].id;
    save();
  },
  setSound(on) { state.sound = !!on; save(); },
};
