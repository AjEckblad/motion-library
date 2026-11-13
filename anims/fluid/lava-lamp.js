// Lava lamp: a whole lamp in a dim room, raymarched in one fragment shader. The lamp is a lathe profile of capped
// cones: a chrome base and cap, and a tapered glass bottle between them. A ray that hits the glass picks up a Fresnel
// reflection of the room (a cool window strip, the warm glow of the lamp itself), bends into the liquid and marches
// through it, gathering a tint that glows warmest near the bulb, until it meets the wax or leaves out the back. The
// wax is 3D metaballs: a pool resting on the bottom plus a few blobs, each an ellipsoid, joined with a smooth minimum,
// so a blob leaving the pool draws out a neck that thins and pinches off, and two blobs that meet swell into one. Each
// blob carries a heat: the bulb warms what sits low, the top cools what rises, and heat sets its buoyancy, so blobs
// swell and lift off, rise slowly, cool and sink back; fast blobs stretch along their motion. The wax is lit from
// below and glows through where it is thin (its depth is sampled a little way inside the surface). Around the lamp,
// the table and the wall are lit by its warm light, with the base's shadow at its foot.
const PARAMS = { blobs: 8, speed: 0.5 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX = 14;
  // the bottle's profile: bottom of the glass, its widest point, the top, and the radii there
  const Y0 = -0.5, YM = -0.14, Y1 = 0.7, RW = 0.17, RM = 0.232, RT = 0.1;
  const radiusAt = y => y < YM ? RW + (RM - RW) * Math.max(0, (y - Y0) / (YM - Y0)) : RM + (RT - RM) * Math.min(1, (y - YM) / (Y1 - YM));

  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R; uniform float T; uniform vec4 B[${MAX}]; uniform vec4 E[${MAX}]; uniform int N;
  const float Y0 = ${Y0.toFixed(3)}, YM = ${YM.toFixed(3)}, Y1 = ${Y1.toFixed(3)}, RW = ${RW.toFixed(3)}, RM = ${RM.toFixed(3)}, RT = ${RT.toFixed(3)};
  const vec3 WAX = vec3(1., .24, .05), HOT = vec3(1., .66, .22);

  // iq's capped cone: height 2h around the origin, radius r1 at the bottom and r2 at the top
  float cone(vec3 p, float h, float r1, float r2) {
    vec2 q = vec2(length(p.xz), p.y), k1 = vec2(r2, h), k2 = vec2(r2 - r1, 2. * h);
    vec2 ca = vec2(q.x - min(q.x, q.y < 0. ? r1 : r2), abs(q.y) - h);
    vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0., 1.);
    float s = (cb.x < 0. && ca.y < 0.) ? -1. : 1.;
    return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
  }
  float glass(vec3 p) {
    float a = cone(p - vec3(0, (Y0 + YM) * .5, 0), (YM - Y0) * .5, RW, RM);
    float b = cone(p - vec3(0, (YM + Y1) * .5, 0), (Y1 - YM) * .5, RM, RT);
    return min(a, b) - .004;
  }
  float base(vec3 p) {
    float a = cone(p - vec3(0, -.76, 0), .24, .33, .168) - .006;
    float foot = cone(p - vec3(0, -.985, 0), .015, .345, .34) - .004;
    return min(a, foot);
  }
  float cap(vec3 p) { return cone(p - vec3(0, Y1 + .13, 0), .13, .112, .056) - .005; }
  float lamp(vec3 p, out float m) {
    float g = glass(p), b = base(p), c = cap(p);
    m = g < min(b, c) ? 0. : b < c ? 1. : 2.;
    return min(g, min(b, c));
  }
  float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
  float ellip(vec3 p, vec3 r) { float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.) / k1; }
  // the wax: a pool on the floor of the bottle, gently heaving, and the blobs, all melted together
  float wax(vec3 p, out float heat) {
    float d = (p.y - (Y0 + .065 + .006 * sin(p.x * 17. + T * .5) * sin(p.z * 15. - T * .4))) * .8;
    heat = 1. - smoothstep(-.02, .06, d);
    for (int i = 0; i < ${MAX}; i++) {
      if (i >= N) break;
      vec4 b = B[i]; float s = E[i].y;
      float e = ellip(p - b.xyz, vec3(b.w / sqrt(s), b.w * s, b.w / sqrt(s)));
      float w = clamp(.5 + (d - e) / .12, 0., 1.);
      heat = mix(heat, E[i].x, w);
      d = smin(d, e, .11);
    }
    return d;
  }
  float waxd(vec3 p) { float h; return wax(p, h); }
  // the room, as seen in reflections: dark, a tall cool window off to the left, the lamp's own warm light above
  vec3 env(vec3 d, float warmUp) {
    vec3 c = vec3(.014, .012, .016) + vec3(.05, .03, .045) * max(d.y, 0.);
    float win = smoothstep(.35, .5, -d.x) * smoothstep(-.1, .1, d.y) * smoothstep(.75, .55, d.y) * smoothstep(-.6, -.2, d.z);
    c += vec3(.55, .62, .78) * win;
    c += vec3(1., .42, .3) * .5 * smoothstep(.2, .9, d.y) * warmUp;
    c += vec3(.5, .2, .12) * .12 * smoothstep(0., -.4, d.y);                  // the warm-lit table below
    return c;
  }
  // the room itself: a table the lamp stands on and a wall behind, both lit by the lamp
  vec3 room(vec3 ro, vec3 rd) {
    float tt = rd.y < 0. ? (-1. - ro.y) / rd.y : 1e9, tw = rd.z < 0. ? (-1.7 - ro.z) / rd.z : 1e9;
    vec3 glowC = vec3(1., .42, .32);
    if (tt < tw) {
      vec3 p = ro + rd * tt; float d = length(p.xz);
      float lit = 1.1 / (1. + 8. * d * d) * smoothstep(.3, .62, d) + .03;      // the base shades its own foot
      float ao = .35 + .65 * smoothstep(.33, .5, d);
      vec3 wood = vec3(.1, .066, .052) * (.94 + .06 * sin(p.x * 95. + sin(p.z * 3.) * 4.) + .04 * sin(p.x * 23. + p.z * 2.));
      return wood * (glowC * lit + vec3(.03, .035, .05)) * ao;
    }
    vec3 p = ro + rd * tw; float d = length((p.xy - vec2(0., .05)) * vec2(1., .8));
    return vec3(.016, .015, .02) + glowC * .14 / (1. + 9. * d * d) + vec3(.012, .016, .028) * smoothstep(-2., -4., p.x);
  }
  // warm glow inside the liquid, strongest just above the bulb
  vec3 inglow(vec3 p) { float b = exp(-(p.y - Y0) * 3.4); return mix(vec3(.2, .05, .3), vec3(1., .28, .2), b) * (.14 + 1.9 * b); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  float h21(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

  void main() {
    vec2 uv = (gl_FragCoord.xy - .5 * R) / R.y;
    vec3 ro = vec3(0, .22, 4.3), ta = vec3(0, -.08, 0);
    vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
    vec3 rd = normalize(uv.x * rt + uv.y * up + 1.8 * fw);
    vec3 col = room(ro, rd);
    // only rays that pass near the lamp's axis march; everything else is just the room
    float bx = dot(ro.xz, rd.xz), by = dot(rd.xz, rd.xz), bc = dot(ro.xz, ro.xz) - .36 * .36, disc = bx * bx - by * bc;
    if (disc > 0.) {
      float t = max(0., (-bx - sqrt(disc)) / by), m = 0.; bool hit = false;
      for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t; float d = lamp(p, m);
        if (d < .0008) { hit = true; break; }
        t += d; if (t > 6.) break;
      }
      if (hit) {
        vec3 p = ro + rd * t; float mm;
        vec2 e = vec2(.0015, 0);
        vec3 n = normalize(vec3(lamp(p + e.xyy, mm) - lamp(p - e.xyy, mm), lamp(p + e.yxy, mm) - lamp(p - e.yxy, mm), lamp(p + e.yyx, mm) - lamp(p - e.yyx, mm)));
        float cosi = max(dot(-rd, n), 0.), F = .04 + .96 * pow(1. - cosi, 5.);
        if (m < .5) {
          // glass: bend into the liquid and march to the wax or out the back
          vec3 rr = refract(rd, n, 1. / 1.36), q = p - n * .006;
          float s = 0., heat = 0.; bool w = false; vec3 acc = vec3(0);
          for (int i = 0; i < 90; i++) {
            vec3 pp = q + rr * s;
            if (glass(pp) > 0. || pp.y > Y1 - .03) break;
            float dw = wax(pp, heat);
            if (dw < .0006) {
              // overshot into the wax: step back half way twice, so the surface sits where it really is
              if (dw < 0.) { s += dw * .5; if (waxd(q + rr * s) < 0.) s += dw * .5; wax(q + rr * s, heat); }
              w = true; break;
            }
            float st = clamp(dw, .002, .05); acc += inglow(pp) * st; s += st;
          }
          vec3 trans = exp(-vec3(1.3, 3.2, 1.6) * s);
          vec3 inner;
          if (w) {
            vec3 pp = q + rr * s, e2 = vec3(.002, 0, 0);
            vec3 wn = normalize(vec3(waxd(pp + e2.xyy) - waxd(pp - e2.xyy), waxd(pp + e2.yxy) - waxd(pp - e2.yxy), waxd(pp + e2.yyx) - waxd(pp - e2.yyx)));
            // how much wax lies just under the surface: thin edges and necks let the light through
            float th = 0.; for (int k = 1; k <= 3; k++) { float dk = .022 * float(k) + .006; th += smoothstep(0., 1., -waxd(pp - wn * dk) / dk); }
            float thin = 1. - th / 3., low = exp(-(pp.y - Y0) * 2.6);
            vec3 c = WAX * (.05 + .32 * low + .3 * max(-wn.y, 0.) * (.3 + low));
            c += mix(WAX, HOT, .2 + .5 * heat) * (thin * thin * (.42 + .9 * low) + heat * .16 * (.3 + low));
            c += vec3(1., .75, .6) * pow(max(dot(reflect(rr, wn), normalize(vec3(-.6, .5, .6))), 0.), 24.) * .12;
            inner = c;
          } else {
            // through the liquid and out: the room behind, bent a little
            vec3 pp = q + rr * s;
            inner = room(pp, normalize(mix(rd, rr, .5))) * .8;
          }
          col = inner * trans + acc * vec3(.55, .32, .5);
          col = col + (env(reflect(rd, n), .2) - col) * F;
          // crisp specular streaks from the window, and a bright Fresnel rim
          col += vec3(.75, .82, 1.) * pow(max(dot(reflect(rd, n), normalize(vec3(-.85, .25, .45))), 0.), 90.) * .9;
          col += vec3(.9, .5, .45) * pow(1. - cosi, 3.) * .1;
        } else {
          // chrome: the room and the glowing glass above it, with fine lathe lines running round it
          float br = .85 + .15 * h21(vec2(floor(p.y * 900.), 3.));
          vec3 rf = reflect(rd, n);
          vec3 c = env(rf, m < 1.5 ? 1. : .15) * vec3(1., .93, .86) * br;
          c += vec3(.75, .82, 1.) * pow(max(dot(rf, normalize(vec3(-.85, .25, .45))), 0.), 30.) * .8;
          // the bulb's glow spills over the top of the base, and the cap catches the lamp from below
          if (m < 1.5) c += vec3(1., .4, .25) * .5 * smoothstep(-.62, -.52, p.y) * max(n.y, 0.);
          else c += vec3(1., .4, .3) * .25 * max(-n.y, 0.);
          col = c * (.6 + .4 * F);
        }
      }
    }
    col = aces(col * 1.15);
    o = vec4(pow(col, vec3(1. / 2.2)) + (h21(gl_FragCoord.xy) - .5) / 255., 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n);
  const uB = u('B'), uE = u('E'), uN = u('N'), uR = u('R'), uT = u('T');
  let dirty = true;
  const resize = () => {
    const cw = stage.clientWidth || 1, ch = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 1.5, Math.sqrt(1600000 / (cw * ch)));
    canvas.width = cw * d | 0; canvas.height = ch * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); dirty = true;
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // the blobs: position, velocity, size and heat. The bulb heats what sits low, the top cools what rises, and heat
  // is buoyancy
  const n = Math.max(1, Math.min(MAX, Math.round(PARAMS.blobs)));
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const blobs = Array.from({ length: n }, (_, i) => {
    const y = Y0 + 0.08 + (Y1 - Y0 - 0.2) * ((i * 0.618) % 1), a = rnd() * 6.283, r = rnd() * 0.08;
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, vx: 0, vy: 0, vz: 0, r0: 0.05 + 0.035 * rnd(), h: rnd() * 0.8, ph: rnd() * 100, k: 0.55 + 0.9 * rnd(), go: 0.8 + 0.1 * rnd() };
  });
  const B = new Float32Array(MAX * 4), E = new Float32Array(MAX * 4);
  const sim = (dt, t) => {
    for (const b of blobs) {
      const top = Y1 - 0.06;
      const low = b.y < Y0 + 0.13;
      if (low) b.h += dt * 0.2 * b.k * (1.05 - b.h);                                      // warming on the bulb
      else b.h -= dt * (0.02 + 0.3 * Math.max(0, (b.y - (top - 0.3)) / 0.3)) * b.h;    // cooling, fastest near the top
      const r = b.r0 * (0.8 + 0.4 * b.h);
      // the pool holds a blob until it is properly hot, then it swells and lets go
      if (low && b.h < b.go) b.vy = Math.min(b.vy, 0); else b.vy += 0.5 * (b.h - 0.55) * dt;
      // a slow wander, a pull toward the middle, and the glass wall
      b.vx += (Math.sin(t * 0.37 + b.ph) * 0.02 - b.x * 0.15) * dt; b.vz += (Math.cos(t * 0.31 + b.ph * 1.3) * 0.02 - b.z * 0.15) * dt;
      for (const c of blobs) if (c !== b) {
        const dx = b.x - c.x, dy = b.y - c.y, dz = b.z - c.z, d = Math.hypot(dx, dy, dz) + 1e-4, m = (b.r0 + c.r0) * 0.9;
        if (d < m) { const f = (m - d) / d * 0.6 * dt; b.vx += dx * f; b.vy += dy * f * 0.3; b.vz += dz * f; }
      }
      const k = Math.exp(-dt * 1.4); b.vx *= k; b.vy *= k; b.vz *= k;
      b.vy = Math.max(-0.14, Math.min(0.14, b.vy));
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      const lo = Y0 + r * 0.35, hi = top - r * 0.9;
      if (b.y < lo) { b.y = lo; b.vy = Math.max(0, b.vy); } if (b.y > hi) { b.y = hi; b.vy = Math.min(0, b.vy); }
      const rr = Math.hypot(b.x, b.z), lim = Math.max(0, radiusAt(b.y) - r * 0.95);
      if (rr > lim) { b.x *= lim / rr; b.z *= lim / rr; b.vx *= 0.5; b.vz *= 0.5; }
      b.r = r;
    }
  };
  const upload = t => {
    blobs.forEach((b, i) => {
      B[i * 4] = b.x; B[i * 4 + 1] = b.y; B[i * 4 + 2] = b.z; B[i * 4 + 3] = b.r;
      E[i * 4] = b.h; E[i * 4 + 1] = 1 + Math.min(0.45, Math.abs(b.vy) * 5);
    });
    gl.uniform4fv(uB, B); gl.uniform4fv(uE, E); gl.uniform1i(uN, n); gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let raf, last = null, st = 0;
  // reduced motion: let the wax run for a while up front, then hold one still frame
  if (reduce) for (let i = 0; i < 2400; i++) { st += 1 / 30; sim(1 / 30, st); }
  function frame(now) {
    if (!reduce) {
      if (last === null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000) * PARAMS.speed * 2; last = now;
      st += dt; sim(dt, st); upload(st);
    } else if (dirty) { upload(st); dirty = false; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
