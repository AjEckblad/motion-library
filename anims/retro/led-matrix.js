// LED dot-matrix sign: text is set in a 5×7 bitmap font and stepped through the panel one LED column at a time,
// the way real signs scroll. The CPU only decides which LEDs are on (with a short afterglow as they switch off) and
// uploads that grid as a tiny texture; the shader draws every LED as a lens with a hot core, adds the light of its
// eight neighbours as bloom, keeps unlit LEDs faintly visible, and runs a slow sine ripple of brightness through it.
const PARAMS = { speed: 1, lines: 3, ripple: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }

  // 5×7 font, five column bytes per glyph, bit 0 = top row
  const F = {
    ' ': [0, 0, 0, 0, 0], A: [0x7C, 0x12, 0x11, 0x12, 0x7C], B: [0x7F, 0x49, 0x49, 0x49, 0x36], C: [0x3E, 0x41, 0x41, 0x41, 0x22],
    D: [0x7F, 0x41, 0x41, 0x22, 0x1C], E: [0x7F, 0x49, 0x49, 0x49, 0x41], F: [0x7F, 0x09, 0x09, 0x09, 0x01], G: [0x3E, 0x41, 0x49, 0x49, 0x7A],
    H: [0x7F, 0x08, 0x08, 0x08, 0x7F], I: [0x00, 0x41, 0x7F, 0x41, 0x00], J: [0x20, 0x40, 0x41, 0x3F, 0x01], K: [0x7F, 0x08, 0x14, 0x22, 0x41],
    L: [0x7F, 0x40, 0x40, 0x40, 0x40], M: [0x7F, 0x02, 0x0C, 0x02, 0x7F], N: [0x7F, 0x04, 0x08, 0x10, 0x7F], O: [0x3E, 0x41, 0x41, 0x41, 0x3E],
    P: [0x7F, 0x09, 0x09, 0x09, 0x06], Q: [0x3E, 0x41, 0x51, 0x21, 0x5E], R: [0x7F, 0x09, 0x19, 0x29, 0x46], S: [0x46, 0x49, 0x49, 0x49, 0x31],
    T: [0x01, 0x01, 0x7F, 0x01, 0x01], U: [0x3F, 0x40, 0x40, 0x40, 0x3F], V: [0x1F, 0x20, 0x40, 0x20, 0x1F], W: [0x3F, 0x40, 0x38, 0x40, 0x3F],
    X: [0x63, 0x14, 0x08, 0x14, 0x63], Y: [0x07, 0x08, 0x70, 0x08, 0x07], Z: [0x61, 0x51, 0x49, 0x45, 0x43],
    0: [0x3E, 0x51, 0x49, 0x45, 0x3E], 1: [0x00, 0x42, 0x7F, 0x40, 0x00], 2: [0x42, 0x61, 0x51, 0x49, 0x46], 3: [0x21, 0x41, 0x45, 0x4B, 0x31],
    4: [0x18, 0x14, 0x12, 0x7F, 0x10], 5: [0x27, 0x45, 0x45, 0x45, 0x39], 6: [0x3C, 0x4A, 0x49, 0x49, 0x30], 7: [0x01, 0x71, 0x09, 0x05, 0x03],
    8: [0x36, 0x49, 0x49, 0x49, 0x36], 9: [0x06, 0x49, 0x49, 0x29, 0x1E], ':': [0x00, 0x36, 0x36, 0x00, 0x00], '.': [0x00, 0x60, 0x60, 0x00, 0x00],
    '-': [0x08, 0x08, 0x08, 0x08, 0x08], '+': [0x08, 0x08, 0x3E, 0x08, 0x08], '*': [0x08, 0x1C, 0x3E, 0x1C, 0x08], '>': [0x00, 0x41, 0x22, 0x14, 0x08],
  };
  const MSG = ['DOT MATRIX * 5X7 FONT * ONE COLUMN PER STEP *   ', 'PER-LED BLOOM + GHOST DOTS + SINE RIPPLE  >>>  ', '0123456789 * AMBER 590NM * NO PIXELS, ONLY LEDS *  '];
  const bitmap = s => { const c = []; for (const ch of s) { for (const b of F[ch] || F[' ']) c.push(b); c.push(0); } return c; };
  const lines = Math.max(1, Math.min(4, Math.round(PARAMS.lines)));
  const texts = Array.from({ length: lines }, (_, i) => bitmap(MSG[i % MSG.length]));
  const ROWS = lines * 7 + (lines - 1) * 3 + 4;          // 2 blank rows of border top and bottom, 3 between lines

  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R, G, O; uniform float P, T, RP; uniform sampler2D S;
  float lit(vec2 c) { if (c.x < 0. || c.y < 0. || c.x >= G.x || c.y >= G.y) return 0.; return texelFetch(S, ivec2(c), 0).r; }
  void main() {
    vec2 q = (vec2(gl_FragCoord.x, R.y - gl_FragCoord.y) - O) / P;
    vec2 cell = floor(q), f = fract(q) - .5;
    float L = lit(cell);
    float d = length(f);
    float lens = smoothstep(.37, .37 - 1.5 / P, d);           // the LED’s round lens, antialiased at any size
    float hot = exp(-d * d * 22.);
    float bloom = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(i, j); bloom += lit(cell + o) * exp(-dot(f - o, f - o) * 4.5);
    }
    float rip = 1. - RP * .32 * (.5 + .5 * sin(cell.x * .28 + cell.y * .16 - T * 3.2));
    vec3 amber = vec3(1., .44, .04);
    bool inside = cell.x >= 0. && cell.y >= 0. && cell.x < G.x && cell.y < G.y;
    vec3 col = vec3(.018, .012, .01);
    if (inside) col += vec3(.055, .022, .008) * lens * (1. - L);                        // unlit LEDs: dark amber ghosts
    col += amber * lens * L * rip * 1.05 + vec3(1., .85, .6) * hot * L * rip * .55;    // lit lens and hot core
    col += amber * bloom * .16 * rip;                                                   // light spilling onto the panel
    o = vec4(1. - exp(-col * 1.4), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'G', 'O', 'P', 'T', 'RP', 'S'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.uniform1i(U.S, 0);

  let COLS = 1, pitch = 1, ox = 0, oy = 0, state = new Float32Array(1), bytes = new Uint8Array(1);
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height);
    pitch = Math.min(canvas.height * 0.9 / ROWS, canvas.width / 30);
    COLS = Math.floor(canvas.width * 0.96 / pitch);
    ox = (canvas.width - COLS * pitch) / 2; oy = (canvas.height - ROWS * pitch) / 2;
    state = new Float32Array(COLS * ROWS); bytes = new Uint8Array(COLS * ROWS);
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let raf, last = performance.now(), t = 0, tr = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt * (reduce ? 0 : PARAMS.speed); tr += dt * (reduce ? 0.1 : 1);
    const fade = Math.exp(-dt * 160);
    for (let L = 0; L < lines; L++) {
      const txt = texts[L], n = txt.length, step = Math.floor(t * 16 * (1 + 0.18 * L)) + L * 13;   // whole LED columns
      for (let c = 0; c < COLS; c++) {
        const b = txt[((c + step) % n + n) % n];
        for (let r = 0; r < 7; r++) {
          const i = (2 + L * 10 + r) * COLS + c, on = (b >> r) & 1;
          state[i] = on ? 1 : state[i] * fade;
        }
      }
    }
    for (let i = 0; i < state.length; i++) bytes[i] = state[i] * 255;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, COLS, ROWS, 0, gl.RED, gl.UNSIGNED_BYTE, bytes);
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform2f(U.G, COLS, ROWS); gl.uniform2f(U.O, ox, oy);
    gl.uniform1f(U.P, pitch); gl.uniform1f(U.T, tr); gl.uniform1f(U.RP, PARAMS.ripple);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.deleteTexture(tex); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
