// Holographic card: a card tilts toward the pointer on a spring, in real CSS 3D. A rainbow foil layer slides
// with the tilt (color-dodge blending, masked to a diagonal pattern), and a glare follows the light. With no
// pointer it sways on its own. The variables live on the card itself, so only the card restyles.
const PARAMS = { tilt: 18, foil: 1, stiffness: 170 };

export default function (stage) {
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;perspective:900px;background:radial-gradient(120% 90% at 50% 20%,#262b3a,#0c0e14);overflow:hidden;touch-action:none';
  root.innerHTML = `
  <style>
    .hc{position:relative;width:min(56%,calc(78cqh*.72));aspect-ratio:5/7;border-radius:4.5%/3.2%;transform-style:preserve-3d;
      transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));box-shadow:0 30px 60px -20px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08) inset;
      background:linear-gradient(160deg,#1d2337,#121522 60%,#1b1530);overflow:hidden;container-type:size}
    .hc-art{position:absolute;inset:7% 7% 34%;border-radius:3%;background:radial-gradient(circle at 50% 45%,#ffd38a 0 9%,transparent 10%),
      repeating-conic-gradient(from 0deg at 50% 45%,#2c3a6b 0 10deg,#1a2143 10deg 20deg);overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.12)}
    .hc-art::before,.hc-art::after{content:"";position:absolute;left:50%;top:45%;border:2px solid rgba(255,220,160,.8);border-radius:50%;translate:-50% -50%}
    .hc-art::before{width:46%;aspect-ratio:1}.hc-art::after{width:70%;aspect-ratio:1;border-style:dashed;border-color:rgba(160,200,255,.6);rotate:var(--spin,0deg)}
    .hc-title{position:absolute;left:8%;right:8%;bottom:19%;font:800 9cqw/1 "Mona Sans",system-ui,sans-serif;font-stretch:115%;letter-spacing:-.02em;color:#f4f1ff}
    .hc-sub{position:absolute;left:8%;right:8%;bottom:9%;font:500 4.2cqw/1.3 "Mona Sans",system-ui,sans-serif;color:rgba(230,228,255,.6);display:flex;justify-content:space-between}
    .hc-foil{position:absolute;inset:0;mix-blend-mode:color-dodge;opacity:calc(.55*var(--foil,1));
      background:repeating-linear-gradient(115deg,#ff6b9d 0%,#ffd36b 6%,#7dffb3 12%,#6bc8ff 18%,#b07dff 24%,#ff6b9d 30%);background-size:220% 220%;
      background-position:var(--fx,50%) var(--fy,50%);
      -webkit-mask:repeating-linear-gradient(135deg,#000 0 2px,rgba(0,0,0,.35) 2px 5px),radial-gradient(circle at var(--gx,50%) var(--gy,50%),#000,transparent 75%);
      -webkit-mask-composite:source-in;mask-composite:intersect}
    .hc-glare{position:absolute;inset:0;mix-blend-mode:overlay;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.75),rgba(255,255,255,.15) 30%,rgba(0,0,0,.35) 75%)}
    .hc-edge{position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 1.5px rgba(255,255,255,.22) inset}
  </style>
  <div class="hc"><div class="hc-art"></div><div class="hc-title">Motion Card</div><div class="hc-sub"><span>No. 027</span><span>Holo foil</span></div><div class="hc-foil"></div><div class="hc-glare"></div><div class="hc-edge"></div></div>`;
  stage.append(root);
  const card = root.querySelector('.hc');
  let tx = 0, ty = 0, rx = 0, ry = 0, vx = 0, vy = 0, lastMove = -1e9;
  const onMove = e => { const b = card.getBoundingClientRect(); tx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); ty = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1)); lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);
  let raf, last = performance.now(); const t0 = last;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    let gx = tx, gy = ty;
    if (now - lastMove > 1200) { gx = Math.sin(t * 0.9) * 0.8; gy = Math.sin(t * 1.3 + 1) * 0.5; }   // idle: a slow figure-of-eight
    // spring toward the target tilt (stiffness from PARAMS, damping fixed near critical)
    const k = PARAMS.stiffness, c = 2 * Math.sqrt(k) * 0.75;
    vx += ((gx - rx) * k - vx * c) * dt; vy += ((gy - ry) * k - vy * c) * dt; rx += vx * dt; ry += vy * dt;
    const s = card.style;
    s.setProperty('--ry', (rx * PARAMS.tilt).toFixed(2) + 'deg'); s.setProperty('--rx', (-ry * PARAMS.tilt).toFixed(2) + 'deg');
    s.setProperty('--gx', (50 + rx * 45).toFixed(1) + '%'); s.setProperty('--gy', (50 + ry * 45).toFixed(1) + '%');
    s.setProperty('--fx', (50 + rx * 60).toFixed(1) + '%'); s.setProperty('--fy', (50 + ry * 60).toFixed(1) + '%');
    s.setProperty('--foil', PARAMS.foil); s.setProperty('--spin', (t * 12 % 360).toFixed(1) + 'deg');
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
