// Latte art: milk is poured into an espresso and drawn into a rosetta. The cup's surface is a 2D fluid simulation on
// the GPU (stable fluids: carry the flow along itself, then make it incompressible). The pour is a source: where the
// stream lands the surface flows outward, so the pressure solve is asked for exactly that much spreading, and a ring
// by the wall takes it back down. Poured from high, the milk dives under the crema and only lightens it; brought
// close, the foam stays on top. Where the stream lands it punches through the foam and brings up the darker coffee
// from below, leaving a thin brown trail; wiggling it while drawing it back lays that trail in a zigzag that the
// spreading pushes outward into nested leaves, and a fast pull through the middle drags them into a fern. The foam is carried by the flow
// with a second-order (MacCormack) step, so its edges stay crisp instead of blurring away.
const PARAMS = { wiggle: 1, foam: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const VS = `#version 300 es
  layout(location = 0) in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const prog = fs => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  // the simulation lives in a square; the liquid is the disc of radius RC in it
  const HEAD = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  const float RC = .47;
  float inside(vec2 q) { return step(length(q - .5), RC); }`;
  // 1. carry the velocity along itself, let the stream drag the surface with it, and (at the end) a spoon's stir
  const advP = prog(`${HEAD} uniform sampler2D U; uniform float DT, DAMP, DRAG, SW, DW; uniform vec2 P, PV;
  void main() {
    vec2 w = texture(U, uv - texture(U, uv).xy * DT).xy * DAMP, d = uv - P;
    w += (PV - w) * min(1., DRAG * DT * 12.) * exp(-dot(d, d) / DW);
    vec2 r = uv - .5; w += SW * vec2(-r.y, r.x) * DT;
    o = vec4(w * inside(uv), 0, 1);
  }`);
  // 2. how much each cell's flow spreads, minus the spreading the pour asks for, plus the ring by the wall that takes it back
  const divP = prog(`${HEAD} uniform sampler2D U; uniform vec2 TX, P; uniform float Q, RA;
  void main() {
    float l = texture(U, uv - vec2(TX.x, 0)).x, r = texture(U, uv + vec2(TX.x, 0)).x, b = texture(U, uv - vec2(0, TX.y)).y, t = texture(U, uv + vec2(0, TX.y)).y;
    vec2 d = uv - P; float src = Q * exp(-dot(d, d) / .0009) / (3.14159 * .0009), ring = smoothstep(RC - .07, RC - .01, length(uv - .5));
    o = vec4(((r - l + t - b) * .5 / TX.x - src + Q * ring / RA) * inside(uv), 0, 0, 1);
  }`);
  // 3. the pressure that removes everything else (Jacobi; the wall reflects it, so nothing flows through)
  const P4 = `float c = texture(PR, uv).x; vec2 dx = vec2(TX.x, 0), dy = vec2(0, TX.y);
    float l = inside(uv - dx) > 0. ? texture(PR, uv - dx).x : c, r = inside(uv + dx) > 0. ? texture(PR, uv + dx).x : c;
    float b = inside(uv - dy) > 0. ? texture(PR, uv - dy).x : c, t = inside(uv + dy) > 0. ? texture(PR, uv + dy).x : c;`;
  const jacP = prog(`${HEAD} uniform sampler2D PR, DV; uniform vec2 TX; void main() { ${P4} o = vec4((l + r + b + t - TX.x * TX.x * texture(DV, uv).x) * .25, 0, 0, 1); }`);
  const subP = prog(`${HEAD} uniform sampler2D U, PR; uniform vec2 TX; void main() { ${P4} o = vec4((texture(U, uv).xy - .5 * vec2(r - l, t - b) / TX.x) * inside(uv), 0, 1); }`);
  // 4. the foam (r), the milk mixed into the crema (g) and the stream's dark trail (b): carried forward, carried back,
  // and the difference split
  const fwdP = prog(`${HEAD} uniform sampler2D U, D; uniform float DT; void main() { o = texture(D, uv - texture(U, uv).xy * DT); }`);
  const bwdP = prog(`${HEAD} uniform sampler2D U, A; uniform float DT; void main() { o = texture(A, uv + texture(U, uv).xy * DT); }`);
  const corP = prog(`${HEAD} uniform sampler2D U, D, A, B; uniform float DT, FR, MR, LR, FADE; uniform vec2 P, PP, TXD;
  void main() {
    vec2 q = uv - texture(U, uv).xy * DT, f = q / TXD - .5, i0 = (floor(f) + .5) * TXD;
    vec4 res = texture(A, uv) + .5 * (texture(D, uv) - texture(B, uv));
    vec4 s0 = texture(D, i0), s1 = texture(D, i0 + vec2(TXD.x, 0)), s2 = texture(D, i0 + vec2(0, TXD.y)), s3 = texture(D, i0 + TXD);
    res = clamp(res, min(min(s0, s1), min(s2, s3)), max(max(s0, s1), max(s2, s3)));   // never overshoot what was there
    vec2 d = uv - P;
    res.r += FR * DT * exp(-dot(d, d) / .0004);                    // foam, where the stream meets the surface
    vec2 sg = P - PP, e = uv - PP - sg * clamp(dot(uv - PP, sg) / max(dot(sg, sg), 1e-9), 0., 1.);
    res.b += LR * DT * exp(-dot(e, e) / .00002);                  // and the thin trail of darker coffee it brings up, along its whole path
    res.g += MR * DT * exp(-dot(d, d) / .006);                     // milk diving under the crema
    o = min(res, vec4(1.6, 1.1, 1.2, 1)) * FADE;
  }`);
  // 5. the table, the saucer, the cup and the coffee in it
  const renP = prog(`${HEAD} uniform sampler2D D; uniform vec2 R, PS; uniform float POUR, T;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + 11.7; a *= .5; } return s; }
  void main() {
    vec2 p = (uv * 2. - 1.) * vec2(R.x / R.y, 1.); p /= min(1., R.x / R.y / 1.15);   // keep the saucer in a narrow frame
    vec2 q = p - vec2(0, .02); float r = length(q); vec2 dir = q / max(r, 1e-4);
    // walnut, lit from a window at the upper left, with the saucer's soft shadow
    float g = fbm(vec2(p.x * 1.4, p.y * 13. + fbm(p * 2.5) * 3.));
    vec3 col = mix(vec3(.2, .11, .055), vec3(.45, .27, .14), g) * (.8 + .35 * smoothstep(1.4, -1.2, p.x * .7 - p.y));
    col *= 1. - .5 * smoothstep(1.1, .88, length(q - vec2(.07, -.09)));
    // the saucer: white china with a raised rim, shaded on the side away from the light, and the cup's shadow on it
    if (r < 1.) {
      float rim = smoothstep(.8, .96, r), lit = dot(dir, vec2(-.6, .8));
      vec3 sc = vec3(.92, .91, .89) * (1. - .22 * rim * smoothstep(-.2, -1., lit)) + .1 * rim * smoothstep(.3, 1., lit) * smoothstep(.985, .94, r);
      sc *= 1. - .3 * smoothstep(.84, .7, length(q - vec2(.05, -.065)));
      col = mix(col, sc, smoothstep(1., .99, r));
    }
    // the handle, to the right
    vec2 hq = q - vec2(.83, -.02); float hd = length(max(abs(hq) - vec2(.12, .04), 0.)) - .04;
    col = mix(col, vec3(.93, .92, .9) * (.82 + .18 * smoothstep(-.06, .05, hq.y)), smoothstep(.006, -.006, hd));
    // the cup: its rim from above, and a sliver of inner wall above the coffee, lit on the far side
    if (r < .74) {
      float lit = dot(dir, vec2(-.6, .8));
      vec3 cc = r > .69 ? vec3(.97, .96, .94) * (.92 + .08 * lit) : vec3(.9, .89, .87) * (.62 + .38 * smoothstep(.5, -.8, lit));
      col = mix(col, cc, smoothstep(.74, .733, r));
    }
    if (r < .655) {
      vec2 s = .5 + q * (RC / .655);
      vec4 d = texture(D, s); float F = d.r, M = clamp(d.g, 0., 1.), line = smoothstep(.15, .55, d.b);
      // crema: deeper toward the wall and mottled; lighter where milk has mixed in under it
      vec3 crema = mix(vec3(.33, .17, .07), vec3(.63, .38, .17), smoothstep(.65, .08, r)) * (.86 + .28 * fbm(q * 11. + 3.));
      crema = mix(crema, vec3(.8, .6, .4), M * .85);
      // foam: white, with the thin tan halo real microfoam has where it runs out
      float foam = smoothstep(.12, .3, F);
      vec3 lc = mix(crema, vec3(.97, .94, .89), foam);
      lc *= 1. - .22 * smoothstep(.03, .12, F) * (1. - foam);
      lc = mix(lc, mix(crema, vec3(.66, .42, .22), .35), line * foam * .95);   // the trail shows as brown lines through the white
      // the window, reflected in the surface and nudged by the foam's slight relief
      vec2 gF = vec2(texture(D, s + vec2(.003, 0)).r - texture(D, s - vec2(.003, 0)).r, texture(D, s + vec2(0, .003)).r - texture(D, s - vec2(0, .003)).r);
      vec2 hl = (q + gF * .06 - vec2(-.2, .26)) * vec2(1.7, 3.2);
      lc += .2 * exp(-dot(hl, hl) * 6.);
      lc *= 1. - .3 * smoothstep(.5, .655, r) * smoothstep(-.2, -1., dot(dir, vec2(-.6, .8)) );   // the wall shades the near edge
      col = mix(col, lc, smoothstep(.655, .648, r));
      // the stream of milk, and its little shadow
      if (POUR > 0.) {
        vec2 ps = (PS - .5) * (.655 / RC); float sd = length(q - ps);
        col *= 1. - .3 * POUR * smoothstep(.05, .02, length(q - ps - vec2(.02, -.03))) * step(.02, sd);
        col = mix(col, vec3(.99, .97, .93) + .04 * smoothstep(.02, .0, length(q - ps - vec2(-.006, .006))), smoothstep(.021, .015, sd) * POUR);
      }
    }
    o = vec4(col, 1);
  }`);

  // render targets: 16-bit float, filtered
  const target = (w, h) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f, w, h };
  };
  const pair = (w, h) => { let a = target(w, h), b = target(w, h); return { get r() { return a; }, get w() { return b; }, swap() { [a, b] = [b, a]; }, both: () => [a, b] }; };
  const N = 256, ND = 512, vel = pair(N, N), prs = pair(N, N), div = target(N, N), dye = pair(ND, ND), dA = target(ND, ND), dB = target(ND, ND);
  const reset = () => { for (const t of [...vel.both(), ...prs.both(), ...dye.both()]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } };
  reset();
  // the area of the ring by the wall, so what it takes back balances what the pour adds
  let RA = 0; for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x++) { const r = Math.hypot((x + 0.5) / 400 - 0.5, (y + 0.5) / 400 - 0.5); if (r < 0.47) { const k = Math.min(1, Math.max(0, (r - 0.4) / 0.06)); RA += k * k * (3 - 2 * k) / 160000; } }
  gl.bindVertexArray(gl.createVertexArray()); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const run = (pr, out, set) => {
    gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null); gl.viewport(0, 0, out ? out.w : W, out ? out.h : H);
    let unit = 0;
    set((name, v) => {
      const loc = pr.u[name]; if (loc == null) return;
      if (v && v.t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v.t); gl.uniform1i(loc, unit++); }
      else if (Array.isArray(v)) gl.uniform2f(loc, v[0], v[1]); else gl.uniform1f(loc, v);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // the pour, by phase: where the stream is, how it moves, how much it spreads, foams and mixes
  const pour = c => {
    const k = (a, b) => Math.min(1, Math.max(0, (c - a) / (b - a)));
    const s = { P: [0.5, 0.5], PV: [0, 0], Q: 0, FR: 0, MR: 0, LR: 0, DRAG: 0, DW: 0.0012, SW: 0, FADE: 1, POUR: 0 };
    if (c >= 1 && c < 3.6) {                                       // from high: the milk dives under the crema, in a slow circle
      const a = (c - 1) * 2.2; s.P = [0.5 + 0.05 * Math.cos(a), 0.52 + 0.05 * Math.sin(a)]; s.PV = [-0.11 * Math.sin(a), 0.11 * Math.cos(a)];
      s.Q = 0.012; s.MR = 0.9; s.DRAG = 0.3; s.POUR = 1;
    } else if (c >= 3.6 && c < 4.2) {                              // brought down close: the foam starts to show
      s.P = [0.5, 0.56]; s.Q = 0.03; s.FR = 5 * k(3.6, 4.2) * PARAMS.foam; s.MR = 0.4; s.DRAG = 0.3; s.POUR = 1;
    } else if (c >= 4.2 && c < 8.6) {                              // the wiggle, drifting back toward us
      const u = (c - 4.2) / 4.4, f = 2.6 * 2 * Math.PI, A = 0.1 * PARAMS.wiggle * (1 - 0.45 * u);
      s.P = [0.5 + A * Math.sin(f * (c - 4.2)), 0.56 - 0.32 * u]; s.PV = [A * f * Math.cos(f * (c - 4.2)), -0.32 / 4.4];
      s.Q = 0.066; s.FR = 5 * PARAMS.foam; s.LR = 8; s.DRAG = 0.15; s.DW = 0.0009; s.POUR = 1;
    } else if (c >= 8.6 && c < 9.4) {                              // a lift, then a fast pull through the middle
      const u = k(8.8, 9.4); s.P = [0.5, 0.24 + 0.5 * u * u * (3 - 2 * u)]; s.PV = [0, c > 8.8 ? 1.25 * (1 - Math.abs(2 * u - 1)) : 0];
      s.Q = c < 8.8 ? 0.02 : 0.004; s.FR = (c < 8.8 ? 3 : 1) * PARAMS.foam; s.LR = c < 8.8 ? 0 : 16; s.DRAG = 0.7; s.DW = 0.0003; s.POUR = c < 9.3 ? 1 : (9.4 - c) / 0.1;
    } else if (c >= 13.2) {                                        // a spoon stirs it away for the next cup
      s.SW = 1.8 * k(13.2, 14.2); s.FADE = 1 - 0.03 * k(13.6, 15);
    }
    return s;
  };

  let raf, last = performance.now(), t = 0, cycle = 0, prevP = [0.5, 0.5];
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000) * PARAMS.speed; last = now; t += dt;
    const L = 15, c = t % L;
    if (Math.floor(t / L) !== cycle) { cycle = Math.floor(t / L); reset(); }
    const s = pour(c), TX = [1 / N, 1 / N];
    run(advP, vel.w, u => { u('U', vel.r); u('DT', dt); u('DAMP', 0.995); u('DRAG', s.DRAG); u('DW', s.DW); u('SW', s.SW); u('P', s.P); u('PV', s.PV); }); vel.swap();
    run(divP, div, u => { u('U', vel.r); u('TX', TX); u('P', s.P); u('Q', s.Q); u('RA', RA); });
    for (let i = 0; i < 30; i++) { run(jacP, prs.w, u => { u('PR', prs.r); u('DV', div); u('TX', TX); }); prs.swap(); }
    run(subP, vel.w, u => { u('U', vel.r); u('PR', prs.r); u('TX', TX); }); vel.swap();
    run(fwdP, dA, u => { u('U', vel.r); u('D', dye.r); u('DT', dt); });
    run(bwdP, dB, u => { u('U', vel.r); u('A', dA); u('DT', dt); });
    run(corP, dye.w, u => { u('U', vel.r); u('D', dye.r); u('A', dA); u('B', dB); u('DT', dt); u('FR', s.FR); u('MR', s.MR); u('LR', s.LR); u('FADE', s.FADE); u('P', s.P); u('PP', prevP); u('TXD', [1 / ND, 1 / ND]); }); dye.swap(); prevP = s.P;
    run(renP, null, u => { u('D', dye.r); u('R', [W, H]); u('PS', s.P); u('POUR', s.POUR); u('T', t); });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
