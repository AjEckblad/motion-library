// Diamond: a round brilliant cut built from 49 flat facets (table, crown, girdle, pavilion), traced exactly as the
// intersection of 49 half-spaces. Light enters, then bounces inside: at each facet it either escapes or, past the
// critical angle, is totally reflected back in, which is what makes a diamond bright. Red, green and blue are traced
// separately with slightly different refractive indices (dispersion), so the escaping light splits into fire. Strip
// lights in a dark studio give it something to sparkle with as it turns.
const PARAMS = { ior: 2.42, fire: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  // the cut: each facet a plane n·p = d with n pointing out
  const planes = [], deg = Math.PI / 180;
  const add = (n, d) => { const l = Math.hypot(...n); planes.push(n[0] / l, n[1] / l, n[2] / l, d / l); };
  add([0, 1, 0], 0.4);                                                         // table
  const through = (n, p) => n[0] * p[0] + n[1] * p[1] + n[2] * p[2];
  for (let k = 0; k < 8; k++) {                                                // crown mains and upper girdle facets
    const f = k * Math.PI / 4, g = f + Math.PI / 8;
    let n = [Math.sin(34.5 * deg) * Math.cos(f), Math.cos(34.5 * deg), Math.sin(34.5 * deg) * Math.sin(f)]; add(n, through(n, [Math.cos(f), 0.04, Math.sin(f)]));
    n = [Math.sin(46 * deg) * Math.cos(g), Math.cos(46 * deg), Math.sin(46 * deg) * Math.sin(g)]; add(n, through(n, [Math.cos(g), 0.03, Math.sin(g)]));
  }
  for (let k = 0; k < 16; k++) { const f = k * Math.PI / 8; add([Math.cos(f), 0, Math.sin(f)], 1); }   // girdle
  for (let k = 0; k < 8; k++) {                                                // pavilion mains to the culet, lower girdle facets
    const f = k * Math.PI / 4 + Math.PI / 8, g = k * Math.PI / 4;
    let n = [Math.sin(40.8 * deg) * Math.cos(f), -Math.cos(40.8 * deg), Math.sin(40.8 * deg) * Math.sin(f)]; add(n, through(n, [0, -0.86, 0]));
    n = [Math.sin(43 * deg) * Math.cos(g), -Math.cos(43 * deg), Math.sin(43 * deg) * Math.sin(g)]; add(n, through(n, [Math.cos(g), -0.03, Math.sin(g)]));
  }
  const NP = planes.length / 4;
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, IOR, FIRE; uniform mat3 ROT; uniform vec4 PL[${NP}];
  vec3 env(vec3 d) {                                                     // a dark studio with strip lights and a ring light
    vec3 c = vec3(.012, .014, .02) + vec3(.05, .05, .06) * smoothstep(-.2, 1., d.y);
    float az = atan(d.z, d.x);
    for (int i = 0; i < 9; i++) { float a = float(i) * .698 + .3; c += vec3(4.5) * smoothstep(.06, .0, abs(sin((az - a) * .5))) * smoothstep(.0, .2, d.y) * smoothstep(.75, .45, d.y); }
    c += vec3(4., 3.6, 3.2) * smoothstep(.04, .0, abs(d.y - .9));          // ring light overhead
    c += vec3(.6, .7, 1.) * smoothstep(.15, .0, abs(d.y + .2)) * .4;
    return c;
  }
  // entering the convex cut from outside: x = t, and the facet hit in yzw
  vec4 enter(vec3 ro, vec3 rd) {
    float tn = -1e9, tf = 1e9; vec3 nn = vec3(0);
    for (int i = 0; i < ${NP}; i++) {
      vec3 n = PL[i].xyz; float den = dot(n, rd), dist = PL[i].w - dot(n, ro);
      if (abs(den) < 1e-6) { if (dist < 0.) return vec4(-1); continue; }
      float t = dist / den;
      if (den < 0.) { if (t > tn) { tn = t; nn = n; } } else tf = min(tf, t);
    }
    return tn < tf && tn > 0. ? vec4(tn, nn) : vec4(-1);
  }
  // leaving from inside: the first facet ahead
  vec4 leave(vec3 p, vec3 rd) {
    float tf = 1e9; vec3 nn = vec3(0, 1, 0);
    for (int i = 0; i < ${NP}; i++) { vec3 n = PL[i].xyz; float den = dot(n, rd); if (den > 1e-6) { float t = (PL[i].w - dot(n, p)) / den; if (t < tf) { tf = t; nn = n; } } }
    return vec4(tf, nn);
  }
  // one colour channel through the stone
  float trace(vec3 ro, vec3 rd, float ior, int ch) {
    vec4 h = enter(ro, rd); if (h.x < 0.) return -1.;
    vec3 n = h.yzw, p = ro + rd * h.x;
    float c = dot(-rd, n), F0 = pow((ior - 1.) / (ior + 1.), 2.), F = F0 + (1. - F0) * pow(1. - c, 5.);
    float acc = F * env(reflect(rd, n))[ch], thr = 1. - F;
    vec3 d = refract(rd, n, 1. / ior);
    for (int b = 0; b < 7; b++) {
      vec4 l = leave(p + d * 1e-4, d); p = p + d * (l.x + 1e-4); vec3 m = l.yzw;
      vec3 out_ = refract(d, -m, ior);
      if (dot(out_, out_) < .01) { d = reflect(d, -m); continue; }          // total internal reflection: stays inside
      float ci = dot(d, m), Fi = F0 + (1. - F0) * pow(1. - ci, 5.);
      acc += thr * (1. - Fi) * env(out_)[ch]; thr *= Fi; d = reflect(d, -m);
    }
    return acc;
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 eye = vec3(0, 1.6, -3.4), f = normalize(vec3(0, -.05, 0) - eye), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r);
    vec3 rd0 = normalize(f * 2.1 + r * q.x + u * q.y);
    vec3 ro = ROT * eye, rd = ROT * rd0;                                    // turn the world, not the stone
    vec3 bg = mix(vec3(.02, .022, .03), vec3(.07, .07, .09), uv.y);
    float sp = .025 * FIRE;
    float rr = trace(ro, rd, IOR - sp, 0);
    vec3 col;
    if (rr < 0.) col = bg + vec3(.04) * smoothstep(.9, .0, length(q - vec2(0, -.55)) * vec2(1, 3).x);
    else col = vec3(rr, trace(ro, rd, IOR, 1), trace(ro, rd, IOR + sp, 2));
    col = aces(col * 1.5);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'IOR', 'FIRE', 'ROT', 'PL'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.uniform4fv(U.PL, new Float32Array(planes));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(1, Math.sqrt(380000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, a = t * 0.35, b = Math.sin(t * 0.4) * 0.18;   // turn, with a gentle rock
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.IOR, PARAMS.ior); gl.uniform1f(U.FIRE, PARAMS.fire);
    gl.uniformMatrix3fv(U.ROT, false, new Float32Array([ca, sb * sa, -cb * sa, 0, cb, sb, sa, -sb * ca, cb * ca]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
