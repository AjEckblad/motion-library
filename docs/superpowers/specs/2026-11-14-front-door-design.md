# Front door, hierarchy and type: design (2026-11-14)

AJ approved this plan in chat on 2026-11-14 ("this is the plan") and went to bed. Calls marked **[lead's call]** were
made without him and are listed in BUILD-NEXT "Resume here" for his review.

## Why

The site is public now (GitHub Pages, npm CLI) and competes for attention with Motion (motion.dev), Animata, Aceternity
and the like. Its edge is not "another motion library" but **the home of showpiece web effects that run in any stack**:
real-time simulations and renders (ferrofluid, ocean, terrain flyover, snow globe), each one plain-JS file with no
dependencies, live sliders on every effect, and "Copy as prompt" for AI assistants. Today none of that is said: a first
visitor lands on "All animations · 224 animations" and a uniform three-across grid, and the best pieces are buried as
equal tiles. AJ also feels the formatting and the font hold the site back.

## Goals

1. **A front door.** The first screen says what this is and why it is different, with a showpiece running live.
   - One showpiece runs full width (live, not a video), with a one-sentence pitch and the three differentiators:
     one plain-JS file for any stack; live sliders on every effect; Copy as prompt / llms.txt for AI assistants
     (plus "real simulations, not buttons" carried by the hero itself).
   - Clear next steps: browse the catalogue (scroll), and the `npx motion-library add <id>` line.
2. **An editorial showpiece row** of large tiles above the catalogue: the hardest, most striking pieces, bigger than the
   catalogue tiles, so the gallery has rhythm (big, then dense).
3. **Hierarchy.** Section headings carry the page; counts stop competing with them (smaller, muted, tabular, or folded
   into the dial). The page title "All animations · 224 animations" goes; the hero takes its job.
4. **Type with character.** A display face with real personality for headlines (hero, section heads, detail title), a
   clean UI face for controls and body, the existing mono for code. All SIL OFL (the repo is public), self-hosted woff2.
5. **The dial reads as intentional.** Its words sit on an arc (a fisheye dial), which at a glance looks like a ragged
   right-aligned list. **[lead's call]** Keep the dial (a signature AJ built and approved) and make the arc legible
   rather than replace it with a flat list.

## Non-goals

- No rename. "Motion Library" stays; the brand should feel its own through type and the front door.
- No React wrappers / shadcn registry, changelog page, showcase or Discord in this round (noted for later).
- No change to the effects, the detail view's function, the CLI, or the creatures' movement (hands off, per AJ).

## Anti-goals (a failure even if it works)

- A template SaaS landing page: gradient blobs, glowing cards, purple accents, centred hero with three icon cards.
- A hero that tanks performance: the live hero must hold frame rate, pause when off screen, and never run alongside a
  second WebGL preview needlessly; reduced motion shows the poster.
- Slowing down the person who comes to find an effect: the catalogue must stay one scroll away, search and the dial
  keep working, deep links (#/a/<id>, #/c/<cat>, #/faq) unchanged.
- Breaking 中文/ES/FR: every new string goes through i18n in all four languages.

## Constraints

- Static HTML/CSS/ES modules, no build step, no frameworks (PRODUCT.md). The static build (tools/build-static.mjs)
  pre-renders the grid into index.html and the fx/ pages; it must keep working (and pre-render the new parts if needed
  for SEO: the hero copy and showpiece row should be in the HTML).
- Dark only; content owns colour (DESIGN.md rules stay unless this doc changes them).
- Imagery: only the effects themselves (posters and live runs). No AI images.
- Tests: tools/check.mjs and tools/motion-check.mjs must pass; add checks for the hero (pauses off screen, reduced
  motion poster, deep links skip it).
- Performance: hero GPU frame within budget at 1440x900; the page's first paint must not wait on WebGL.

## Decided (by AJ, via the approved plan)

- Front page with one showpiece running live, full width.
- One sentence saying what this is, plus the three differentiators.
- An editorial row of large showpiece tiles, the full catalogue below.
- New type pairing: display face with character + clean UI face + mono for code, open-licensed.
- Fix the flat hierarchy (counts vs headings, uniform card text) and the rail's ragged look.

## Left to the builder (the lead)

- Which showpiece(s) the hero runs (one fixed vs a slow rotation), and which 4 to 6 pieces fill the showpiece row.
- The exact type pairing (render candidates on the real page and choose; check licences).
- Layout of the hero and showpiece row at desktop, tablet and phone; how the dial behaves over the hero.
- Copy (plain, specific, no hype), in EN, 中文, ES, FR.
- Motion for the new parts (entrances, hero handover), within the motion system in DESIGN.md.
