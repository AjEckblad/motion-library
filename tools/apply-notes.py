# apply-notes.py <pending.py> [...]: replace each entry's `notes` with NOTES = { id: ['…', '…'] } in both registry files,
# and the Chinese notes with ZH = { id: ['…', '…'] } in anims/i18n-zh.js (title and trick there are left alone)
import sys, runpy, re, json
ROOT = '/Users/axeljohneckblad/Downloads/motion-library/anims/'
NOTES, ZHN = {}, {}
for f in sys.argv[1:]:
    d = runpy.run_path(f); NOTES.update(d.get('NOTES', {})); ZHN.update(d.get('ZH', {}))

def js(s):   # a single-quoted JS string; apostrophes are already ’, so only backslashes and stray quotes need escaping
    return "'" + s.replace('\\', '\\\\').replace("'", '’') + "'"

done = set()
for f in ['registry.js', 'registry-more.js']:
    L = open(ROOT + f).read().split('\n'); cur = None
    for i, l in enumerate(L):
        m = re.match(r"  \{ id: '([^']+)'", l)
        if m: cur = m.group(1)
        if cur in NOTES and l.startswith('    notes: ['):
            L[i] = '    notes: [' + ', '.join(js(n) for n in NOTES[cur]) + '],'; done.add(cur)
    open(ROOT + f, 'w').write('\n'.join(L))
missing = set(NOTES) - done
print(f'notes: {len(done)} updated' + (f'; not found: {sorted(missing)}' if missing else ''))

p = ROOT + 'i18n-zh.js'; src = open(p).read()
head, body = src.split('export const ZH = ', 1)
zh = json.loads(body.rstrip().rstrip(';'))
n = 0
for k, v in ZHN.items():
    if k in zh: zh[k]['notes'] = v; n += 1
open(p, 'w').write(head + 'export const ZH = ' + json.dumps(zh, ensure_ascii=False, indent=1) + ';\n')
print(f'zh notes: {n} updated' + (f'; no zh entry: {sorted(set(ZHN) - set(zh))}' if set(ZHN) - set(zh) else ''))
