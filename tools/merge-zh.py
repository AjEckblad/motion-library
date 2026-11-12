# merge-zh.py <pending.py>: add the pending file's ZH = { id: { title, trick, notes } } to anims/i18n-zh.js (JSON body, so it stays parseable)
import sys, runpy, json, re
P = '/Users/axeljohneckblad/Downloads/motion-library/anims/i18n-zh.js'
src = open(P).read()
head = src[:src.index('export const ZH =')]
body = src[src.index('export const ZH =') + len('export const ZH ='):].strip().rstrip(';')
cur = json.loads(body) if body.strip() != '{}' else {}
new = runpy.run_path(sys.argv[1]).get('ZH', {})
cur.update(new)
open(P, 'w').write(head + 'export const ZH = ' + json.dumps(cur, ensure_ascii=False, indent=1) + ';\n')
print(f'zh: +{len(new)} -> {len(cur)} entries')
