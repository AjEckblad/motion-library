// Lava lamp: metaballs. Every blob adds a field that falls off with distance; where the sum passes a threshold
// the pixel is lava. Because fields add up, nearby blobs bulge toward each other and merge smoothly.
const PARAMS = { blobs: 8, speed: 0.5 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const MAX = 14;
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec3 B[${MAX}]; uniform int N; uniform vec2 R;
  void main() {
    vec2 q = uv * vec2(R.x / R.y, 1.);
    float f = 0.;
    for (int i = 0; i < ${MAX}; i++) { if (i >= N) break; vec2 d = q - B[i].xy; f += B[i].z * B[i].z / (dot(d, d) + 1e-4); }
    vec3 bg = mix(vec3(.04, .09, .2), vec3(.09, .18, .36), uv.y);
    float edge = smoothstep(.95, 1.05, f);
    // height rises from 0 at the edge toward 1 inside; its screen-space slope gives a smooth normal
    float hgt = clamp(1. - 1. / max(f, 1e-3), 0., 1.);
    vec3 n = normalize(vec3(-dFdx(hgt) * R.y * .35, -dFdy(hgt) * R.y * .35, 1.));
    float light = clamp(dot(n, normalize(vec3(-.45, .55, .7))), 0., 1.);
    vec3 lava = mix(vec3(.95, .25, .2), vec3(1., .72, .25), clamp(hgt * .9 + uv.y * .25, 0., 1.));
    lava *= .55 + .6 * light; lava += pow(light, 18.) * .35;
    float glow = smoothstep(.25, 1., f) * (1. - edge) * .35;
    o = vec4(mix(bg + glow * vec3(1., .4, .2), lava, edge), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uB = gl.getUniformLocation(prog, 'B'), uN = gl.getUniformLocation(prog, 'N'), uR = gl.getUniformLocation(prog, 'R');
  const resize = () => { const d = Math.min(devicePixelRatio, 1.5); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const n = Math.min(MAX, Math.round(PARAMS.blobs));
  const blobs = Array.from({ length: n }, (_, i) => ({ x: 0.15 + 0.7 * ((i * 0.618) % 1), r: 0.07 + 0.05 * ((i * 0.37) % 1), f: 0.15 + 0.2 * ((i * 0.53) % 1), ph: i * 1.7 }));
  const data = new Float32Array(MAX * 3);
  let raf;
  function frame(now) {
    const t = now / 1000 * PARAMS.speed, ar = canvas.width / canvas.height;
    blobs.forEach((b, i) => {
      data[i * 3] = (b.x + 0.06 * Math.sin(t * 0.7 + b.ph)) * ar;
      data[i * 3 + 1] = 0.5 - 0.42 * Math.cos(t * b.f * 2 + b.ph);     // slow rise and fall
      data[i * 3 + 2] = b.r * (1 + 0.15 * Math.sin(t * 1.3 + b.ph));
    });
    gl.uniform3fv(uB, data); gl.uniform1i(uN, n); gl.uniform2f(uR, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
