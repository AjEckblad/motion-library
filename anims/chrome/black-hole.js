// Black hole: each pixel's ray is stepped through space and bent toward the hole a little at every step (gravity
// pulls light by an amount that grows as 1/r²). Rays that come too close fall in and stay black; the rest curve round
// and pick up the stars behind, which is why the background swirls into an Einstein ring. A hot accretion disk lies in
// the plane; because rays bend, you also see its far side arching over the top. The side turning toward you is
// brighter and bluer (Doppler beaming), the receding side dimmer and redder.
const PARAMS = { spin: 1, tilt: 0.18 };

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
  uniform vec2 R; uniform float T, TILT, SPIN;
  float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float a = hash(vec3(i, 1)), b = hash(vec3(i + vec2(1, 0), 1)), c = hash(vec3(i + vec2(0, 1), 1)), d = hash(vec3(i + 1., 1)); return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
  vec3 stars(vec3 d) {                                                     // a starfield plus a faint band of galaxy
    vec3 c = vec3(0); vec3 g = d * 220.; vec3 id = floor(g); float h = hash(id);
    if (h > .985) { float s = (h - .985) / .015; c += vec3(.8 + .2 * s, .85, 1.) * s * smoothstep(.5, .0, length(fract(g) - .5)) * 2.5; }
    float band = exp(-pow(d.y * 3. + sin(d.x * 2.) * .3, 2.)) * (.5 + .5 * noise(d.xz * 9.));
    return c + vec3(.35, .3, .45) * band * .25;
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    float ct = cos(TILT), st = sin(TILT);
    vec3 ro = vec3(0, st * 9., -ct * 9.);                                 // camera a little above the disk plane
    vec3 f = normalize(-ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r);
    vec3 rd = normalize(f * 1.7 + r * q.x + u * q.y), p = ro;
    vec3 col = vec3(0); float alpha = 1.; bool fell = false;
    const float RS = 1.;                                                  // event horizon radius
    for (int i = 0; i < 260; i++) {
      float rr = length(p);
      if (rr < RS) { fell = true; break; }
      float dt = clamp(rr * .05, .02, .4);
      vec3 np = p + rd * dt;
      // crossing the disk plane between 2.2 and 7 radii: add its light, tinted by speed toward the camera
      if (p.y * np.y < 0.) {
        vec3 c = mix(p, np, p.y / (p.y - np.y)); float d = length(c.xz);
        if (d > 2.2 && d < 7.) {
          float ang = atan(c.z, c.x) + T * SPIN * 1.2 / d;                  // inner rings turn faster
          float lanes = .55 + .45 * noise(vec2(ang * 3., d * 2.5)) * (.6 + .4 * sin(d * 9. + ang * 2.));
          vec3 vel = normalize(vec3(-c.z, 0, c.x));                        // orbital direction
          float dop = 1. + .75 * dot(vel, -rd);                             // beaming: brighter toward us
          float heat = smoothstep(7., 2.2, d);
          vec3 tint = mix(vec3(1., .35, .1), vec3(1., .85, .65), heat) * mix(vec3(1., .7, .5), vec3(.75, .85, 1.2), clamp(dop - .6, 0., 1.));
          float a = lanes * smoothstep(2.2, 2.6, d) * smoothstep(7., 5.5, d);
          col += alpha * tint * a * dop * dop * (1.2 + 2.2 * heat);
          alpha *= 1. - a * .85;
        }
      }
      rd = normalize(rd - p / (rr * rr * rr) * RS * 1.5 * dt);           // bend toward the hole
      p = np;
      if (rr > 30.) break;
    }
    if (!fell) col += alpha * stars(rd);
    col = aces(col * .9);
    col *= 1. - .3 * pow(length(uv - .5) * 1.3, 2.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'TILT', 'SPIN'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(1, Math.sqrt(320000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.TILT, PARAMS.tilt + Math.sin(t * 0.1) * 0.03); gl.uniform1f(U.SPIN, PARAMS.spin);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
