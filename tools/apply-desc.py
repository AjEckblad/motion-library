# apply-desc.py <pending.py>: set each entry's `trick` from DESC = { id: 'new description' } (both registry files, in place)
import sys, runpy, re
ROOT = '/Users/axeljohneckblad/Downloads/motion-library/anims/'
DESC = runpy.run_path(sys.argv[1])['DESC']
done = set()
for f in ['registry.js', 'registry-more.js']:
    L = open(ROOT + f).read().split('\n'); cur = None
    for i, l in enumerate(L):
        m = re.match(r"  \{ id: '([^']+)'", l)
        if m: cur = m.group(1)
        if cur in DESC and l.startswith("    trick: '"):
            t = DESC[cur].replace("'", '’').rstrip('.')
            L[i] = f"    trick: '{t}',"; done.add(cur)
    open(ROOT + f, 'w').write('\n'.join(L))
missing = set(DESC) - done
print(f'desc: {len(done)} updated' + (f'; not found: {sorted(missing)}' if missing else ''))
