// Mercury: beads of liquid metal on a tray. JavaScript moves the beads (they pull together and merge, and a
// fast stroke splits them); the shader turns them into one metaball surface, builds a height from it and
// reflects a studio (pale floor at the rim, dark room, bright softboxes on top) off its normal.
const PARAMS = { beads: 14, cohesion: 1, tilt: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const MAX = 24;
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform int N; uniform vec4 B[${MAX}]; uniform vec2 V[${MAX}];
  // metaball field; w returns the field-weighted radius so big puddles can be flatter than small beads
  float field(vec2 p, out float w) {
    float f = 0., wr = 0.;
    for (int i = 0; i < ${MAX}; i++) {
      if (i >= N) break;
      vec2 d = p - B[i].xy, v = V[i]; float s = length(v);
      if (s > 1e-3) { vec2 vn = v / s; d -= vn * dot(d, vn) * (1. - 1. / (1. + s * .9)); }   // moving beads stretch along their path
      float r = B[i].z, k = r * r / (dot(d, d) + 1e-6);
      f += k; wr += k * r;
    }
    w = wr / max(f, 1e-6); return f;
  }
  float height(vec2 p) { float w; float f = field(p, w); return f > 1. ? min(w, .065) * sqrt(1. - 1. / f) : 0.; }
  vec3 env(vec3 d) {
    float up = d.z;
    vec3 floorC = vec3(.1, .1, .115), room = vec3(.02, .022, .028), ceil = vec3(.34, .37, .42);   // a dark studio: softboxes on black
    vec3 c = up < 0. ? mix(room, floorC, smoothstep(0., -.35, up)) : mix(room, ceil, smoothstep(.03, .32, up));
    vec2 q = d.xy / max(d.z, .06);                                       // where the ray meets the ceiling
    float key = smoothstep(.75, .4, length((q - vec2(-.4, .45)) * vec2(1., 1.5))), fill = smoothstep(.5, .2, length((q - vec2(.6, -.1)) * vec2(1.4, 1.)));
    float strip = smoothstep(.08, .035, abs(q.y + .62 + .12 * q.x)) * smoothstep(1.6, 1.2, abs(q.x - .25));
    c += step(0., up) * (vec3(1.) * key * 1.6 + vec3(.9, .95, 1.) * fill * .7 + vec3(1., .96, .9) * strip * 1.2);
    float az = atan(d.y, d.x), hz = exp(-pow((up - .16) / .07, 2.));     // a window glow just above the horizon
    c += hz * vec3(.45, .55, .7) * smoothstep(.3, .95, sin(az * 2. + .6)) * .8;
    return c;
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
  void main() {
    vec2 A = vec2(R.x / R.y, 1.), p = (uv - .5) * A;
    float w, f = field(p, w);
    // the tray: dark slate with grain and a soft pool of light
    vec3 bg = vec3(.085, .085, .1) * (.55 + .45 * smoothstep(.95, .1, length(uv - .5)));
    bg += (hash(floor(uv * R)) - .5) * .012;
    float ws, fs2 = field(p - vec2(-.018, .03), ws);                     // shadow: the field again, nudged away from the key light
    bg *= 1. - smoothstep(.22, 1.15, fs2) * .6;
    bg *= 1. - smoothstep(.78, 1., f) * .16;                             // contact darkening hugging each bead
    float e = 1. / R.y;
    vec3 n = normalize(vec3(-(height(p + vec2(e, 0)) - height(p - vec2(e, 0))) / (2. * e), -(height(p + vec2(0, e)) - height(p - vec2(0, e))) / (2. * e), 1.));
    vec3 vd = normalize(vec3(p * .35, -1.));
    vec3 rd = reflect(vd, n);
    float fr = .78 + .22 * pow(1. - max(0., dot(-vd, n)), 4.);           // metal: reflective everywhere, more at grazing angles
    vec3 metal = env(rd) * fr * vec3(.9, .92, .95);
    float aa = fwidth(f) * 1.2;
    float m = smoothstep(1. - aa, 1. + aa, f);
    vec3 c = mix(bg, metal, m);
    o = vec4(pow(c, vec3(.95)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n), uR = u('R'), uN = u('N'), uB = u('B'), uV = u('V');
  const resize = () => { const d = Math.min(devicePixelRatio, 1.5); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // beads live in shader units: the frame is 1 tall and aspect wide, centred on 0
  const aspect = () => canvas.width / Math.max(1, canvas.height);
  const beads = [];
  const bead = (x, y, r, vx = 0, vy = 0) => ({ x, y, r, vx, vy, age: 0, jig: 0.6 });
  for (let i = 0; i < Math.round(PARAMS.beads); i++) {
    const a = aspect();
    beads.push(bead((Math.random() - 0.5) * (a - 0.2), (Math.random() - 0.5) * 0.8, 0.022 + Math.random() * 0.042));
  }
  // pointer as a stylus; when idle, a virtual finger swipes through every few seconds
  let px = 99, py = 99, pvx = 0, pvy = 0, lastMove = -1e9, lastT = 0;
  const onMove = e => {
    const b = canvas.getBoundingClientRect(), a = b.width / b.height, now = performance.now();
    const x = ((e.clientX - b.left) / b.width - 0.5) * a, y = 0.5 - (e.clientY - b.top) / b.height;
    const dt = Math.max(0.008, (now - lastT) / 1000);
    if (now - lastMove < 100) { pvx = pvx * 0.5 + (x - px) / dt * 0.5; pvy = pvy * 0.5 + (y - py) / dt * 0.5; }
    px = x; py = y; lastMove = lastT = now;
  };
  const onLeave = () => { px = py = 99; pvx = pvy = 0; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave);
  const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const t0 = performance.now(), sweep = { k: -1, ang: 0, off: 0 };
  let raf, last = t0;
  const Bf = new Float32Array(MAX * 4), Vf = new Float32Array(MAX * 2);

  function step(dt, t) {
    const a = aspect(), hw = a / 2, hh = 0.5;
    let sx = px, sy = py, svx = pvx, svy = pvy;
    if (performance.now() - lastMove > 1500) {
      const ph = (t - 0.6) / 3.6, k = Math.floor(ph), f = ph - k, dur = 1.1 / 3.6;
      if (ph >= 0 && f < dur) {
        if (k !== sweep.k) {                              // each swipe is aimed through the biggest puddle
          const big = beads.reduce((m, b) => b.r > m.r ? b : m, beads[0]);
          sweep.k = k; sweep.ang = rnd(k) * Math.PI * 2; sweep.off = -Math.sin(sweep.ang) * big.x + Math.cos(sweep.ang) * big.y;
        }
        const ang = sweep.ang, off = sweep.off, s = f / dur;
        const dx = Math.cos(ang), dy = Math.sin(ang), L = a * 0.65;
        sx = -dy * off + dx * (s - 0.5) * 2 * L; sy = dx * off + dy * (s - 0.5) * 2 * L;
        svx = dx * 2 * L / (dur * 3.6); svy = dy * 2 * L / (dur * 3.6);
      } else { sx = sy = 99; svx = svy = 0; }
    }
    const sp = Math.hypot(svx, svy), gx = Math.sin(t * 0.37 + 1) * 0.16 * PARAMS.tilt, gy = Math.cos(t * 0.29) * 0.13 * PARAMS.tilt;
    for (const b of beads) {
      b.age += dt; b.jig *= Math.exp(-dt * 3.5);
      let ax = gx, ay = gy;
      const dx = b.x - sx, dy = b.y - sy, d = Math.hypot(dx, dy), reach = b.r + 0.055;
      if (d < reach && d > 1e-5) {                       // the stylus shoves and drags the metal
        const k = 1 - d / reach; ax += dx / d * k * 9 + svx * k * 2.5; ay += dy / d * k * 9 + svy * k * 2.5;
      }
      b.ax = ax; b.ay = ay;
    }
    // cohesion: beads that are close pull together, the pull shared by size
    for (let i = 0; i < beads.length; i++) for (let j = i + 1; j < beads.length; j++) {
      const A = beads[i], B = beads[j]; if (A.age < 0.35 || B.age < 0.35) continue;
      // surfaces touch at about 1.35x the summed radii (where the metaballs bridge): touching beads snap together
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) + 1e-6, gap = d - (A.r + B.r) * 1.35;
      if (gap > 0.09) continue;
      const k = gap < 0 ? 6 : PARAMS.cohesion * 0.9 * (1 - gap / 0.09), ma = A.r * A.r, mb = B.r * B.r;
      A.ax += dx / d * k * mb / (ma + mb); A.ay += dy / d * k * mb / (ma + mb);
      B.ax -= dx / d * k * ma / (ma + mb); B.ay -= dy / d * k * ma / (ma + mb);
    }
    for (const b of beads) {
      const damp = 1.4 + 0.012 / b.r;                    // tiny beads stick to the tray more than big ones
      b.vx = (b.vx + b.ax * dt) * Math.exp(-damp * dt); b.vy = (b.vy + b.ay * dt) * Math.exp(-damp * dt);
      b.x += b.vx * dt; b.y += b.vy * dt;
      const m = b.r * 1.1 + 0.015;
      if (b.x < -hw + m) { b.x = -hw + m; b.vx *= -0.35; } if (b.x > hw - m) { b.x = hw - m; b.vx *= -0.35; }
      if (b.y < -hh + m) { b.y = -hh + m; b.vy *= -0.35; } if (b.y > hh - m) { b.y = hh - m; b.vy *= -0.35; }
    }
    // merge: centres close enough become one bead with the same area and momentum
    for (let i = 0; i < beads.length; i++) for (let j = beads.length - 1; j > i; j--) {
      const A = beads[i], B = beads[j], d = Math.hypot(B.x - A.x, B.y - A.y);
      if (d < (A.r + B.r) * 0.42 && A.age > 0.35 && B.age > 0.35) {
        const ma = A.r * A.r, mb = B.r * B.r, m = ma + mb;
        A.x = (A.x * ma + B.x * mb) / m; A.y = (A.y * ma + B.y * mb) / m;
        A.vx = (A.vx * ma + B.vx * mb) / m; A.vy = (A.vy * ma + B.vy * mb) / m;
        A.r = Math.sqrt(m); A.jig = 1; beads.splice(j, 1);
      }
    }
    // split: a fast stroke through a bead tears it in two, flung apart across the stroke
    if (sp > 0.7) for (let i = beads.length - 1; i >= 0; i--) {
      const b = beads[i];
      if (beads.length >= MAX || b.r < 0.03 || b.age < 0.25 || Math.hypot(b.x - sx, b.y - sy) > b.r * 0.9 + 0.012) continue;
      const f = 0.35 + Math.random() * 0.3, r1 = b.r * Math.sqrt(f), r2 = b.r * Math.sqrt(1 - f);
      const nx = -svy / sp, ny = svx / sp, kick = 0.35 + Math.random() * 0.25;
      beads.splice(i, 1,
        bead(b.x + nx * r1 * 0.9, b.y + ny * r1 * 0.9, r1, b.vx + nx * kick + svx * 0.15, b.vy + ny * kick + svy * 0.15),
        bead(b.x - nx * r2 * 0.9, b.y - ny * r2 * 0.9, r2, b.vx - nx * kick + svx * 0.15, b.vy - ny * kick + svy * 0.15));
    }
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    step(dt / 2, t); step(dt / 2, t);
    if (now - lastMove > 120) { pvx *= 0.8; pvy *= 0.8; }
    beads.forEach((b, i) => {
      const r = b.r * (1 + 0.07 * b.jig * Math.sin(b.age * 26));
      Bf.set([b.x, b.y, r, 0], i * 4); Vf.set([b.vx, b.vy], i * 2);
    });
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1i(uN, beads.length);
    gl.uniform4fv(uB, Bf); gl.uniform2fv(uV, Vf);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
