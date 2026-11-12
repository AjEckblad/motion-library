// Stained glass: a tall pointed window in a dark stone nave. The sun stands behind it and slowly moves; its light
// comes through the glass as coloured shafts in the dusty air and lands on the flagstones as pools of colour that
// drift across the floor, brightening and dimming as clouds pass. Move across it to move the sun.
// Everything is one fragment shader. The window is a function: given a point on the wall it returns the glass colour
// there and whether lead is in the way (a ruby border, a rose medallion in the arch, diamond quarries below, each pane
// with its own streaks and seeds). The floor asks it once per pixel: follow the sunlight back from the floor to the
// wall and look up the glass where it lands, from a few points on the sun's disc for a soft edge. The air asks it at
// every step of a march from the eye: a step inside a beam adds that pane's colour, scaled by the dust there.
const PARAMS = { dust: 1, sun: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FS = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 RES; uniform float T, SX, SUN, DUST, CLOUD;
  uniform vec3 EYE, FWD, RGT, UPV;
  #define HW .62
  #define Y0 .9
  #define YS 2.3
  #define SPAN 1.24
  float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float a = h1(i.xy + i.z * 17.), b = h1(i.xy + vec2(1, 0) + i.z * 17.), c = h1(i.xy + vec2(0, 1) + i.z * 17.), d = h1(i.xy + vec2(1, 1) + i.z * 17.);
    float e = h1(i.xy + (i.z + 1.) * 17.), g = h1(i.xy + vec2(1, 0) + (i.z + 1.) * 17.), k = h1(i.xy + vec2(0, 1) + (i.z + 1.) * 17.), l = h1(i.xy + vec2(1, 1) + (i.z + 1.) * 17.);
    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(k, l, f.x), f.y), f.z); }
  // the window's outline as a signed distance: a rectangle below the springing line, an equilateral arch above
  float win(vec2 p) {
    if (p.y < YS) return max(abs(p.x) - HW, Y0 - p.y);
    return max(length(p - vec2(HW, YS)) - SPAN, length(p - vec2(-HW, YS)) - SPAN);
  }
  // pot-metal colours: mostly blues, with ruby, amber, emerald, violet and a pale gold
  vec3 pal(float h) {
    return h < .34 ? vec3(.05, .16, .62) : h < .5 ? vec3(.12, .32, .85) : h < .62 ? vec3(.75, .05, .07) : h < .74 ? vec3(.95, .55, .08)
         : h < .84 ? vec3(.06, .5, .22) : h < .93 ? vec3(.38, .1, .6) : vec3(.98, .85, .45);
  }
  // the glass at a point on the wall: rgb transmittance, and a = 1 where light gets through (0 on lead and stone)
  vec4 glass(vec2 p) {
    float d = win(p);
    if (d > 0.) return vec4(0.);
    float lead = 0.; vec3 c; vec2 cell;
    vec2 med = vec2(0., YS + .36); float rm = length(p - med);
    if (d > -.075) {                                                 // the border: ruby and gold pieces in a band
      float s = floor((p.y + atan(p.x, 2.) * 2.) / .2);
      c = mod(s, 3.) < 1. ? vec3(.95, .6, .1) : vec3(.72, .04, .06); cell = vec2(s, 7.);
      lead = max(smoothstep(.016, .006, abs(d + .075)), smoothstep(.012, .004, abs(fract((p.y + atan(p.x, 2.) * 2.) / .2) - .5) - .488));
    } else if (rm < .43) {                                           // the rose in the arch
      float a = atan(p.y - med.y, p.x - med.x), sec = floor((a + 3.14159) / (6.28318 / 8.)), r = rm + .05 * cos(a * 8.);
      if (rm < .1) { c = vec3(.98, .8, .3); cell = vec2(0, 1); }
      else if (r < .3) { c = mod(sec, 2.) < 1. ? vec3(.72, .04, .06) : vec3(.95, .55, .08); cell = vec2(sec, 2.); }
      else { c = vec3(.08, .2, .75); cell = vec2(sec, 3.); }
      float fa = fract((a + 3.14159) / (6.28318 / 8.));
      lead = max(max(smoothstep(.014, .004, abs(rm - .1)), smoothstep(.014, .004, abs(r - .3))), max(smoothstep(.014, .004, abs(rm - .43)), smoothstep(.04, .01, min(fa, 1. - fa)) * step(.1, rm)));
    } else {                                                         // diamond quarries with the odd roundel
      vec2 q = mat2(.7071, -.7071, .7071, .7071) * (p - vec2(0., Y0)) / .27;
      cell = floor(q); vec2 f = fract(q);
      float h = h1(cell);
      c = pal(h);
      lead = smoothstep(.06, .02, min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)));
      float rr = length(f - .5);
      if (h1(cell + 7.) < .18) { c = rr < .22 ? vec3(.98, .85, .45) : c; lead = max(lead, smoothstep(.05, .015, abs(rr - .22))); }
    }
    // each pane: streaks of thicker and thinner glass, a few seeds (bubbles)
    float streak = n2(vec2(p.x * 6. + h1(cell) * 9., p.y * 40.)) * .55 + n2(p * 23.) * .45;
    float seed = smoothstep(.92, .96, n2(p * 90. + cell * 3.1));
    c *= .65 + .6 * streak; c += seed * .25;
    lead = max(lead, smoothstep(.014, .004, -d));                    // the outer lead against the stone
    return vec4(c, 1. - lead);
  }
  vec3 sunDir() { return normalize(vec3(-.22 + SX, -.86, 1.)); }      // the way the light travels (in through the window, down)
  // light reaching a point in the room through the window: follow the ray back to the wall (z = 0)
  vec3 through(vec3 p, vec3 L) {
    if (p.z <= 0.) return vec3(0.);
    vec3 q = p - L * (p.z / L.z);
    vec4 g = glass(q.xy); return g.rgb * g.a;
  }
  void main() {
    vec2 uv = (gl_FragCoord.xy - .5 * RES) / RES.y;
    vec3 rd = normalize(FWD * 1.32 + RGT * uv.x + UPV * uv.y), ro = EYE;
    vec3 L = sunDir(), sunC = vec3(1., .9, .72) * SUN * (.55 + .45 * CLOUD);
    // what the eye hits: the floor (y = 0) or the wall (z = 0)
    float tf = rd.y < 0. ? -ro.y / rd.y : 1e9, tw = rd.z < 0. ? -ro.z / rd.z : 1e9, t = min(tf, tw);
    vec3 p = ro + rd * t, col;
    if (tw < tf) {
      vec4 g = glass(p.xy);
      if (g.a > 0. || win(p.xy) < 0.) {                              // the window itself, lit from behind
        float glow = 2.4 * SUN * (.55 + .45 * CLOUD);
        col = pow(g.rgb, vec3(1.35)) * g.a * glow + (1. - g.a) * vec3(.008, .007, .006);   // deep, saturated pot-metal
        col += vec3(1., .85, .6) * g.a * smoothstep(.5, .0, length(p.xy - vec2(SX * 2.2, 2.4))) * glow * .35;   // the sun behind the glass
      } else {                                                       // ashlar: courses of blocks
        vec2 b = p.xy * vec2(1.6, 3.2); b.x += floor(b.y) * .5; vec2 f = fract(b);
        float joint = .55 + .45 * smoothstep(.0, .025, min(min(f.x, 1. - f.x) / 1.6, min(f.y, 1. - f.y) / 3.2) * 3.);
        vec3 stone = vec3(.36, .32, .27) * (.7 + .4 * n2(floor(b) * 3.7)) * (.8 + .35 * n2(p.xy * 14.));
        // a dim nave: only a little light, bounced up from the pool on the floor
        col = stone * joint * (.02 + .045 * smoothstep(1.8, 0., p.y));
        col *= 1. - .6 * smoothstep(.0, -.15, win(p.xy)) ;
        col *= smoothstep(-.02, .1, win(p.xy)) * .8 + .2;            // the window reveal is in shadow
      }
    } else {                                                         // flagstones
      vec2 b = p.xz * vec2(.9, 1.1); vec2 f = fract(b);
      float joint = .5 + .5 * smoothstep(.0, .02, min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)));
      vec3 stone = vec3(.42, .38, .33) * (.7 + .4 * h1(floor(b))) * (.85 + .25 * n2(p.xz * 9.));
      // the pool: the window's colours, from a few points on the sun's disc for a soft edge
      vec3 pool = vec3(0.);
      for (int i = 0; i < 5; i++) { float a = float(i) * 1.2566; vec3 Lj = normalize(L + vec3(cos(a), 0., sin(a)) * .012 * (i == 0 ? 0. : 1.)); pool += through(p, Lj); }
      pool *= .2;
      col = stone * joint * (.02 + pool * sunC * 1.7 * max(-L.y, 0.));
    }
    // the air: march from the eye to the surface; dust in a beam scatters that pane's colour toward us
    vec3 fog = vec3(0.); float steps = 56., dt = min(t, 14.) / steps, j = h1(gl_FragCoord.xy + fract(T) * 13.);
    for (float i = 0.; i < 56.; i++) {
      vec3 s = ro + rd * (i + j) * dt;
      if (s.z <= .02 || s.y <= 0.) continue;
      vec3 l = through(s, L);
      if (l.r + l.g + l.b < .003) continue;
      float dust = .35 + .65 * n3(s * 1.7 + vec3(0., -T * .05, T * .03));
      float mote = smoothstep(.985, 1., n3(s * 24. + vec3(T * .08, T * .15, 0.)));   // single motes catching the light
      fog += l * (dust * dust * .06 + mote * .45) * dt;
    }
    // forward scattering: brighter looking toward the sun
    float phase = .4 + 1.6 * pow(max(dot(rd, -L), 0.), 6.);
    col += fog * sunC * DUST * phase * 2.2;
    // tone map and grade
    col = col * (2.51 * col + .03) / (col * (2.43 * col + .59) + .14);
    col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
    col *= 1. - .3 * dot(uv, uv);
    o = vec4(col, 1.);
  }`;
  const VS = `#version 300 es
  void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2. - 1., 0., 1.); }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const U = {}; ['RES', 'T', 'SX', 'SUN', 'DUST', 'CLOUD', 'EYE', 'FWD', 'RGT', 'UPV'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
  const vao = gl.createVertexArray();

  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(700000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // the pointer moves the sun; a resting mouse holds it there, leaving lets it drift on
  let px = 0, lastMove = -1e9, held = false;
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = ((e.clientX - b.left) / b.width) * 2 - 1; lastMove = performance.now(); held = e.pointerType === 'mouse'; };
  const onLeave = () => { held = false; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);

  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let raf, last = performance.now(), t = reduce ? 20 : 0, sx = 0, sv = 0;
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (!reduce) t += dt * PARAMS.speed;
    const live = held || now - lastMove < 1800;
    const target = live ? px * 0.38 : 0.3 * Math.sin(t * 0.09) + 0.05 * Math.sin(t * 0.23);
    if (reduce) { sx = 0.12; sv = 0; } else { const k = 6; sv += (k * k * (target - sx) - 2 * k * sv) * dt; sx += sv * dt; }
    // clouds: a slow, uneven dimming of the sun
    const cloud = reduce ? 1 : Math.min(1, Math.max(0, 0.72 + 0.28 * Math.sin(t * 0.21) * Math.sin(t * 0.077 + 1.3) + 0.15 * Math.sin(t * 0.5)));
    const a = W / H, back = Math.max(1, 1.45 / a);
    const eye = [1.85 * back, 1.62, 5.6 * back], at = [-0.5, 1.3, 1.9];
    const f = norm([at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    gl.viewport(0, 0, W, H); gl.useProgram(prog); gl.bindVertexArray(vao);
    gl.uniform2f(U.RES, W, H); gl.uniform1f(U.T, t); gl.uniform1f(U.SX, sx); gl.uniform1f(U.SUN, PARAMS.sun); gl.uniform1f(U.DUST, PARAMS.dust); gl.uniform1f(U.CLOUD, cloud);
    gl.uniform3fv(U.EYE, eye); gl.uniform3fv(U.FWD, f); gl.uniform3fv(U.RGT, r); gl.uniform3fv(U.UPV, u);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
  const ro2 = reduce ? new ResizeObserver(() => frame(performance.now())) : null; ro2?.observe(stage);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); ro2?.disconnect();
    canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
