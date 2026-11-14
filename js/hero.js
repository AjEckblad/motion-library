// The front page's live hero, shared by the app (js/front.js) and the static build (tools/build-static.mjs).
// HERO runs live across the right of the first screen, steered by the pointer, fading out under the headline.
export const HERO = 'clifford-attractor';
// tuned for the hero only, through the stage's ?p= (the piece's own PARAMS; its file is untouched): 0.4 million points
// a frame instead of 1 keeps the hero near 5 ms of GPU time at 1440x900 on a 2x screen (12.5 ms at the default)
export const HERO_PARAMS = 'points=0.4';
// The front headline, and the phrase in it set in Instrument Serif italic and the pop pink (both translated in js/i18n.js;
// the translated phrase must appear word for word in the translated headline, or the headline is set plain).
export const HEADLINE = 'Web effects you can drop into any site';
export const HEADLINE_ACCENT = 'any site';
