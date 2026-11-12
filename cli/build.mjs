// Copies what the command line tool needs into this folder before packing: the animations, their registry, the shared
// code module (the same safety gate and prompt builder the site uses) and the licence. Runs as `prepack`, so
// `npm pack` / `npm publish` always ship the current library. Refuses to pack while the licence still has a placeholder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..');
const licence = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');
if (/\[your name\]/i.test(licence)) {
  if (process.env.ALLOW_DRAFT !== '1') { console.error('LICENSE still says [your name]: put the copyright holder in it first.'); process.exit(1); }
  console.warn('cli: draft build (LICENSE has a placeholder); never publish this one');
}

for (const d of ['anims', 'js']) fs.rmSync(path.join(here, d), { recursive: true, force: true });
fs.cpSync(path.join(root, 'anims'), path.join(here, 'anims'), { recursive: true });
fs.mkdirSync(path.join(here, 'js'));
fs.copyFileSync(path.join(root, 'js', 'code.js'), path.join(here, 'js', 'code.js'));
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(here, 'LICENSE'));
const n = fs.readdirSync(path.join(here, 'anims'), { recursive: true }).filter(f => f.endsWith('.js') && !f.startsWith('registry') && !f.startsWith('i18n')).length;
console.log(`cli: copied ${n} animations, js/code.js and LICENSE`);
