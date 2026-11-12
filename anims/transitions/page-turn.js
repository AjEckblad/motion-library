// Page turn: an open book on a desk, and every few seconds the right-hand page lifts from its corner, bends over the
// spine like real paper and settles on the left, uncovering the next spread. Drag the right page to turn it yourself;
// let go past halfway and it falls over, short of that and it springs back.
// The page is a grid that never stretches: each row is built outward from the spine as a chain of short segments, and
// each segment's angle is the turn angle plus a bend that grows toward the outer edge (more at the lower corner, the
// one a hand would hold), so the paper arcs and twists while every row keeps its length. Normals come from the grid,
// the front shows this page and the back the next one, and the pages underneath get the turning page's shadow: each
// frame the page is projected along the light onto the desk, row by row, into a small texture the flat pages read.
// Every page (type, figures, folios) is drawn in code into canvases.
const PARAMS = { every: 4.5, curl: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- the pages, drawn in code
  const PW = 720, PH = 1000, ASPECT = PH / PW, H = ASPECT;        // page: 1 wide, H tall in world units
  const serif = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';
  const TEXT = {
    timing: 'Timing is the first decision. Too fast and the change goes unseen; too slow and it stands between the reader and the page. Most interface motion lives between a tenth and a third of a second, quick enough to feel like an answer and long enough to show where things went. A menu that opens in a fifth of a second feels instant, yet the eye still sees it grow from the button that summoned it.',
    easing: 'Easing is the second. Nothing in the world starts or stops at full speed. A ball rolling to rest gives up its speed gradually; a door swings open quickly and settles slowly. Curves that start fast and land softly feel responsive, because the change begins the moment it is asked for, and the slow ending gives the eye time to arrive with it.',
    restraint: 'The third decision is restraint. A page that turns like paper is a pleasure the first time and a delay the hundredth. Good motion knows how often it will be seen, and it grows shorter, quieter, or disappears altogether as it becomes familiar. What remains should explain something: where a thing came from, where it went, or that the interface heard you.',
    craft: 'None of this is visible when it works. Nobody praises a drawer for sliding, and nobody notices a list that settles into place. The craft is in the absence of friction: in the curve that matches the gesture, the shadow that says which sheet is on top, and the paper that bends the way paper bends.',
  };
  const paper = (g, seed) => {
    g.fillStyle = '#f2ece0'; g.fillRect(0, 0, PW, PH);
    let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '120,100,70' : '255,255,255'},${(0.03 + rnd() * 0.05).toFixed(3)})`; g.fillRect(rnd() * PW, rnd() * PH, 1 + rnd() * 1.5, 1 + rnd() * 1.5); }
  };
  const folio = (g, n, left) => {
    g.fillStyle = '#8a7f70'; g.font = `500 17px ${serif}`; g.textAlign = 'center'; g.fillText(String(n), PW / 2, PH - 46);
    g.font = `500 13px ${serif}`; g.textAlign = left ? 'left' : 'right';
    g.save(); g.letterSpacing = '3px'; g.fillText('ON MOTION', left ? 76 : PW - 76, 58); g.restore();
  };
  // justified paragraph: greedy lines, the space stretched so both edges are straight (last line ragged)
  const para = (g, text, x, y, w, size, lead, dropCap = false) => {
    g.font = `400 ${size}px ${serif}`; g.fillStyle = '#2a2621'; g.textAlign = 'left';
    const words = text.split(' '); let line = [], lines = [];
    let indent = 0;
    if (dropCap) {
      g.save(); g.font = `400 ${size * 3.3}px ${serif}`; g.fillStyle = '#7a2e1f'; g.fillText(words[0][0], x, y + size * 1.9); indent = g.measureText(words[0][0]).width + 10; g.restore();
      words[0] = words[0].slice(1);
    }
    const widthOf = l => g.measureText(l.join(' ')).width;
    for (const wd of words) {
      const avail = w - (lines.length < 2 && dropCap ? indent : 0);
      if (line.length && widthOf([...line, wd]) > avail) { lines.push(line); line = []; }
      line.push(wd);
    }
    if (line.length) lines.push(line);
    lines.forEach((l, i) => {
      const ox = x + (i < 2 && dropCap ? indent : 0), avail = w - (i < 2 && dropCap ? indent : 0);
      if (i === lines.length - 1 || l.length === 1) { g.fillText(l.join(' '), ox, y + i * lead); return; }
      const ws = l.map(t => g.measureText(t).width), gap = (avail - ws.reduce((a, b) => a + b, 0)) / (l.length - 1);
      let cx = ox; l.forEach((t, k) => { g.fillText(t, cx, y + i * lead); cx += ws[k] + gap; });
    });
    return y + lines.length * lead;
  };
  const heading = (g, txt, y, size = 40) => { g.fillStyle = '#1d1a16'; g.font = `400 ${size}px ${serif}`; g.textAlign = 'left'; g.fillText(txt, 76, y); };
  const caption = (g, txt, y) => { g.fillStyle = '#6b6156'; g.font = `italic 400 18px ${serif}`; g.textAlign = 'left'; g.fillText(txt, 76, y); };
  const DRAW = [
    g => { // chapter opener: a linocut sun over hills
      g.fillStyle = '#1d1a16'; g.textAlign = 'center'; g.font = `400 64px ${serif}`; g.fillText('On Motion', PW / 2, 250);
      g.font = `italic 400 24px ${serif}`; g.fillStyle = '#6b6156'; g.fillText('Notes on movement in interfaces', PW / 2, 300);
      // a round linocut: a sun rising in rings behind three ridges
      const cx = PW / 2, cy = 610, R = 205;
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#efe0c8'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      for (let r = 250; r > 20; r -= 15) { g.beginPath(); g.arc(cx, cy + 70, r, Math.PI, 0); g.strokeStyle = (r / 15 | 0) % 2 ? '#c9572f' : '#e2a14a'; g.lineWidth = 6.5; g.stroke(); }
      g.fillStyle = '#c9572f'; g.beginPath(); g.arc(cx, cy + 70, 34, Math.PI, 0); g.fill();
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(cx - R, cy + R);
        for (let x = cx - R; x <= cx + R; x += 5) g.lineTo(x, cy + 40 + k * 46 + Math.sin(x * 0.013 + k * 2.3) * 20 - (k === 0 ? Math.cos((x - cx) * 0.008) * 34 : 0));
        g.lineTo(cx + R, cy + R); g.closePath(); g.fillStyle = ['#7d7466', '#4d463d', '#2a2621'][k]; g.fill();
      }
      g.restore();
      g.strokeStyle = '#2a2621'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    },
    g => { heading(g, 'I. Timing', 170); para(g, TEXT.timing, 76, 240, PW - 152, 25, 40, true); },
    g => { // figure: linear against ease-out
      heading(g, 'Fig. 1', 170, 30);
      const x0 = 110, y0 = 690, w = PW - 220, h = 420;
      g.strokeStyle = '#2a2621'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0 - h); g.lineTo(x0, y0); g.lineTo(x0 + w, y0); g.stroke();
      g.setLineDash([6, 8]); g.strokeStyle = '#8a7f70'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 - h); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#7a2e1f'; g.lineWidth = 5; g.beginPath();
      for (let i = 0; i <= 100; i++) { const t = i / 100, e = 1 - Math.pow(1 - t, 3.4); g.lineTo(x0 + t * w, y0 - e * h); } g.stroke();
      g.fillStyle = '#6b6156'; g.font = `italic 400 19px ${serif}`; g.fillText('time', x0 + w - 40, y0 + 34); g.save(); g.translate(x0 - 22, y0 - h + 70); g.rotate(-Math.PI / 2); g.fillText('progress', 0, 0); g.restore();
      caption(g, 'An ease-out curve (red) against a linear one: most of', 790); caption(g, 'the change happens at once, the rest lands softly.', 820);
    },
    g => { heading(g, 'II. Easing', 170); para(g, TEXT.easing, 76, 240, PW - 152, 25, 40, true); },
    g => { // figure: a bouncing ball's arcs
      heading(g, 'Fig. 2', 170, 30);
      g.strokeStyle = '#2a2621'; g.lineWidth = 2; g.beginPath(); g.moveTo(90, 700); g.lineTo(PW - 90, 700); g.stroke();
      let x = 110, hgt = 380, span = 210;
      g.strokeStyle = '#7a2e1f'; g.lineWidth = 3;
      for (let k = 0; k < 6; k++) { g.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40; g.lineTo(x + t * span, 700 - 4 * hgt * t * (1 - t)); } g.stroke(); x += span; hgt *= 0.52; span *= 0.72; }
      g.fillStyle = '#1d1a16'; g.beginPath(); g.arc(110 + 105, 700 - 380 - 18, 18, 0, Math.PI * 2); g.fill();
      caption(g, 'Each bounce keeps about half its height: the eye', 790); caption(g, 'reads weight from how quickly the arcs shrink.', 820);
    },
    g => { heading(g, 'III. Restraint', 170); para(g, TEXT.restraint, 76, 240, PW - 152, 25, 40, true); },
    g => { // pull quote
      g.fillStyle = '#7a2e1f'; g.font = `400 150px ${serif}`; g.textAlign = 'left'; g.fillText('“', 70, 340);
      g.fillStyle = '#1d1a16'; g.font = `italic 400 44px ${serif}`;
      ['The best motion', 'knows how often', 'it will be seen.'].forEach((l, i) => g.fillText(l, 110, 400 + i * 62));
      g.fillStyle = '#8a7f70'; g.font = `400 20px ${serif}`; g.fillText('— from the chapter on restraint', 110, 640);
    },
    g => { heading(g, 'Coda', 170); const y = para(g, TEXT.craft, 76, 240, PW - 152, 25, 40, true); g.fillStyle = '#7a2e1f'; g.fillRect(PW / 2 - 5, y + 30, 10, 10); },
  ];
  const NP = DRAW.length, pageTex = [];
  const pc = document.createElement('canvas'); pc.width = PW; pc.height = PH; const pg = pc.getContext('2d');
  for (let i = 0; i < NP; i++) {
    paper(pg, i + 1); DRAW[i](pg); folio(pg, 12 + i, i % 2 === 0);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pc); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    pageTex.push(t);
  }

  // ---- shaders: one program, a mode per surface
  const VS = `#version 300 es
  layout(location=0) in vec3 p; layout(location=1) in vec3 n; layout(location=2) in vec2 c;
  uniform mat4 VP; out vec3 wp, wn; out vec2 tc;
  void main() { wp = p; wn = n; tc = c; gl_Position = VP * vec4(p, 1.); }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 wp, wn; in vec2 tc; out vec4 o;
  uniform sampler2D FRONT, BACK, SH; uniform int MODE; uniform vec3 EYE, L; uniform float H;
  vec3 lit(vec3 base, vec3 n) {
    vec3 v = normalize(EYE - wp), h = normalize(L + v);
    float d = max(dot(n, L), 0.), s = pow(max(dot(n, h), 0.), 24.) * .05;
    return base * (.5 + .58 * d) + s;
  }
  float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec3 col;
    if (MODE == 3) {                                                  // the desk: dark, with a pool of lamplight
      float r = length(wp.xy * vec2(.42, .58) - vec2(-.05, .05));
      col = mix(vec3(.018, .018, .02), vec3(.105, .085, .065), exp(-r * r * 3.2)) * (.95 + .05 * hash(floor(wp.xy * 300.)));
    } else if (MODE == 2) {                                           // the cover: dark blue cloth, a hair larger than the pages
      col = lit(vec3(.07, .085, .12) * (.9 + .1 * hash(floor(wp.xy * 500.))), vec3(0, 0, 1));
    } else if (MODE == 0) {                                           // a page lying flat
      vec3 base = texture(FRONT, tc).rgb;
      float g = abs(wp.x);
      base *= 1. - .42 * exp(-g / .035) - .1 * exp(-g / .2);          // the gutter: pages dip into the spine
      base *= 1. - .05 * smoothstep(.9, 1., g);                       // and darken a touch toward the fore-edge
      float sh = texture(SH, vec2(wp.x * .5 + .5, 1. - tc.y)).r;      // the turning page's shadow (rows run bottom to top)
      col = lit(base, vec3(0, 0, 1)) * (1. - sh);
    } else {                                                          // the turning page: this page in front, the next on the back
      vec3 n = normalize(wn);
      vec3 base = gl_FrontFacing ? texture(FRONT, tc).rgb : texture(BACK, vec2(1. - tc.x, tc.y)).rgb;
      if (!gl_FrontFacing) n = -n;
      // paper lets a little light through: the side away from the lamp glows faintly with the other side's tone
      float through = max(dot(-n, L), 0.) * .18;
      col = lit(base, n) + base * through;
    }
    o = vec4(pow(col, vec3(1. / 2.2)), 1.);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const U = {}; ['VP', 'FRONT', 'BACK', 'SH', 'MODE', 'EYE', 'L', 'H'].forEach(k => U[k] = gl.getUniformLocation(prog, k));

  // a mesh: positions + normals (dynamic for the turning page), texture coords
  const mesh = (pos, nrm, uv, idx, dynamic) => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const mk = (data, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, dynamic && loc < 2 ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return b; };
    const bp = mk(pos, 0, 3), bn = mk(nrm, 1, 3); mk(uv, 2, 2);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    return { vao, bp, bn, n: idx.length };
  };
  const quad = (x0, y0, x1, y1, z, u0 = 0, u1 = 1) => mesh(new Float32Array([x0, y0, z, x1, y0, z, x0, y1, z, x1, y1, z]), new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
    new Float32Array([u0, 1, u1, 1, u0, 0, u1, 0]), new Uint16Array([0, 1, 2, 2, 1, 3]), false);
  const desk = quad(-6, -5, 6, 5, -0.03), cover = quad(-1.035, -H / 2 - 0.03, 1.035, H / 2 + 0.03, -0.012);
  const leftPage = quad(-1, -H / 2, 0, H / 2, 0), rightPage = quad(0, -H / 2, 1, H / 2, 0);
  // the turning page: NU columns out from the spine, NV rows up the page
  const NU = 60, NV = 40, VN = (NU + 1) * (NV + 1);
  const tp = new Float32Array(VN * 3), tn = new Float32Array(VN * 3), tuv = new Float32Array(VN * 2);
  for (let j = 0; j <= NV; j++) for (let k = 0; k <= NU; k++) { const i = j * (NU + 1) + k; tuv[i * 2] = k / NU; tuv[i * 2 + 1] = 1 - j / NV; }
  const tidx = new Uint16Array(NU * NV * 6);
  for (let j = 0, q = 0; j < NV; j++) for (let k = 0; k < NU; k++) { const a = j * (NU + 1) + k; tidx[q++] = a; tidx[q++] = a + 1; tidx[q++] = a + NU + 1; tidx[q++] = a + NU + 1; tidx[q++] = a + 1; tidx[q++] = a + NU + 2; }
  const turning = mesh(tp, tn, tuv, tidx, true);

  // the shadow map: SX samples across the spread × (NV + 1) rows
  const SX = 160, shadow = new Float32Array(SX * (NV + 1)), tmp = new Float32Array(SX);
  const shTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, SX, NV + 1, 0, gl.RED, gl.FLOAT, shadow);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const LV = (() => { const l = [-0.32, -0.38, 1], m = Math.hypot(...l); return l.map(x => x / m); })();

  // bend the page: angle theta at the spine (0 flat on the right, PI flat on the left)
  const curl = Math.max(0, Math.min(2, PARAMS.curl));
  function build(theta, lead) {
    const du = 1 / NU, lift = Math.sin(theta);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV, corner = 1 + 0.5 * (1 - v);                // the lower corner leads: that's where the hand is
      let x = 0, z = 0.0025, phi;
      for (let k = 0; k <= NU; k++) {
        const u = k / NU, i = j * (NU + 1) + k;
        tp[i * 3] = x; tp[i * 3 + 1] = (v - 0.5) * H; tp[i * 3 + 2] = z;
        // the bend: outer paper runs ahead while it's lifted (lead > 0) or trails while it falls (lead < 0)
        phi = theta + curl * lead * lift * Math.pow(u, 1.6) * corner * 0.9;
        phi = Math.min(Math.PI - 0.004 * (1 - u), Math.max(0.0, phi));
        x += Math.cos(phi) * du; z += Math.sin(phi) * du;
      }
    }
    // normals from the grid
    const P = (j, k) => (Math.min(NV, Math.max(0, j)) * (NU + 1) + Math.min(NU, Math.max(0, k))) * 3;
    for (let j = 0; j <= NV; j++) for (let k = 0; k <= NU; k++) {
      const a = P(j, k + 1), b = P(j, k - 1), c = P(j + 1, k), d = P(j - 1, k);
      const ux = tp[a] - tp[b], uy = tp[a + 1] - tp[b + 1], uz = tp[a + 2] - tp[b + 2], vx = tp[c] - tp[d], vy = tp[c + 1] - tp[d + 1], vz = tp[c + 2] - tp[d + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const m = Math.hypot(nx, ny, nz) || 1;
      const i = (j * (NU + 1) + k) * 3; tn[i] = nx / m; tn[i + 1] = ny / m; tn[i + 2] = nz / m;
    }
    // its shadow on the flat pages: project each row along the light onto the desk, keep the nearest height
    const sx = -LV[0] / LV[2];
    for (let j = 0; j <= NV; j++) {
      tmp.fill(1e9);
      for (let k = 0; k < NU; k++) {
        const i0 = (j * (NU + 1) + k) * 3, i1 = i0 + 3;
        const z0 = tp[i0 + 2], z1 = tp[i1 + 2], x0 = tp[i0] + z0 * sx, x1 = tp[i1] + z1 * sx;
        let a = Math.round((Math.min(x0, x1) * 0.5 + 0.5) * (SX - 1)), b = Math.round((Math.max(x0, x1) * 0.5 + 0.5) * (SX - 1));
        a = Math.max(0, a); b = Math.min(SX - 1, b);
        for (let s = a; s <= b; s++) { const f = b > a ? (s - a) / (b - a) : 0, zz = x1 >= x0 ? z0 + (z1 - z0) * f : z1 + (z0 - z1) * f; if (zz < tmp[s]) tmp[s] = zz; }
      }
      // darker where the paper is close, softer and lighter as it rises
      const row = shadow.subarray(j * SX, (j + 1) * SX);
      for (let s = 0; s < SX; s++) row[s] = tmp[s] < 1e8 ? 0.62 * Math.exp(-tmp[s] * 1.7) * Math.min(1, tmp[s] * 30) : 0;
      for (let pass = 0; pass < 3; pass++) { for (let s = 0; s < SX; s++) tmp[s] = row[s]; for (let s = 0; s < SX; s++) { let acc = 0, c = 0; for (let q = -3; q <= 3; q++) { const r = s + q; if (r >= 0 && r < SX) { acc += tmp[r]; c++; } } row[s] = acc / c; } }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, turning.bp); gl.bufferSubData(gl.ARRAY_BUFFER, 0, tp);
    gl.bindBuffer(gl.ARRAY_BUFFER, turning.bn); gl.bufferSubData(gl.ARRAY_BUFFER, 0, tn);
    gl.bindTexture(gl.TEXTURE_2D, shTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SX, NV + 1, gl.RED, gl.FLOAT, shadow);
  }

  let W = 1, Hh = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.75, Math.sqrt(1700000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); Hh = canvas.height = Math.max(1, (h * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  const persp = (fov, a, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; };
  const lookAt = (e, c, up) => { const z = norm(sub(e, c)), x = norm(cross(up, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]; };
  const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  let VP = null, EYE = [0, 0, 3];
  const camera = () => {
    const a = W / Hh, d = Math.max(2.55, 3.25 / a);
    EYE = [0, -0.5 * d, 0.87 * d];
    VP = mul(persp(0.72, a, 0.05, 30), lookAt(EYE, [0, 0.07, 0.12], [0, 1, 0]));
  };

  // ---- turning: a spring on the spine angle. Auto turns every few seconds; a drag sets the target directly
  let spread = 0, theta = 0, vel = 0, target = 0, dragging = false, nextAuto = 1.6, t = 0;
  const pickRay = e => {                                               // pointer → point on the desk plane z = 0
    const b = canvas.getBoundingClientRect(), nx = ((e.clientX - b.left) / b.width) * 2 - 1, ny = 1 - ((e.clientY - b.top) / b.height) * 2;
    const a = W / Hh, tf = Math.tan(0.36), f = norm(sub([0, 0.07, 0.12], EYE)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    const dir = norm([f[0] + (r[0] * nx * a + u[0] * ny) * tf, f[1] + (r[1] * nx * a + u[1] * ny) * tf, f[2] + (r[2] * nx * a + u[2] * ny) * tf]);
    const s = -EYE[2] / dir[2]; return [EYE[0] + dir[0] * s, EYE[1] + dir[1] * s];
  };
  const onDown = e => { const [x, y] = pickRay(e); if (x > 0.05 && x < 1.05 && Math.abs(y) < H / 2 + 0.05 && theta < 0.3) { dragging = true; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; onMove(e); } };
  const onMove = e => { if (!dragging) return; const [x] = pickRay(e); target = Math.acos(Math.max(-1, Math.min(1, x))); };
  const onUp = () => { if (!dragging) return; dragging = false; canvas.style.cursor = 'grab'; target = theta > Math.PI / 2 || vel > 2.2 ? Math.PI : 0; nextAuto = t + PARAMS.every + 1; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);

  const draw = (m, mode, front, back) => {
    gl.uniform1i(U.MODE, mode);
    if (front != null) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, front); }
    if (back != null) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, back); }
    gl.bindVertexArray(m.vao); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
  };
  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now; t += dt;
    if (!dragging && !reduce && t > nextAuto && target === 0 && theta < 0.01) target = Math.PI;
    // a stiff, nearly critical spring: the page lifts slowly, swings over and lands without bouncing through the book
    const w = (dragging ? 7 : 3.1) * Math.max(0.3, PARAMS.speed), k = w * w, c = 2 * w * (dragging ? 1.1 : 0.94);   // a hand follows fast; on its own the page takes about a second
    for (let i = 0; i < 4; i++) { const a = k * (target - theta) - c * vel; vel += a * dt / 4; theta += vel * dt / 4; }
    if (theta > Math.PI) { theta = Math.PI; vel = 0; }
    if (theta < 0) { theta = 0; vel = Math.max(0, vel); }
    if (!dragging && target === Math.PI && theta > Math.PI - 0.003) { spread++; theta = 0; vel = 0; target = 0; nextAuto = t + PARAMS.every; }
    // the bend leads on the way up and trails on the way down, and eases out as the page lands
    const lead = reduce ? 0.9 : Math.max(-0.9, Math.min(1, vel * 0.22 + (theta < Math.PI / 2 ? 0.45 : -0.15)));
    build(reduce ? 0.62 : theta, reduce ? 0.75 : lead);
    camera();
    gl.viewport(0, 0, W, Hh); gl.clearColor(0.03, 0.028, 0.027, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(U.VP, false, VP); gl.uniform3fv(U.EYE, EYE); gl.uniform3fv(U.L, LV); gl.uniform1f(U.H, H);
    gl.uniform1i(U.FRONT, 0); gl.uniform1i(U.BACK, 1); gl.uniform1i(U.SH, 2);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, shTex);
    const pgAt = i => pageTex[((i % NP) + NP) % NP];
    const L0 = spread * 2, R0 = L0 + 1;                                  // this spread: left page L0, right page R0
    draw(desk, 3); draw(cover, 2);
    draw(leftPage, 0, pgAt(L0)); draw(rightPage, 0, pgAt(R0 + 2));    // under the turning page: the next right page
    draw(turning, 1, pgAt(R0), pgAt(R0 + 1));
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
  const ro2 = reduce ? new ResizeObserver(() => frame(performance.now())) : null; ro2?.observe(stage);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); ro2?.disconnect();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
