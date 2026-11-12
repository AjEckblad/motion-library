// RGB-split glitch: the picture is split into red, green and blue copies and added back together.
// Aligned, they rebuild the original; offset, the colour splits. In bursts, slices jump sideways.
const PARAMS = { intensity: 1, rate: 0.8 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, d = 1, src, chans;
  const build = () => {
    // the source picture
    src = document.createElement('canvas'); src.width = W * d; src.height = H * d;
    const s = src.getContext('2d'); s.scale(d, d);
    s.fillStyle = '#101205'; s.fillRect(0, 0, W, H);
    s.fillStyle = '#e9f5a0'; s.font = `900 ${Math.min(W * 0.2, H * 0.34)}px "Mona Sans", system-ui, sans-serif`; s.textAlign = 'center'; s.textBaseline = 'middle';
    s.fillText('GLITCH', W / 2, H * 0.46);
    s.fillStyle = '#7b8c10'; s.fillRect(W * 0.18, H * 0.7, W * 0.64, H * 0.05);
    s.fillStyle = '#ffffff'; s.font = `600 ${Math.max(11, H * 0.05)}px "Mona Sans", system-ui, sans-serif`; s.fillText('signal lost · retrying', W / 2, H * 0.82);
    // one copy per channel: multiply by pure red, green or blue
    chans = ['#ff0000', '#00ff00', '#0000ff'].map(c => {
      const k = document.createElement('canvas'); k.width = src.width; k.height = src.height;
      const g = k.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = c; g.fillRect(0, 0, k.width, k.height);
      return k;
    });
  };
  const resize = () => { d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; build(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let burst = 0, next = performance.now() + 600, raf;
  function frame(now) {
    if (now > next) { burst = 1; next = now + (400 + Math.random() * 1600) / Math.max(0.05, PARAMS.rate); }
    burst *= 0.9;
    const k = (0.15 + burst) * PARAMS.intensity, jitter = () => (Math.random() - 0.5) * 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    const off = W * d * 0.012 * k;
    ctx.drawImage(chans[0], -off + jitter() * off * 0.3, 0);
    ctx.drawImage(chans[1], 0, jitter() * off * 0.2);
    ctx.drawImage(chans[2], off + jitter() * off * 0.3, 0);
    ctx.globalCompositeOperation = 'source-over';
    if (burst > 0.2) {
      // displaced horizontal slices
      for (let i = 0; i < 6; i++) {
        const y = Math.random() * canvas.height, h = (0.01 + Math.random() * 0.07) * canvas.height, dx = jitter() * canvas.width * 0.08 * k;
        ctx.drawImage(canvas, 0, y, canvas.width, h, dx, y, canvas.width, h);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    for (let y = 0; y < canvas.height; y += 4 * d) ctx.fillRect(0, y, canvas.width, d);   // scanlines
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
