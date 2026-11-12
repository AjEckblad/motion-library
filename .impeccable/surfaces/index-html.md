---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: Motion Library catalogue (index.html)

Scope: the whole single-page catalogue: dial navigation, card grid, hover previews, detail view with notes and code, hearts.
Mode: Operate (find an effect, understand it, copy it), with the animations as the content.
Audience/job: the owner, browsing their own reference library at their desk; they find an effect, see it live, read the trick, copy the code.
Constraints: plain HTML/JS, no libraries in snippets, local only, one live preview at a time, reduced motion respected.

## Direction contract
THESIS: A catalogue you dial through. The categories ride a semicircular dial on the right edge that magnifies under the pointer while the whole arc stays readable, and the live-preview grid is the content. It refuses the default left sidebar with dark rounded cards and a purple accent.
OWN-WORLD:
- A plain, cool light-grey ground.
- Slate ink.
- Twelve category hues that appear only as small dial dots and card ticks.
- One warm red reserved for hearts.
- Preview tiles are flat, near-square windows with tight corners and no shadows.
- Fluffy creatures drawn in code from fur strands perch on the dial and the grid edges, blink, and watch the cursor.
STORY: The owner sees all 60 previews at once and hovers to watch them live. They dial to a category, heart what they like, open a card to read the trick, and copy working code.
FIRST VIEWPORT:
- Right: a semicircle dial (radius about 44vh, centred vertically) carrying All, Hearted and the 12 categories. Labels are set horizontally along the arc, the active one sits at the 9 o'clock point, and a creature peeks over the arc's top.
- Left of the dial: a slim header with the title, search and result count.
- Below the header: a 4-column grid filling to the dial.
- Primary action: hover a card to play it, click to open it.
FORM: user-pinned (dial + grid + code-drawn fluffy creatures, plain light ground, hearts), overriding the rolled Test Card & Idents direction; seed:5d0e354a838f0717
SIGNATURE: the dial. Hovering magnifies the entry under the pointer, fisheye-style, along the arc. Clicking springs the dial round until the chosen category lands at 9 o'clock, while the grid swaps with a short staggered exit and enter.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Adaptations (recorded after the finish review)
- Dial: entries stay fixed on the arc and a needle springs to the chosen one. The user required the whole selection to stay visible, so the dial itself cannot rotate.
- Dial radius is about 250px (roughly 28vh at 900px tall), not 44vh. The horizontal labels need about 190px beside the arc, and a larger radius would take the grid's fourth column.
- Phones: a half-dial along the bottom edge shows all 14 entries as dots; the chosen entry is named under the arc.
- Tiles are 5:4 (near-square); 4 columns at 1440 and wider, 3 at 1280.
