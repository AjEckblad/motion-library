# insert-entries.py <pending.py>: add NEW = [(cat, entry), ...] after the last entry of each category, in whichever registry file holds it
import sys, runpy
ROOT = '/Users/axeljohneckblad/Downloads/motion-library/anims/'
NEW = runpy.run_path(sys.argv[1])['NEW']
files = {f: open(ROOT + f).read().split('\n') for f in ['registry.js', 'registry-more.js']}
for cat, entry in NEW:
    cat = cat.strip()
    best = None
    for f, lines in files.items():
        for i, l in enumerate(lines):
            if l.startswith('  { id: ') and f"cat: '{cat}'" in l: best = (f, i)
    if best is None:  # empty (new) category: append at the end of registry-more.js's list
        lines = files['registry-more.js']; j = max(i for i, l in enumerate(lines) if l.startswith('];')) - 1
    else:
        f, i = best; lines = files[f]
        j = i
        while not lines[j].rstrip().endswith('} },'): j += 1
    lines[j + 1:j + 1] = entry.strip('\n').split('\n')
    print('added to', f, cat)
for f, lines in files.items(): open(ROOT + f, 'w').write('\n'.join(lines))
