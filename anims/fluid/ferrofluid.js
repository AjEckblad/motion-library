// Ferrofluid: a glossy black blob whose surface rises into spikes, strongest on the side facing the magnet.
// The outline is a distance field (circle + sharpened cosine spikes); its gradient gives a normal for the gloss.
const PARAMS = { spikes: 22, strength: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R, M; uniform float T, N, S;
  float blob(vec2 q) {
    float a = atan(q.y, q.x), r = length(q);
    vec2 toM = M - vec2(0); float face = max(0., dot(normalize(q + 1e-4), normalize(toM + 1e-4)));   // spikes grow toward the magnet
    float pull = S * (.35 + .65 * pow(face, 2.)) * clamp(1.2 - length(toM) * .6, .3, 1.);
    float spikes = pow(max(0., cos(a * N + sin(T * .7) * .4)), 6.) * .16 * pull + pow(max(0., cos(a * N * 2. + 1.)), 10.) * .05 * pull;
    float base = .3 + .03 * sin(a * 3. + T) + pull * .04;
    return r - (base + spikes);
  }
  void main() {
    vec2 a = vec2(R.x / R.y, 1.), q = (uv - .5) * a * 1.1;
    float d = blob(q), e = 1.5 / R.y;
    vec2 g = vec2(blob(q + vec2(e, 0)) - blob(q - vec2(e, 0)), blob(q + vec2(0, e)) - blob(q - vec2(0, e)));
    float h = clamp(-d * 8., 0., 1.);                               // height: rises away from the edge
    vec3 n = normalize(vec3(-g / (2. * e) * (1. - h) * .9, .45 + h));
    vec3 l = normalize(vec3(-.4, .6, .7)), v = vec3(0, 0, 1);
    float spec = pow(max(0., dot(reflect(-l, n), v)), 60.), rim = pow(1. - n.z, 2.);
    vec3 bg = mix(vec3(.13, .13, .155), vec3(.03, .03, .04), smoothstep(0., .65, length(uv - .5)));   // a dark stage with a soft pool of light under the blob
    vec3 ink = vec3(.008, .008, .012) + spec * vec3(1.15) + rim * vec3(.3, .4, .65) + max(0., n.x) * .06;   // black oil read by its highlights and a cool rim
    float cover = smoothstep(e * 1.5, -e * 1.5, d);
    float shadow = smoothstep(.12, -.05, blob(q - vec2(.02, -.04))) * .6;
    o = vec4(mix(bg * (1. - shadow), ink, cover), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n), uR = u('R'), uM = u('M'), uT = u('T'), uN = u('N'), uS = u('S');
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let mx = 0.4, my = 0.2, tx = mx, ty = my, lastMove = -1e9, raf;
  const onMove = e => { const b = canvas.getBoundingClientRect(), a = b.width / b.height; tx = ((e.clientX - b.left) / b.width - 0.5) * a * 1.1; ty = (0.5 - (e.clientY - b.top) / b.height) * 1.1; lastMove = performance.now(); };
  canvas.addEventListener('pointermove', onMove);
  function frame(now) {
    const t = now / 1000;
    if (now - lastMove > 1500) { tx = Math.cos(t * 0.6) * 0.5; ty = Math.sin(t * 0.9) * 0.35; }
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform2f(uM, mx, my); gl.uniform1f(uT, t); gl.uniform1f(uN, Math.round(PARAMS.spikes)); gl.uniform1f(uS, PARAMS.strength);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
