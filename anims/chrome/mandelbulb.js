// Mandelbulb: the 3D cousin of the Mandelbrot set. Each point is raised to a power in spherical coordinates
// (radius to the n, both angles times n) and added back, over and over; the distance estimate from that orbit
// lets a ray step safely toward the surface. The power drifts slowly, so the bulb breathes and rearranges.
const PARAMS = { power: 8, drift: 1, detail: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T, PW, EPS;
  vec4 trap;
  float de(vec3 p) {
    vec3 z = p; float dr = 1., r = 0.; trap = vec4(abs(z), dot(z, z));
    for (int i = 0; i < 9; i++) {
      r = length(z); if (r > 2.) break;
      float th = acos(clamp(z.y / r, -1., 1.)) * PW, ph = atan(z.z, z.x) * PW;
      dr = pow(r, PW - 1.) * PW * dr + 1.;
      z = pow(r, PW) * vec3(sin(th) * cos(ph), cos(th), sin(th) * sin(ph)) + p;
      trap = min(trap, vec4(abs(z), dot(z, z)));                   // orbit trap: how close the orbit came to the axes and origin
    }
    return .5 * log(r) * r / dr;
  }
  vec3 nrm(vec3 p, float e) { vec2 k = vec2(e, -e); return normalize(k.xyy * de(p + k.xyy) + k.yyx * de(p + k.yyx) + k.yxy * de(p + k.yxy) + k.xxx * de(p + k.xxx)); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv - .5) * vec2(R.x / R.y, 1.);
    float a = T * .15;
    vec3 ro = vec3(sin(a) * 4.4, 1.1 * sin(T * .07) + .6, cos(a) * 4.4), f = normalize(-ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r);
    vec3 rd = normalize(f * 1.55 + r * q.x + u * q.y);
    vec3 bg = mix(vec3(.02, .02, .035), vec3(.09, .06, .1), uv.y) + vec3(.12, .07, .04) * exp(-length(q) * 2.2);
    vec3 col = bg;
    // only march inside the bounding sphere
    float b = dot(ro, rd), c = dot(ro, ro) - 1.44, h = b * b - c;
    float glow = 0.;
    if (h > 0.) {
      float t = max(0., -b - sqrt(h)), tEnd = -b + sqrt(h), steps = 0.; bool hit = false;
      for (int i = 0; i < 140; i++) {
        float d = de(ro + rd * t);
        glow += exp(-d * 30.) * .012;
        if (d < EPS * t) { hit = true; break; }
        t += d; steps += 1.; if (t > tEnd) break;
      }
      if (hit) {
        vec3 p = ro + rd * t, n = nrm(p, EPS * t * .5);
        float ao = clamp(1. - steps / 90., 0., 1.);                // more steps to arrive = deeper in a crevice
        vec3 base = mix(vec3(.95, .55, .22), vec3(.2, .55, .65), clamp(trap.y * 1.3, 0., 1.));
        base = mix(base, vec3(.95, .9, .8), clamp(1. - trap.w * 1.5, 0., 1.) * .6);
        vec3 L = normalize(vec3(.6, .8, -.4));
        float dif = max(0., dot(n, L)), sp = pow(max(0., dot(reflect(rd, n), L)), 24.), rim = pow(1. - max(0., dot(n, -rd)), 3.);
        col = base * (.12 + dif * 1.1) * (.35 + .65 * ao) + sp * .5 * ao + rim * vec3(.5, .35, .7) * .4 * ao;
      }
    }
    col += vec3(.9, .5, .3) * glow * .35;                               // halo from near misses
    col = aces(col * 1.1);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'R'), uT = gl.getUniformLocation(prog, 'T'), uP = gl.getUniformLocation(prog, 'PW'), uE = gl.getUniformLocation(prog, 'EPS');
  const resize = () => { const d = Math.min(devicePixelRatio, 1); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, t);
    gl.uniform1f(uP, PARAMS.power + Math.sin(t * 0.25) * 1.5 * PARAMS.drift);
    gl.uniform1f(uE, 0.0016 / PARAMS.detail);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
