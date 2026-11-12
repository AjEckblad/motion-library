// A small JavaScript highlighter: comments, strings (template literals with nested ${…}), numbers,
// keywords and called functions. Returns one HTML string per line.
const KW = new Set('const let var function return if else for while do break continue new class export default import from of in typeof instanceof switch case try catch finally throw async await this null undefined true false void delete yield'.split(' '));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function scanTemplate(src, i) {           // i points at the opening backtick; returns index after the closing one
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '`') return j + 1;
    if (c === '$' && src[j + 1] === '{') { j = scanExpr(src, j + 2); continue; }
    j++;
  }
  return j;
}
function scanExpr(src, j) {               // inside ${ … }: returns index after the matching }
  let depth = 1;
  while (j < src.length && depth) {
    const c = src[j];
    if (c === '`') { j = scanTemplate(src, j); continue; }
    if (c === '"' || c === "'") { j++; while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; } j++; continue; }
    if (c === '{') depth++; else if (c === '}') depth--;
    j++;
  }
  return j;
}

export function tokenize(src) {
  const out = []; let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { let j = src.indexOf('\n', i); if (j < 0) j = n; out.push(['c', src.slice(i, j)]); i = j; continue; }
    if (c === '/' && d === '*') { let j = src.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; out.push(['c', src.slice(i, j)]); i = j; continue; }
    if (c === '`') { const j = scanTemplate(src, i); out.push(['s', src.slice(i, j)]); i = j; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; } j++; out.push(['s', src.slice(i, j)]); i = j; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(d || ''))) {
      const m = /^(0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)/i.exec(src.slice(i, i + 32));
      if (m) { out.push(['n', m[0]]); i += m[0].length; continue; }
    }
    if (/[A-Za-z_$]/.test(c)) {
      const w = /^[\w$]+/.exec(src.slice(i, i + 80))[0];
      const call = /^\s*\(/.test(src.slice(i + w.length, i + w.length + 4));
      out.push([KW.has(w) ? 'k' : call ? 'f' : '', w]); i += w.length; continue;
    }
    out.push(['', c]); i++;
  }
  return out;
}

// hot: Set of PARAMS keys whose value differs from the default; marked only on the PARAMS line (hotLine)
export function highlightLines(src, hot = new Set(), hotLine = -1) {
  const lines = [[]];
  let pendingHot = false;
  for (const [type, text] of tokenize(src)) {
    let cls = type;
    const onHotLine = lines.length - 1 === hotLine;
    if (onHotLine && type === '' && hot.has(text)) pendingHot = true;
    else if (onHotLine && type === 'n' && pendingHot) { cls = 'n hot'; pendingHot = false; }
    const parts = text.split('\n');
    parts.forEach((p, k) => {
      if (k > 0) lines.push([]);
      if (p) lines.at(-1).push(cls ? `<span class="tk-${cls.replace(' ', ' tk-')}">${esc(p)}</span>` : esc(p));
    });
  }
  return lines.map(l => l.join(''));
}
