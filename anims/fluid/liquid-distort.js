// Liquid image distortion: the picture is a texture, and every pixel samples it from a spot shifted by
// flowing noise. Near the pointer the shift grows, like a finger dragged through water.
const PARAMS = { strength: 0.04, speed: 0.4 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }

  // The "image": painted once on a 2D canvas, then uploaded as a texture.
  const pic = document.createElement('canvas'); pic.width = 1024; pic.height = 768;
  const p = pic.getContext('2d');
  const bands = ['#06070d', '#0a1636', '#0f2f78', '#1c6fd0', '#3fa0f5', '#ffc93b', '#ff7a1f'];   // night to glow, so it sits on a dark page
  bands.forEach((c, i) => { p.fillStyle = c; p.fillRect(0, i * 768 / bands.length, 1024, 768 / bands.length + 1); });
  p.fillStyle = '#ffffff'; p.font = '900 230px "Mona Sans", system-ui, sans-serif'; p.textAlign = 'center'; p.textBaseline = 'middle';
  p.fillText('LIQUID', 512, 384);

  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D img; uniform float T, S; uniform vec2 M, R;
  vec2 hash(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1. + 2. * fract(sin(p) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
    return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x), mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y); }
  void main() {
    vec2 q = uv * vec2(R.x / R.y, 1.);
    vec2 n = vec2(noise(q * 2.2 + vec2(T, T * .7)), noise(q * 2.2 + vec2(-T * .8, T) + 7.3));
    vec2 m = M * vec2(R.x / R.y, 1.); float near = exp(-dot(q - m, q - m) * 9.);
    vec2 swirl = vec2(-(q - m).y, (q - m).x) * near * 1.6;
    vec2 st = uv + n * S + swirl * S;
    // cover-fit the 4:3 picture into the frame
    vec2 ar = vec2(R.x / R.y / (4. / 3.), 1.); if (ar.x < 1.) ar = vec2(1., (4. / 3.) / (R.x / R.y));
    vec2 tc = (st - .5) * (ar.x > 1. ? vec2(1., 1. / ar.x) : vec2(1. / ar.y, 1.)) + .5;
    o = vec4(texture(img, vec2(tc.x, 1. - tc.y)).rgb, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  const U = n => gl.getUniformLocation(prog, n);
  const uT = U('T'), uS = U('S'), uM = U('M'), uR = U('R');

  const resize = () => { const d = Math.min(devicePixelRatio, 1.5); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, lastMove = -1e9, raf;
  const onMove = e => { const b = canvas.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; ty = 1 - (e.clientY - b.top) / b.height; lastMove = performance.now(); };
  canvas.addEventListener('pointermove', onMove);
  function frame(now) {
    const t = now / 1000;
    if (now - lastMove > 1500) { tx = 0.5 + Math.cos(t * 0.7) * 0.3; ty = 0.5 + Math.sin(t * 1.1) * 0.25; }
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    gl.uniform1f(uT, t * PARAMS.speed); gl.uniform1f(uS, PARAMS.strength); gl.uniform2f(uM, mx, my); gl.uniform2f(uR, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
