// Liquid metal: a pool of molten chrome. A blob pulls itself up out of the surface (a smooth union, so a neck
// forms and thins), hangs there wobbling, then drops back and sends rings across the pool. Every pixel is
// raymarched and reflected twice, so the blob mirrors the pool and the pool mirrors the blob.
const PARAMS = { cycle: 5.5, ripple: 1, smooth: 0.45 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, BY, BR, TI, TR, RA, K;
  float smin(float a, float b, float k) { float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
  float rings(vec2 q, float t0, float amp) {                     // a ring wave from the centre, starting at t0
    float age = T - t0, r = length(q), front = age * 1.7;
    if (age < 0.) return 0.;
    return amp * exp(-age * 1.1) * sin(r * 11. - age * 13.) * smoothstep(front, front - .9, r) * exp(-r * .5);
  }
  float surf(vec3 p) {
    float h = .035 * sin(p.x * 1.9 + T * .7) * sin(p.z * 1.6 - T * .55) + .02 * sin(p.x * 4.3 - p.z * 3.1 + T * 1.3);
    h += rings(p.xz, TI, .1 * RA) + rings(p.xz, TR, .05 * RA);
    return (p.y - h) * .6;
  }
  float blob(vec3 p) {
    vec3 q = p - vec3(0, BY, 0);
    return length(q * vec3(1, 1. + .08 * sin(T * 5.), 1)) - BR - .045 * sin(q.x * 7. + T * 3.) * sin(q.y * 6. + T * 2.3) * sin(q.z * 7. - T * 2.);
  }
  float map(vec3 p) { return smin(surf(p), blob(p) * .75, K); }   // the wobble bends the field, so step a little shorter
  vec3 nrm(vec3 p) { vec2 e = vec2(.002, -.002); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
  float march(vec3 ro, vec3 rd, float far) { float t = 0.; for (int i = 0; i < 110; i++) { float d = map(ro + rd * t); if (d < .0012 * (1. + t)) return t; t += d; if (t > far) break; } return -1.; }
  vec3 env(vec3 d) {
    vec3 c = mix(vec3(.02, .022, .03), vec3(.13, .14, .17), smoothstep(-.1, .7, d.y));
    vec2 q = d.xz / max(d.y, .05);
    c += vec3(1.) * 2.6 * smoothstep(.06, .0, abs(q.x - .1) - .55) * smoothstep(.06, .0, abs(q.y + .2) - .16) * step(0., d.y);   // overhead softbox
    float az = atan(d.x, d.z);
    c += vec3(1., .55, .3) * 1.6 * smoothstep(.1, .02, abs(az - 1.9)) * smoothstep(-.05, .2, d.y) * smoothstep(.75, .3, d.y);  // warm strip
    c += vec3(.35, .6, 1.) * 1.4 * smoothstep(.1, .02, abs(az + 1.6)) * smoothstep(-.05, .2, d.y) * smoothstep(.75, .3, d.y);  // cool strip
    c += vec3(.9, .9, 1.) * .5 * exp(-pow(d.y * 18., 2.));                                                                      // horizon line
    c += vec3(1., .97, .92) * 1.3 * smoothstep(.07, .0, abs(d.y - .34) - .05);                                                  // a ring light all round the studio
    return c;
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv - .5) * vec2(R.x / R.y, 1.);
    float a = T * .12;
    vec3 ro = vec3(sin(a) * 4.3, 2.7, -cos(a) * 4.3), ta = vec3(0, .25, 0);
    vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r);
    vec3 rd = normalize(f * 1.6 + r * q.x + u * q.y);
    vec3 col = env(rd) * .35;
    float t = march(ro, rd, 30.);
    if (t > 0.) {
      vec3 p = ro + rd * t, n = nrm(p), rf = reflect(rd, n);
      float fr = .75 + .25 * pow(1. - max(0., dot(n, -rd)), 5.);
      vec3 refl = env(rf);
      float t2 = march(p + n * .02, rf, 12.);                       // second bounce: the metal mirrors itself
      if (t2 > 0.) { vec3 p2 = p + n * .02 + rf * t2, r2 = reflect(rf, nrm(p2)); refl = env(vec3(r2.x, abs(r2.y), r2.z)) * (r2.y < 0. ? .6 : .85); }   // rays heading down see the pool's mirror of the room
      else if (rf.y < 0.) refl = env(vec3(rf.x, -rf.y, rf.z)) * .6;
      col = refl * fr * vec3(.92, .95, 1.);
      col = mix(col, env(rd) * .35, smoothstep(9., 22., t));        // the pool fades into the dark studio
    }
    col = aces(col);
    col *= 1. - .3 * pow(length(uv - .5) * 1.3, 2.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'BY', 'BR', 'TI', 'TR', 'RA', 'K'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 1); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, C = PARAMS.cycle, k = Math.floor(t / C), c = (t % C) / C;
    // the cycle: rise (0–30%), hang and wobble (30–62%), fall (62–72%), rings spread (72–100%)
    let by;
    if (c < 0.3) by = -0.55 + 1.45 * ease(c / 0.3);
    else if (c < 0.62) by = 0.9 + 0.06 * Math.sin((c - 0.3) * C * 4);
    else if (c < 0.72) { const f = (c - 0.62) / 0.1; by = 0.9 - 1.6 * f * f; }
    else by = -0.7;
    const impact = k * C + C * (0.62 + 0.1 * Math.sqrt(0.9 / 1.6));   // when the falling blob meets the surface
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t);
    gl.uniform1f(U.BY, by); gl.uniform1f(U.BR, 0.48); gl.uniform1f(U.TI, t >= impact ? impact : impact - C);
    gl.uniform1f(U.TR, k * C + 0.15 * C); gl.uniform1f(U.RA, PARAMS.ripple); gl.uniform1f(U.K, PARAMS.smooth);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
