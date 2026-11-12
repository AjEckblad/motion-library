#!/usr/bin/env node
// motion-library: copy an animation from the Motion Library into your project, tuned to your numbers.
//   npx motion-library add confetti --pieces 300
// The animations and js/code.js ship inside the package (cli/build.mjs copies them in), so nothing is downloaded.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANIMS, animById, catById, CATEGORIES, srcOf } from './anims/registry.js';
import { readParams, writeParams, parseParams, formatValue, standalone, promptFor } from './js/code.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(here, 'package.json'), 'utf8'));
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = s => c(1, s), dim = s => c(2, s), green = s => c(32, s), yellow = s => c(33, s);

const HELP = `${bold('motion-library')} ${pkg.version}: hand-made web animations, one plain-JS file each, no dependencies.

${bold('Usage')}
  npx motion-library add <id> [--<setting> <value> ...] [--dir <folder>] [--html] [--force]
  npx motion-library list [category]
  npx motion-library info <id>
  npx motion-library prompt <id> [--<setting> <value> ...]

${bold('Commands')}
  add      Copy an animation into your project. Settings you pass are written into its PARAMS line.
           --dir     where to put it (default: src/animations if there is a src folder, else animations)
           --html    write a standalone .html page instead of a .js module
           --force   overwrite a file that is already there
  list     All animations, or one category: ${CATEGORIES.map(k => k.id).join(', ')}
  info     What it does, how it works, and the settings you can tune
  prompt   Print a prompt for an AI coding assistant to fit the animation into your project

${bold('Example')}
  npx motion-library add confetti --pieces 300 --gravity 0.6

Browse them all, live: run the Motion Library site and open any card; Share gives a link with your settings.
Licence: MIT-0. Use it anywhere, change it freely, no credit needed.`;

// --pieces 300 or --pieces=300; flags without a value are booleans
function parseArgs(argv) {
  const pos = [], opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const [k, v] = a.slice(2).split(/=(.*)/s);
    if (v !== undefined) opts[k] = v;
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) opts[k] = argv[++i];
    else opts[k] = true;
  }
  return { pos, opts };
}

function fail(msg) { console.error(`${c(31, 'error')} ${msg}`); process.exit(1); }

// edit distance, for "did you mean"
function typo(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

function findAnim(id) {
  if (!id) fail('Which animation? Try `npx motion-library list`.');
  const a = animById[id];
  if (a) return a;
  const q = id.toLowerCase();
  const near = ANIMS.map(x => [x, x.id.includes(q) || q.includes(x.id) || x.title.toLowerCase().includes(q) ? 0 : typo(q, x.id)])
    .filter(([, d]) => d <= Math.max(2, Math.floor(q.length / 4))).sort((m, n) => m[1] - n[1]).slice(0, 5).map(([x]) => x);
  fail(`No animation called "${id}".${near.length ? ` Did you mean: ${near.map(x => x.id).join(', ')}?` : ' Try `npx motion-library list`.'}`);
}

// the settings from the command line, through the same gate the site uses: only the animation's own settings, only
// numbers, clamped to the range and snapped to the step. Reports anything that was dropped or changed.
const OWN = new Set(['dir', 'html', 'force', 'help', 'version']);
function tuned(a, opts) {
  const given = Object.entries(opts).filter(([k]) => !OWN.has(k));
  const query = new URLSearchParams(given.map(([k, v]) => [k, String(v)])).toString();
  const values = parseParams(query, a.params);
  for (const [k, v] of given) {
    if (!(k in a.params)) console.error(yellow(`  ignored --${k}: ${a.id} has no setting called "${k}"${Object.keys(a.params).length ? ` (it has: ${Object.keys(a.params).join(', ')})` : ''}`));
    else if (!(k in values)) console.error(yellow(`  ignored --${k}: "${v}" is not a number`));
    else if (Number(v) !== values[k]) console.error(yellow(`  --${k} ${v} became ${values[k]} (range ${a.params[k].min}–${a.params[k].max}, step ${a.params[k].step})`));
  }
  return values;
}
const source = a => fs.readFileSync(path.join(here, srcOf(a)), 'utf8');
const header = a => `// ${a.title} · Motion Library (npx motion-library add ${a.id}) · MIT-0\n`;

function add(id, opts) {
  const a = findAnim(id);
  const values = tuned(a, opts);
  let code = writeParams(source(a), { ...readParams(source(a)), ...values }, a.params);
  const dir = typeof opts.dir === 'string' ? opts.dir : fs.existsSync('src') ? path.join('src', 'animations') : 'animations';
  const file = path.join(dir, `${a.id}.${opts.html ? 'html' : 'js'}`);
  if (fs.existsSync(file) && !opts.force) fail(`${file} is already there. Use --force to overwrite it.`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, opts.html ? standalone(code, a.title) : header(a) + code);
  const p = readParams(code);
  console.log(`${green('✓')} ${bold(a.title)} → ${file}`);
  if (Object.keys(p).length) console.log(dim(`  settings: ${Object.entries(p).map(([k, v]) => `${k} ${v}`).join(', ')}`));
  if (opts.html) { console.log(dim('  open it in a browser: it runs on its own.')); return; }
  const rel = './' + path.relative(process.cwd(), file).split(path.sep).join('/');
  const name = a.id.replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
  console.log(`
  ${bold('Use it')}: the default export draws into a container, sizes itself to it, and returns a cleanup function.
    import ${name} from '${rel}';   // path from your project root: adjust it from your file
    const stop = ${name}(document.querySelector('#hero'));   // give the container a size
    // later, e.g. when a component unmounts: stop();
${a.pointer ? dim('  It reacts to the pointer inside its container.\n') : ''}${a.scroll ? dim('  It reads scroll inside its container (an element with data-scroll).\n') : ''}${dim(`  Fit it to your project with an AI assistant: npx motion-library prompt ${a.id}`)}`);
}

function list(cat) {
  if (cat && !catById[cat]) fail(`No category "${cat}". Categories: ${CATEGORIES.map(k => k.id).join(', ')}`);
  for (const k of CATEGORIES) {
    if (cat && k.id !== cat) continue;
    const items = ANIMS.filter(a => a.cat === k.id);
    console.log(`\n${bold(k.name)} ${dim(`(${k.id}, ${items.length})`)}`);
    const w = Math.max(...items.map(a => a.id.length));
    for (const a of items) console.log(`  ${a.id.padEnd(w)}  ${dim(a.title)}`);
  }
  console.log(dim(`\n${cat ? ANIMS.filter(a => a.cat === cat).length : ANIMS.length} animations. Add one: npx motion-library add <id>`));
}

function info(id) {
  const a = findAnim(id), now = readParams(source(a));
  console.log(`${bold(a.title)} ${dim(`· ${catById[a.cat].name} · ${a.kind}`)}\n${a.trick}\n`);
  for (const n of a.notes) console.log(`  • ${n}`);
  const keys = Object.keys(a.params).filter(k => k in now);
  if (keys.length) {
    console.log(`\n${bold('Settings')}`);
    const w = Math.max(...keys.map(k => k.length));
    for (const k of keys) { const r = a.params[k]; console.log(`  --${k.padEnd(w)}  ${formatValue(now[k], r.step).padStart(6)}  ${dim(`${r.label}, ${r.min}–${r.max}, step ${r.step}`)}`); }
  }
  console.log(dim(`\nnpx motion-library add ${a.id}${keys[0] ? ` --${keys[0]} ${a.params[keys[0]].max}` : ''}`));
}

function prompt(id, opts) {
  const a = findAnim(id), values = tuned(a, opts);
  const code = writeParams(source(a), { ...readParams(source(a)), ...values }, a.params);
  process.stdout.write(promptFor(a, code, catById[a.cat].name));
}

const { pos: [cmd, arg], opts } = parseArgs(process.argv.slice(2));
if (opts.version || cmd === 'version') console.log(pkg.version);
else if (!cmd || cmd === 'help' || opts.help) console.log(HELP);
else if (cmd === 'add') add(arg, opts);
else if (cmd === 'list' || cmd === 'ls') list(arg);
else if (cmd === 'info') info(arg);
else if (cmd === 'prompt') prompt(arg, opts);
else fail(`Unknown command "${cmd}". Run \`npx motion-library help\`.`);
