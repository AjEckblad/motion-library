// Glass lens refraction: inside the lens each pixel samples the scene behind it through a domed surface,
// pulled toward the centre (magnification). Red, green and blue bend by slightly different amounts: dispersion.
const PARAMS = { ior: 1.3, dispersion: 0.02 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }

  // The scene behind the glass, painted once.
  const pic = document.createElement('canvas'); pic.width = 1200; pic.height = 900;
  const g = pic.getContext('2d');
  g.fillStyle = '#0e0d12'; g.fillRect(0, 0, 1200, 900);
  g.fillStyle = '#2c2936'; for (let x = 0; x < 1200; x += 60) for (let y = 0; y < 900; y += 60) { g.beginPath(); g.arc(x + 30, y + 30, 6, 0, 7); g.fill(); }
  g.fillStyle = '#ece4d6'; g.font = '900 210px "Mona Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('REFRACT', 600, 330);
  g.fillStyle = '#ff6a1f'; g.fillText('LIGHT', 600, 580);
  g.strokeStyle = '#8fd3ff'; g.lineWidth = 6; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(80 + i * 150, 760); g.lineTo(160 + i * 150, 840); g.stroke(); }

  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D img; uniform vec2 R, M; uniform float IOR, DISP;
  vec3 scene(vec2 st) {
    vec2 a = vec2(R.x / R.y, 1.), cover = a.x > 4. / 3. ? vec2(1., (4. / 3.) / a.x) : vec2(a.x / (4. / 3.), 1.);
    vec2 tc = (st - .5) * cover + .5; return texture(img, vec2(tc.x, 1. - tc.y)).rgb;
  }
  void main() {
    vec2 a = vec2(R.x / R.y, 1.), q = uv * a, m = M * a;
    float r = .3, d = length(q - m) / r;
    vec3 col = scene(uv);
    float shadow = smoothstep(1.25, .95, length(q - m - vec2(.02, -.03)) / r) * .18;
    col *= 1. - shadow;
    if (d < 1.) {
      float h = sqrt(1. - d * d);                      // dome height
      float mag = (IOR - 1.) * 1.1;
      vec2 dir = (q - m);
      vec3 c;
      c.r = scene((m + dir * (1. - mag * (1. + DISP * 6.) * h)) / a).r;
      c.g = scene((m + dir * (1. - mag * h)) / a).g;
      c.b = scene((m + dir * (1. - mag * (1. - DISP * 6.) * h)) / a).b;
      float rim = smoothstep(.82, 1., d);
      float hi = pow(max(0., dot(normalize(vec3(dir / r, h)), normalize(vec3(-.5, .6, .8)))), 40.);
      col = mix(c * 1.04, vec3(1.), rim * .35) + hi * .6;
    }
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const u = n => gl.getUniformLocation(prog, n), uR = u('R'), uM = u('M'), uI = u('IOR'), uD = u('DISP');
  const resize = () => { const d = Math.min(devicePixelRatio, 1.5); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, lastMove = -1e9, raf;
  const onMove = e => { const b = canvas.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; ty = 1 - (e.clientY - b.top) / b.height; lastMove = performance.now(); };
  canvas.addEventListener('pointermove', onMove);
  function frame(now) {
    const t = now / 1000;
    if (now - lastMove > 1500) { tx = 0.5 + Math.cos(t * 0.6) * 0.28; ty = 0.5 + Math.sin(t * 0.9) * 0.2; }
    mx += (tx - mx) * 0.1; my += (ty - my) * 0.1;
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform2f(uM, mx, my); gl.uniform1f(uI, PARAMS.ior); gl.uniform1f(uD, PARAMS.dispersion);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
