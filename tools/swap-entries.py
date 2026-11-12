# swap.py <entries.py>: replace registry entries by old id with new entry text (kept in place, so order holds)
import sys, re, runpy
ROOT = '/Users/axeljohneckblad/Downloads/motion-library/anims/'
E = runpy.run_path(sys.argv[1])['E']          # list of (old_id, new_text)
for f in ['registry.js', 'registry-more.js']:
    src = open(ROOT + f).read().split('\n')
    out, i, changed = [], 0, 0
    while i < len(src):
        line = src[i]
        hit = next((n for o, n in E if line.startswith(f"  {{ id: '{o}'")), None)
        if hit is not None:
            j = i
            while not src[j].rstrip().endswith('} },'): j += 1
            out.extend(hit.strip('\n').split('\n')); i = j + 1; changed += 1
        else:
            out.append(line); i += 1
    open(ROOT + f, 'w').write('\n'.join(out)); print(f, 'replaced', changed)
