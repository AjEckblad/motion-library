// Bioluminescent shore: a night beach where plankton (Noctiluca) flash blue whenever the water is disturbed. The glow
// lives in a texture laid over the beach in world space. Every frame it fades, it is carried up and back down the
// sand with the wash, and it is lit again wherever a wave breaks and wherever the pointer stirs the water. Each pixel
// casts a ray onto the beach to find where it looks, then reads the waves, the wet sand's sheen and the glow there.
const PARAMS = { waves: 1, glow: 1, sparkle: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const GS = 512;                                                // glow texture: x −24..24 m, z 0..56 m from the camera
  const COMMON = `
  const float X0 = -24., X1 = 24., Z0 = 0., Z1 = 56.;
  uniform float T, WV;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
  float shore(float x) { return 9. + 1.6 * sin(x * .17 + 1.) + .8 * sin(x * .43); }     // where the sand meets the sea (z)
  // the wave train: crests run toward the beach; phase 0..1, crest at 0
  float phase(vec2 w) { return fract((w.y - shore(w.x)) / 7. + T * .16 * WV + n2(vec2(w.x * .08, T * .05)) * .35); }
  // how far up the sand the current wash has reached (it surges in after each break, then slides back)
  float wash(float x) { float p = fract(T * .16 * WV + n2(vec2(x * .08, T * .05)) * .35); return shore(x) - 3.2 * sin(3.14159 * clamp(p * 1.6, 0., 1.)) * (.7 + .3 * n2(vec2(x * .2, floor(T * .16 * WV)))); }`;
  const QUAD = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  // the glow, in world space: fade, ride the wash, light up at breaking crests and under the pointer
  const glowFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D G; uniform vec3 P; uniform float DT;
  ${COMMON}
  void main() {
    vec2 w = vec2(mix(X0, X1, uv.x), mix(Z0, Z1, uv.y));
    float s = shore(w.x), ws = wash(w.x);
    // the wash carries light up the sand and back: sample from slightly seaward (or landward) of here
    float drift = w.y < s + 2. && w.y > ws - 1. ? (fract(T * .16 * WV) < .32 ? .9 : -.5) : 0.;
    vec2 src = uv + vec2(0., drift * DT / (Z1 - Z0));
    float g = texture(G, src).r * exp(-DT * 1.1);
    float ph = phase(w), surf = smoothstep(s + 9., s + 2., w.y) * step(s - .3, w.y);
    float crest = exp(-pow((ph - .02) / .018, 2.)) + exp(-pow((ph - 1.02) / .018, 2.));   // the line where the wave is breaking
    g += crest * surf * (.15 + 1.3 * pow(n2(w * vec2(.9, 2.) + T * .7), 2.)) * DT * 9.;   // breaking is patchy, so the line flickers along its length
    if (w.y < s && w.y > ws) g += DT * 1.4 * n2(w * 2. + T * 3.) * smoothstep(ws, ws + .6, w.y);   // the foam edge of the wash
    float d = length((w - P.xy) * vec2(1., .7));
    g += P.z * exp(-d * d * 3.) * DT * 6.;                                    // a hand dragged through the water
    o = vec4(min(g, 6.), 0, 0, 1);
  }`;
  // the picture
  const showFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D G; uniform vec2 R; uniform float CH, PITCH, FOC, K, SP;
  ${COMMON}
  vec3 sky(vec3 d) {
    vec3 c = mix(vec3(.007, .013, .026), vec3(.0008, .0016, .005), smoothstep(0., .5, d.y));
    vec2 sp = vec2(atan(d.x, d.z), d.y) * 340., ci = floor(sp);
    vec3 p3 = fract(vec3(ci.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); float s = fract((p3.x + p3.y) * p3.z);
    c += vec3(.75, .82, 1.) * step(.994, s) * (s - .994) * 120. * smoothstep(.45, .1, length(fract(sp) - .5));
    float band = exp(-pow((d.y - .25 - d.x * .3) / .09, 2.)) * n2(vec2(d.x * 9., d.y * 14.));          // a faint Milky Way
    return c + vec3(.012, .013, .02) * band;
  }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    float cp = cos(PITCH), sp = sin(PITCH);
    vec3 d = normalize(vec3(q.x, q.y * cp - FOC * sp, q.y * sp + FOC * cp));
    vec3 col;
    if (d.y > -.0005) col = sky(d);
    else {
      float t = CH / -d.y; vec2 w = vec2(d.x, d.z) * t; float dist = t;
      float s = shore(w.x), ws = wash(w.x), ph = phase(w);
      vec2 gt = vec2((w.x - X0) / (X1 - X0), (w.y - Z0) / (Z1 - Z0));
      float g = texture(G, gt).r, gs = (texture(G, gt + vec2(.004, 0)).r + texture(G, gt - vec2(.004, 0)).r + texture(G, gt + vec2(0, .006)).r + texture(G, gt - vec2(0, .006)).r) * .25;
      if (w.y > ws) {                                               // sea (and the thin sheet of the wash)
        float wave = sin(ph * 6.2832), slope = cos(ph * 6.2832);
        float fres = .03 + .5 * pow(1. - abs(d.y), 6.);
        vec3 refl = sky(reflect(d, normalize(vec3(n2(w * 1.3 + T) - .5, 6. + slope * 2., slope * 1.5))));
        col = vec3(.001, .003, .007) + refl * fres * (w.y < s ? .5 : 1.);
        col *= .8 + .2 * wave;
      } else {                                                      // sand: wet and glossy near the water, dry further up
        float wet = smoothstep(ws - 4., ws - .3, w.y);
        col = mix(vec3(.0055, .005, .0045), vec3(.0025, .003, .0045), wet) * (.85 + .3 * n2(w * 6.));
        col += sky(reflect(d, vec3(0, 1, 0))) * wet * .35;
      }
      // the plankton light: a broad glow plus sparks where it is strongest
      float spark = step(1. - .04 * SP, h(floor(w * 7.) + floor(T * 12.))) * smoothstep(.3, .1, length(fract(w * 7.) - .5)) * g;
      col += vec3(.05, .55, 1.) * (g * .5 + gs * .5) * K + vec3(.6, .95, 1.) * spark * .8 * K;
      col = mix(col, vec3(.004, .008, .016), smoothstep(30., 56., dist));     // haze toward the horizon
    }
    col = col / (1. + col);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = fs => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, QUAD)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const glowP = prog(glowFS), showP = prog(showFS);
  const quad = gl.createVertexArray(); gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const target = () => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, GS, GS, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); return { t, fb };
  };
  let A = target(), B = target();
  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // camera: standing on the beach, 2.2 m up, looking out to sea and a little down
  const CH = 2.2, PITCH = 0.2, FOC = 2.2;
  const ptr = { x: 0, z: 0, s: 0, on: false };
  const move = e => {
    const r = canvas.getBoundingClientRect(), qx = (((e.clientX - r.left) / r.width) * 2 - 1) * (r.width / r.height), qy = 1 - ((e.clientY - r.top) / r.height) * 2;
    const cp = Math.cos(PITCH), sp = Math.sin(PITCH), dy = qy * cp - FOC * sp, dz = qy * sp + FOC * cp;
    if (dy >= -0.001) { ptr.on = false; return; }
    const t = CH / -dy; ptr.x = qx * t; ptr.z = dz * t; ptr.on = true;
  };
  const leave = () => { ptr.on = false; };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);

  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * Math.min(1, dt * 8);
    gl.bindVertexArray(quad);
    gl.useProgram(glowP.p); gl.bindFramebuffer(gl.FRAMEBUFFER, B.fb); gl.viewport(0, 0, GS, GS);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(glowP.u.G, 0);
    gl.uniform1f(glowP.u.T, t); gl.uniform1f(glowP.u.WV, PARAMS.waves); gl.uniform1f(glowP.u.DT, dt); gl.uniform3f(glowP.u.P, ptr.x, ptr.z, ptr.s);
    gl.drawArrays(gl.TRIANGLES, 0, 3); [A, B] = [B, A];
    gl.useProgram(showP.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(showP.u.G, 0); gl.uniform2f(showP.u.R, W, H);
    gl.uniform1f(showP.u.T, t); gl.uniform1f(showP.u.WV, PARAMS.waves); gl.uniform1f(showP.u.CH, CH); gl.uniform1f(showP.u.PITCH, PITCH); gl.uniform1f(showP.u.FOC, FOC);
    gl.uniform1f(showP.u.K, PARAMS.glow); gl.uniform1f(showP.u.SP, PARAMS.sparkle);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
