---
name: Motion Library
description: A dark catalogue of live web effects you scroll and dial through, in English and Chinese.
colors:
  frame: "#0c0c0e"
  sheet: "#141416"
  edge: "#26262a"
  raised: "#1c1c1f"
  line: "#202024"
  control: "#3a3a3e"
  ink: "#f2f2f3"
  ink-2: "#c6c6ca"
  muted: "#8a8c92"
  accent: "#7cc0ff"
  heart: "#ff4d6d"
  heart-soft: "#ffb3c8"
  focus: "#a6d4ff"
  danger: "#ff6b7d"
  code-bg: "#0f0f11"
  cat-basics: "#3b5bdb"
  cat-transitions: "#0e9488"
  cat-text: "#4f5d75"
  cat-scroll: "#2f9e44"
  cat-hover: "#b07a00"
  cat-micro: "#d63c74"
  cat-springs: "#d9601a"
  cat-morph: "#b8359a"
  cat-flow: "#0a87a6"
  cat-fluid: "#2b74c9"
  cat-chrome: "#8a6a4f"
  cat-shaders: "#7b8c10"
  cat-generative: "#7a5af5"
  cat-simulation: "#c2410c"
  cat-retro: "#16a34a"
typography:
  display:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  subhead:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1
  meta:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  dial-label:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1
  dial-label-active:
    fontFamily: "IBM Plex Sans, PingFang SC, Noto Sans SC, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1
  code:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  tag: "6px"
  control: "8px"
  media: "10px"
  stage: "12px"
  sheet: "16px"
  pill: "999px"
spacing:
  inset: "8px"
  gap: "20px"
  pad: "24px"
  bar-h: "60px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.pill}"
    height: "38px"
    padding: "0 16px"
    typography: "{typography.label}"
  button-ink-hover:
    backgroundColor: "#2a2d31"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "38px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.raised}"
  icon-button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "38px"
  playback-button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.media}"
    height: "38px"
    padding: "0 12px"
  segmented:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.media}"
    padding: "3px"
  segmented-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  search-field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.media}"
    height: "38px"
    padding: "0 8px 0 36px"
  sheet-panel:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.pad}"
  preview-tile:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.media}"
  compare-tray:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 14px"
  popover:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stage}"
    padding: "6px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.media}"
    padding: "9px 14px"
---

# Design System: Motion Library

## Overview

**Creative North Star: "The Dial and the Window Wall"**

A near-black frame holds two things: one long scroll of category sections, three large preview windows across, and a narrow arc of category words on the right edge that follows the scroll and jumps to a section when chosen. The interface is deliberately colourless so the effects, which are the content, carry all the colour and motion; on black they read the way they would in a real hero. Chrome is near-white ink on near-black, surfaces separated by a step in tone. The one accent, a light sky blue, marks the chosen category (a 1px line under its word) and the chosen language.

Personality comes from two code-drawn signatures, not from decoration. The dial magnifies the entry under the pointer fisheye-style, swelling the scale of the words, while a needle springs to the chosen entry with a little overshoot. Fluffy creatures, painted from thousands of fur strands, perch on the dial and sheet edges, breathe, blink and watch the cursor. Everything else stays calm and dense: a desk tool for one designer-developer, tuned for finding an effect in seconds.

The build refuses the default catalogue look: no left sidebar, no glowing cards, no purple accent, no light-grey wash that flattens the effects.

**Key Characteristics:**
- Near-black frame (#0c0c0e), sheets one tone step lighter; dark only.
- Near-white ink for all chrome; colour lives only in category dots, the heart, the one accent and the content.
- Three across: flat 5:4 preview windows with 8px corners and no shadow, posters rendered at 1120x896 WebP.
- One superfamily, IBM Plex Sans and IBM Plex Mono (self-hosted woff2), with system CJK faces for 中文; the mono only for code and the npx command.
- Motion is springy and short; the needle, the grid swap and the FLIP expand are the system's voice.
- No raster imagery except generated poster frames of the animations themselves.

## Colors

A near-black monochrome system with fifteen small category hues, one light sky-blue accent for selection, and a pink-red held back for hearts (with a soft pink for the Hearted word in the dial).

### Primary
- **Near-white Ink** (ink): every piece of text that matters, the dial needle and hub, the solid primary button, the compare tray, the toast, slider thumbs (`accent-color`), the Surprise-me die.

### Secondary
- **Heart Red** (heart): the filled heart, and the Hearted entry on the dial. Nothing else is red-pink in the chrome.

### Tertiary
- **Category Hues** (cat-flow through cat-morph): fifteen mid-saturation hues, one per category, defined in `anims/registry.js`. They appear only as small dots: 10px on the dial (12px on phones), 8px beside card titles and in the detail breadcrumb. The active dial dot gets a double ring (3px frame gap, then 2px hue).
- **Accent** (accent): light sky blue. Only selection: the 1px line under the chosen dial word, the chosen language in the EN/中文 switch, slider thumbs, changed-code highlights.
- **Focus** (focus): the 2px keyboard focus outline, a lighter step of the accent.
- **Danger Brick** (danger): destructive text actions only (delete group, remove from group).

### Neutral
- **Frame Grey** (frame): the page ground, top bar, detail and compare backgrounds, the phone dial strip.
- **Sheet White** (sheet): the content sheet, detail panels, compare columns, popovers, outline buttons.
- **Hairline Edge** (edge): the 1px border on every sheet, panel and outline control.
- **Raised Grey** (raised): preview tile placeholders, hover fill on outline controls, segmented-control track.
- **Divider Line** (line): internal rules inside panels (tweak area, notes, code header, popover separator).
- **Control Stroke** (control): text-input borders (group rename, new-group field).
- **Ink Two** (ink-2): secondary text that is still read (notes, slider labels, link buttons).
- **Muted Slate** (muted): counts, kind labels, trick lines, file paths, the clock.
- **Code Paper** (code-bg): the code pane ground.
- **Dial Track / Dial Tick** (dial-track, dial-tick): the arc and its minor ticks.

### Named Rules
**The Dots-Only Rule.** Category hues appear only as small round dots (8 to 12px). They never fill a surface, tint a card, colour text or become a button.

**The One Warm Colour Rule.** Heart Red is the only warm accent in the chrome and means exactly one thing: hearted.

**The Content Owns Colour Rule.** The shell stays slate on grey and white so every preview reads at full strength beside its neighbours.

## Typography

**Display Font:** none beyond the page title; the system has one family.
**Body Font:** IBM Plex Sans (SIL OFL), self-hosted variable woff2 (weight 100 to 700, latin subset, 40 KB), then PingFang SC / Noto Sans SC for Chinese, then system-ui. Chosen 2026-11-12 to replace Public Sans: AJ asked for a more professional look. Plex is an engineered grotesque with real character in its details, and it is not the face every dev-tool site already uses (Geist and Inter were considered and rejected as overused).
**Mono Font:** IBM Plex Mono 400 and 500 (same superfamily, 10 KB each), used only for code, the file path and the npx command. Sans and mono were drawn together, so the install line and code read as part of the same system.

**Character:** One quiet grotesque with clear size steps. Hierarchy comes from six sizes and three weights; nothing in between.

### Hierarchy (tokens in `css/app.css` `:root`, `--fs-*`)
- **Display** (`--fs-display`, 28px, 600, 1.1, -0.025em): the page title ("All animations").
- **Headline** (`--fs-h1`, 24px, 600, 1.2, -0.02em): category section headings and the FAQ heading.
- **Subhead** (`--fs-h2`, 20px, 600, -0.015em): the detail title, Hearted group names, the empty state.
- **Title** (`--fs-title`, 16px): card titles and FAQ questions at 500; panel headings ("How it works", "Install", "Tweak", "Code") at 600.
- **Body** (`--fs-body`, 16px, 400, 1.6): notes (62ch) and FAQ answers (68ch), `text-wrap: pretty`.
- **Label** (`--fs-label`, 14px, 500): top-bar buttons, link buttons, toast, popover items; the line under each card title is 14px 400 in Muted Slate; the dial is 14px 400, the chosen entry 500 in ink.
- **Meta** (`--fs-meta`, 13px): counts, kind labels, timecode, clock, slider labels and values, compact panel buttons, the language switch, and code (Geist Mono 400, 1.65).

### Named Rules
**The Three Weights Rule.** 400 for reading and quiet labels, 500 for controls and card titles, 600 for headings. No in-between weights.

**The No Faked Style Rule.** Only upright Plex Mono is loaded, so code comments are set apart by tone, never by a synthesized slant.

**The Tabular Numbers Rule.** Every count, timecode, clock, slider value and speed option uses tabular figures.

**The Sentence Case Rule.** No uppercase labels or tracked-out small caps anywhere in the shell.

## Layout

A fixed 60px top bar sits on the frame (56px under 860px). Below it, one white sheet holds the header and the grid; the dial occupies a fixed column on the right edge (440px wide; 400px at 1280 and under; 360px at 1100 and under). The sheet keeps an 8px inset from the frame on its left and bottom edges.

The grid auto-fills columns at least 205px wide with a 28px row gap and a 20px column gap, giving 4 columns at 1440 and 3 at 1280. Tiles are 5:4. Under 860px the dial becomes a 150px half-dial strip along the bottom, the grid drops to columns at least 160px wide (22px / 12px gaps), and button labels collapse to icons. Under 420px the grid is fixed at two columns and meta text drops to the title alone.

The detail view is a full-screen layer on the frame: a 60px top row (back, breadcrumb, actions), then two sheet panels split 1.35fr / 1fr (the right panel at least 360px) with 8px between them. It stacks to one column at 1100px. Compare uses the same panel language with two equal stages above a control bar.

Spacing rhythm: 8px inset between planes, 20px grid gutter, 24px sheet padding, 6 to 14px gaps inside controls.

## Elevation & Depth

Depth is planar, not shadowed. The frame is the back plane; white sheets sit on it with a 1px hairline edge and 16px corners. Preview tiles are flat. Shadows appear only on layers that float above everything and must detach: the popover, the compare tray, and the selected segment.

### Shadow Vocabulary
- **Popover lift** (`box-shadow: 0 12px 32px rgba(21,23,26,.16), 0 2px 6px rgba(21,23,26,.08)`): the group-picker popover.
- **Tray lift** (`box-shadow: 0 10px 30px rgba(21,23,26,.25)`): the dark compare tray at the bottom of the screen.
- **Segment nudge** (`box-shadow: 0 1px 2px rgba(21,23,26,.12)`): the selected option in a segmented control.
- **Focus glow** (`box-shadow: 0 0 0 3px rgba(43,116,201,.12)`): the search field when focused.

### Named Rules
**The Flat Window Rule.** Preview tiles and sheets never carry a shadow. A playing tile lifts only by translating 2px up.

**The Floating-Only Shadow Rule.** A shadow means the layer floats over the page (popover, tray). Anything that lives in the layout uses a hairline edge instead.

## Shapes

Gently rounded throughout, tightening as elements get smaller: sheets and panels 16px, the detail stage and popover 12px, preview tiles, the search field, playback buttons and the segmented track 10px, popover items and small inputs 8px, tags, link buttons and the timecode 6px. Top-bar buttons, icon buttons, chips and the compare tray are full pills. Dots, the heart button and the dial hub are circles. The dial itself, a 128-degree arc with an entry every few degrees and three minor ticks between entries, is the system's one large geometric figure.

## Components

### Buttons
Calm pill controls with a tactile press.
- **Shape:** full pill (999px), 38px tall; icon buttons are 38px circles.
- **Primary (ink):** Slate Ink fill, white label, 600 weight, 17px stroked icon; used once per screen (Surprise me).
- **Outline:** Sheet White with the hairline edge; hover fills Raised Grey.
- **Press:** every button scales to 0.97 on press over 160ms on the out-curve.
- **Playback buttons:** same as outline but with 10px corners, grouped in the detail play bar.
- **Link buttons:** borderless 13px text in Ink Two, Raised Grey fill on hover; danger variant in Danger Brick.

### Chips
- **Style:** inside the dark compare tray only: 30px pills in #2a2e33 with white 13px text and a round remove button.

### Cards / Containers
- **Preview tile:** 5:4 window, 10px corners, Raised Grey behind a poster frame; no border, no shadow.
- **Hover intent:** after 110ms of hover (or on focus) the live animation fades in over the poster in 160ms, the tile lifts 2px and a timecode pill appears bottom-left. Only one tile plays at a time.
- **Meta:** category dot, two-line title, kind label on the right, two-line trick in Muted Slate.
- **Heart:** 34px white disc top-right, revealed on hover or focus (always visible on touch); filled Heart Red when on, with a squash-and-pop (0.82 then 1.22) on toggle.
- **Sheets / panels:** Sheet White, 1px hairline edge, 16px corners, 24px padding (16px in the detail left panel).

### Inputs / Fields
- **Search:** 38px, 10px corners, white with hairline edge and a 16px stroked magnifier; on focus the edge darkens and a faint blue glow appears.
- **Sliders:** native range inputs with Slate Ink accent, label left and tabular value right.
- **Segmented control:** Raised Grey track with 3px padding; the selected option becomes a white chip with a 1px nudge shadow.
- **Text inputs:** Control Stroke border, 6 to 8px corners.

### Navigation
The dial is the navigation (see below). The top bar carries the brand mark (a gauge glyph whose needle rotates -38 degrees on hover), search, Surprise me and sound. The detail view uses a breadcrumb: category dot and name in Muted Slate, a slash, then the title.

### The Dial (signature)
A semicircle on the right edge carrying All, Hearted and the 12 categories, with horizontal labels set to the left of the arc, a hue dot on the arc and a count beyond it. Entries are fixed on the arc; a Slate Ink needle (3px, round cap) points from the hub to the chosen entry.
- **Radius:** clamped between 150 and 380px from the available height and width; the arc spans plus and minus 64 degrees.
- **Fisheye:** under the pointer each label swells on a Gaussian falloff and shifts left, in transform only (the UI face has no width axis, so nothing relayouts). Its strength is set from the room the tightest word has: every word moves left the same way, and the longest stops 10px short of the cards (about 1.14× in English, the full 1.38× for the shorter 中文 labels). A slightly underdamped spring carries each label to its target; keyboard moves and reduced motion land at once. (Two rejected approaches: capping each long word's scale made the hovered word smaller than its neighbours; sliding long words right broke the shared leftward motion.)
- **Needle spring:** stiffness 170, damping ratio about 0.62, so it overshoots slightly and settles; a soft tick sounds each time it passes an entry.
- **Selection:** active label 500 weight in ink, scaled up by 0.16 of the same strength, with a 1px accent line under the word; the Hearted word stays soft pink.
- **Grid swap** (All ↔ Hearted): the old cards leave all at once (120ms, 6px drop, no stagger, so the new view is never held back) and the first screen comes in at 240ms with a 30ms stagger capped at the 8th card, from 12px below at 98.5% scale. Categories inside All glide to their section instead; keyboard moves swap and scroll instantly.
- **Phones:** a half-dial along the bottom edge; every entry stays visible as a 12px dot with a 44px hit area, and the chosen entry is named in a caption under the arc.

### Creatures (signature)
Fluffy round creatures drawn in canvas from a few thousand fur strands in three-tone palettes (mist blue-grey, peach, mint), with dark eyes and a small pink accent. They perch on the dial, peek from the frame, sit on the sheet's edge, keep the empty state company and sit in the detail notes. They breathe, hop, blink every 2 to 6 seconds and follow the cursor with their eyes. They are decoration only and never carry information.

### Detail view
Opens with a FLIP expand from the clicked tile (460ms, drawer curve) into the stage; panels fade and settle from 98.5% scale over 240ms. The play bar holds pause, a speed segment (0.25x, 0.5x, 1x), frame-step, replay and a tabular clock. Tweak sliders sit under a hairline; changed code lines get a faint sky-blue band and the hot value a stronger one. The code pane is IBM Plex Mono on Code Paper with line numbers. Pointer-driven pieces (`pointer: true`) open already running with no big play button: you play them by moving over them. Their hint ("Interactive: move or press inside") sits in the control row beside the clock, in Muted Slate with a small cursor icon, never over the animation: white text on a light demo can't be read. On wide screens the stage fills the left panel down to the controls (no fixed 16:10 box), capped at 88% of its width so it never turns portrait.

### Popover, tray, toast
- **Group-picker popover:** white, 12px corners, 6px padding, popover lift shadow; enters from 96% scale over 160ms from the trigger's corner. Rows are 8px-cornered with a tick for checked groups.
- **Compare tray:** a dark ink pill fixed at the bottom centre with chips and a white Compare button.
- **Toast:** ink, 10px corners, rises 16px and fades in, gone after 1.7s.

## Do's and Don'ts

### Do:
- **Do** keep the chrome slate on grey and white; let the previews supply the colour.
- **Do** show a category only as its hue dot (8px on cards, 10px on the dial) next to its name.
- **Do** separate planes with the 8px inset and a 1px hairline edge (#e1e5e9) rather than a shadow.
- **Do** keep emphasis to weight and size; monospace only for code and the npx command.
- **Do** use the shared curves: out (cubic-bezier(0.23, 1, 0.32, 1)) for most UI, drawer (cubic-bezier(0.32, 0.72, 0, 1)) for expands, and keep UI transitions between 120 and 460ms.
- **Do** honour reduced motion: posters instead of live previews, the needle and fisheye jump straight to their targets, transitions collapse.
- **Do** use tabular figures for every number.

### Don't:
- **Don't** fill surfaces, text or buttons with a category hue.
- **Don't** use Heart Red for anything but hearts.
- **Don't** put shadows on preview tiles or sheets; shadows are for floating layers only.
- **Don't** introduce a left sidebar, dark rounded cards or a purple accent.
- **Don't** use uppercase or letter-spaced labels.
- **Don't** play more than one live preview at a time.
- **Don't** ship raster imagery other than poster frames generated from the animations themselves (tools/posters.mjs).
