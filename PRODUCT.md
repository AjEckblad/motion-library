# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Static HTML/CSS/JS with ES modules, no build step, no frameworks. Served locally by `run.sh`. Every animation snippet is plain JavaScript with no libraries (user decision).

## Users
The owner, a designer-developer who builds motion-heavy websites and videos. They use the library as a personal reference: browse by type, see the effect live, take the code into their own projects.

## Product Purpose
A catalogue of 60 web animations in 12 categories (basics, page transitions, text, scroll, hover & cursor, micro & loading, springs & physics, morph & SVG, flow & particles, fluid, chrome & 3D, shaders & glitch). Hovering a card plays the real animation, and clicking it opens the code. Success means the owner finds the right effect in seconds, understands the trick behind it, and copies working code that runs outside the library.

## Positioning
Every preview is the code itself running, not a recording. What you see is exactly what you copy, and each snippet is one self-contained file with no dependencies.

## Operating Context
- Used locally on the owner's M1 Mac in a desktop browser, alongside their own projects (Next.js test-site, Spring Boot kinetic-fluid, video renders).
- Phone use is secondary.

## Capabilities and Constraints
- 60 animations; each one is a single plain-JS file with a cleanup function.
- Live previews run one at a time, so the frame rate stays smooth and WebGL contexts stay few.
- Each animation shows 2–3 plain-language notes covering the trick and the key numbers to tweak, then the code with Copy and Download .html.
- Local only for now; it should stay deployable as static files later without changes.
- Disk space on the machine is tight (about 7 GB free): no video assets.

## Evidence on Hand
- Reusable animation code from the owner's own projects: `~/Downloads/showreel/src/reel.js` (springs, shape morphs, particle flow, chrome raymarch, spirograph) and `~/Downloads/kinetic-fluid/src/main/resources/templates/index.html` (WebGL fluid simulation).
- No testimonials, users or metrics exist, and none should be invented.

## Product Principles
1. The animation is the content; the interface frames it and steps back.
2. What runs is what you copy: no hidden helpers or libraries behind a preview.
3. Find it fast: categories, search and live hover beat reading descriptions.
4. Teach the trick in a sentence: the notes explain why it feels right, not just what it does.

## Accessibility & Inclusion
Respect `prefers-reduced-motion`: with it on, nothing autoplays and posters are shown instead. Full keyboard navigation, with focus also starting the preview.
