// Tartan, actually woven: every pixel works out which warp thread (running down) and which weft thread (running
// across) it sits on, and which of the two is on top. The colours come from one sett, a stripe sequence of thread
// counts mirrored at its pivots, used for both warp and weft; where two colours cross they mix into a third. The
// 2/2 twill (over two, under two, stepping one each row) draws the diagonal ribs, and each float is shaded round
// like a real yarn, darker where it dives under. The cloth slides diagonally and repeats seamlessly forever.
const PARAMS = { thread: 3, speed: 1, relief: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // an original sett, given as [colour, thread count] from one pivot to the other; it is mirrored to make the repeat
  const C = { N: [16, 22, 46], R: [150, 22, 34], G: [18, 64, 44], Y: [222, 170, 52], W: [228, 222, 206], K: [10, 10, 14], B: [36, 64, 120] };
  const half = [['R', 30], ['K', 4], ['R', 4], ['K', 4], ['N', 22], ['G', 26], ['Y', 2], ['G', 26], ['K', 18], ['B', 6], ['K', 4], ['W', 2]];
  const seq = [];
  half.forEach(([c, n]) => { for (let i = 0; i < n; i++) seq.push(C[c]); });
  for (let k = half.length - 2; k >= 1; k--) { const [c, n] = half[k]; for (let i = 0; i < n; i++) seq.push(C[c]); }
  const L = seq.length, data = new Uint8Array(L * 4);
  seq.forEach((c, i) => { data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2]; data[i * 4 + 3] = 255; });
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, L, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R, OFF; uniform float S, RL; uniform int L; uniform sampler2D SETT;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 sett(float i) { int k = int(mod(i, float(L))); return pow(texelFetch(SETT, ivec2(k, 0), 0).rgb, vec3(2.2)); }
  void main() {
    vec2 q = (vec2(gl_FragCoord.x, R.y - gl_FragCoord.y) + OFF) / S;   // position in thread units
    vec2 id = floor(q), f = fract(q);
    bool warpUp = mod(id.x + id.y, 4.) < 2.;                            // 2/2 twill: the ribs run diagonally
    // where along its float (two cells long) this point lies: 0 = just surfaced, 1 = about to dive under
    float k = mod(id.x + id.y, 2.);
    float along = warpUp ? (mod(id.x + id.y, 4.) + f.y) / 2. : (mod(id.x + id.y, 4.) - 2. + f.x) / 2.;
    float across = warpUp ? f.x : f.y;
    vec3 col = warpUp ? sett(id.x) : sett(id.y);
    // yarn: round across the thread, dipping at each end of the float, with a fine twist of fibres
    float round = sin(3.14159 * across);
    float dip = smoothstep(0., .22, along) * smoothstep(1., .78, along);
    float fib = .5 + .5 * sin((warpUp ? f.y * 1.0 + across * .9 : f.x * 1.0 + across * .9) * 18.85 + hash(id) * 6.28);
    float shade = mix(1., (.35 + .65 * round) * (.55 + .45 * dip) * (.88 + .12 * fib), clamp(RL, 0., 1.));
    shade *= .92 + .16 * hash(id * 1.3 + (warpUp ? .5 : .0));          // thread-to-thread unevenness of the dye
    col *= shade * 1.25;
    col += vec3(1.) * pow(round * dip, 6.) * .05 * RL;                   // a soft sheen on the crown of each float
    vec2 uv = gl_FragCoord.xy / R - .5;
    col *= 1. - dot(uv, uv) * .9;                                        // a gentle vignette, like light across cloth
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'OFF', 'S', 'RL', 'L', 'SETT'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.uniform1i(U.SETT, 0); gl.uniform1i(U.L, L);
  let d = 1;
  const resize = () => { d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = reduce ? 0 : (now - t0) / 1000 * PARAMS.speed;
    const S = PARAMS.thread * d;
    // slide diagonally; the offset wraps at one full repeat of the sett, so it stays exact however long it runs
    const per = L * S, ox = (t * 22 * d) % per, oy = (t * 13 * d) % per;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform2f(U.OFF, ox + per * .3, oy + per * .1); gl.uniform1f(U.S, S); gl.uniform1f(U.RL, PARAMS.relief);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.deleteTexture(tex); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
