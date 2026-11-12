// Fire & smoke: a GPU fluid solver with buoyancy. Heat rises (it pushes the velocity field up), cools as it
// travels and leaves smoke behind. Colour comes from temperature through a blackbody ramp: white, yellow, red, smoke.
const PARAMS = { heat: 1, cooling: 0.95, curl: 22 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const VS = `#version 300 es
  in vec2 p; out vec2 uv, vL, vR, vT, vB; uniform vec2 texel;
  void main() { uv = p * .5 + .5; vL = uv - vec2(texel.x, 0); vR = uv + vec2(texel.x, 0); vT = uv + vec2(0, texel.y); vB = uv - vec2(0, texel.y); gl_Position = vec4(p, 0, 1); }`;
  const head = `#version 300 es
  precision highp float; precision highp sampler2D; in vec2 uv, vL, vR, vT, vB; out vec4 o;`;
  const FS = {
    // the burner: heat (x), smoke (y) and an upward kick near the bottom, flickering
    source: `uniform sampler2D tgt; uniform float T, amt; uniform vec2 aspect; uniform int mode;
      float n(vec2 p) { return fract(sin(dot(p, vec2(12.9, 78.2))) * 43758.5); }
      void main() { vec4 v = texture(tgt, uv); vec2 d = (uv - vec2(.5 + .04 * sin(T * 3.1), .07)) * aspect; float r = exp(-dot(d * vec2(1.7, 4.5), d * vec2(1.7, 4.5)) * 90.);
        float flick = .7 + .3 * n(floor(uv * 40.) + floor(T * 20.));
        if (mode == 0) o = v + vec4(0, r * 2.2 * amt, 0, 0); else o = v + vec4(r * flick * amt * .9, r * amt * .25, 0, 0); }`,
    advect: `uniform sampler2D vel, src; uniform vec2 simTexel; uniform float dt; uniform vec4 keep;
      void main() { vec2 c = uv - dt * texture(vel, uv).xy * simTexel; o = keep * texture(src, c); }`,
    buoy: `uniform sampler2D vel, dye; uniform float dt;
      void main() { vec4 v = texture(vel, uv); vec2 d = texture(dye, uv).xy; o = vec4(v.xy + vec2(0, d.x * 260. - d.y * 18.) * dt, 0, 1); }`,
    divergence: `uniform sampler2D vel;
      void main() { float L = texture(vel, vL).x, R = texture(vel, vR).x, T = texture(vel, vT).y, B = texture(vel, vB).y; vec2 C = texture(vel, uv).xy;
        if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y; o = vec4(.5 * (R - L + T - B), 0, 0, 1); }`,
    curl: `uniform sampler2D vel; void main() { o = vec4(.5 * (texture(vel, vR).y - texture(vel, vL).y - texture(vel, vT).x + texture(vel, vB).x), 0, 0, 1); }`,
    vorticity: `uniform sampler2D vel, crl; uniform float strength, dt;
      void main() { float L = texture(crl, vL).x, R = texture(crl, vR).x, T = texture(crl, vT).x, B = texture(crl, vB).x, C = texture(crl, uv).x;
        vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= strength * C; f.y *= -1.; o = vec4(texture(vel, uv).xy + f * dt, 0, 1); }`,
    pressure: `uniform sampler2D prs, div; void main() { o = vec4((texture(prs, vL).x + texture(prs, vR).x + texture(prs, vB).x + texture(prs, vT).x - texture(div, uv).x) * .25, 0, 0, 1); }`,
    gradient: `uniform sampler2D prs, vel; void main() { o = vec4(texture(vel, uv).xy - .5 * vec2(texture(prs, vR).x - texture(prs, vL).x, texture(prs, vT).x - texture(prs, vB).x), 0, 1); }`,
    scale: `uniform sampler2D src; uniform float k; void main() { o = k * texture(src, uv); }`,
    display: `uniform sampler2D dye;
      vec3 black(float t) { return clamp(vec3(t * 3.2, t * t * 2.4, pow(t, 4.) * 3.), 0., 1.); }
      void main() { vec2 d = texture(dye, uv).xy; vec3 bg = mix(vec3(.04, .035, .05), vec3(.08, .06, .07), uv.y);
        vec3 smoke = vec3(.32, .3, .31) * (1. - exp(-d.y * 1.4));
        vec3 c = bg * exp(-d.y * 1.2) + smoke + black(clamp(d.x * .75, 0., 1.)) * 1.3;
        o = vec4(c / (1. + c * .25), 1); }`,
  };
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const vs = compile(gl.VERTEX_SHADER, VS), progs = {};
  for (const k in FS) {
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, head + FS[k])); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    progs[k] = { p, u };
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const fbo = (w, h) => { const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); return { tex, fb, w, h }; };
  const pair = (w, h) => { let a = fbo(w, h), b = fbo(w, h); return { get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; } }; };
  let W = 0, H = 0, vel, dye, div, crl, prs;
  const resize = () => { const d = Math.min(devicePixelRatio, 1.5); W = Math.max(2, stage.clientWidth * d | 0); H = Math.max(2, stage.clientHeight * d | 0); canvas.width = W; canvas.height = H;
    const ar = W / H, sw = Math.round(128 * Math.max(1, ar)), sh = Math.round(128 * Math.max(1, 1 / ar)); vel = pair(sw, sh); prs = pair(sw, sh); div = fbo(sw, sh); crl = fbo(sw, sh); dye = pair(sw * 3, sh * 3); };
  resize(); const ro = new ResizeObserver(resize); ro.observe(stage);
  const bind = (u, t) => { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, t.tex); return u; };
  const run = (prog, target, set) => { gl.useProgram(prog.p); const w = target ? target.w : W, h = target ? target.h : H; gl.uniform2f(prog.u.texel, 1 / w, 1 / h); set(prog.u); gl.viewport(0, 0, w, h); gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  let last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.016, (now - last) / 1000); last = now; const t = now / 1000, st = [1 / vel.read.w, 1 / vel.read.h], asp = [W / H, 1];
    run(progs.source, vel.write, u => { gl.uniform1i(u.tgt, bind(0, vel.read)); gl.uniform1f(u.T, t); gl.uniform1f(u.amt, 60 * PARAMS.heat * dt * 60); gl.uniform2f(u.aspect, ...asp); gl.uniform1i(u.mode, 0); }); vel.swap();
    run(progs.source, dye.write, u => { gl.uniform1i(u.tgt, bind(0, dye.read)); gl.uniform1f(u.T, t); gl.uniform1f(u.amt, PARAMS.heat * dt * 60 * 0.4); gl.uniform2f(u.aspect, ...asp); gl.uniform1i(u.mode, 1); }); dye.swap();
    run(progs.buoy, vel.write, u => { gl.uniform1i(u.vel, bind(0, vel.read)); gl.uniform1i(u.dye, bind(1, dye.read)); gl.uniform1f(u.dt, dt); }); vel.swap();
    run(progs.curl, crl, u => gl.uniform1i(u.vel, bind(0, vel.read)));
    run(progs.vorticity, vel.write, u => { gl.uniform1i(u.vel, bind(0, vel.read)); gl.uniform1i(u.crl, bind(1, crl)); gl.uniform1f(u.strength, PARAMS.curl); gl.uniform1f(u.dt, dt); }); vel.swap();
    run(progs.divergence, div, u => gl.uniform1i(u.vel, bind(0, vel.read)));
    run(progs.scale, prs.write, u => { gl.uniform1i(u.src, bind(0, prs.read)); gl.uniform1f(u.k, 0.8); }); prs.swap();
    for (let i = 0; i < 20; i++) { run(progs.pressure, prs.write, u => { gl.uniform1i(u.prs, bind(0, prs.read)); gl.uniform1i(u.div, bind(1, div)); }); prs.swap(); }
    run(progs.gradient, vel.write, u => { gl.uniform1i(u.prs, bind(0, prs.read)); gl.uniform1i(u.vel, bind(1, vel.read)); }); vel.swap();
    run(progs.advect, vel.write, u => { gl.uniform1i(u.vel, bind(0, vel.read)); gl.uniform1i(u.src, bind(0, vel.read)); gl.uniform2f(u.simTexel, ...st); gl.uniform1f(u.dt, dt); gl.uniform4f(u.keep, 0.995, 0.995, 1, 1); }); vel.swap();
    const cool = Math.pow(PARAMS.cooling, dt * 60);
    run(progs.advect, dye.write, u => { gl.uniform1i(u.vel, bind(0, vel.read)); gl.uniform1i(u.src, bind(1, dye.read)); gl.uniform2f(u.simTexel, ...st); gl.uniform1f(u.dt, dt); gl.uniform4f(u.keep, cool, Math.pow(0.992, dt * 60), 1, 1); }); dye.swap();
    run(progs.display, null, u => gl.uniform1i(u.dye, bind(0, dye.read)));
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
