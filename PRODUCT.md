# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Static HTML/CSS/JS with ES modules, no build step, no frameworks. Served locally by `run.sh`. Every animation snippet is plain JavaScript with no libraries (user decision).

## Users
Two groups. The owner (AJ), a designer-developer who builds motion-heavy websites and videos and uses the library as his
own reference. And, since 2026-11-12, the public: front-end developers, creative coders and designers who land on the
site (GitHub Pages, npm CLI `motion-library`) looking for an effect to use, or to be impressed by; and AI coding
assistants that read llms.txt and "Copy as prompt".

## Product Purpose
A public catalogue of 224 live web effects in 15 categories, from UI basics to real-time simulations and renders
(ferrofluid, ocean, terrain flyover, snow globe). Each card plays the real effect; each detail view shows how it works,
live sliders, the code, Copy / Copy as prompt / Download .html, and an `npx motion-library add <id>` line. Success: a
first-time visitor understands within seconds what makes it different and stays to explore; anyone finds the right
effect in seconds and leaves with code that runs in their own stack.

## Positioning
Not "another motion library" (Motion at motion.dev owns that phrase): the home of showpiece web effects that run in any
stack. Every preview is the code itself running, not a recording; what you see is what you copy; each effect is one
plain-JS file with no dependencies. Live sliders on every effect and Copy as prompt for AI assistants set it apart from
React component libraries (Animata, Aceternity, Magic UI).

## Operating Context
- Public static site on GitHub Pages (https://ajeckblad.github.io/motion-library/); desktop browsers first, phones a
  close second for visitors arriving from social links.
- The owner develops on an M1 Mac; the site runs locally with run.sh on port 4321.

## Capabilities and Constraints
- 224 effects; each one is a single plain-JS file with a cleanup function and PARAMS for live sliders.
- Live previews run one at a time, so the frame rate stays smooth and WebGL contexts stay few.
- Four languages: English, 中文, Español, Français.
- Static files only, no build step at serve time (tools/build-static.mjs pre-renders the grid and fx/ pages).
- Disk space on the machine is tight: no video assets in the repo.

## Evidence on Hand
- Reusable animation code from the owner's own projects: `~/Downloads/showreel/src/reel.js` (springs, shape morphs, particle flow, chrome raymarch, spirograph) and `~/Downloads/kinetic-fluid/src/main/resources/templates/index.html` (WebGL fluid simulation).
- No testimonials, user counts or metrics exist, and none should be invented.

## Product Principles
1. The animation is the content; the interface frames it and steps back.
2. What runs is what you copy: no hidden helpers or libraries behind a preview.
3. Find it fast: categories, search and live hover beat reading descriptions.
4. Teach the trick in a sentence: the notes explain why it feels right, not just what it does.

## Accessibility & Inclusion
Respect `prefers-reduced-motion`: with it on, nothing autoplays and posters are shown instead. Full keyboard navigation, with focus also starting the preview.
