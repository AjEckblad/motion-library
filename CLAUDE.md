# Motion Library: project rules

A free, open-source catalogue of 223 live web effects, each one a single plain-JavaScript file you can tune with
sliders and copy. Live at https://ajeckblad.github.io/motion-library (repo AjEckblad/motion-library, public, GitHub
Pages from main). The site is in English, 中文, Español and Français.

## Start here
- Every session starts from "Resume here" at the top of BUILD-NEXT.md: what is live, what is in progress, what waits
  on AJ. At about 40% context (400k tokens) update Resume here (exact state, uncommitted files, next step) and hand off.
- DESIGN.md holds the site's design system (colours, type, motion). PRODUCT.md holds who it is for.

## Layout (static, no build step for the app)
- `anims/<cat>/<id>.js`: one effect. A header comment says what it shows and how it works, then one
  `const PARAMS = { ... }` line (the sliders write into it), then `export default function (stage) { ...; return cleanup }`.
  The cleanup cancels the frame loop, removes listeners and frees GL resources.
- `anims/registry.js` and `anims/registry-more.js`: the catalogue. Each entry has id, cat, title, kind
  (dom/canvas/webgl), posterAt (ms), trick (the card line), notes (two "How it works" paragraphs), params (slider
  ranges, `P(min, max, step, label)` and `O(label, ...options)`).
- `anims/i18n-{zh,es,fr}.js`: per-entry title, trick and notes, plus `LABELS` for slider and option labels.
- `stage.html` runs one effect in an iframe on a virtual clock (pause, slow motion, frame stepping). Effects read time
  only through requestAnimationFrame / performance.now, so their motion is a pure function of time.
- `index.html` is pre-rendered by tools/build-static.mjs (catalogue, FAQ, JSON-LD); js/ replaces those parts when it
  runs. A hand edit to index.html must match what build-static writes. `fx/`, `llms*.txt`, `fx-index.json`,
  `sitemap.xml` and `js/versions.js` are generated too.
- `js/` app (front page hero in js/hero.js + js/front.js, detail view, creatures in js/critters.js), `css/app.css`,
  `fonts/`, `posters/` (webp per effect, plus the hero's poster).
- `cli/`: the npm package (`npx motion-library add <id>`). `cli/anims` is built by `cd cli && node build.mjs`
  (gitignored). AJ publishes it to npm.

## Tools
- `node tools/check.mjs`: site checks in GPU Chromium (catalogue, languages, static HTML, versions). Must pass.
- `node tools/motion-check.mjs`: motion guards (grid entrance, hero, keyboard swaps, touch). Must pass.
- `node tools/posters.mjs <id|cat ...> [hero]`: renders posters at posterAt, checks the effect moves, writes a contact
  sheet. Run it for every effect you change.
- `SITE_URL=https://ajeckblad.github.io/motion-library node tools/build-static.mjs`: regenerate the static side after
  any catalogue, text or poster change.
- `node tools/gpu.mjs anims/<cat>/<id>.js [1440x620] [--dpr 2] [--p "a=1&b=2"]`: GPU frame time. Budget about 8 ms at
  1440x620 on DPR 2. The GPU is shared, so compare variants in interleaved runs.
- `node tools/look.mjs anims/<cat>/<id>.js 1000,3000,6000 [900x560] [--reduce]`: real-time shots plus a contact sheet
  in tools/.look/. `node tools/frames.mjs ... 9000,9050,9100`: frame-exact shots on the virtual clock.
- `node tools/shot.mjs [hash] [width] [height] [name]`: screenshot of the app.

## Shipping
- The lead session ships: posters, build-static, both test suites, then a commit to main with explicit paths
  (never `git add -A`; tools/.sheet.html and screenshots stay out). Helpers never commit or run build-static; they
  report files and evidence, and the lead applies shared files (registry, i18n, index.html).
- Commit identity is the repo-local no-reply address; AJ's email is never published. Never rewrite pushed history.

## Quality rules (AJ's)
- Every effect is its own idea, hard to make and worth stopping for. No two share a trick or a look. A weak piece is
  replaced, not kept alongside. Judge from rendered frames, never from titles.
- One effect per card. Never merge near-duplicates behind a mode switch; ship the better one. A variant picker inside
  one effect is fine only when AJ asks for it.
- Where AJ asks for realism, compare against real reference photos (open collections, credited) and iterate on
  screenshots until it holds up.
- Reduced motion shows a still. Pointer and touch input must not fight each other (a tap is not a drag).
- Creature movement (js/critters.js) is hands-off: fix reported bugs only, never retune the feel.
- No AI image or video generators. Art is made in code, or comes from AJ or CC0 / open collections.

## Words
- Every user-facing string goes into all four languages. 中文 uses full-width punctuation (，。：；？！). French puts
  a no-break space (U+00A0 or U+202F) before : ; ? ! and uses ’ for apostrophes.
- Card lines (`trick`) say in plain words what you see or can do, in one short line. No jargon, hype, em dashes or
  "not X but Y". Notes: the first paragraph says what it shows, the second how it works, still in plain words.
- Reports to AJ are short and plain: what changed, the evidence (numbers, screenshot paths), what waits on AJ.

## Saved agents (.claude/agents, local only)
- `effect-builder` (Opus, high effort): builds or reworks one effect.
- `site-ui` (Sonnet, medium): site chrome changes (index.html, css/, js/, tools/).
- `copywriter` (Sonnet, low): card and UI text in four languages.
Briefs to them only need what is specific to the job; these rules load automatically.
