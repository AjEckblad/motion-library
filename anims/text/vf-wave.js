// Variable-font wave, on a typeface specimen page: a sine wave travels through each letter's weight and width axes, and the axis sliders follow one marked letter.
// A variable font is one file with continuous axes, so every letter can sit anywhere between thin-condensed and black-wide; offsetting the wave by letter makes the bulge roll along the word. Needs a variable font with wght and wdth axes (Mona Sans here).
const PARAMS = { amplitude: 1, speed: 1.6, spread: 0.5 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400, WORD = 'Wavelength', PROBE = 4;
  const root = document.createElement('div');
  root.className = 'vw-root';
  root.innerHTML = `<style>
    .vw-root { position: absolute; inset: 0; overflow: hidden; background: #f5d547; color: #161616; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .vw-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .vw-top { position: absolute; left: 26px; right: 26px; top: 0; height: 48px; display: flex; align-items: center; gap: 16px; border-bottom: 1.5px solid #161616; font-size: 12px; font-weight: 560; }
    .vw-top strong { margin-right: auto; font-size: 15px; font-weight: 760; font-stretch: 110%; letter-spacing: -0.01em; }
    .vw-top span:nth-of-type(1) { padding: 5px 10px; border-radius: 999px; background: #161616; color: #f5d547; font-weight: 640; }
    .vw-meta { position: absolute; left: 26px; right: 26px; top: 62px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
    .vw-word { position: absolute; left: 0; right: 0; top: 96px; display: flex; justify-content: center; line-height: 1; }
    .vw-word span { position: relative; }
    .vw-word span.probe::after { content: ""; position: absolute; left: 50%; bottom: -12px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: #161616; }
    .vw-axes { position: absolute; left: 26px; right: 26px; top: 206px; display: grid; gap: 14px; }
    .vw-axis { display: grid; grid-template-columns: 58px 1fr 40px; align-items: center; gap: 12px; font-size: 11.5px; font-weight: 600; }
    .vw-axis output { text-align: right; font-variant-numeric: tabular-nums; }
    .vw-track { position: relative; height: 2px; background: rgba(22,22,22,.25); border-radius: 2px; }
    .vw-fill { position: absolute; inset: 0; background: #161616; transform-origin: 0 50%; border-radius: 2px; }
    .vw-knob { position: absolute; left: 0; top: -7px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: #161616; box-shadow: 0 0 0 3px #f5d547; }
    .vw-foot { position: absolute; left: 26px; right: 26px; bottom: 20px; display: flex; gap: 18px; align-items: baseline; font-size: 13px; border-top: 1.5px solid #161616; padding-top: 12px; }
    .vw-foot b { margin-right: auto; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
  </style>
  <div class="vw-art">
    <div class="vw-top"><strong>Mona Sans</strong><span>Specimen</span><span>Glyphs</span><span>Download</span></div>
    <div class="vw-meta"><span>Variable · 2 axes</span><span>Following the marked letter</span></div>
    <div class="vw-word" aria-label="${WORD}"></div>
    <div class="vw-axes">
      <div class="vw-axis"><span>Weight</span><div class="vw-track"><i class="vw-fill"></i><i class="vw-knob"></i></div><output>400</output></div>
      <div class="vw-axis"><span>Width</span><div class="vw-track"><i class="vw-fill"></i><i class="vw-knob"></i></div><output>100</output></div>
    </div>
    <div class="vw-foot"><b>Styles</b><span style="font-weight:250">Light</span><span style="font-weight:400">Regular</span><span style="font-weight:700">Bold</span><span style="font-weight:900;font-stretch:120%">Black Wide</span></div>
  </div>`;
  stage.append(root);
  const art = root.querySelector('.vw-art'), word = root.querySelector('.vw-word');
  const spans = [...WORD].map((ch, i) => { const s = document.createElement('span'); s.textContent = ch; if (i === PROBE) s.className = 'probe'; word.append(s); return s; });
  const tracks = [...root.querySelectorAll('.vw-track')], outs = [...root.querySelectorAll('.vw-axis output')];
  let trackW = 0;
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1, aw = W / s;
    art.style.width = aw + 'px'; art.style.top = (H - AH * s) / 2 + 'px'; art.style.transform = `scale(${s})`;
    word.style.fontSize = Math.min(84, (aw - 40) / 6.2).toFixed(1) + 'px';
    trackW = tracks[0].clientWidth;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  let raf;
  function frame(now) {
    // Reduced motion: a slower wave in weight only; width stays put so the letters never shift sideways.
    const t = now / 1000 * PARAMS.speed * (reduce ? 0.35 : 1);
    spans.forEach((s, i) => {
      const k = 0.5 + 0.5 * Math.sin(t * 2 - i * PARAMS.spread) * PARAMS.amplitude;
      const wght = Math.round(200 + 700 * k), wdth = reduce ? 100 : 75 + 50 * k;
      s.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth.toFixed(1)}`;
      if (i === PROBE) {
        // the sliders are read-outs: knob position and fill are transforms, so they never cause layout
        [[wght, (wght - 200) / 700], [Math.round(wdth), (wdth - 75) / 50]].forEach(([v, f], a) => {
          outs[a].textContent = v;
          tracks[a].children[0].style.transform = `scaleX(${f.toFixed(4)})`;
          tracks[a].children[1].style.transform = `translateX(${(f * trackW).toFixed(1)}px)`;
        });
      }
    });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.remove(); };
}
