// Export: one standalone HTML page holding a set of designs, each running in its own frame with its code inline.
import { catById } from '../anims/registry.js';
import { source, standalone, download } from './code.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function exportGroup(name, anims) {
  if (!anims.length) return;
  const srcs = await Promise.all(anims.map(source));
  const tiles = anims.map((a, i) => `
  <article>
    <iframe title="${esc(a.title)}" loading="lazy" srcdoc="${esc(standalone(srcs[i], a.title))}"></iframe>
    <h2><i style="background:${catById[a.cat].hue}"></i>${esc(a.title)}</h2>
    <p>${esc(a.trick)}</p>
    <details><summary>Code</summary><pre>${esc(srcs[i])}</pre></details>
  </article>`).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} · Motion Library</title>
<style>
  body { margin: 0; padding: 32px clamp(16px, 4vw, 48px); background: #eceff2; color: #15171a; font: 15px/1.45 system-ui, sans-serif; }
  h1 { margin: 0; font-size: 28px; letter-spacing: -0.02em; }
  header p { margin: 4px 0 28px; color: #5b6066; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px 20px; }
  article { background: #fff; border-radius: 14px; padding: 10px 10px 14px; border: 1px solid #e1e5e9; }
  iframe { width: 100%; aspect-ratio: 4 / 3; border: 0; border-radius: 9px; display: block; background: #f4f6f8; }
  h2 { margin: 12px 4px 2px; font-size: 16px; display: flex; gap: 8px; align-items: center; }
  h2 i { width: 8px; height: 8px; border-radius: 50%; }
  p { margin: 0 4px; color: #5b6066; font-size: 14px; }
  details { margin: 10px 4px 0; } summary { cursor: pointer; font-weight: 600; font-size: 13px; }
  pre { max-height: 320px; overflow: auto; background: #f6f7f9; padding: 12px; border-radius: 8px; font: 12px/1.6 ui-monospace, Menlo, monospace; }
</style>
</head>
<body>
<header><h1>${esc(name)}</h1><p>${anims.length} ${anims.length === 1 ? 'animation' : 'animations'} from the Motion Library · exported ${new Date().toLocaleDateString()}</p></header>
<main>${tiles}
</main>
</body>
</html>`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export';
  download(`motion-library-${slug}.html`, html);
}
