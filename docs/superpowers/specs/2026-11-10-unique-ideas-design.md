# Motion Library: every piece is its own idea

Date: 2026-11-10 · Status: draft for AJ's approval

## Why

A visitor should be able to stop on any piece and think "I couldn't build that, and I haven't seen it anywhere else."
Right now some pieces fail that: the chrome gyroscope and Newton's cradle are well made, but "chrome that moves" isn't
an idea. The fractal tree and the volumetric clouds are the bar: the effect itself is hard and beautiful.

**The test for every piece:** can you name its idea in one line, and would someone have to look up how it's done?
Fails: an object that only turns or swings; the same trick as another piece in a different costume; a demo every
other library already has.

## Goals

1. **Complex categories** (Flow & particles, Fluid, Chrome & 3D, Shaders): replace every piece that fails the test
   with a new one that passes, and add pieces other sites don't have. AJ: *replace*, don't keep alongside.
2. **Simple categories** (Basics, Transitions, Text, Scroll, Hover, Micro, Springs, Morph): grow from 5 to 10 each,
   and re-dress all of them in real product context (a real "Add to cart" button, a settings row, two small mock
   screens) instead of grey placeholder boxes, so you see how it looks in use.

## Non-goals / anti-goals

- No retuning of the creature crew (standing rule).
- No video exports of effects; everything stays live, tweakable code.
- Anti-goal: a piece that only works as a screenshot. Each must still be a usable snippet (`PARAMS`, cleanup, sliders).
- Anti-goal: AI-generated imagery. Photos only from open collections (credited), else art made in code.

## Constraints (unchanged house rules)

Plain JS ES-module snippet, `const PARAMS = {…}` on one line, `export default function(stage)` returning cleanup;
registered in `anims/registry-more.js` with trick + notes + params; poster rendered; `tools/posters.mjs --leak` clean
and moving; `tools/check.mjs` passing; heavy pieces ~60 fps at detail size (pixel budget for raymarchers).
Removed pieces: delete the file, poster and registry entry (nothing is published yet, so no links break).

## Part 1: complex categories

### Chrome & 3D: replace 8

| Out (why) | In: the idea |
| --- | --- |
| gyroscope (object turning) | **Inflated type**: flat letters puff up like balloons, wrinkle at the seams, then deflate |
| newtons-cradle (object swinging) | **Shatter & rewind**: a glass pane cracks into Voronoi shards, falls, then plays back into one piece |
| cube-carousel (common CSS demo) | **Cloth reveal**: a silk sheet slides off a hidden object, draping over it as it goes |
| wireframe-terrain (dup of terrain-flyover; synthwave cliché) | **Dust to the wind**: a 3D bust disintegrates into particles from one side and blows away |
| iridescent-torus (dup of torus-knot) | **Geode**: a rough rock cracks open to show amethyst crystals inside |
| chrome-blobs (third chrome metaball piece) | **Portal**: a ring that shows a different world through it, which you see as the camera moves |
| glass-spheres (classic ray tracer) | **Tesseract**: a 4D cube rotating through 4D, so it turns inside out in 3D |
| voxel-wave (common) | **Melting chrome logo**: chrome text melts into a puddle and pulls itself back into shape |

### Flow & particles: the big overhaul (AJ: "a lot of mediocre design ... really go all out")

Judged from the posters, not the titles. 13 stay as they are (curl-flow, galaxy, strange-attractor, lightning,
gpu-particles, sparks, dandelion, dla-crystal, murmuration, harmonograph, confetti, snowfall, embers). The other 22
go, or get rebuilt from scratch. Rule for the new set: each is one idea nobody else has, no two share a trick
or a look, and dark "glow on black" pieces are balanced with daylight, paper and material ones.

| Out (what was wrong) | In: the idea |
| --- | --- |
| particle-text (flat, dated) | **Drone light show**: 1,500 drones lift off a grid and fly formations over a night city, reflected in the water |
| boids (flat triangles) | **Particle life**: six species and one table of likes and dislikes, and creatures that look alive appear |
| starfield (cliché) | **Cloud chamber**: radiation made visible: alpha stubs, wiggly beta tracks, a cosmic muon, all fading into mist |
| fireworks (sparse) | **Holi powder**: colour bursts that billow and shade themselves like real volumes in daylight |
| physarum (looked like neon pipes) | **Slime mould maps Tokyo** (rebuilt): a million agents on the GPU grow the rail network between oat-flake "cities" |
| point-morph (a blob) | **Starry night in brushstrokes**: a painted sky made only of strokes that ride a turbulent flow, Van Gogh style, all made in code |
| magnetic-field (a diagram) | **Iron filings**: thousands of slivers on paper turn and chain up as you drag a magnet underneath |
| smoke-sprites (flat) | **Wheat field in wind**: tens of thousands of stalks at golden hour, gusts rolling across as waves of sheen |
| falling-sand (crude) | **Galton board**: beads bounce through pegs, each a coin toss, and the bell curve builds itself |
| dot-matrix (sparse) | **Pin art**: the pin-screen toy in 3D; a shape pushes through from behind and the pointer presses in |
| fireflies (flat trees) | **Firefly sync**: a forest of fireflies flashing at random slowly falls into one rhythm (Kuramoto) |
| silk-ribbons (sparse) | **Spider web at dawn**: an orb weaver spins frame, radials and spiral; dew beads up and catches the sun |
| text-dissolve (meh) | **Hydrogen orbitals**: 200k samples of where the electron might be; a superposition sloshes like the light it emits |
| orbit-trails (meh) | **Roche limit**: a moon drifts too close to its planet and is shredded into a ring |
| ant-colony (meh) | **States of matter**: 2,000 atoms with one force law condense from gas to droplets to a hexagonal crystal |
| plexus (After Effects cliché) | **Bioluminescent shore**: night waves glow blue where they break and wherever the pointer stirs the water |
| tornado (grey) | **Scramble crossing in the rain**: umbrellas from above, crowds flowing through each other when the lights change |
| dust-motes (dim) | **Calligraphy brush**: a bristle brush writes 永 (the eight basic strokes): dry-brush streaks, pooling, bleeding into paper |
| chladni (flat lines) | **Chladni plate** (rebuilt): a brass plate on a speaker, real sand jumping to the nodes as the tone sweeps |
| autumn-leaves (flat) | **Sand mandala**: coloured sand laid grain by grain into a mandala, then swept into a spiral |
| stippling (a blob) | **Wind tunnel**: smoke lines through a GPU lattice-Boltzmann flow, shedding a Kármán vortex street behind what you drag |
| rain-splash (meh) | **Rainbow from raindrops**: each falling drop sends one colour to your eye; the bow appears where they agree |

### Fluid: replace 4

| Out (why) | In: the idea |
| --- | --- |
| ripples (classic demo) | **Latte art**: milk pours into espresso and is pulled into a rosetta |
| ocean-waves (dup of the 3D ocean) | **Beer pour**: a glass fills, bubbles stream up, and a foam head builds and settles |
| caustics (covered by underwater) | **Lava flow**: glowing lava creeps, a dark crust forms and cracks over it |
| bubbles (dup of chrome soap-bubble) | **Kelvin–Helmholtz clouds**: two layers sliding past each other curl into breaking waves |

### Shaders: replace 2, add 4 (9 → 13)

| Out / new | The idea |
| --- | --- |
| aurora → out (same trick as domain-warp) | **CRT monitor**: real phosphor mask, curvature, bloom and a boot sequence |
| voronoi → out (basic) | **CMYK halftone**: a photo printed as four rotated dot screens, slightly misregistered |
| new | **Cross-hatch sketch**: a 3D scene shaded as pen hatching, wobbly like a hand drew it |
| new | **ASCII render**: a 3D scene drawn with characters chosen by brightness and edge direction |
| new | **Pixel sorting**: rows of a photo sorted by brightness, flowing like a glitch waterfall |
| new | **Hyperbolic tiling**: an Escher-style Poincaré disk that scrolls endlessly toward its rim |

Kept in all four categories: everything else on the current list (it passes the test or is genuinely useful, like
the dot globe, holo card and confetti). Totals stay the same except Shaders (+4).

## Part 2: simple categories

Each grows 5 → 10, and every piece (old and new) is shown inside a small, believable product scene, drawn in code,
using the library's tokens. My call on the scenes and the new pieces:

| Category | Existing pieces get a scene like | 5 new |
| --- | --- | --- |
| Basics | product cards, a pricing table | list reorder (FLIP), add/remove with collapse, number ticker, accordion FAQ, tab content swap |
| Transitions | a two-screen shop app | iOS sheet with scale-back, lightbox zoom, directional tabs, blur crossfade, swipe card stack |
| Text | a landing hero, a headline | split-flap board, odometer, rotating word in a headline, highlighter sweep, text on a circle |
| Scroll | an article, a product page | reading progress, sticky card stack, timeline path draw, image-sequence scrub, snap gallery |
| Hover | nav, buttons, a blog list | list with image following cursor, directional button fill, underline slide, cursor-lit card border, dock magnify |
| Micro | forms, settings, a cart | copy tick, password strength, hold-to-delete, bell + badge, toast stack |
| Springs | a mobile app | snap-point bottom sheet, swipe-to-dismiss, chat-head chain, draggable app icon jelly, pull-to-refresh |
| Morph | a media player, a menu | play/pause morph, hamburger → close, chart line morph between datasets, logo draw then fill, button that grows into a menu |

Scenes stay light: a few elements, real-sounding copy, no fake brand names. Sliders still tune the motion, not the scene.

## Order

1. Flow (AJ flagged it), 2. Chrome & 3D, 3. Fluid, 4. Shaders, 5. simple categories (re-dress existing, then add).
Each category ends with posters, leak test, checks and a contact sheet AJ can look over.

## Left to the builder

Exact visuals, palettes, slider choices and performance tricks per piece; which open-collection photos to use
(credited in notes); scene layouts within the token system.
