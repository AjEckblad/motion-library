// Shatter & rewind: a pane of glass takes a hit, cracks into shards and bursts apart, the burst slows to a stop in
// mid-air as if time were running out, then time runs backwards and the pane puts itself back together. The cracks are a Voronoi diagram: seed points scattered densely near the impact and
// sparsely far from it, each owning the part of the pane closest to it; every cell is cut out by clipping the pane
// against the halfway line to each other seed. Each shard then follows a ballistic path with its own spin, which is
// easy to run in reverse. The glass bends the scene behind it, a little differently for red, green and blue.
const PARAMS = { shards: 90, force: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const PW = 1.7, PH = 1.1;                                       // half-size of the pane
  let shards = [];
  // the Voronoi cell of each seed: the pane, clipped by the halfway line to every other seed
  function fracture() {
    const n = Math.max(12, Math.round(PARAMS.shards)), ix = (Math.random() - 0.5) * PW, iy = (Math.random() - 0.5) * PH * 0.8, seeds = [];
    for (let i = 0; i < n; i++) { const r = Math.pow(Math.random(), 1.8) * 2.6, a = Math.random() * 6.283; seeds.push([ix + Math.cos(a) * r, iy + Math.sin(a) * r * 0.8]); }
    shards = [];
    for (let i = 0; i < n; i++) {
      let poly = [[-PW, -PH], [PW, -PH], [PW, PH], [-PW, PH]]; const [sx, sy] = seeds[i];
      for (let j = 0; j < n && poly.length; j++) {
        if (j === i) continue; const [tx, ty] = seeds[j], nx = tx - sx, ny = ty - sy, mx = (sx + tx) / 2, my = (sy + ty) / 2;
        const side = p => (p[0] - mx) * nx + (p[1] - my) * ny, out = [];
        for (let k = 0; k < poly.length; k++) {
          const a = poly[k], b = poly[(k + 1) % poly.length], da = side(a), db = side(b);
          if (da <= 0) out.push(a);
          if (da * db < 0) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
        }
        poly = out;
      }
      if (poly.length < 3) continue;
      const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
      const dx = cx - ix, dy = cy - iy, d = Math.hypot(dx, dy) + 0.05, kick = PARAMS.force * (1.4 / (0.4 + d));
      const ax = Math.random() - 0.5, ay = Math.random() - 0.5, az = Math.random() - 0.5, al = Math.hypot(ax, ay, az);
      shards.push({ poly: poly.map(([x, y]) => [x - cx, y - cy]), cx, cy, v: [dx / d * kick * 0.9, dy / d * kick * 0.9 + 0.6, -(1.2 + Math.random() * 1.6) * kick], axis: [ax / al, ay / al, az / al], spin: (Math.random() * 6 + 2) * Math.min(2, kick) });
    }
    return [ix, iy];
  }
  let impact = fracture();

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const SCENE = `
  vec3 scene(vec2 s) {                                           // what is behind the glass: a sunset, a sun, bold bands and discs
    vec3 c = mix(vec3(.98, .55, .32), vec3(.25, .18, .5), smoothstep(-.6, .9, s.y));
    c = mix(c, vec3(1., .9, .6), smoothstep(.36, .33, length(s - vec2(.35, .05))));
    c *= .85 + .15 * step(.5, fract(s.y * 7.));
    c = mix(c, vec3(.1, .08, .2), smoothstep(-.4, -.42, s.y + .08 * sin(s.x * 3.)));
    c = mix(c, vec3(.2, .7, .75), smoothstep(.2, .18, length(s - vec2(-.75, .35))));
    return c;
  }`;
  const bgP = prog(`#version 300 es
  layout(location = 0) in vec2 p; out vec2 v; void main() { v = p; gl_Position = vec4(p, .9999, 1); }`, `#version 300 es
  precision highp float; in vec2 v; out vec4 o; uniform float A; ${SCENE} void main() { o = vec4(scene(v * vec2(A, 1.)), 1); }`);
  const glassP = prog(`#version 300 es
  layout(location = 0) in vec2 P; uniform mat3 RT; uniform vec3 C; uniform float A, F; out vec3 n; out vec3 w; out vec2 sp;
  void main() {
    vec3 p = RT * vec3(P, 0.) + C; n = RT * vec3(0, 0, 1); w = p;
    vec3 c = p - vec3(0, 0, 4.); gl_Position = vec4(c.x * F / (-c.z * A), c.y * F / -c.z, 0, 1); sp = gl_Position.xy;
  }`, `#version 300 es
  precision highp float; in vec3 n; in vec3 w; in vec2 sp; out vec4 o; uniform float A, EDGE; ${SCENE}
  void main() {
    vec3 N = normalize(n); if (N.z < 0.) N = -N;
    vec3 V = normalize(vec3(0, 0, 4.) - w);
    vec2 off = N.xy * .22;                                        // tilted glass shifts what you see through it, per colour
    vec2 s = sp * vec2(A, 1.);
    vec3 c = vec3(scene(s + off * 1.06).r, scene(s + off).g, scene(s + off * .94).b) * vec3(.88, .96, .94);   // a faint green, as real glass has
    float fr = .05 + .95 * pow(1. - max(dot(N, V), 0.), 5.);
    vec3 refl = mix(vec3(.15, .16, .2), vec3(1.), smoothstep(.2, .9, reflect(-V, N).y * .5 + .5));
    c = mix(c, refl, .1 + fr * .85) + EDGE;
    // streaks of a window's reflection, running diagonally; they slide across a shard as it tilts
    float k = dot(w.xy, vec2(.55, .83)) - .35 * N.x + .2 * N.y;
    c += vec3(1., 1., .98) * (smoothstep(.1, 0., abs(k - .25)) * .2 + smoothstep(.035, 0., abs(k + .22)) * .14);
    o = vec4(c, 1);
  }`);
  const edgeP = prog(`#version 300 es
  layout(location = 0) in vec2 P; uniform mat3 RT; uniform vec3 C; uniform float A, F;
  void main() { vec3 c = RT * vec3(P, 0.) + C - vec3(0, 0, 4.); gl_Position = vec4(c.x * F / (-c.z * A), c.y * F / -c.z, -.001, 1); }`, `#version 300 es
  precision mediump float; out vec4 o; uniform float K; void main() { o = vec4(vec3(.75, 1., .9) * K, 1); }`);
  const qv = gl.createVertexArray(); gl.bindVertexArray(qv); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const sv = gl.createVertexArray(); gl.bindVertexArray(sv); const sb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);

  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const rotm = (ax, a) => { const [x, y, z] = ax, c = Math.cos(a), s = Math.sin(a), k = 1 - c; return new Float32Array([c + x * x * k, y * x * k + z * s, z * x * k - y * s, x * y * k - z * s, c + y * y * k, z * y * k + x * s, x * z * k + y * s, y * z * k - x * s, c + z * z * k]); };
  let raf, last = performance.now(), t = 0, cycle = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * PARAMS.speed;
    // whole (1.4 s); the hit, and the burst slowing to a stop (1.2 s); the shards hang, barely drifting (0.5 s); time
    // runs backwards and they fly home, settling softly into place (1.7 s); whole again (1.6 s)
    const L = 6.4, c = t % L, TM = 0.6;
    if (Math.floor(t / L) !== cycle) { cycle = Math.floor(t / L); impact = fracture(); }
    let tt = 0;
    if (c >= 1.4 && c < 2.6) tt = TM * (1 - (1 - (c - 1.4) / 1.2) ** 3);
    else if (c >= 2.6 && c < 3.1) tt = TM + 0.03 * (c - 2.6);
    else if (c >= 3.1 && c < 4.8) { const u = (c - 3.1) / 1.7; tt = (TM + 0.015) * (1 - u * u * (3 - 2 * u)); }
    const cracks = c > 1.25 && c < 1.4 ? 1 : 0;
    const A = W / H, F = 2.6;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(bgP.p); gl.uniform1f(bgP.u.A, A); gl.bindVertexArray(qv); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(sv);
    for (const s of shards) {
      const T = tt, pos = [s.cx + s.v[0] * T, s.cy + s.v[1] * T - 2.4 * T * T, s.v[2] * T], R = rotm(s.axis, s.spin * T);
      const fan = []; s.poly.forEach(p => fan.push(p[0], p[1]));
      gl.bindBuffer(gl.ARRAY_BUFFER, sb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fan), gl.STREAM_DRAW);
      gl.useProgram(glassP.p); gl.uniformMatrix3fv(glassP.u.RT, false, R); gl.uniform3f(glassP.u.C, ...pos); gl.uniform1f(glassP.u.A, A); gl.uniform1f(glassP.u.F, F); gl.uniform1f(glassP.u.EDGE, 0);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, s.poly.length);
      // the edges: bright where the glass is cut (always, once broken; a flash of cracks just before it goes)
      if (T > 0 || cracks) { gl.useProgram(edgeP.p); gl.uniformMatrix3fv(edgeP.u.RT, false, R); gl.uniform3f(edgeP.u.C, ...pos); gl.uniform1f(edgeP.u.A, A); gl.uniform1f(edgeP.u.F, F); gl.uniform1f(edgeP.u.K, cracks ? 1.4 : 1.05); gl.drawArrays(gl.LINE_LOOP, 0, s.poly.length); }
    }
    // the whole pane's rim catches the light, the way the edge of real glass does
    if (tt === 0 && !cracks) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-PW, -PH, PW, -PH, PW, PH, -PW, PH]), gl.STREAM_DRAW);
      gl.useProgram(edgeP.p); gl.uniformMatrix3fv(edgeP.u.RT, false, [1, 0, 0, 0, 1, 0, 0, 0, 1]); gl.uniform3f(edgeP.u.C, 0, 0, 0); gl.uniform1f(edgeP.u.A, A); gl.uniform1f(edgeP.u.F, F); gl.uniform1f(edgeP.u.K, 0.85);
      gl.drawArrays(gl.LINE_LOOP, 0, 4);
    }
    gl.bindVertexArray(null); gl.disable(gl.DEPTH_TEST);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
