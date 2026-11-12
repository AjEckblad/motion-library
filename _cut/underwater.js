// Underwater: god rays slanting down from the surface, caustic light rippling on the sand, depth fog, kelp
// swaying in the current and bubbles rising, all in one fragment shader.
const PARAMS = { rays: 1, bubbles: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T, RY, BU;
  float h(float n) { return fract(sin(n) * 43758.5453); }
  float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
  float caustic(vec2 p, float t) { float c = 0.; for (int i = 0; i < 3; i++) { p += vec2(sin(p.y * 1.7 + t), cos(p.x * 1.3 - t * .8)) * .4; c += abs(sin(p.x * 3.) * sin(p.y * 3.)); } return pow(1. - c / 3., 6.); }
  void main() {
    vec2 a = vec2(R.x / R.y, 1.), q = uv * a;
    vec3 deep = vec3(.01, .08, .16), shallow = vec3(.05, .42, .55);
    vec3 col = mix(deep, shallow, pow(uv.y, 1.4));
    // god rays: bright bands slanting from the surface, flickering with the waves
    float x = q.x + (1. - uv.y) * .35;
    float rays = noise(vec2(x * 7., T * .3)) * noise(vec2(x * 15. + 4., T * .5));
    col += vec3(.45, .75, .8) * pow(rays, 2.) * pow(uv.y, 1.5) * 1.6 * RY;
    // sand with caustics
    float sand = smoothstep(.22, .18, uv.y + .03 * sin(q.x * 3.));
    vec3 sandC = vec3(.55, .5, .38) * (.6 + .4 * noise(q * 40.)) + vec3(.6, .9, .9) * caustic(q * 6., T * .9) * .7;
    col = mix(col, mix(sandC, deep, .35), sand);
    // kelp: a few swaying ribbons
    for (int i = 0; i < 7; i++) { float fi = float(i), kx = (fi + .5) / 7. * a.x + (h(fi) - .5) * .2;
      float sway = sin(T * .8 + fi + uv.y * 4.) * .04 * uv.y; float w = .012 * (1. - uv.y * .6);
      float k = smoothstep(w, w * .3, abs(q.x - kx - sway)) * step(uv.y, .45 + h(fi + 3.) * .35);
      col = mix(col, vec3(.04, .2, .12) * (.6 + .4 * uv.y), k * .9); }
    // bubbles rising in columns
    for (int i = 0; i < 18; i++) { float fi = float(i); if (fi > 18. * BU) break;
      float bx = h(fi * 3.1) * a.x, sp = .08 + h(fi) * .12, by = fract(T * sp + h(fi * 7.)) * 1.2 - .1;
      vec2 c = vec2(bx + sin(T * 2. + fi) * .01, by); float r = .006 + h(fi * 9.) * .01, d = length(q - c);
      col += vec3(.7, .95, 1.) * (smoothstep(r, r * .7, d) - smoothstep(r * .7, r * .3, d) * .7) * .8; }
    col = mix(col, deep, (1. - uv.y) * .25);                                      // depth fog
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n), uR = u('R'), uT = u('T'), uRY = u('RY'), uBU = u('BU');
  const resize = () => { const d = Math.min(devicePixelRatio, 1.5); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf;
  function frame(now) { gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, now / 1000); gl.uniform1f(uRY, PARAMS.rays); gl.uniform1f(uBU, PARAMS.bubbles); gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame); }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
