# Resume here (2026-11-14 ~01:00): ferrofluid + water ripples SHIPPED (a31b44c); honey agent running; site redesign next

AJ is asleep and approved working through the night with **one helper agent at a time** (option 1: the lead coordinates,
agents do the big chunks, so the lead's context stays under the 400k handoff). AJ cannot type "continue" while asleep.
- SHIPPED a31b44c: ferrofluid (switch = two springs, no pop on reversal; needles collapse ~0.3 s, film drains ~3 s;
  puddle stays put with the field off; soft limits; fat cones, meniscus, irregular film rupture, edge AA, GPU ~9.3 ms)
  + 2 motion-check tests (25/25); water ripples (full-speed waves again, one drop at a time, 'Seconds between drops'
  slider default 1.25 s, sunlit pond bed drawn once into a texture, poster at 4.6 s, 4 languages). check 89/89.
- RUNNING: honey agent (anims/fluid/honey-coil.js only: hyperrealism + physics: coil centred under the nozzle, stacked
  coil, straight vertical thread, no softbox "setting sun", no pink patch). Lead reviews frames, then ships it in a
  clean worktree (git worktree add --detach <scratch>/wt HEAD; copy files; posters; SITE_URL build; checks; commit;
  ff-merge main; push).
- NEXT: the site redesign per docs/superpowers/specs/2026-11-14-front-door-design.md (AJ approved the plan: front door
  with a live showpiece, one-sentence pitch + 3 differentiators, editorial showpiece row, hierarchy fixes, new OFL type
  pairing). Done by ONE agent end to end (one hand for a coherent design), after the honey agent finishes. The before
  is recorded in .taste-skill/before (design-taste inspect: 0 FAIL, 1 WARN below-fold). Lead's calls to show AJ: keep
  the dial (make its arc legible), no rename, Penpot skipped (AJ's tab not open overnight).
- Waiting on AJ: npm publish of CLI 0.3.5 (`cd ~/Downloads/motion-library/cli && npm login && npm publish`); his
  verdict on ferrofluid, ripples, honey; /review-animations at the end.

# Resume here (2026-11-13 ~23:30): AJ's 4 fixes SHIPPED (ocean, tank, honey, ferrofluid); nothing in progress

All four reviewed frame by frame by the lead and live (check 89/89, motion-check 22/22, CLI copy rebuilt, 224 effects).
- Ocean + tank: see the 69153d3 notes below.
- Ferrofluid (agent B): continuous oil over the magnet, turned + jittered hex lattice, graded cones leaning out at edges,
  concave fillets, soft-marched reflections, iris-like film on/off; camera pulled back to max(2.05, 2.72/a) by the
  lead for frame cost (agent measured 13.3 ms at its closer camera, ~10 at the old one). Reservations: front row has
  small bright cup-like flares, coated side reads a bit box-like, off-state reflection of bare nickel is dark grey.
- Honey (agent A): white porcelain bowl on dark wood, higher camera, tapering thread (r ~ v^-1/2), coil smooth-unioned
  into the pool, absorption-depth colour, TAU 1 -> 2 s, posterAt 10000; GPU 7.8 ms. Reservations: the softbox
  reflection is a pale half-disc behind the coil (a bit like a setting sun; candidate fix: smaller/softer, varied
  shape), pool in front fairly smooth, no depth of field, thread colour seam at the rim line.
- Token rule: hand off at 400k context; ~/.claude/hooks/handoff-at-40.js (PostToolUse) enforces it.
/review-animations (AJ ran it): approved ocean, tank, honey; blocked ferrofluid on touch (a tap both yanked the magnet to the
finger and switched it off). FIXED: touch moves the magnet only after 8 px of travel, click toggles only under 8 px;
motion-check test added (23/23). Ferrofluid GPU measured 11.07 ms median / 13.2 p90 at 900x560 (budget 12): OK.
Waiting on AJ: his verdict on the 4 pieces (suggest /review-animations); npm publish of CLI 0.3.5 from his Terminal.

# Earlier (2026-11-13 night): run /review-animations FIRST on 4 pieces, then fix them; terrain flyover pending

AJ, verbatim: "have the waves move in a general direction because of the wind right have a higher amplitude and a
longer crest deeper trough too, the side to side on the water tank force the max speed that the cage can wobble lower
make it waves more gradual, fix the honey pour its not as realistic as it needs to be, ferrofluid is also not as it
should be ill run the animation check do the animation check on the current ones before you fix them so you know
what im talking about /review-animations"
Plan for the new session:
1. Invoke the review-animations skill and review the CURRENT versions (render frame sequences with tools/frames.mjs,
   read the motion code) of: fluid/ocean.js, fluid/sph-water.js (the "water tank": the side-to-side tank shake/force),
   fluid/honey-coil.js, fluid/ferrofluid.js. Report the findings table to AJ before changing anything.
2. Then fix: ocean = waves travel in one clear wind direction (narrow directional spread around the wind), higher
   amplitude, longer crests and deeper troughs (more swell energy, less short-crested chop than the 17:30 round);
   sph-water = cap the max speed/accel of the tank's side-to-side motion and ease it, so the sloshing waves build
   gradually; honey-coil = more realistic (look at real honey pour references: thin glossy stream, rope coiling,
   translucent amber with refraction, viscous spreading); ferrofluid = AJ says not as it should be (compare with his
   earlier reference photo: a dense dome of fine spikes on a magnet, black glossy; review first to find what's off).
   Use two helper agents if the batch is big (memory: big-batches-two-agents); lead reviews frames and ships.
Terrain flyover: DONE and shipped (camera follows a lookahead clearance on a critically damped spring, never under
the lake, distance-faded detail; GPU 13-15 -> 11-12.5 ms).
State: 224 effects live (watch-movement removed, a3c48ad). CLI 0.3.5 built (224), unpublished; AJ publishes.

# Earlier (2026-11-13 evening): AJ's 17:30 list ALL DONE (225 live); npm 0.3.5 waits on AJ

AJ (17:30): fix honey pour; ocean a little too bright + normal wind-sea wave patterns (ref: grey overcast sea,
whitecaps, foam streaks); ferrofluid bugged, no petri dish; fire & smoke burning on glowing logs, hyperrealistic;
lava flow: spend time on visuals, red-hot lava must FLOW down, not stay at the top; fireworks: remove the "O"/ring
bursts; crystal growth (dla-crystal) more realistic; REMOVE bonfire embers; iron filings: one + and one − pole, far
fewer lines; REMOVE leaf venation; water ripples: slower, much less happening.
- SHIPPED and live (reviewed, registry/i18n/posters applied, built in a worktree, pushed; last e71fd3b): embers and
  leaf-venation removed (225 live); ferrofluid (no dish, puddle on the table, 3 bugs fixed); ocean (overcast grey wind
  sea; sun slider now 1-20); fire-smoke (campfire on 4 logs, glowing alligator char, ember bed); iron-filings (one bar
  magnet, 16 lines, light paper); water-ripple (speed param 0.2-1 default 0.55, 'Ripple speed' labels added); fireworks
  (ring burst removed; "five" shell types in all languages). check 89/89. Agent B (ad136918ab3a25700) finished.
- ALSO SHIPPED (1b0e4e2): lava-flow (flows down a channel, surges, crust rafts) and honey-coil (reflection now shaded
  rope, no red popping on melt, softer shadow, irregular coiling with folds/reversals). 10 of 11 done.
- dla-crystal SHIPPED: manganese dendrites from a crack in limestone, WebGL, posterAt 12000. All 11 items done.
- CLI 0.3.5 (0.3.4 is on npm), rebuilt with 225; AJ runs `cd ~/Downloads/motion-library/cli && npm login && npm publish`.
  check 89/89, motion-check 22/22. Both agents finished. Suggest AJ run /review-animations on the reworked pieces.
- AFTER ALL: cd cli && node build.mjs (drops removed pieces from its copy); check npm whether 0.3.4 was published
  (npm view motion-library version); if it was, bump to 0.3.5. Run motion-check (22 tests). Final report to AJ:
  list each of his 11 items with what changed, reservations (ocean clouds a bit streaky; iron filings now light paper,
  easy to revert; ferrofluid edge needles slightly jagged; lava may pool a bright blob on the right flank briefly).


# Earlier (2026-11-13 afternoon): AJ's 11:20 list + Animata gaps + 4 new effects all live (227); npm 0.3.4 waits on AJ

AJ asked (2026-11-13 ~11:20): diff-growth less gross; falling sand more grains + sand coloured; stained glass more
detailed environment; snow globe much more detailed; paper fold folds smoother ("spend time until perfect");
ferrofluid: square magnet INSIDE the fluid (not under glass), a magnet on/off option, much more detailed (like his
photo: dense fine spikes); lava lamp more detailed; compare with Animata and add what makes sense; more effects.
DONE and live (commits f430f84 .. f867b15):
- Paper fold (lead): minimum-jerk crease timing, overlapping steps, loose flaps are strip chains that bow edge-first
  (gradient-shaded in the face background: overlay children left hairlines), per-panel projected shadows, slide follows
  step progress, Z0 hinge lift. Peak panel motion 56-72 -> 15-20 px/frame, jolts <1 px. Cycle 10 s.
- Stained glass (lead): nave of bays with piers, deep splayed reveals, ashlar detail, string course, polished floor;
  fixed the border band's inverted separator lead.
- Site (lead): Search pill + ⌘K palette (js/search.js; AJ had removed the old always-on search bar for looking
  unprofessional, so this is the pill/palette form Animata uses: easy to drop if AJ objects), New (build-static reads
  git: added after the first import, last 21 days; chip + dial entry), previous/next in the detail view, file path
  links to GitHub (also in fx/ pages). Phone bar: chevron off <420, GitHub off <383, Surprise off <339.
  check.mjs 89/89 (3 new), motion-check 21/21 (dial test starts on New).
- Agents' pieces, reviewed frame by frame: diff-growth (pen-plotter print), falling-sand, snow-globe.
- New effects (lead): chrome/watch-movement, generative/wave-collapse, simulation/mud-cracks (warped Voronoi + DT
  shading), generative/leaf-venation (space colonisation). Dropped: pool caustics (too close to water-ripple).
- Builds: an agent edits files in the main tree, so the static build runs in a clean worktree of HEAD
  (git worktree add --detach <scratch>/wt HEAD; build + check there; copy the changed outputs back; commit; push).
ALSO DONE (00c4214, 239d1b8): lava-lamp (raymarched chrome/glass lamp, heat-driven 3D wax) and ferrofluid (square nickel
magnet standing in the oil in a petri dish, ~260 needles, Magnet On/Off option O() + click/tap toggle; motion-check
hooks unchanged, 21/21). CLI is 0.3.4 and rebuilt (227): AJ runs `cd ~/Downloads/motion-library/cli && npm login &&
npm publish`. Reservations from the agents: lava lamp edges not antialiased at 1x; ferrofluid corner needles a bit
blobby, pool mirrors only the crown; snow globe icicles/twigs shimmer slightly (1 spp); falling sand stream chunkier
on phones. AJ should run /review-animations on the search palette and paper fold.
Animata comparison for AJ: theirs = React+Tailwind UI components (157), shadcn CLI, ⌘K search, New badges, changelog,
prev/next; ours already had more in the detail view (live tweak sliders, Copy as prompt, Download .html, Share, Embed,
4 languages, llms.txt). Not added on purpose: shadcn registry (not React), theme toggle, newsletter, testimonials.

# Earlier (2026-11-13 morning): AJ's overnight list done; 223 effects live; npm 0.3.3 waits on AJ

AJ's requests (2026-11-12 ~23:30). 1–5 DONE (2026-11-13, commit "Wix Madefor type, FAQ in the dial, GitHub..."):
- Type: Wix Madefor Text (UI) + Wix Madefor Display (headings 20px+) + JetBrains Mono (code), OFL, fonts/OFL.txt.
  15 faces rendered on the real catalogue; Switzer was the runner-up (Fontshare licence murky for a public repo).
  impeccable type scan 0 findings; DESIGN.md updated. design-taste inspect --app: 1 FAIL "covered-text" at 768px is
  the Fluid heading scrolling under the fixed bottom dial band (the inspector only exempts fixed bars at the top);
  defended, not a design change. WARN below-fold (212-card gallery) as before.
- FAQ: 8 questions in all four languages; "FAQ" is the last dial entry (#/faq, glides there, lit by the scrollspy).
- GitHub button in the top bar; footer under the FAQ: licence, GitHub, npm, llms.txt, llms-full.txt. llms.txt links
  the repo and npm. robots.txt already allows every AI crawler by name.
- Stale copies: js/versions.js (generated by build-static) holds a content hash per effect and poster; the grid,
  detail view and stage add ?v=<hash>, so a changed effect always loads fresh. check.mjs fails if it is out of date.
- Lead's own new pieces, all live: text/type-ribbon (ffd2ee5), transitions/page-turn (6440fcb), chrome/snow-globe
  (57a61a6), morph/dynamic-island (cf5f270), shaders/stained-glass (253cad4). Agents' pieces reviewed and live:
  simulation/lenia (a057ee4), fluid/ocean + fluid/honey-coil + simulation/diff-growth (f3f9d87), simulation/snowflake
  + chrome/meadow (5c4c9a9, meadow by the lead): 223 effects. Both agents finished. mud-cracks was never built.
  CLI is 0.3.3 and rebuilt: AJ runs `cd ~/Downloads/motion-library/cli && npm login && npm publish`.
  Agents' reservations: Lenia species pass through each other (one channel each); diff-growth's mantle is the coral
  form in a new material, early growth a little six-fold; ocean clouds are a 2D layer, glitter core burns white;
  honey coil is kinematic (never buckles irregularly); snowflake's broad plate shows lattice-scale striping.
- Agents were stopped by the usage limit at ~01:00 (resumed 02:00) and again before 07:00 (resumed 07:00 with a
  2-hour budget, reporting each piece as it is done). Their untracked files: fluid/ocean.js, fluid/honey-coil.js,
  simulation/lenia.js so far.
Original list:
1. A better, more professional UI font than IBM Plex (AJ dislikes it; Geist was rejected earlier as overused). Use the
   design stack (impeccable typeset, design-taste-frontend); AJ is away, so the lead picks and shows a comparison.
2. A GitHub link (repo AjEckblad/motion-library) and links for AI agents (llms.txt, llms-full.txt) — top bar + footer.
3. "FAQ" in the dial (sidebar) that jumps to the FAQ at the bottom.
4. FAQ copy: "What is the licence?" → "Is this really free?" (Yes. MIT-0 ...); remove "What about reduced motion?";
   "How do I add one to my project?" → "How do I get started?" (browse, copy the code, ~30 s; or copy the command next
   to Install, e.g. npx motion-library add confetti --pieces 300; Node.js 18+). All four languages.
5. Shatter & rewind "not updated" on AJ's screen: repo, live site and poster are all the new piece, so a browser kept
   an old copy. Fix: piece URLs carry a content hash (?v=) so a changed piece is always fetched fresh.
6. Until AJ is back: more effects the library doesn't have, at the reference quality bar, with 2 agents.
   Agent 1 (water & matter): fluid/ocean, fluid/honey-coil, simulation/snowflake, simulation/mud-cracks.
   Agent 2 (life & light): simulation/lenia, simulation/diff-growth, shaders/stained-glass, chrome/meadow.
   They edit only those files and report registry text (EN/中文/ES/FR), params, posterAt, evidence. The lead applies
   registry/i18n/posters, reviews each piece frame by frame (tools/frames.mjs, whole loop), commits with explicit
   paths. If a new session finds them gone, their files hold uncommitted work: review before registering.

# Resume here (2026-11-12, night): AJ's list of fixes and rebuilds all shipped; everything live

Live: https://ajeckblad.github.io/motion-library/ (repo AjEckblad/motion-library; gh is logged in, so commit + `git push`
from here deploys in about a minute). 213 pieces. Checks: `node tools/check.mjs` 82/82, `node tools/motion-check.mjs` 17/17,
`node tools/posters.mjs chrome --leak` all clean and moving. CLI 0.3.2 is published on npm (AJ, 2026-11-12 night).

Finished this session:
1. Portal: the "hazy grey-brown" night world was the crossing flash. It was ADDED light before tone mapping, so a linear
   0.05–0.25 lifted the night's blacks to 30–60 % grey for ~0.3 s. Now the flash is an exposure surge (multiplies), so
   blacks stay black. Second bug: the ring's inner face went dark and speckled because shadeGate tested `ring(q) < .004`
   while the march stops at `.0007 * (1 + t)` (.0056 at 7 units); edge-on hits failed the test and lost the daylight
   glow. Now the hit is "ring" if the ring is the nearest part of the gate. posterAt 17000 (the night side: gate in the
   sea, aurora above, desert through the opening).
2. Cloth reveal: proper header comment; the sheet is put away only once no point of it (or its reflection) is on
   screen, at the latest a second before the next drop (on a 3.6:1 stage it was still in view at TPARK). posterAt 7000
   (mid-reveal). Reduced motion: a still of the drape. 60 fps in a 1280×760 detail view, both pieces.
3. New trick + notes for both in EN, 中文, ES, FR.
Frame-exact renders: `node tools/frames.mjs anims/<cat>/<id>.js 9000,9050 [WxH] [--reduce] [--tag x]` steps the stage
clock to each time (tools/look.mjs is real time, ±50 ms, and misses fast moments like a 0.2 s flash).

Card hover (AJ, 2026-11-12): the image, its heart and the text under it lift 2px together, straight from the pointer
(the preview still waits 110 ms), on `translate .25s ease` both ways, so sweeping a row glides; reduced motion: no lift.
Guarded in tools/motion-check.mjs (18/18).

DONE: AJ's list (2026-11-12, late), all shipped and live. 212 pieces; check 83/83, motion-check 18/18.
Helper agents' own reservations (worth AJ's eye): ferrofluid's flat oil shows small hard softbox glints and the trailing
pool reads as a smooth slug on fast moves; SPH water has ~1 px rest shimmer; shatter's ball reads as dark steel; black
hole's spin is a per-ray-mass approximation (not a full Kerr integrator) and its disc lacks the film's fine grain; lava
flows at time-lapse speed with a slightly grainy plume; fire is a 2D slice (often one merged column).
/review-animations (AJ ran it, 2026-11-12 night): approved after three fixes, guarded in tools/motion-check.mjs (21/21):
the language menu swallowed a click during its 120 ms fade-out (now it reopens from the opacity it had reached);
Ferrofluid's magnet and SPH water's tilt walked away from a resting mouse after ~2 s (now a mouse over the stage keeps
control; leaving, or a finger lifted for ~2 s, hands it back to the automatic motion).
npm 0.3.2: PUBLISHED by AJ (2026-11-12 night). Nothing is waiting on AJ.
- [x] UI demos: the 50 with a pastel ground behind app windows / phones (basics, transitions, micro, springs, morph) get
      a near-black ground; the windows and phones keep their own colours. The 30 full-page designs (text, scroll,
      hover) stay exactly as designed (AJ chose this). Done: one shared ground radial-gradient(120% 100% at 50% 0%,
      #1b1b1e, #0d0d0f) (canvas twins draw the same); the 19 phones get a rim light (steel band, white hairline, black
      drop shadow); fade-scale and like-burst, which drew text straight on the ground, sit in a window of their old
      colour. Logo draw keeps its own dark plum.
- [x] Cut ink-drop (to _cut/, like Geode; Geode was already cut earlier on 2026-11-12). 212 pieces.
Agents (2026-11-12): agent 1 has black-hole, lava-flow, fire-smoke; agent 2 has ferrofluid, sph-water, shatter. They edit
only those files and report registry text; the lead applies registry/i18n/posters and commits. Both were stopped once by
the usage limit and resumed (agent 1: black hole nearly done, then volcano, fire; agent 2: tuning SPH water rest jitter,
then shatter). If a new session finds them gone: their files hold uncommitted work; review each piece with
`node tools/frames.mjs` (whole loop) before finishing it. When committing anything else meanwhile, build static pages
in a temporary worktree without the agents' files (fx pages and llms-full.txt embed each piece's code and size).
- [x] Black hole → Gargantua, the FILM look (AJ chose it): thin disc lensed over the top and under the shadow, photon
      ring, even warm-white disc, NO Doppler beaming / colour shift. Ground it in the real ray-bending (Kerr-ish
      geodesics as DNGR did), not a 2D trick.
- [x] Ferrofluid: light grey ground; a magnet under it that the pointer moves (drag left/right), and the fluid follows.
- [x] Lava flow: a realistic volcano/mountain with lava that reads as real (crust, glow, cooling).
- [x] Fire & smoke: refine to reference quality (a campfire: combustion sim, Planck colour, sparks).
- [x] SPH water tank: refine to reference quality (WebGL2 now; Clavet double-density SPH, Gauss-Seidel; pointer tilts).
- [x] Paper fold: several fold types (letter/tri-fold, sideways gate fold, accordion, map fold...) chosen with a PICKER
      in the detail view (AJ chose a picker over cycling: an explicit exception to "one effect per card, no switcher").
      Done: `fold` 0 letter (the card), 1 gate, 2 accordion (a W standing on the table), 3 map (pleat, then in half),
      each with its own printed sheet. Registry helper O(label, ...options) makes a picker (js/detail.js .pick, styled
      like the speed control .seg); the value stays a number for code, links and `--fold 2`. Guarded in check.mjs.
- [x] Shatter & rewind: refine to reference quality (steel ball through dichroic glass before a ring of light).

WAITING ON AJ
- Nothing. (Ink drop: AJ said cut it, done. /review-animations: run, fixes shipped. npm 0.3.2: published.)

# Earlier (2026-11-12, round 2): interactive math, short notes, blue accent, IBM Plex type are DONE

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

Later on 2026-11-12 (all pushed and live): dial fisheye is one shared strength set by the tightest word (every word moves
left, the longest stops 10px short of the cards); detail stage fills the panel; the Interactive hint sits in the control
row; creatures start spread out and avoid the category headings; grid rows 64px apart, categories 112px.

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
