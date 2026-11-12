// Volumetric clouds: the sky is filled with a density field (layers of 3D noise, shaped into a slab and eroded at the
// edges). Each pixel's ray walks through it, adding light and losing transparency as it goes (Beer's law). At each
// step a short second march toward the sun measures how much cloud is in the way, which gives the dark bellies and
// bright tops; a forward-scattering term makes edges glow when you look toward the sun. The wind slides it all along.
const PARAMS = { cover: 0.5, wind: 1 };

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
  uniform vec2 R; uniform float T, COV, WIND;
  float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + 1.), f.x), f.y), f.z); }
  float density(vec3 p) {
    vec3 q = p + vec3(T * .6 * WIND, 0, T * .25 * WIND);
    float f = .5 * noise(q * .3) + .25 * noise(q * .62) + .125 * noise(q * 1.27) + .0625 * noise(q * 2.6) + .03 * noise(q * 5.3);
    float slab = smoothstep(0., 1.2, p.y) * smoothstep(5., 2.8, p.y);       // clouds live in a layer
    return clamp((f - (.64 - COV * .2)) * 4.5 * slab, 0., 1.);          // above the threshold: cloud; below: clear sky
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(0, -1.2, 0), rd = normalize(vec3(q.x, q.y * .75 + .78, 1.4));   // looking up into the layer
    vec3 sd = normalize(vec3(.55, .32, .8));
    float sun = max(dot(rd, sd), 0.);
    vec3 sky = mix(vec3(.42, .6, .86), vec3(.06, .2, .55), clamp(rd.y * 1.2, 0., 1.)) + vec3(1., .85, .6) * (pow(sun, 600.) * 6. + pow(sun, 8.) * .25);
    // march from where the ray enters the layer
    float t0 = max(0., (0. - ro.y) / rd.y), t1 = (5. - ro.y) / max(rd.y, .03);
    float t = t0 + .12 * fract(sin(dot(uv * R, vec2(12.9, 78.2))) * 43758.5), trans = 1.; vec3 light = vec3(0);
    float hg = .75 * (1. + .8 * pow(sun, 6.)) + .5 * pow(sun, 30.);         // brighter toward the sun: forward scattering
    for (int i = 0; i < 64; i++) {
      if (t > t1 || trans < .02) break;
      vec3 p = ro + rd * t; float d = density(p);
      if (d > .01) {
        float sh = 0.; for (int j = 1; j <= 5; j++) sh += density(p + sd * float(j) * .35);   // cloud toward the sun
        vec3 lit = vec3(1., .95, .88) * exp(-sh * 1.6) * hg * 1.5 + vec3(.22, .3, .45) * (.3 + .7 * smoothstep(.0, 4., p.y));
        float a = 1. - exp(-d * .9 * .25 / .25);
        light += trans * a * lit; trans *= 1. - a;
      }
      t += .12 + t * .02;
    }
    vec3 col = sky * trans + light;
    col = mix(col, sky, 1. - exp(-max(t0, 0.) * .02));
    col = aces(col * 1.05);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'COV', 'WIND'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(0.6, Math.sqrt(190000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, (now - t0) / 1000); gl.uniform1f(U.COV, PARAMS.cover); gl.uniform1f(U.WIND, PARAMS.wind);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
