// Ocean at sunset: a raymarched heightfield. The surface is a stack of sharp-crested waves, each one dragging
// the next along its slope so crests bunch up like real swell. Every pixel reflects the sky with Fresnel,
// lets the low sun glow through thin crests, and catches the sun's glint on its facets.
const PARAMS = { waves: 1, sun: 0.5, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T, D, SY;
  vec3 SUN;
  // sharp-crested waves; each one drags the sample point along its slope (that bunches the crests)
  float waves(vec2 p, int it) {
    float w = 1., ws = 0., sum = 0., f = 1., t = T, a = 0.;
    for (int i = 0; i < 40; i++) {
      if (i >= it) break;
      vec2 d = vec2(sin(a), cos(a));
      float x = dot(d, p) * f + t, wave = exp(sin(x) - 1.), dx = wave * cos(x);
      sum += wave * w; ws += w; p -= d * dx * w * .38;
      a += 1232.399963; w = mix(w, 0., .2); f *= 1.18; t *= 1.07;
    }
    return sum / ws;
  }
  float hgt(vec2 p, int it) { return waves(p * .55, it) * D - D; }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
  vec3 sky(vec3 d) {
    float y = max(d.y, 0.), sd = max(dot(d, SUN), 0.), low = 1. - smoothstep(.02, .3, SY);
    vec3 top = mix(vec3(.1, .2, .5), vec3(.04, .05, .18), low), mid = mix(vec3(.8, .5, .45), vec3(.62, .2, .26), low), hor = mix(vec3(1., .7, .45), vec3(1., .42, .14), low);
    vec3 c = mix(hor, mid, smoothstep(0., .06, y)); c = mix(c, top, smoothstep(.04, .3, y));
    c += vec3(1., .38, .1) * pow(sd, 4.) * .22 + vec3(1., .55, .22) * pow(sd, 18.) * .35 + vec3(1., .78, .5) * pow(sd, 160.) * 1.4;
    c += vec3(1., .9, .7) * smoothstep(.99935, .9997, sd) * 12.;                       // the sun's disc (HDR, tonemapped later)
    vec2 q = d.xz / (y + .06) * .6 + vec2(T * .01, 0);                                   // streaky clouds lit from below
    float cl = smoothstep(.42, .75, fbm(q * vec2(.6, 2.2))) * smoothstep(.0, .08, y) * (1. - smoothstep(.25, .6, y));
    c = mix(c, mix(vec3(.3, .12, .22), vec3(1., .55, .3), pow(sd, 4.)), cl * .8);
    return c;
  }
  vec3 normalAt(vec2 p, float e) {
    float h = hgt(p, 34);
    return normalize(cross(vec3(e, hgt(p + vec2(e, 0), 34) - h, 0), vec3(0, hgt(p + vec2(0, -e), 34) - h, -e)) * vec3(1, 1, 1));
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    SUN = normalize(vec3(-.18, SY, 1.));
    vec2 q = (uv - .5) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(0, 2.1 + .12 * sin(T * .4), T * .9);
    float roll = .025 * sin(T * .33);
    vec3 rd = normalize(vec3(q.x * cos(roll) - q.y * sin(roll), q.x * sin(roll) + q.y * cos(roll) - .1, 1.15));
    vec3 col;
    if (rd.y >= 0.) col = sky(rd);
    else {
      // march between the top (y = 0) and bottom (y = -D) planes of the wave slab
      vec3 pos = ro + rd * (ro.y / -rd.y), end = ro + rd * ((ro.y + D) / -rd.y);
      vec3 dir = normalize(end - pos);
      for (int i = 0; i < 56; i++) {
        float h = hgt(pos.xz, 12);
        if (h + .01 > pos.y) break;
        pos += dir * (pos.y - h);
      }
      float dist = length(pos - ro);
      vec3 n = normalAt(pos.xz, .01);
      n = normalize(mix(n, vec3(0, 1, 0), min(1., sqrt(dist * .012) * 1.1)));          // calm the far field so it does not shimmer
      float fr = .04 + .96 * pow(1. - max(0., dot(n, -rd)), 5.);
      vec3 rf = reflect(rd, n); rf.y = abs(rf.y);
      vec3 refl = sky(rf);
      float crest = clamp((pos.y + D) / D, 0., 1.);
      vec3 deep = vec3(.01, .035, .06) + vec3(.02, .14, .16) * pow(crest, 3.) * pow(max(0., dot(rd, SUN)), 2.) * 2.5;   // low sun glows through thin crests
      vec3 c = mix(deep, refl, fr);
      c += vec3(1., .8, .55) * pow(max(0., dot(rf, SUN)), 900.) * 30. * (1. - smoothstep(.0, .15, SY - .1));             // glint
      col = mix(c, sky(normalize(vec3(rd.x, .001, rd.z))), 1. - exp(-dist * .0028));
    }
    col = aces(col * .72);
    col *= 1. - .25 * pow(length(uv - .5) * 1.25, 2.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n), uR = u('R'), uT = u('T'), uD = u('D'), uSY = u('SY');
  // a heavy shader: render at 1x pixels at most and let the browser scale
  const resize = () => { const d = Math.min(devicePixelRatio, 1); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, (now - t0) / 1000 * PARAMS.speed + 40);
    gl.uniform1f(uD, 0.55 * PARAMS.waves); gl.uniform1f(uSY, 0.005 + 0.1 * PARAMS.sun);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
