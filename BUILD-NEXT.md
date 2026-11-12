# Resume here (2026-11-12, round 2): interactive math, short notes, blue accent, IBM Plex type are DONE

214 pieces. Checks: check 76/76, motion-check 15/15, posters --leak (generative, simulation, retro) all clean and
moving, design-taste inspect --app 0 FAIL (1 WARN: below-fold, a 214-card gallery). CLI bumped to 0.3.1 and rebuilt
(0.3.0 is on npm; AJ published it 2026-11-12).
This round:
- 19 more pieces answer the pointer with no click (16 generative + double-pendulum + oscilloscope; all now
  `pointer: true`). Pointer pieces open the detail view already running, with no big play button.
- Bug fixed: hover previews in the grid never received the pointer (the card's 2px lift made the media its own
  stacking layer under .card-hit). `.card.is-live .card-media` now has z-index 3; focus starts a preview only on
  keyboard focus (:focus-visible), so a mouse click is never swallowed by a preview mounting mid-click.
- Detail view: How it works sits above Install. Every note is now 2 short strings (median 41 words, was 83), EN + 中文;
  tool: tools/apply-notes.py.
- Accent #ff5a36 → light sky blue #7cc0ff (focus #a6d4ff); the Hearted dial word is soft pink #ffb3c8.
- Search bar removed (markup, logic, strings, checks).
- Type: IBM Plex Sans + IBM Plex Mono (self-hosted), six sizes 13/14/16/20/24/28 as --fs-* tokens, weights 400/500/600.
  Geist was tried first and dropped: the impeccable detector flags it as overused.

WAITING ON AJ
- (done) npm 0.3.1 is published (2026-11-12) and matches the local build file for file
- (done) live on GitHub Pages: https://ajeckblad.github.io/motion-library/ (repo github.com/AjEckblad/motion-library,
  public, Pages from main /). After any catalogue change: SITE_URL=https://ajeckblad.github.io/motion-library node tools/build-static.mjs,
  then commit and `git push` (gh is logged in as AjEckblad; commits use 355636509+AjEckblad@users.noreply.github.com).
- the 80 UI demos are light app screens: convert to dark-mode mockups or keep?
- ink-drop is the weakest card on black (Ink fluid covers it): cut?
- (done) /review-animations ran 2026-11-12; all 8 fixes applied and guarded in tools/motion-check.mjs (18/18):
  dial snaps on keyboard moves, dial fisheye is transform-only (font-stretch removed: 129 → 2 layouts per hover second),
  popover fades only under reduced motion, grid exit has no stagger, card lift 200ms, heart press 160ms, logo turn
  240ms, every :hover rule gated to fine pointers.

# Earlier (2026-11-12, round 1): dark redesign + fx effects + AI-crawler pages
51 new effects, 20 scene pieces cut to _cut/, dark shell, 3 across, scrollspy dial, EN/中文, FAQ, npx line, WebP
posters, tools/build-static.mjs (re-run after any catalogue change; SITE_URL=https://… once there is a domain).

# Build list: round 2 (2026-11-08)

User request: creatures that vary in size and material and roll/bounce around the dial; many more, very detailed animations in Flow & particles, Fluid, and Chrome & 3D ("the lengths of what is possible").

## Creatures
- [x] Materials: fur, jelly, chrome, knit (user gave no pick, so all four). Sizes 38–92px.
- [x] Roam the dial column with physics (no word platforms in the end: they covered category names; they roll on the floor under the words): floor, walls, bouncing on the dial's arc as a solid disc, colliding with each other. They roll (the body rotates with travel) and right themselves when resting.
- [x] Changed 2026-11-09 (user feedback: they bunched at the bottom): no gravity, floor or bouncing any more. They float weightlessly and spread over the whole dial column (wandering heading, bob, lazy tilt, soft separation), drift off an edge every 20–50 s and float back in from another, and sit behind the dial words (words carry a background-colour halo). They pause while the detail or compare view is open. Code: js/critters.js.
- [x] Changed 2026-11-09 (2) (user feedback: they hid behind the white panel, covered dial words, should be faster and all fluffy). Rules:
  - **Range**: the crew roams the whole viewport.
  - **Layering**: a fixed layer above the page background and behind the cards (z-index 0 vs the sheet's 1). The white sheet panel is gone: cards sit on the frame and the grid lines up with the logo. A clipped twin inside the bar (z-index -1 there) shows any creature floating up into the bar band, above the bar's background and below its controls. Cards always draw above creatures (pixel-checked).
  - **Words**: they never cover text: dial words, sheet header, top-bar controls, card titles, kind labels and notes, empty states, the tray.
    - A soft push within 36 px soaks up their closing speed.
    - 16-direction look-ahead steering turns them toward open space, so pockets and corners resolve outward.
    - A ≤3 px/frame slide clears a word that moved onto one.
    - Card images are soft obstacles: a creature may tuck partly behind a card, never deep.
    - The dial-word halo is removed.
    - Boxes are cached: bar and dial every 250 ms; sheet words on any change, every 250 ms while it settles, then every 1 s. Sheet boxes are kept in page coordinates, so scrolling never measures, and creatures over the sheet ride along with the scroll.
    - The first placement waits for a settled layout.
  - **Motion**:
    - About 2× faster: 30 px/s × sqrt(80/size) × a personal factor (0.78–1.35) × moods (cruise, slow drift 0.4–0.65×, gentle dash 1.8–2.3×, eased).
    - A loose pull toward a fresh open spot every 6–14 s keeps them travelling the whole page.
    - Kept: edge exits and re-entry at the most open edge spot, sleep, the pause under detail and compare.
    - Reduced motion: a slow even drift (0.35×), no dashes, hops or spins.
    - Phones: hidden (the crew isn't even built there).
  - **Look**:
    - All 7 are fur with a coarseness from 0 (fine down with a soft haze) to 1 (shaggy locks with under-shadows): mint 0, mist 0.12, peach 0.36, rose 0.55, mustard 0.78, plum 0.9, graphite 1. New palettes: rose and graphite.
    - The static peeking creature became the mint crew member.
    - Each creature is a composited `div` (static body canvas + tiny face canvas repainted only on gaze, blink or mouth changes + CSS Zs).
  - **Measured**: crew JS ≈0.35–0.5 ms per frame (p95 <1 ms); 0 text overlaps in 20 s samples on All, a category, scrolling, sleep, empty states and resizes.
  - **Code**:
    - js/critters.js (crew, steering, layers);
    - js/creatures.js (`paintFur(S, palette, seed, coarse, pad)`; coarse 0.4 is the old coat exactly, so detail and empty-state creatures are unchanged; `drawFeatures` parts/lightInk);
    - css/app.css (.sheet, .crew, .crew-top, .critter);
    - js/app.js (createCrew wiring, refresh after render, toss toward the die's target).
- [x] Changed 2026-11-09 (3) (user: "make the fluffies as fluffy as possible"). New fur painter in js/creatures.js (`paintFurLayers`; `paintFur` composites it for the single creatures):
  - Every coat is a lit ball of hair: a soft undercoat gradient that fades out just past the body (no disc or glow behind them), thousands of thin tapered strands (3 taper steps, thinner and more see-through towards the tip) shaded like a sphere lit from the top left and darker towards the roots, backlit translucent tips at the outline, and a few long flyaways. Fine coats keep a downy haze.
  - Coarseness still varies: 0 is dense velvet, 1 is long, wavy soft locks in tufts with a shadow under each (mustard, plum and graphite stay visibly shaggy).
  - Strands are binned by shell, taper step, shade and weight, so 2–7k strands draw in a few hundred strokes: 10–25 ms per creature at 130 px, once at build. Shells are dithered, otherwise the root lines draw visible rings.
  - The coat is shorter underneath so the feet peek out, and it always stops short of the sprite edge (the pad-0 single creatures aren't clipped).
  - The crew gets the fringe (long outer strands) on its own composited canvas (`.critter-fur`). It streams back against the drift and swings on a loose spring (k 110, damping 7.5) when the pace changes, plus a small breathing puff and a fling-out during a spin. Offset ≤ 5% of the size (0.5–2.4 px measured). Held still under reduced motion.
  - The avoidance radius now counts translucent tips (alpha ≥ 90, was 150).
  - Measured: crew JS 0.39 ms per frame mean (p95 0.7 ms), no frames over 20 ms beside a live WebGL preview; 0 word overlaps in 20 s samples (closest 14 px); check.mjs 40/40.
- [x] Wander behaviour: roll, hop, rest. Squash on landing; jelly wobbles more.
- [x] Sleep when idle (no pointer movement for about 12 s); wake with a hop.
- [x] Keep reactions: heart → a critter hops; Surprise me → toss from a critter. Reduced motion: a slow drift since 2026-11-09 (2) (was still). Phones: hidden.

## +15 Flow & particles
- [x] galaxy, strange-attractor, physarum, lightning, point-morph
- [x] magnetic-field, smoke-sprites, falling-sand, dot-matrix, confetti
- [x] fireflies, silk-ribbons, gpu-particles, text-dissolve, orbit-trails

## +15 Fluid
- [x] fire-smoke, caustics, ferrofluid, marbling, sph-water (fixed 2026-11-08: pressure was ~100x too soft, `* 0.01` removed and k 2600→8000; mean density now ~1.1x rest)
- [x] raindrops-glass, liquid-glass-fill, ink-drop, underwater, dripping-text
- [x] mercury, honey-drip, water-surface-3d, bubbles, paint-swirl

## +15 Chrome & 3D
- [x] liquid-metal, mandelbulb, infinite-tunnel, glass-prism, low-poly-planet
- [x] point-globe, extruded-type, isometric-city, holo-card, torus-knot
- [x] jelly-cube, neon-geodesic, path-spheres, sdf-morph, paper-fold

## Done means
Each batch: posters + contact sheet look right, no errors; `node tools/check.mjs` still 36/36 (update the counts it expects); registry entries carry notes + slider ranges.

## Also done (user feedback)
- [x] Dial: the rule (arc line, ticks, needle, counts) is gone; just the words on a curve, in a narrower column (300px), so the grid gets 4 wider columns.
- [x] 2026-11-09 detail view (user: "very blurry", "should not be playing already", "breaks when you change settings"). Root cause of all three: the 640×512 card poster sat on top of the live stage iframe (later in the DOM, no z-index), so the viewer saw a stretched still while the clock ran underneath and slider changes seemed to do nothing. Fix: iframe z-index 1 and the poster is removed once the stage is live (detail and compare). The detail view now opens paused on its first frame (`stage.html?paused=1`; a stopped stage draws one frame two real frames after mount, after the ResizeObserver has wiped the canvas) with a round play button that leaves on the first play; Replay now restarts and plays. Compare still autoplays. run.sh now serves `Cache-Control: no-store` so the browser never mixes old and new modules. The search placeholder count comes from ANIMS.length. Also fixed: the close fade stayed on #detail at opacity 0 (fill:forwards), making every later detail open invisible; reaction-diffusion slider ranges narrowed so no endpoint dies out.

## How new entries are added
- Files: anims/<cat>/<id>.js (PARAMS line + export default function(stage) returning cleanup).
- Registry: append to MORE in anims/registry-more.js (sorted into categories automatically).
- Verify: node tools/posters.mjs <cat>; montage posters with ffmpeg hstack; node tools/check.mjs at the end.

## DONE 2026-11-11: "every piece its own idea" overhaul is COMPLETE. START HERE NEXT SESSION.

**2026-11-11, after /review-animations:** UI durations trimmed (directional-tabs 240, blur-crossfade 260, chart-morph 280, list-reorder 300, stagger-grid tiles 360, circle-reveal 450). All 80 UI pieces honour prefers-reduced-motion (movement dropped, fades kept; scrub-reveal and lit-border need none). `tools/look.mjs --reduce` previews it. CLI bumped to 0.2.0; AJ publishes from their own Terminal. Open taste calls: velocity-skew and vf-wave keep a slow drift under reduce; rubber-band loses its stretch under reduce (by design).
183 animations (Flow 22 replaced, Chrome 8 replaced + 4 rebuilt, Fluid 4 replaced, Shaders 9 -> 13, every simple category 5 -> 10 and re-dressed in product scenes). All posters rendered with the leak test clean; check.mjs 59/59.
Left for AJ: (1) lower effort (design work done); (2) npm: bump cli/package.json to 0.2.0 with AJ's OK, then AJ runs `cd ~/Downloads/motion-library/cli && npm publish` in their own Terminal (2FA); (3) AJ runs /review-animations over the new UI pieces.
Registering agent output: tools/swap-entries.py (E) + tools/insert-entries.py (NEW), then `node -e "import('./anims/registry.js')"` to be sure it parses: the Morph agent left plain apostrophes in single-quoted notes, which broke the registry until they were swapped for ’.
Agent-flagged weak spots (optional polish): phone scenes have ~8 px text at poster size; accordion poster is a settled frame; card-stack-swipe back cards show as strips mid-loop; ripple/bell small at card size; lit-border subtle; menu-close hero is a plain gradient; chart-morph tab pill snaps width; logo-draw and liquid-button last tweaks not re-viewed; roche-limit moon small; portal sky streaks; particle-life poster noisy; tesseract dark.

## (history) IN PROGRESS 2026-11-10: "every piece its own idea" overhaul
Design: docs/superpowers/specs/2026-11-10-unique-ideas-design.md (AJ approved: replace weak pieces, don't keep alongside).
AJ raised effort to max for this design work and asked: TELL AJ WHEN THE DESIGN WORK IS DONE so they can lower it again.
AJ's bar (their words): each animation must be its own idea, "things someone would find hard to create / inspirational", not "moving pieces of chrome"; Flow had "a lot of mediocre design ... really go all out".

DONE and registered (old files + posters deleted, entries swapped in place, still 139 total):
- FLOW (22): drone-show, orbitals, wheat-field, wind-tunnel, physarum (Tokyo rebuild), starry-night, iron-filings, cloud-chamber, galton-board, firefly-sync, particle-life, roche-limit, states-of-matter, bio-shore, scramble-crossing, calligraphy, chladni (brass plate rebuild), rainbow, pin-art, spider-web, sand-mandala, holi. Verified: posters.mjs flow --leak all clean + moving, check.mjs 59/59, all ~60 fps.
- CHROME (8): tesseract, inflated-type, geode, melting-logo, portal, dust-bust, shatter, cloth-reveal (replaced glass-spheres, gyroscope, iridescent-torus, voxel-wave, chrome-blobs, wireframe-terrain, newtons-cradle, cube-carousel). check.mjs now uses liquid-metal (chrome-blobs is gone).

NEXT, in order:
1. DONE 2026-11-10 (second session): Chrome verified and four pieces rebuilt after looking at them over time:
   - melting-logo: letters now stand on a black mirror floor (reflections traced a second time), soften (blurred field), squash, sink and swell at the base; drips hang from overhangs found by scanning the glyphs (works for any WORD); rivulets on the faces; puddle = one lobe per letter; chrome 'horizon' on the faces; reform is a damped spring that overshoots. posterAt 3700.
   - dust-bust: the bust is now a sculpted SDF (skull, jaw, cheekbones, eye sockets with blank eyes, nose, lips, ears, curls, shoulders, classical curved cut, socle) sampled ONCE on the GPU by random isotropic lines into RGBA8 MRT (16-bit positions, oct normals, AO, marble vein); socle never dissolves; ember edge white-hot -> orange -> grey. posterAt 5200.
   - cloth-reveal: the hidden object is a chrome small stellated dodecahedron mounted on one spike; cloth collides with core + 12 spike cones + tips; the top tip snags the sheet's middle (silk catches on points) until the whip; whip goes up and away (not at the camera); high-contrast studio. posterAt 4020.
   - shatter: burst decelerates to a stop mid-air (time running out), shards hang 0.5 s, then rewind; pane has a bright rim and diagonal window-reflection streaks so it reads as glass. posterAt 2300.
   Tools added: tools/look.mjs writes a contact sheet (tools/.look/<id>-sheet.png) when given several times; tools/posters.mjs accepts single ids as well as categories. check.mjs 59/59 after the first three rebuilds.
   Still-known weaker spots (lower priority): roche-limit moon small at poster size; portal faint sky streaks on far dune crests; particle-life poster noisy; tesseract a bit dark.
   npm: PUBLISHED motion-library@0.1.0 (2026-11-10). Republish as 0.2.0 after the overhaul (AJ runs npm publish in their own Terminal).
2. DONE 2026-11-10: FLUID 4/4 registered with posters: latte-art (GPU stable fluids with a moving source + MacCormack dye; the stream's dark trail is its own dye, which is what makes the rosetta veins), beer-pour (nucleation-site bubble chains that grow and speed up, head, lace rings per sip, condensation only where cold), lava-flow (viscous flow with temperature-dependent mobility, surface-age crust, plates on flow-carried coordinates that relax back), billow-clouds (Kelvin–Helmholtz: buoyancy + vorticity confinement + projection, sun-marched lighting). Replaced ripples, ocean-waves, caustics, bubbles. check.mjs 59/59.
3. DONE 2026-11-10: SHADERS 9 -> 13, built by an agent, reviewed and registered: crt-monitor (replaced aurora), cmyk-halftone (replaced voronoi), pen-sketch, ascii-render, pixel-sort, hyperbolic-tiling. 143 animations; posters clean; check.mjs 59/59. ALL DETAILED DESIGN WORK IS DONE (AJ told: can lower effort).
4. SIMPLE CATEGORIES: 5 -> 10 each and re-dress every piece in a small believable product scene (lists in the design doc table). Basics + Transitions DONE 2026-11-10 (agent built, Claude reviewed the poster sheet and registered: 153 animations, check.mjs 59/59; register with tools/swap-entries.py for E and tools/insert-entries.py for NEW). It was delegated to a second background agent (re-dresses the 10 existing files in place, adds 5 new each; entries in scratchpad pending-basics-transitions.py, E = updated existing entries, NEW = (cat, entry) pairs). Text + Scroll DONE 2026-11-11 (agent built, Claude reviewed the sheet and registered; 167 animations; check.mjs 59/59 after fixing the dial check's hard-coded '5 text cards' to read the registry). Remaining after those: Hover, Micro, Springs, Morph (assign 2-3 agents at a time; AJ's choice; the GPU is shared so not more). Hover + Micro DONE 2026-11-11 (registered, leak test clean). Springs DONE 2026-11-11 (all 10 registered; 178 animations). Springs + Morph: the first agent ran out of context after 4 new Springs pieces (bottom-sheet, swipe-dismiss, chat-heads, icon-jelly), now REGISTERED (157 animations). Springs remainder (pull-refresh + re-dress squash-bounce, rubber-band, pendulum-wave, verlet-rope, ball-collisions) DELEGATED 2026-11-11 at medium; entries -> scratchpad pending-springs2.py. The phone kit lives in scratchpad src/ (PHONE.txt + build.py). MORPH DELEGATED 2026-11-11 at medium (scratchpad pending-morph.py, updated per piece). Plan from the previous agent: re-dress shape-morph (music-player cover changing shape per track), icon-morph (download->check and list<->grid in a podcast app), gooey (add button oozing into action buttons), line-draw (analytics card lines drawing on), liquid-button ("Place order" in a checkout); new play-pause, menu-close, chart-morph, logo-draw, button-menu (see the design doc table). AJ 2026-11-10: launch those simple-category agents with effort 'medium' (Agent tool effort param) once the shaders are reviewed; do NOT restart already-running agents just to change effort.
5. Then tell AJ the design work is done.

How I worked (keep doing this): write the piece, render it with tools/look.mjs at 2-3 times (node tools/look.mjs anims/<cat>/<id>.js 1500,5000 --fps; PNGs land in tools/.look/), look, fix what reads wrong, repeat; then swap the registry entry with tools/swap-entries.py <file.py> where the file defines E = [(old_id, new_entry_text), ...] (same 4-line entry format as registry-more.js, P(min,max,step,label) params); delete the old file + poster; run posters --leak + check.mjs per category. Every piece: one-line PARAMS, export default function(stage) returning cleanup, WebGL2 with WEBGL_lose_context on cleanup, ResizeObserver, pixel budget for raymarchers, ~60 fps at 900x560.

APPLIED 2026-11-10 (AJ said "apply the fixes"; guarded by `node tools/motion-check.mjs`, 15/15, and check.mjs 59/59). Also fixed: `.heart:active` lost to `.card:hover .heart` on specificity, so the press never showed on desktop; the touch rule now also covers `(pointer: coarse)` and `(pointer: none)`. The /review-animations verdict had been BLOCK: dial arrow keys and search typing animate the grid swap (should be instant), grid entrance stagger too long (320 ms x 16 -> 240 ms, cap 8), built-in 'ease-out' in app.js:85 and compare.js:46 (use the cubic-bezier token), ungated :hover on .brand-mark and .card .heart, .heart:active scale(.9) -> .94. I offered to apply; not applied yet.

## Resume here (handoff 2026-11-09, after features 1, 7 and the unpublished package)
State: 139 animations. `node tools/check.mjs` 59/59 PASS. Posters current.
DONE 2026-11-09 (3): fluffier fur and a trailing fringe (see "## Creatures", Changed 2026-11-09 (3)).
DONE 2026-11-09 (2): creature rework (see "## Creatures", Changed 2026-11-09 (2)).
   - Fluffies roam the whole page behind the cards, with no white panel.
   - They path around every word.
   - They are faster and vary in speed.
   - All are fur with different coarseness.
   - Verification scripts (overlap sampler, pixel layering test, frame cost) live in the session scratchpad, not the repo.
Done since the last handoff (see "Also done" above):
   - Detail view: poster no longer covers the live stage (it was the blur and the "settings break" report); opens paused on frame 1 with a round play button; Replay plays.
   - BIG BUG fixed: the close fade (fill:forwards) stayed on #detail at opacity 0, so every detail opened after closing one was invisible until reload. Now cancelled once hidden and on reopen (js/detail.js closeAnim). Regression check added.
   - Slider sweep of all 105 (every slider to min, max, fast scrub): 0 errors. Only real dead end was reaction-diffusion; ranges now feed 0.025-0.05, kill 0.058-0.0655 (each endpoint checked by eye). Sweep tooling lives in the session scratchpad (sweep.mjs / triage.mjs), not the repo.
   - run.sh serves Cache-Control: no-store. Search placeholder counts from ANIMS.length.
DONE 2026-11-09 (4): motion review fixes 1-5 and 7 applied. check.mjs 40/40 (the Esc check now asserts it's hidden within 60 ms with no ghost).
   1. Esc closes instantly: js/app.js sets kbClose on Escape and route() passes it to detail.close()/compare.close(). The back button and pointer closes keep the FLIP and fade.
   2. Detail open and close fades use easeOut = cubic-bezier(0.23, 1, 0.32, 1) (js/detail.js, matches --ease-out).
   3. The close FLIP is 300 ms on easeOut (flip() takes { duration, easing }); open stays 460 ms on the drawer curve. Measured with getAnimations().
   4. The poster blurs to 2px over 200 ms while the live stage fades in (css/app.css .d-stage:has(iframe.live) img). Traced frame by frame: 0 -> 1.2 -> 1.75 -> 2px.
   5. The crew eases to 0.4x while a card preview plays: crew.hush(on) in js/critters.js, called from startPreview/stopPreview. Measured pace 1.0 -> 0.41 (1.9 s) -> 0.99 after.
   7. Reduced motion no longer zeroes transitions: transition-property is limited to opacity/colour/filter, so fades keep their 150-200 ms and every transform snaps. Keyframes stay cut to a frame.
DROPPED: fix 6 (reduced-motion creatures hold still). The user said on 2026-11-09 to leave the creature movement alone. Creature questions 1-3 are dropped too.
OPEN (bug, user report 2026-11-09): "they move out of the screen up, but when it sits at the sides it goes from the right to the left side of the screen". Exact symptom not confirmed yet; asked the user.
   - Found so far: a creature roaming in the dial column (x about 1130-1190 at 1440 wide, between the grid's right edge and the dial words) often can't leave. nearestEdge picks the right edge, which the dial's words wall off (word gaps about 32 px). It sits there in 'leave' for good, and two of those fill the busy slots (busy < 2), so no one else leaves or comes back. Measured with the old code: 2 of 7 real side leaves got out within 25 s. No creature ever re-entered from the opposite side in 2-minute traces at 1440, 1680 and 1920 wide.
   - Tried and reverted: (a) nearest edge with a clear straight run: sent one across the whole grid to the left (a row of card images counts as clear). (b) steer to the most open nearby edge spot plus a re-pick after 8 s: 4 of 7 out, not a fix. The dial corridor is about 108 px wide for creatures up to 86 px across, and several creatures crowd it.
   - Test harness (scratchpad, not repo): leave-stats.mjs <dir> old|new N serves a critters variant and forces leaves from real side positions.
WAITING ON THE USER (creature questions, asked 2026-11-09):
   1. Phones: should a crew show there? (Currently hidden, not even built.)
   2. Reduced motion: slow drift (now) or hold still (PRODUCT.md says nothing autoplays)?
   3. May creatures tuck partly behind card edges (now: soft, never deep)?
   4. Safari is untested (canvas, composited transforms, the fur painter).
DECIDED 2026-11-09 (user): build Feature 1 (share links + embeds), Feature 2 (install command) and Feature 7 ("Copy as prompt"), in that order.
   - Feature 2: publish to npm now. Package name `motion-library` (it was unpublished in 2022, so npm should allow it; confirm at publish). The animations ship inside the package, so `npx motion-library add <id>` needs no hosted site. The user runs `! npm login` themselves; ask before `npm publish` (outward-facing).
   - Licence: MIT-0 (the user's pick after MIT vs MIT-0 was explained). LICENSE file + package.json "license": "MIT-0" + one line per snippet.
   - Dropped: video/GIF export (the user: developers want the effect in their own context, not a clip).
   - Feature 7, "Copy as prompt": code + notes + key numbers formatted for Claude/Cursor, a button beside Copy.
DONE OVERNIGHT 2026-11-09/10: +15 Flow & particles, +15 Chrome & 3D, +4 Shaders (34 new, 139 total; flow 35, chrome 35, shaders 9). All posters checked by eye and fixed where needed; posters.mjs --leak on flow/chrome/shaders: all clean and moving; check.mjs 59/59; heaviest ones measured at 900x560: all ~60 fps (volumetric-clouds pixel budget lowered to 190k to get there). Not yet looked at by the user. Mark each [x] as it lands (file + registry entry in anims/registry-more.js MORE with trick, 2-3 notes, params + poster checked on the contact sheet):
   Flow: [x] snowfall [x] sparks [x] murmuration [x] dandelion [x] ant-colony [x] plexus [x] tornado [x] embers [x] dust-motes [x] harmonograph [x] chladni [x] dla-crystal [x] autumn-leaves [x] stippling [x] rain-splash
   Chrome: [x] menger-sponge [x] terrain-flyover [x] rubiks-cube [x] glass-spheres [x] voxel-wave [x] gyroid [x] soap-bubble [x] dna-helix [x] volumetric-clouds [x] black-hole [x] gem [x] fractal-tree [x] newtons-cradle [x] klein-bottle [x] gyroscope
   Shaders: [x] domain-warp [x] truchet [x] kaleidoscope [x] dither
   Rules: plain JS, one file, `const PARAMS = { ... };` on one line, export default function(stage) returning cleanup, ResizeObserver, WebGL2 with a pixel budget (~360k px, see chrome/sdf-morph.js), loseContext on cleanup. Verify per batch: node tools/posters.mjs <cat> (errors, STILL), look at tools/sheet-<cat>.png; at the end node tools/check.mjs.
   npm: the user ran `npm login` and will finish it in the morning; still do not publish without their OK.
DONE 2026-11-09: Feature 1, share links + embeds. check.mjs 52/52 (12 new).
   - #/a/<id>?pieces=300 restores sliders + code; sliding updates the address bar via replaceState; Reset gives the plain link. js/code.js encodeParams/parseParams (the gate: slider keys only, plain numbers only, clamped + snapped).
   - Share and Embed sit in the detail top bar (not the code head: page-level actions, and the code head stays room for Prompt). copyText() is shared by Copy/Share/Embed.
   - stage.html: ?p= applied before the first mount (window.__params); mode=embed adds a "Motion Library" badge back to the tuned link (new tab), pauses off screen (IntersectionObserver), starts paused with a play button under reduced motion.
   - Security: messages accepted only from parent on the same origin; ?src= must match anims/<cat>/<id>.js (a crafted src could otherwise run any script on the site's origin once public).
DONE 2026-11-09: Feature 7, "Copy as prompt". A Prompt button in the code head (between Copy and Download) copies promptFor(anim, code, catName) from js/code.js: title, trick, kind, notes, the PARAMS settings with current value + range, the mount/cleanup contract, reduced motion, MIT-0, a "My project: [...]" slot, then the code. check.mjs 53/53. Phones (<=480px): the file path and button icons hide so the three buttons fit on one line.
PUBLISHED 2026-11-10 as motion-library@0.1.0 (npm user 101snow_hero; AJ ran `npm publish` in their own Terminal). Verified from a clean folder with npx: list shows 139, add writes tuned PARAMS, info finds the new Flow pieces. Feature 2, the npm package `motion-library` in cli/ (bin.mjs, build.mjs, package.json, README.md; LICENSE at the repo root, MIT-0). check.mjs 59/59 (6 cli checks).
   - Commands: add <id> [--setting v] [--dir] [--html] [--force], list [cat], info <id>, prompt <id>. Settings pass the site's parseParams gate (clamp notes on stderr); typos get "did you mean" (edit distance).
   - cli/build.mjs (prepack) copies anims/, js/code.js and LICENSE into cli/, and refuses while LICENSE says [your name] (ALLOW_DRAFT=1 skips it for tests only). Draft tarball: 167 KB, 112 files; tested through `npx --package=<tgz>` in a throwaway project, and the written module mounts and cleans up in a browser.
   - TO REPUBLISH (after the overhaul, so npm gets the new Fluid, Shaders and simple-category pieces): bump cli/package.json version (0.2.0; versions 0.0.0, 1.0.0 and 0.1.0 are burned), ask AJ's OK, then AJ runs `cd ~/Downloads/motion-library/cli && npm publish` in their OWN Terminal: the account's two-factor check needs a browser approval, and from Claude's non-interactive shell npm just exits with EOTP and a hidden link. After a publish, npx may serve a stale cached 404: use `npx --prefer-online`.
   - Idea not built: show the install command (npx motion-library add <id> --tuned) in the detail view.
IN PROGRESS (paused 2026-11-09, unverified by eye): creature spreading (the user: "spread out from each other but never staying in the same area"; picked "pass behind card images"). js/critters.js now has a route grid (clearance/reach/route), pickGoal with crowd/been/visibility scoring, an 8 s linger rule (off-route only), exitRoute for leaving, and no card-image push. Measured over 2 min at 1440: median gap to the nearest creature 98 -> 191 px, under 40 px 27.5% -> 14.8%, time in the dial strip 53% -> 41%, longest stay 38 -> 37 s (still to find). Harness: scratchpad spread-stats.mjs / goal-stats.mjs / why-trace.mjs.
NEXT after the review fixes: Feature 1, share links + embeds (user picked it). Design:
   - js/code.js: encodeParams(values, defaults, ranges) -> "pieces=300&gravity=0.6" (changed keys only); parseParams(query, anim) -> only keys in anim.params, only finite numbers, clamped to [min,max] and snapped to step. URL values end up in executed code: this is the safety gate.
   - URL: #/a/<id>?pieces=300&gravity=0.6. js/app.js route() splits off "?" and passes values to detail.open(anim, card, initial). While sliding, history.replaceState keeps the address bar in sync (no history spam); Reset returns to #/a/<id>.
   - stage.html applies values itself via ?p=<encoded>: fetch source, writeParams with registry ranges, import as blob (existing load(code)). Values are in place before the first mount, so nothing is lost while loading; the detail iframe uses it too.
   - Detail: Share (copies link) and Embed (copies an <iframe> snippet) buttons in .code-head beside Copy/Download; factor copy()'s clipboard fallback into copyText().
   - Embed mode (stage.html?mode=embed): small "Motion Library" badge linking back to the tuned animation; pauses off screen (IntersectionObserver); starts paused under prefers-reduced-motion.
   - REQUIRED hardening: stage.html message listener must accept only e.source === parent && e.origin === location.origin, or any page embedding the stage could post "run" with arbitrary code.
   - New checks: shared link restores sliders + code; Share copies a link with the changed values; embed URL applies its values (expose window.__params); cross-origin "run" is ignored; out-of-range URL values are clamped.
   - Design stack: Penpot skipped (two buttons and a badge); animate for the badge fade; emil-design-eng polish; remind the user to run /review-animations at the end.
Later ideas the user saw (not picked yet): framework exports (React/Vue/Svelte/Web Component wrappers), frame-perfect video/GIF export via the virtual clock, study mode (onion skin, trails, scrub timeline, easing graph), trust badges, licence per snippet.
Tips: the 404 in console during renders is the favicon (harmless). Heavy raymarchers cap DPR at 1 or use a pixel budget (sdf-morph). A quick one-animation renderer: tools/lib.mjs serve()+launch(), load stage.html?src=anims/<cat>/<id>.js, screenshot at a few times. Detail URLs are #/a/<id> (not #<id>).
