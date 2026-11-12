// Glass prism: a raymarched triangular prism in a striped studio. Rays refract in, travel through the glass,
// bounce off a face if they hit it too steeply (total internal reflection), and refract out. Red, green and
// blue each use a slightly different index of refraction, so every edge behind the glass splits into a rainbow.
const PARAMS = { dispersion: 1, ior: 1.5, spin: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T, A, DS, IOR;
  mat3 rot;
  float prism(vec3 p) {
    p = rot * p;
    vec3 q = abs(p);
    return max(q.z - .95, max(q.x * .866025 + p.y * .5, -p.y) - .42) - .02;   // equilateral cross-section, softened edges
  }
  vec3 nrm(vec3 p) { vec2 k = vec2(.001, -.001); return normalize(k.xyy * prism(p + k.xyy) + k.yyx * prism(p + k.yyx) + k.yxy * prism(p + k.yxy) + k.xxx * prism(p + k.xxx)); }
  vec3 spectrum(float x) { return clamp(vec3(abs(x * 6. - 3.) - 1., 2. - abs(x * 6. - 2.), 2. - abs(x * 6. - 4.)), 0., 1.); }
  // the studio: a floor with the prism's rainbow cast across it, and a backdrop of bold stripes and a softbox
  vec3 env(vec3 ro, vec3 d) {
    if (d.y < 0.) {
      vec3 p = ro + d * ((-1.05 - ro.y) / d.y);
      vec3 c = vec3(.2, .2, .23) * (1. - smoothstep(4., 14., length(p.xz)) * .6);
      vec2 dir = vec2(cos(A * 1.4 + .6), sin(A * 1.4 + .6)), rel = p.xz;
      float along = dot(rel, dir), across = dot(rel, vec2(-dir.y, dir.x));
      float fan = across / max(along, .01) * 2.2;                                      // a fan of colour spreading away from the prism
      float band = smoothstep(.0, .25, along - .6) * smoothstep(3.6, 2., along) * step(0., fan) * step(fan, 1.);
      c += spectrum(fan) * band * 1.1;
      c *= .6 + .4 * smoothstep(.2, 1.4, length(p.xz - vec2(.1, .25)));              // soft contact shadow
      return c;
    }
    float az = atan(d.x, d.z);
    float stripes = smoothstep(.45, .55, abs(fract(az * 3.2 + .25) - .5) * 2.);
    vec3 c = mix(vec3(.03, .03, .045), vec3(.85, .85, .88), stripes) * smoothstep(.95, .1, d.y) * smoothstep(-.02, .12, d.y);
    c += vec3(1.) * 3. * smoothstep(.08, .02, abs(az + .55)) * smoothstep(.2, .3, d.y) * smoothstep(.8, .6, d.y);   // tall softbox
    return c + vec3(.08, .08, .1) * d.y;
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv - .5) * vec2(R.x / R.y, 1.);
    float ca = cos(A), sa = sin(A), cb = cos(.42), sb = sin(.42);
    rot = mat3(1, 0, 0, 0, cb, -sb, 0, sb, cb) * mat3(ca, 0, sa, 0, 1, 0, -sa, 0, ca);
    vec3 ro = vec3(0, .9, -5.6), f = normalize(vec3(0, -.15, 0) - ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r);
    vec3 rd = normalize(f * 1.75 + r * q.x + u * q.y);
    float t = 0.; bool hit = false;
    for (int i = 0; i < 90; i++) { float d = prism(ro + rd * t); if (d < .0008) { hit = true; break; } t += d; if (t > 12.) break; }
    vec3 col;
    if (!hit) col = env(ro, rd);
    else {
      vec3 p = ro + rd * t, n = nrm(p);
      float fr = .04 + .96 * pow(1. - max(0., dot(n, -rd)), 5.);
      vec3 refr = vec3(0);
      for (int c = 0; c < 3; c++) {
        float ior = IOR + (float(c) - 1.) * .035 * DS;
        vec3 d = refract(rd, n, 1. / ior), pp = p - n * .004;
        for (int b = 0; b < 3; b++) {                                    // up to two bounces inside the glass
          float s = 0.;
          for (int i = 0; i < 40; i++) { float dd = -prism(pp + d * s); if (dd < .0008) break; s += max(dd, .002); }
          pp += d * s; vec3 n2 = nrm(pp);
          vec3 out_ = refract(d, -n2, ior);
          if (dot(out_, out_) > 0. || b == 2) { d = dot(out_, out_) > 0. ? out_ : reflect(d, -n2); pp += n2 * .006; break; }
          d = reflect(d, -n2); pp -= n2 * .004;                         // total internal reflection
        }
        refr[c] = env(pp, d)[c];
      }
      refr *= vec3(.94, .97, 1.);
      col = mix(refr, env(p, reflect(rd, n)), fr);
      col += pow(1. - abs(dot(n, rd)), 12.) * .4;                       // bright rim where the faces turn edge-on
    }
    col = aces(col * .95);
    col *= 1. - .25 * pow(length(uv - .5) * 1.3, 2.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'A', 'DS', 'IOR'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 1.25); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, ang = 0.6, last = performance.now(); const t0 = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; ang += dt * 0.35 * PARAMS.spin;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, (now - t0) / 1000); gl.uniform1f(U.A, ang);
    gl.uniform1f(U.DS, PARAMS.dispersion); gl.uniform1f(U.IOR, PARAMS.ior);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
