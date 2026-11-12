// Gyroid fly-through: the gyroid, sin x cos y + sin y cos z + sin z cos x = 0, is a surface that splits space into
// two interwoven labyrinths. Thickened into a sheet, it makes endless organic walls. A tube is carved along the camera's
// winding path so the flight never hits a wall. The walls are glossy and lit by a headlight and two coloured fills, the
// colour shifts with depth, and fog swallows the distance.
const PARAMS = { speed: 1, scale: 1 };

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
  uniform vec2 R; uniform float T, Z, K;
  vec2 path(float z) { return vec2(sin(z * .31) * 1.4 + sin(z * .13) * 1.1, cos(z * .23) * 1.2); }
  float gyroid(vec3 p) { return dot(sin(p), cos(p.yzx)); }
  float map(vec3 p) {
    float s = 1.6 * K;
    float g = abs(gyroid(p * s)) / s - .12 / K;                           // a thickened sheet
    g = max(g, .55 - length(p.xy - path(p.z)));                            // carve the flight tube
    return g * .7;                                                         // the gyroid isn't an exact distance: step carefully
  }
  vec3 nrm(vec3 p) { vec2 e = vec2(.002, -.002); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(path(Z), Z), ta = vec3(path(Z + 1.5), Z + 1.5);
    vec3 f = normalize(ta - ro), r = normalize(cross(f, vec3(sin(Z * .1) * .3, 1, 0))), u = cross(r, f);
    vec3 rd = normalize(f * 1.3 + r * q.x + u * q.y);
    float t = 0.; bool hit = false;
    for (int i = 0; i < 140; i++) { float d = map(ro + rd * t); if (d < .001 * (1. + t)) { hit = true; break; } t += d; if (t > 14.) break; }
    vec3 fog = mix(vec3(.008, .01, .02), vec3(.03, .015, .045), uv.y);    // a dark cave: only the headlight reaches the walls
    vec3 col = fog;
    if (hit) {
      vec3 p = ro + rd * t, n = nrm(p);
      float head = max(dot(n, -rd), 0.);
      vec3 base = .5 + .5 * cos(6.28 * (p.z * .045 + vec3(0, .33, .67)) + 1.);   // hue drifts along the tunnel
      base = pow(base, vec3(1.5));                                           // deeper, more saturated walls on black
      float ao = clamp(map(p + n * .15) / .15, 0., 1.);
      float fall = 1.3 / (1. + t * t * .45);                                 // headlight falls off with distance
      vec3 l1 = normalize(vec3(1, 1, -.5)), l2 = normalize(vec3(-1, -.4, .3));
      float rim = pow(1. - head, 3.);                                        // grazing edges catch the coloured fills: rim light
      col = base * (.02 + .95 * head * head) * (.4 + .6 * ao) * fall;
      col += (vec3(1., .5, .25) * max(dot(n, l1), 0.) + vec3(.2, .5, 1.) * max(dot(n, l2), 0.)) * (.08 + .9 * rim) * .5 * ao;
      col += pow(max(dot(reflect(rd, n), -rd), 0.), 30.) * .8 * fall;        // the headlight's glint
      col = mix(col, fog, 1. - exp(-t * t * .045));
    }
    col = aces(col * 1.2);
    col *= 1. - .35 * pow(length(uv - .5) * 1.3, 2.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'Z', 'K'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(1, Math.sqrt(340000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), z = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    z += dt * 1.1 * PARAMS.speed;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, now / 1000); gl.uniform1f(U.Z, z); gl.uniform1f(U.K, PARAMS.scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
