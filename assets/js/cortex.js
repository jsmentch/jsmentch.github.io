/*
 * Cortex: a slowly turning 3D cortical surface with a small network of
 * neurons floating above it. Monochrome at rest; colour arrives with activity.
 *
 * Two layers
 * 1. Surface (WebGL, one fragment shader). A very large sphere whose curved
 *    horizon enters the hero. Folds come from a 3D random-wave field sampled
 *    on the sphere: its zero lines are sulci, the rest is shaded as rounded
 *    gyri with real lighting. The sphere turns on its own and with the pointer.
 * 2. Neurons (Canvas 2D). A few cell types built from soft spring chains, so
 *    they sway and flop when pushed. They are wired into three networks, and
 *    some send an axon down to the surface.
 *
 * Interaction
 * - Move: the pointer is a small lamp on the surface, tilts the whole scene,
 *   pushes dendrites around, and makes a neuron fire if you brush its body.
 * - Press: a wave travels over the surface. Where it meets an axon, a pulse
 *   runs up into the network; neurons fire one after another and send their
 *   own smaller waves back down.
 * - Hold: charge builds under the pointer and pulls neurons in. Let go and it
 *   bursts.
 *
 * No dependencies. Sound comes from audio.js.
 */
(function () {
  "use strict";

  var canvas = document.querySelector("[data-cortex]");
  if (!canvas) return;
  var ncanvas = document.querySelector("[data-neurons]");
  var nctx = ncanvas ? ncanvas.getContext("2d") : null;
  var stage = document.querySelector("[data-cortex-stage]");
  var audio = window.siteAudio;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function bail() {
    canvas.parentNode && canvas.parentNode.removeChild(canvas);
    if (ncanvas && ncanvas.parentNode) ncanvas.parentNode.removeChild(ncanvas);
  }

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false });
  } catch (e) {}
  if (!gl) return bail();

  var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  if (!highp || !highp.precision || gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) < 48) return bail();

  var TAU = Math.PI * 2;
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  // ---- Surface shader ----------------------------------------------------

  var NW = 8; // fold waves
  var ND = 3; // fine detail waves
  var NR = 8; // ripples

  var VERT = "attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "#define NW " + NW,
    "#define ND " + ND,
    "#define NR " + NR,
    "uniform vec2 uRes;", // CSS px
    "uniform float uScale;", // device px per CSS px
    "uniform vec3 uSphere;", // centre x, centre y, radius (CSS px, y down)
    "uniform mat3 uRot;", // view -> surface
    "uniform vec4 uWave[NW];", // wave vector, phase
    "uniform vec4 uDet[ND];",
    "uniform vec4 uRip[NR];", // centre (surface frame), radius in radians
    "uniform vec4 uRipB[NR];", // strength, hue, width
    "uniform vec4 uHover;", // point (surface frame), energy
    "uniform vec4 uHold;", // point (surface frame), charge
    "uniform float uHoldHue;",
    "uniform float uTime;",
    "uniform float uGain;",
    "uniform float uWide;",
    "uniform float uFoldW;", // half-width of a fold's shoulder, radians
    "uniform float uDetK;",
    "uniform vec2 uFade;", // screen y where the surface dissolves: start, end
    "",
    "vec3 hue(float h) {",
    "  h = fract(h) * 5.0;",
    "  vec3 c0 = vec3(0.30, 0.80, 1.00);",
    "  vec3 c1 = vec3(0.42, 0.95, 0.72);",
    "  vec3 c2 = vec3(1.00, 0.74, 0.38);",
    "  vec3 c3 = vec3(1.00, 0.42, 0.50);",
    "  vec3 c4 = vec3(0.64, 0.52, 1.00);",
    "  vec3 c = mix(c0, c1, clamp(h, 0.0, 1.0));",
    "  c = mix(c, c2, clamp(h - 1.0, 0.0, 1.0));",
    "  c = mix(c, c3, clamp(h - 2.0, 0.0, 1.0));",
    "  c = mix(c, c4, clamp(h - 3.0, 0.0, 1.0));",
    "  c = mix(c, c0, clamp(h - 4.0, 0.0, 1.0));",
    "  return c;",
    "}",
    "",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
    "",
    "void main() {",
    "  vec2 p = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;",
    "  vec3 bg = vec3(0.0275, 0.0275, 0.0235);",
    "  vec2 d = (p - uSphere.xy) / uSphere.z;",
    "  d.y = -d.y;",
    "  float r = length(d);",
    "",
    // Dissolve at the bottom of the hero, and stay quiet behind the copy.
    "  float mask = 1.0 - smoothstep(uFade.x, uFade.y, p.y);",
    "  mask *= mix(1.0, mix(0.16, 1.0, smoothstep(0.27, 0.6, p.x / uRes.x)), uWide);",
    "  mask *= uGain;",
    "",
    "  vec3 L = normalize(vec3(0.42, 0.68, 0.6));",
    "  vec3 col = bg;",
    "",
    "  if (r < 1.0) {",
    "    vec3 n0 = vec3(d, sqrt(1.0 - r * r));",
    "    vec3 q = uRot * n0;",
    "",
    // Activity first: it also disturbs the folds.
    "    float act = 0.0;",
    "    vec3 actCol = vec3(0.0);",
    "    float kick = 0.0;",
    "    vec3 push = vec3(0.0);",
    "    for (int i = 0; i < NR; i++) {",
    "      vec4 rp = uRip[i];",
    "      vec4 rb = uRipB[i];",
    "      if (rb.x > 0.0) {",
    "        float ang = acos(clamp(dot(q, rp.xyz), -1.0, 1.0));",
    "        float x = (ang - rp.w) / rb.z;",
    "        float ring = exp(-x * x) * rb.x;",
    "        float inner = (1.0 - smoothstep(rp.w * 0.3, rp.w, ang)) * rb.x * 0.14;",
    "        vec3 t = q * dot(q, rp.xyz) - rp.xyz;",
    "        t /= max(length(t), 1e-3);",
    "        act += ring + inner;",
    "        actCol += (ring + inner) * hue(rb.y);",
    "        kick += ring;",
    "        push += t * ring * x * 1.5;", // a real swell: the surface tilts as the wave passes
    "      }",
    "    }",
    "",
    "    float hang = acos(clamp(dot(q, uHold.xyz), -1.0, 1.0));",
    "    float hr = 0.05 + 0.2 * uHold.w;",
    "    float blob = uHold.w * exp(-(hang * hang) / (hr * hr));",
    "    blob *= 0.8 + 0.2 * sin(uTime * 24.0 - hang * 46.0);",
    "    vec3 ht = q * dot(q, uHold.xyz) - uHold.xyz;",
    "    ht /= max(length(ht), 1e-3);",
    "    act += blob * 1.1;",
    "    actCol += blob * 1.1 * mix(hue(uHoldHue), vec3(1.0, 0.95, 0.9), uHold.w * 0.55);",
    "    kick += blob * 1.6;",
    "    push -= ht * blob * 0.9;", // pressed in
    "",
    "    float vang = acos(clamp(dot(q, uHover.xyz), -1.0, 1.0));",
    "    float spot = uHover.w * exp(-(vang * vang) / 0.03);",
    "    kick += spot * 0.6;",
    "",
    // Folds: a 3D random-wave field on the sphere.
    "    vec3 qw = q + 0.014 * sin(q.yzx * 7.0 + uTime * 0.07);",
    "    float h = 0.0;",
    "    vec3 g = vec3(0.0);",
    "    for (int i = 0; i < NW; i++) {",
    "      vec4 w = uWave[i];",
    "      float ph = dot(w.xyz, qw) + w.w + kick * (0.9 + 0.3 * float(i));",
    "      h += cos(ph);",
    "      g -= w.xyz * sin(ph);",
    "    }",
    "    vec3 gt = g - q * dot(g, q);",
    "    float gl = max(length(gt), 1e-3);",
    "    float ad = abs(h) / gl;", // distance to the nearest sulcus, radians
    "    float x = clamp(ad / uFoldW, 0.0, 1.0);",
    "    float prof = sqrt(max(1.0 - (1.0 - x) * (1.0 - x), 0.0));", // rounded shoulder
    "    float slope = (1.0 - x) / max(prof, 0.3);",
    "    vec3 up = (h < 0.0 ? -1.0 : 1.0) * gt / gl;",
    "    vec3 nl = q - 0.78 * slope * up;",
    "",
    // Fine undulation on the crowns.
    "    vec3 gd = vec3(0.0);",
    "    for (int j = 0; j < ND; j++) {",
    "      vec4 w = uDet[j];",
    "      gd -= w.xyz * sin(dot(w.xyz, qw) + w.w);",
    "    }",
    "    gd -= q * dot(gd, q);",
    "    nl -= gd * (0.05 / uDetK) * prof;",
    "    nl += push;",
    "",
    "    vec3 n = normalize(nl);",
    "    vec3 nv = n * uRot;", // back to view space
    "    float diff = smoothstep(-0.3, 1.0, dot(nv, L));",
    "    float ao = mix(0.1, 1.0, smoothstep(0.0, 0.5, x));",
    "    float term = smoothstep(-0.25, 0.7, dot(n0, L));",
    "    vec3 hv = normalize(L + vec3(0.0, 0.0, 1.0));",
    "    float spec = pow(max(dot(nv, hv), 0.0), 42.0);",
    "    float fres = pow(1.0 - n0.z, 3.0);",
    "    float gray = (0.04 + 0.66 * diff * diff) * ao * term + spec * 0.34 * term * ao + fres * 0.1 * term;",
    "    gray += spot * (0.17 * ao + spec * 0.4);", // the pointer is a small lamp
    "    vec3 surf = vec3(gray * 0.82);",
    "",
    // Colour only where there is activity.
    "    float a = clamp(act, 0.0, 1.6);",
    "    vec3 pc = actCol / max(act, 1e-3);",
    "    float amt = smoothstep(0.02, 0.55, a);",
    "    vec3 lit = pc * (0.16 + 0.95 * diff * ao + spec * 0.5);",
    "    surf = mix(surf, lit, amt * 0.9);",
    "    float edge = 1.0 - smoothstep(0.0, 0.3, x);",
    "    surf += pc * edge * a * 0.5;",
    "    surf += vec3(1.0, 0.95, 0.9) * max(a - 1.0, 0.0) * 0.6 * ao;",
    "",
    "    float aa = smoothstep(1.0, 1.0 - 2.5 / uSphere.z, r);",
    "    col = bg + surf * mask * aa;",
    "  } else {",
    // A thin atmosphere along the lit part of the horizon.
    "    float lim = smoothstep(-0.25, 0.7, dot(vec3(d / r, 0.0), L));",
    "    col += vec3(0.55) * exp(-(r - 1.0) / 0.012) * 0.075 * lim * mask;",
    "  }",
    "",
    "  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.console) console.warn("cortex shader:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  var prog = gl.createProgram();
  if (vs && fs) {
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
  }
  if (!vs || !fs || !gl.getProgramParameter(prog, gl.LINK_STATUS)) return bail();
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  [
    "uRes", "uScale", "uSphere", "uRot", "uWave", "uDet", "uRip", "uRipB", "uHover", "uHold",
    "uHoldHue", "uTime", "uGain", "uWide", "uFoldW", "uDetK", "uFade"
  ].forEach(function (name) {
    U[name] = gl.getUniformLocation(prog, name);
  });

  // ---- Shared state ------------------------------------------------------

  var cssW = 1;
  var cssH = 1;
  var scale = 1;
  var scaleMul = 1; // lowered on slow GPUs
  var wide = true;
  var time = 0;
  var scrollY = 0;
  var gain = 1;
  var PARALLAX = 0.45;

  var sphere = { x: 0, y: 0, R: 600 }; // page coordinates
  var stageBox = { left: 0, top: 0, width: 1, height: 1 };
  var domeTop = 0;
  var foldW = 0.02;
  var detK = 200;
  var waves = [];
  var waveData = new Float32Array(NW * 4);
  var detData = new Float32Array(ND * 4);
  var ripData = new Float32Array(NR * 4);
  var ripDataB = new Float32Array(NR * 4);

  var rot = new Float32Array(9); // surface -> view, row-major
  var yaw = Math.random() * TAU;
  var yawVel = 0;
  var yawOff = 0;
  var pitchOff = 0;

  var pointer = { x: -9999, y: -9999, nx: 0.5, ny: 0.5, energy: 0, target: 0, lastMove: 0, inside: false, speed: 0 };
  var hover = { dir: [0, 0, 1], energy: 0 };
  var hold = { active: false, x: 0, y: 0, t0: 0, charge: 0, dir: null, hue: 0, lastTrailX: 0, lastTrailY: 0 };
  var ripples = [];
  var rippleId = 0;
  var hueNow = Math.random();

  function offsetY() {
    return scrollY * PARALLAX;
  }

  function updateRot() {
    var pitch = 0.12 + pitchOff;
    var y = yaw + yawOff;
    var cy = Math.cos(y);
    var sy = Math.sin(y);
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);
    rot[0] = cy;
    rot[1] = 0;
    rot[2] = sy;
    rot[3] = sp * sy;
    rot[4] = cp;
    rot[5] = -sp * cy;
    rot[6] = -cp * sy;
    rot[7] = sp;
    rot[8] = cp * cy;
  }

  // Screen point -> point on the sphere, in the surface's own frame.
  function pick(clientX, clientY) {
    var dx = (clientX - sphere.x) / sphere.R;
    var dy = -(clientY + offsetY() - sphere.y) / sphere.R;
    var r2 = dx * dx + dy * dy;
    if (r2 >= 0.985) return null;
    var dz = Math.sqrt(1 - r2);
    return [
      rot[0] * dx + rot[3] * dy + rot[6] * dz,
      rot[1] * dx + rot[4] * dy + rot[7] * dz,
      rot[2] * dx + rot[5] * dy + rot[8] * dz
    ];
  }

  function addRipple(dir, strength, hue, gen, opts) {
    opts = opts || {};
    ripples.push({
      id: ++rippleId,
      dir: dir,
      t0: time,
      strength: strength,
      hue: hue,
      gen: gen,
      speed: opts.speed || 0.6, // radians per second
      life: opts.life || 3.6,
      hits: {}
    });
    if (ripples.length > 14) ripples.shift();
  }

  // ---- Neurons -----------------------------------------------------------

  var NET_HUE = [0.07, 0.42, 0.84];
  var neurons = [];
  var nodes = [];
  var conns = [];
  var pulses = [];
  var later = [];
  var cluster = { x: 0, y: 0 };
  var FOCAL = 900;

  function hueRGB(h) {
    var stops = [
      [77, 204, 255],
      [107, 242, 184],
      [255, 189, 97],
      [255, 107, 128],
      [163, 133, 255]
    ];
    h = (h - Math.floor(h)) * 5;
    var i = Math.floor(h);
    var f = h - i;
    var a = stops[i % 5];
    var b = stops[(i + 1) % 5];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  function tint(rgb, amount, alpha) {
    // White at rest, towards the network colour when active.
    var r = Math.round(255 + (rgb[0] - 255) * amount);
    var g = Math.round(255 + (rgb[1] - 255) * amount);
    var b = Math.round(255 + (rgb[2] - 255) * amount);
    return "rgba(" + r + "," + g + "," + b + "," + clamp(alpha, 0, 1).toFixed(3) + ")";
  }

  function addNode(n, parent, ox, oy, oz, w) {
    var depth = parent ? parent.d + 1 : 0;
    var nd = {
      n: n,
      p: parent,
      ox: ox,
      oy: oy,
      oz: oz,
      x: n.home.x,
      y: n.home.y,
      z: n.home.z,
      vx: 0,
      vy: 0,
      vz: 0,
      d: depth,
      w: w,
      k: 120 / (1 + 0.28 * depth),
      sx: n.home.x,
      sy: n.home.y,
      ss: 1,
      df: 0.5,
      ph: Math.random() * TAU
    };
    n.nodes.push(nd);
    nodes.push(nd);
    return nd;
  }

  // A chain of segments that wanders and may fork.
  function limb(n, parent, ang, elev, segs, len, w, curl, fork) {
    var node = parent;
    for (var s = 0; s < segs; s++) {
      ang += rnd(-curl, curl);
      elev += rnd(-0.2, 0.2);
      var l = len * (1 - 0.05 * s) * rnd(0.85, 1.15);
      var ce = Math.cos(elev);
      node = addNode(n, node, Math.cos(ang) * ce * l, Math.sin(ang) * ce * l, Math.sin(elev) * l, w);
      w *= 0.87;
      if (fork > 0 && s < segs - 1 && Math.random() < fork) {
        limb(n, node, ang + (Math.random() < 0.5 ? -1 : 1) * rnd(0.45, 1.0), elev, segs - s - 1, len * 0.82, w * 0.85, curl, fork * 0.45);
      }
    }
    return { node: node, ang: ang, elev: elev };
  }

  var UP = -Math.PI / 2;

  function makeNeuron(type, x, y, z, sc) {
    var n = { type: type, home: { x: x, y: y, z: z }, nodes: [], conns: [], root: null, glow: 0, ref: 0, net: 0, r: 5 * sc, tilt: rnd(-0.22, 0.22), bob: Math.random() * TAU, sc: sc };
    var soma = addNode(n, null, 0, 0, 0, 1.7);
    n.soma = soma;
    var i;
    var t = n.tilt;

    if (type === "pyramidal") {
      // Triangular body, one long apical dendrite with a tuft, a skirt of basal ones.
      n.r = 7.5 * sc;
      var apical = limb(n, soma, UP + t, rnd(-0.2, 0.2), 7, 15 * sc, 1.7, 0.13, 0.5);
      for (i = 0; i < 3; i++) limb(n, apical.node, apical.ang + (i - 1) * 0.75 + rnd(-0.2, 0.2), apical.elev, 3, 9 * sc, 0.8, 0.3, 0.2);
      var basal = [0.14, 0.37, 0.63, 0.86];
      for (i = 0; i < basal.length; i++) limb(n, soma, Math.PI * basal[i] + t + rnd(-0.15, 0.15), rnd(-0.5, 0.5), 4, 10 * sc, 1.1, 0.25, 0.35);
    } else if (type === "stellate") {
      // Small round body, dendrites in every direction.
      n.r = 4.6 * sc;
      var arms = 6;
      for (i = 0; i < arms; i++) limb(n, soma, (TAU * i) / arms + rnd(-0.3, 0.3), rnd(-0.7, 0.7), 4, 8.5 * sc, 1.0, 0.3, 0.3);
    } else if (type === "bipolar") {
      // Two long processes, one each way.
      n.r = 4.2 * sc;
      limb(n, soma, UP + t, rnd(-0.2, 0.2), 6, 11 * sc, 1.2, 0.16, 0.25);
      limb(n, soma, -UP + t, rnd(-0.2, 0.2), 6, 11 * sc, 1.2, 0.16, 0.25);
    } else if (type === "basket") {
      // Round body, a few dendrites, and a dense curly axon arbor below.
      n.r = 5.6 * sc;
      for (i = 0; i < 4; i++) limb(n, soma, UP + (i - 1.5) * 0.85 + rnd(-0.2, 0.2), rnd(-0.5, 0.5), 4, 9 * sc, 1.1, 0.25, 0.25);
      for (i = 0; i < 3; i++) limb(n, soma, -UP + (i - 1) * 0.7 + rnd(-0.2, 0.2), rnd(-0.4, 0.4), 5, 6 * sc, 0.7, 0.6, 0.5);
    } else {
      // Purkinje: one trunk opening into a flat, dense fan.
      n.r = 7 * sc;
      var trunk = limb(n, soma, UP + t, 0, 2, 10 * sc, 1.8, 0.08, 0);
      for (i = 0; i < 5; i++) limb(n, trunk.node, UP + t + (i - 2) * 0.5 + rnd(-0.1, 0.1), rnd(-0.08, 0.08), 4, 9 * sc, 1.2, 0.22, 0.85);
    }
    neurons.push(n);
    return n;
  }

  function link(a, b) {
    for (var i = 0; i < a.conns.length; i++) {
      var c0 = a.conns[i];
      if ((c0.a === a && c0.b === b) || (c0.a === b && c0.b === a)) return;
    }
    var c = {
      id: conns.length,
      a: a,
      b: b,
      root: false,
      tx: 0,
      ty: 0,
      sag: { x: rnd(-20, 20), y: rnd(8, 34), z: rnd(-24, 24) },
      x: (a.home.x + b.home.x) / 2,
      y: (a.home.y + b.home.y) / 2,
      z: (a.home.z + b.home.z) / 2,
      vx: 0,
      vy: 0,
      vz: 0,
      sx: 0,
      sy: 0,
      ex: 0,
      ey: 0,
      len: 100,
      glow: 0,
      hue: 0
    };
    a.conns.push(c);
    b.conns.push(c);
    conns.push(c);
  }

  function rootTo(a, tx, ty) {
    var c = {
      id: conns.length,
      a: a,
      b: null,
      root: true,
      tx: tx,
      ty: ty,
      sag: { x: rnd(-14, 14), y: rnd(-6, 10), z: rnd(-10, 10) },
      x: (a.home.x + tx) / 2,
      y: (a.home.y + ty) / 2,
      z: a.home.z * 0.5,
      vx: 0,
      vy: 0,
      vz: 0,
      sx: 0,
      sy: 0,
      ex: tx,
      ey: ty,
      len: 100,
      glow: 0,
      hue: 0
    };
    a.conns.push(c);
    a.root = c;
    conns.push(c);
  }

  function domeY(x) {
    var dx = x - sphere.x;
    if (Math.abs(dx) >= sphere.R * 0.98) return null;
    return sphere.y - Math.sqrt(sphere.R * sphere.R - dx * dx);
  }

  function dist2(a, b) {
    var dx = a.home.x - b.home.x;
    var dy = a.home.y - b.home.y;
    return dx * dx + dy * dy;
  }

  function buildNeurons() {
    neurons = [];
    nodes = [];
    conns = [];
    pulses = [];
    later = [];

    var b = stageBox;
    var count = wide ? clamp(Math.round((b.width * b.height) / 25000), 10, 17) : 7;
    var sc = wide ? clamp(b.width / 540, 0.85, 1.15) : 0.7;
    var x0 = b.left + b.width * 0.04;
    var x1 = b.left + b.width * 0.96;
    var y0 = b.top + b.height * (wide ? 0.06 : 0.04);
    var y1 = domeTop + b.height * (wide ? 0.15 : 0.1);
    var order = ["pyramidal", "stellate", "purkinje", "basket", "pyramidal", "bipolar", "stellate", "pyramidal", "basket", "stellate", "bipolar", "pyramidal", "purkinje", "stellate", "basket", "pyramidal", "bipolar"];

    // Spread them out: of a few random candidates, keep the loneliest.
    var spots = [];
    for (var i = 0; i < count; i++) {
      var best = null;
      var bestD = -1;
      for (var t = 0; t < 14; t++) {
        var cx = rnd(x0, x1);
        var cy = rnd(y0, y1);
        var dmin = 1e9;
        for (var j = 0; j < spots.length; j++) {
          var ddx = cx - spots[j].x;
          var ddy = (cy - spots[j].y) * 1.25;
          dmin = Math.min(dmin, ddx * ddx + ddy * ddy);
        }
        if (dmin > bestD) {
          bestD = dmin;
          best = { x: cx, y: cy };
        }
      }
      spots.push(best);
    }
    spots.forEach(function (s, k) {
      makeNeuron(order[k % order.length], s.x, s.y, rnd(-130, 130), sc);
    });

    // Three networks, split left to right.
    var byX = neurons.slice().sort(function (p, q) {
      return p.home.x - q.home.x;
    });
    byX.forEach(function (n, k) {
      n.net = Math.min(2, Math.floor((k / byX.length) * 3));
    });

    // Within a network, wire each neuron to its nearest neighbours.
    neurons.forEach(function (n) {
      var same = neurons
        .filter(function (m) {
          return m !== n && m.net === n.net;
        })
        .sort(function (p, q) {
          return dist2(n, p) - dist2(n, q);
        });
      if (same[0]) link(n, same[0]);
      if (same[1] && Math.random() < 0.5) link(n, same[1]);
    });
    // One bridge between neighbouring networks.
    [[0, 1], [1, 2]].forEach(function (pair) {
      var bestPair = null;
      var bestDist = 1e12;
      neurons.forEach(function (p) {
        if (p.net !== pair[0]) return;
        neurons.forEach(function (q) {
          if (q.net !== pair[1]) return;
          var dd = dist2(p, q);
          if (dd < bestDist) {
            bestDist = dd;
            bestPair = [p, q];
          }
        });
      });
      if (bestPair) link(bestPair[0], bestPair[1]);
    });

    // The lowest ones send an axon down into the surface.
    var byY = neurons.slice().sort(function (p, q) {
      return q.home.y - p.home.y;
    });
    var roots = Math.max(3, Math.ceil(count * 0.38));
    for (var r = 0; r < roots && r < byY.length; r++) {
      var n = byY[r];
      var tx = n.home.x + rnd(-26, 26);
      var top = domeY(tx);
      if (top == null) continue;
      rootTo(n, tx, Math.max(top + rnd(22, 60) * sc, n.home.y + 34 * sc));
    }

    var sx = 0;
    var sy = 0;
    neurons.forEach(function (n) {
      sx += n.home.x;
      sy += n.home.y;
    });
    cluster.x = sx / Math.max(1, neurons.length);
    cluster.y = sy / Math.max(1, neurons.length);
  }

  function sendPulse(c, from, gen, hue, upward) {
    var dir = upward ? -1 : c.a === from ? 1 : -1;
    pulses.push({ c: c, dir: dir, t: 0, dur: clamp(c.len / 300, 0.16, 0.8), gen: gen, hue: hue });
    c.glow = 1;
    c.hue = hue;
  }

  function fire(n, gen, from) {
    if (time < n.ref || gen > 7) return false;
    n.ref = time + 0.9;
    n.glow = 1;
    // A physical twitch: the dendrites flick outward.
    for (var i = 1; i < n.nodes.length; i++) {
      var nd = n.nodes[i];
      nd.vx += nd.ox * 3.2;
      nd.vy += nd.oy * 3.2;
      nd.vz += nd.oz * 3.2;
    }
    if (audio) audio.spike(n.soma.sx / Math.max(1, cssW));
    var hue = NET_HUE[n.net];
    n.conns.forEach(function (c) {
      if (c === from) return;
      later.push({
        at: time + 0.05 + Math.random() * 0.07,
        run: function () {
          sendPulse(c, n, gen + 1, hue, false);
        }
      });
    });
    return true;
  }

  function stepNeurons(dt) {
    var i;
    var px = pointer.x;
    var py = pointer.y + offsetY();
    var pe = pointer.energy;
    var hx = hold.x;
    var hy = hold.y + offsetY();
    var hc = hold.active ? hold.charge : 0;

    // Scheduled events
    if (later.length) {
      var keep = [];
      for (i = 0; i < later.length; i++) {
        if (later[i].at <= time) later[i].run();
        else keep.push(later[i]);
      }
      later = keep;
    }

    for (i = 0; i < neurons.length; i++) {
      var n = neurons[i];
      n.glow *= Math.exp(-2.4 * dt);
      // Brushing a cell body is enough to set it off.
      if (pe > 0.36) {
        var ddx = n.soma.sx - px;
        var ddy = n.soma.sy - py;
        var reach = n.r * n.soma.ss + 13;
        if (ddx * ddx + ddy * ddy < reach * reach) fire(n, 3, null);
      }
    }

    for (i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      var tx;
      var ty;
      var tz;
      var k;
      var c;
      if (nd.p) {
        tx = nd.p.x + nd.ox;
        ty = nd.p.y + nd.oy;
        tz = nd.p.z + nd.oz;
        k = nd.k;
        c = 8;
      } else {
        var home = nd.n.home;
        tx = home.x + Math.sin(time * 0.5 + nd.n.bob) * 5;
        ty = home.y + Math.cos(time * 0.4 + nd.n.bob) * 4;
        tz = home.z;
        k = 26;
        c = 5.5;
      }
      var ax = k * (tx - nd.x) + Math.sin(time * 0.7 + nd.ph) * nd.d * 1.5;
      var ay = k * (ty - nd.y) + Math.cos(time * 0.6 + nd.ph) * nd.d * 1.2;
      var az = k * (tz - nd.z);

      if (pe > 0.02) {
        var dx = nd.sx - px;
        var dy = nd.sy - py;
        var d2 = dx * dx + dy * dy;
        if (d2 < 12100) {
          var d = Math.sqrt(d2) + 0.01;
          var f = 1 - d / 110;
          f = f * f * pe * 2600;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      if (hc > 0) {
        var dxh = hx - nd.sx;
        var dyh = hy - nd.sy;
        var dh = Math.sqrt(dxh * dxh + dyh * dyh) + 0.01;
        if (dh < 340) {
          var fh = hc * (1 - dh / 340) * 760;
          ax += (dxh / dh) * fh + Math.sin(time * 40 + nd.ph) * hc * 60;
          ay += (dyh / dh) * fh + Math.cos(time * 37 + nd.ph) * hc * 60;
        }
      }

      nd.vx += (ax - c * nd.vx) * dt;
      nd.vy += (ay - c * nd.vy) * dt;
      nd.vz += (az - c * nd.vz) * dt;
      nd.x += nd.vx * dt;
      nd.y += nd.vy * dt;
      nd.z += nd.vz * dt;
    }

    // Axons: a single sagging control point each, with its own inertia.
    for (i = 0; i < conns.length; i++) {
      var cn = conns[i];
      var a = cn.a.soma;
      var bx = cn.root ? cn.tx : cn.b.soma.x;
      var by = cn.root ? cn.ty : cn.b.soma.y;
      var bz = cn.root ? 0 : cn.b.soma.z;
      var mx = (a.x + bx) / 2 + cn.sag.x;
      var my = (a.y + by) / 2 + cn.sag.y;
      var mz = (a.z + bz) / 2 + cn.sag.z;
      var cax = 18 * (mx - cn.x);
      var cay = 18 * (my - cn.y);
      var caz = 18 * (mz - cn.z);
      if (pe > 0.02) {
        var cdx = cn.sx - px;
        var cdy = cn.sy - py;
        var cd2 = cdx * cdx + cdy * cdy;
        if (cd2 < 12100) {
          var cd = Math.sqrt(cd2) + 0.01;
          var cf = 1 - cd / 110;
          cf = cf * cf * pe * 2000;
          cax += (cdx / cd) * cf;
          cay += (cdy / cd) * cf;
        }
      }
      cn.vx += (cax - 3.5 * cn.vx) * dt;
      cn.vy += (cay - 3.5 * cn.vy) * dt;
      cn.vz += (caz - 3.5 * cn.vz) * dt;
      cn.x += cn.vx * dt;
      cn.y += cn.vy * dt;
      cn.z += cn.vz * dt;
      cn.glow *= Math.exp(-2.2 * dt);
    }

    // Project everything. The cluster leans with the pointer for depth.
    var ry = yawOff * 0.9 + Math.sin(time * 0.13) * 0.06;
    var rx = pitchOff * 0.9;
    var cyw = Math.cos(ry);
    var syw = Math.sin(ry);
    var cpt = Math.cos(rx);
    var spt = Math.sin(rx);
    function project(o, x, y, z) {
      var x1 = x - cluster.x;
      var y1 = y - cluster.y;
      var x2 = x1 * cyw + z * syw;
      var z2 = -x1 * syw + z * cyw;
      var y3 = y1 * cpt - z2 * spt;
      var z3 = y1 * spt + z2 * cpt;
      var s = FOCAL / (FOCAL - z3);
      o.sx = cluster.x + x2 * s;
      o.sy = cluster.y + y3 * s;
      o.ss = s;
      o.df = clamp((z3 + 170) / 340, 0, 1);
    }
    for (i = 0; i < nodes.length; i++) project(nodes[i], nodes[i].x, nodes[i].y, nodes[i].z);
    for (i = 0; i < conns.length; i++) {
      var cc = conns[i];
      project(cc, cc.x, cc.y, cc.z);
      cc.ex = cc.root ? cc.tx : cc.b.soma.sx;
      cc.ey = cc.root ? cc.ty : cc.b.soma.sy;
      var lx = cc.ex - cc.a.soma.sx;
      var ly = cc.ey - cc.a.soma.sy;
      cc.len = Math.sqrt(lx * lx + ly * ly);
    }

    // Pulses in transit
    if (pulses.length) {
      var alive = [];
      for (i = 0; i < pulses.length; i++) {
        var pu = pulses[i];
        pu.t += dt / pu.dur;
        pu.c.glow = Math.max(pu.c.glow, 0.7);
        if (pu.t < 1) {
          alive.push(pu);
          continue;
        }
        var conn = pu.c;
        if (conn.root) {
          if (pu.dir === 1) {
            // Reached the surface: a small wave in the network's colour.
            var loc = pick(conn.tx, conn.ty - offsetY());
            if (loc) addRipple(loc, 0.44, pu.hue, 1, { speed: 0.42, life: 2.4 });
          } else {
            fire(conn.a, pu.gen, conn);
          }
        } else {
          fire(pu.dir === 1 ? conn.b : conn.a, pu.gen, conn);
        }
      }
      pulses = alive;
    }

    // Surface waves from presses reach the axon feet and climb into the network.
    for (i = 0; i < ripples.length; i++) {
      var rp = ripples[i];
      if (rp.gen !== 0) continue;
      var radius = (time - rp.t0) * rp.speed;
      for (var j = 0; j < conns.length; j++) {
        var rc = conns[j];
        if (!rc.root || rp.hits[rc.id]) continue;
        var rl = pick(rc.tx, rc.ty - offsetY());
        if (!rl) continue;
        var dot = clamp(rl[0] * rp.dir[0] + rl[1] * rp.dir[1] + rl[2] * rp.dir[2], -1, 1);
        if (Math.acos(dot) <= radius) {
          rp.hits[rc.id] = true;
          sendPulse(rc, null, 1, rp.hue, true);
        }
      }
    }
  }

  var ndpr = 1;

  function drawNeurons(fade) {
    if (!nctx) return;
    nctx.setTransform(1, 0, 0, 1, 0, 0);
    nctx.clearRect(0, 0, ncanvas.width, ncanvas.height);
    if (fade <= 0.01) return;
    nctx.setTransform(ndpr, 0, 0, ndpr, 0, -offsetY() * ndpr);
    nctx.globalCompositeOperation = "lighter";
    nctx.lineCap = "round";
    nctx.lineJoin = "round";
    var white = [255, 255, 255];
    var i;

    // Axons
    for (i = 0; i < conns.length; i++) {
      var c = conns[i];
      var a = c.a.soma;
      var rgb = c.glow > 0.02 ? hueRGB(c.hue) : white;
      var amt = Math.min(1, c.glow * 1.4);
      nctx.strokeStyle = tint(rgb, amt, (0.13 + 0.55 * c.glow) * fade);
      nctx.lineWidth = 0.7 + c.glow * 0.9;
      nctx.beginPath();
      nctx.moveTo(a.sx, a.sy);
      nctx.quadraticCurveTo(c.sx, c.sy, c.ex, c.ey);
      nctx.stroke();
      // Terminal: a bouton on the next cell, or a foot on the surface.
      nctx.fillStyle = tint(rgb, amt, (0.4 + 0.5 * c.glow) * fade);
      nctx.beginPath();
      if (c.root) {
        nctx.arc(c.ex, c.ey, 2 + c.glow * 2, 0, TAU);
      } else {
        var bt = 0.94;
        var u = 1 - bt;
        nctx.arc(u * u * a.sx + 2 * u * bt * c.sx + bt * bt * c.ex, u * u * a.sy + 2 * u * bt * c.sy + bt * bt * c.ey, 1.5, 0, TAU);
      }
      nctx.fill();
    }

    // Cells
    for (i = 0; i < neurons.length; i++) {
      var n = neurons[i];
      var soma = n.soma;
      var g = n.glow;
      var col = g > 0.02 ? hueRGB(NET_HUE[n.net]) : white;
      var am = Math.min(1, g * 1.6);
      var base = (0.26 + 0.5 * soma.df) * fade;
      var ws = soma.ss * (0.8 + 0.4 * soma.df);

      // Dendrites, in three weights
      for (var pass = 0; pass < 3; pass++) {
        nctx.beginPath();
        for (var j = 1; j < n.nodes.length; j++) {
          var nd = n.nodes[j];
          var bucket = nd.d <= 2 ? 0 : nd.d <= 5 ? 1 : 2;
          if (bucket !== pass) continue;
          nctx.moveTo(nd.p.sx, nd.p.sy);
          nctx.lineTo(nd.sx, nd.sy);
        }
        nctx.strokeStyle = tint(col, am, base * (pass === 0 ? 1 : pass === 1 ? 0.82 : 0.62) * (0.7 + 0.6 * g));
        nctx.lineWidth = (pass === 0 ? 1.5 : pass === 1 ? 1.0 : 0.65) * ws;
        nctx.stroke();
      }

      // Body
      var r = n.r * soma.ss;
      nctx.fillStyle = tint(col, am, Math.min(1, base * 1.5 + g * 0.5));
      nctx.beginPath();
      if (n.type === "pyramidal") {
        var up = UP + n.tilt;
        nctx.moveTo(soma.sx + Math.cos(up) * r * 1.45, soma.sy + Math.sin(up) * r * 1.45);
        nctx.lineTo(soma.sx + Math.cos(up + 2.25) * r * 1.15, soma.sy + Math.sin(up + 2.25) * r * 1.15);
        nctx.lineTo(soma.sx + Math.cos(up - 2.25) * r * 1.15, soma.sy + Math.sin(up - 2.25) * r * 1.15);
        nctx.closePath();
      } else if (n.type === "bipolar") {
        nctx.ellipse(soma.sx, soma.sy, r * 0.75, r * 1.3, n.tilt, 0, TAU);
      } else {
        nctx.arc(soma.sx, soma.sy, r, 0, TAU);
      }
      nctx.fill();

      if (g > 0.04) {
        nctx.fillStyle = tint(col, 1, g * 0.2 * fade);
        nctx.beginPath();
        nctx.arc(soma.sx, soma.sy, r * 2.8, 0, TAU);
        nctx.fill();
        nctx.fillStyle = tint(col, 1, g * 0.07 * fade);
        nctx.beginPath();
        nctx.arc(soma.sx, soma.sy, r * 6, 0, TAU);
        nctx.fill();
      }
    }

    // Pulses
    for (i = 0; i < pulses.length; i++) {
      var pu = pulses[i];
      var pc = pu.c;
      var t = pu.dir === 1 ? pu.t : 1 - pu.t;
      var v = 1 - t;
      var x = v * v * pc.a.soma.sx + 2 * v * t * pc.sx + t * t * pc.ex;
      var y = v * v * pc.a.soma.sy + 2 * v * t * pc.sy + t * t * pc.ey;
      var prgb = hueRGB(pu.hue);
      nctx.fillStyle = tint(prgb, 1, 0.22 * fade);
      nctx.beginPath();
      nctx.arc(x, y, 6.5, 0, TAU);
      nctx.fill();
      nctx.fillStyle = tint(prgb, 0.45, 0.95 * fade);
      nctx.beginPath();
      nctx.arc(x, y, 2.3, 0, TAU);
      nctx.fill();
    }
  }

  // ---- Presses -----------------------------------------------------------

  function nearNeurons(x, y, radius, kick, gen) {
    var sy = y + offsetY();
    for (var i = 0; i < neurons.length; i++) {
      var n = neurons[i];
      var dx = n.soma.sx - x;
      var dy = n.soma.sy - sy;
      var d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      if (d > radius) continue;
      var k = 1 - d / radius;
      for (var j = 0; j < n.nodes.length; j++) {
        var nd = n.nodes[j];
        var ex = nd.sx - x;
        var ey = nd.sy - sy;
        var ed = Math.sqrt(ex * ex + ey * ey) + 0.01;
        nd.vx += (ex / ed) * k * kick * rnd(0.7, 1.3);
        nd.vy += (ey / ed) * k * kick * rnd(0.7, 1.3);
        nd.vz += rnd(-1, 1) * k * kick * 0.4;
      }
      if (k > 0.25) fire(n, gen, null);
    }
  }

  // A press: a wave over the surface, and a jolt to anything nearby.
  function excite(clientX, clientY, strength, silent) {
    var s = strength == null ? 1 : strength;
    hueNow = (hueNow + 0.19 + Math.random() * 0.1) % 1;
    var dir = pick(clientX, clientY);
    if (dir) addRipple(dir, s, hueNow, 0);
    nearNeurons(clientX, clientY, 130, 260 * s, 0);
    if (!silent && audio) audio.hit(clientX / Math.max(1, cssW), clientY / Math.max(1, cssH), s);
    burst();
  }
  window.cortexExcite = excite;

  // Letting go of a hold.
  function blast(clientX, clientY, charge) {
    var dir = pick(clientX, clientY);
    if (dir) {
      addRipple(dir, 1.0 + 0.8 * charge, hold.hue, 0, { speed: 0.85, life: 3.2 });
      addRipple(dir, 0.7, (hold.hue + 0.4) % 1, 2, { speed: 0.5, life: 3.4 });
    }
    nearNeurons(clientX, clientY, 200 + 180 * charge, 500 + 700 * charge, 0);
    yawVel += (clientX < sphere.x ? -1 : 1) * 0.5 * charge;
    if (audio) audio.release(clientX / Math.max(1, cssW), clientY / Math.max(1, cssH), charge);
    burst();
  }

  function press(x, y) {
    hold.active = true;
    hold.x = x;
    hold.y = y;
    hold.t0 = time;
    hold.charge = 0;
    hold.lastTrailX = x;
    hold.lastTrailY = y;
  }

  function letGo() {
    if (!hold.active) return;
    hold.active = false;
    if (audio) audio.charge(0);
    if (hold.charge > 0.06) blast(hold.x, hold.y, hold.charge);
    hold.charge = 0;
  }

  // ---- Frame -------------------------------------------------------------

  var born = 0;

  function step(dt) {
    time += dt;

    // Rotation: a slow turn, plus whatever the pointer adds.
    yawVel *= Math.exp(-1.6 * dt);
    yaw += (0.032 + yawVel) * dt;
    var ease = 1 - Math.exp(-3 * dt);
    yawOff += ((pointer.inside ? (pointer.nx - 0.5) * 0.55 : 0) - yawOff) * ease;
    pitchOff += ((pointer.inside ? (pointer.ny - 0.5) * 0.34 : 0) - pitchOff) * ease;
    updateRot();

    // Pointer lamp
    var now = performance.now();
    if (pointer.inside) {
      var idle = now - pointer.lastMove;
      pointer.target = idle > 700 ? 0.3 : Math.max(pointer.target * Math.pow(0.15, dt), 0.3);
    } else {
      pointer.target = 0;
    }
    pointer.energy += (pointer.target - pointer.energy) * (1 - Math.pow(0.01, dt));
    var hd = pointer.inside ? pick(pointer.x, pointer.y) : null;
    if (hd) {
      hover.dir = hd;
      hover.energy += (Math.min(1, 0.55 + pointer.energy) - hover.energy) * (1 - Math.exp(-8 * dt));
    } else {
      hover.energy *= Math.exp(-5 * dt);
    }

    // Hold
    if (hold.active) {
      hold.charge = clamp((time - hold.t0 - 0.2) / 1.3, 0, 1);
      hold.dir = pick(hold.x, hold.y);
      if (hold.charge > 0) {
        if (!hold.hue || hold.charge < 0.02) hold.hue = (hueNow + 0.5) % 1;
        if (audio) audio.charge(0.12 + 0.88 * hold.charge);
        // Dragging while holding leaves a trail of small waves.
        var mx = hold.x - hold.lastTrailX;
        var my = hold.y - hold.lastTrailY;
        if (mx * mx + my * my > 2500 && hold.dir) {
          hold.lastTrailX = hold.x;
          hold.lastTrailY = hold.y;
          addRipple(hold.dir, 0.4, hold.hue, 2, { speed: 0.45, life: 2.2 });
        }
      }
    }

    var live = [];
    for (var i = 0; i < ripples.length; i++) {
      if (time - ripples[i].t0 < ripples[i].life) live.push(ripples[i]);
    }
    ripples = live;

    stepNeurons(dt);
  }

  function render() {
    var oy = offsetY();
    var intro = clamp((time - born) / 1.8, 0, 1);
    intro = intro * intro * (3 - 2 * intro);

    for (var i = 0; i < NW; i++) {
      var w = waves[i];
      waveData[i * 4] = w.kx;
      waveData[i * 4 + 1] = w.ky;
      waveData[i * 4 + 2] = w.kz;
      waveData[i * 4 + 3] = (w.ph + w.sp * time) % TAU;
    }
    for (i = 0; i < ND; i++) {
      var dw = waves[NW + i];
      detData[i * 4] = dw.kx;
      detData[i * 4 + 1] = dw.ky;
      detData[i * 4 + 2] = dw.kz;
      detData[i * 4 + 3] = (dw.ph + dw.sp * time) % TAU;
    }

    // Newest ripples win the shader's slots.
    var start = Math.max(0, ripples.length - NR);
    for (i = 0; i < NR; i++) {
      var rp = ripples[start + i];
      var o = i * 4;
      if (rp) {
        var age = time - rp.t0;
        var fade = Math.exp(-age * 0.8) * Math.min(1, age * 12) * clamp((rp.life - age) / 0.6, 0, 1);
        ripData[o] = rp.dir[0];
        ripData[o + 1] = rp.dir[1];
        ripData[o + 2] = rp.dir[2];
        ripData[o + 3] = age * rp.speed;
        ripDataB[o] = rp.strength * fade;
        ripDataB[o + 1] = rp.hue;
        ripDataB[o + 2] = 0.045 + 0.04 * age;
        ripDataB[o + 3] = 0;
      } else {
        ripData[o] = ripData[o + 1] = ripData[o + 2] = ripData[o + 3] = 0;
        ripDataB[o] = ripDataB[o + 1] = ripDataB[o + 3] = 0;
        ripDataB[o + 2] = 1;
      }
    }

    var bottom = stageBox.top + stageBox.height - scrollY; // true screen position of the hero's lower edge
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, cssW, cssH);
    gl.uniform1f(U.uScale, scale);
    gl.uniform3f(U.uSphere, sphere.x, sphere.y - oy, sphere.R);
    gl.uniformMatrix3fv(U.uRot, false, rot);
    gl.uniform4fv(U.uWave, waveData);
    gl.uniform4fv(U.uDet, detData);
    gl.uniform4fv(U.uRip, ripData);
    gl.uniform4fv(U.uRipB, ripDataB);
    gl.uniform4f(U.uHover, hover.dir[0], hover.dir[1], hover.dir[2], hover.energy);
    var hdir = hold.active && hold.dir ? hold.dir : [0, 0, 1];
    gl.uniform4f(U.uHold, hdir[0], hdir[1], hdir[2], hold.active && hold.dir ? hold.charge : 0);
    gl.uniform1f(U.uHoldHue, hold.hue);
    gl.uniform1f(U.uTime, time % 1000);
    gl.uniform1f(U.uGain, gain * intro);
    gl.uniform1f(U.uWide, wide ? 1 : 0);
    gl.uniform1f(U.uFoldW, foldW);
    gl.uniform1f(U.uDetK, detK);
    gl.uniform2f(U.uFade, bottom - (wide ? 110 : 70), bottom + (wide ? 60 : 30));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    drawNeurons(gain * intro);
  }

  var running = false;
  var raf = 0;
  var last = 0;
  var slow = 0;

  function frame(t) {
    if (!running) return;
    var raw = last ? (t - last) / 1000 : 0.016;
    last = t;
    step(Math.min(0.034, raw));
    render();

    // If frames are consistently late, render the surface at a lower resolution.
    if (raw > 0.03 && raw < 0.2) slow++;
    else if (slow > 0) slow--;
    if (slow > 50 && scaleMul > 0.5) {
      scaleMul *= 0.78;
      slow = 0;
      resize();
    }
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    last = 0;
    raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
  }

  // Reduced motion: a settled still, with a short contained response to presses.
  function settle() {
    for (var n = 0; n < 150; n++) step(1 / 30);
    render();
  }

  var burstTimer = 0;
  function burst() {
    if (!reduceMotion) return;
    var began = performance.now();
    var prev = began;
    window.clearInterval(burstTimer);
    burstTimer = window.setInterval(function () {
      var now = performance.now();
      step(Math.min(0.034, (now - prev) / 1000));
      prev = now;
      render();
      if (now - began > 3200) window.clearInterval(burstTimer);
    }, 33);
  }

  // Fast-forward (handy for checking a settled state).
  excite.advance = function (seconds) {
    var n = Math.round((seconds || 1) * 30);
    for (var k = 0; k < n; k++) step(1 / 30);
    render();
    return { neurons: neurons.length, nodes: nodes.length, conns: conns.length, ripples: ripples.length, pulses: pulses.length, scale: scale };
  };

  // ---- Layout ------------------------------------------------------------

  function buildWaves() {
    var foldPx = wide ? 56 : 40; // fold wavelength on screen
    var K = (TAU * sphere.R) / foldPx;
    waves = [];
    function one(k) {
      // A random direction on the unit sphere
      var z = rnd(-1, 1);
      var a = rnd(0, TAU);
      var s = Math.sqrt(1 - z * z);
      return { kx: Math.cos(a) * s * k, ky: Math.sin(a) * s * k, kz: z * k, ph: rnd(0, TAU), sp: rnd(0.04, 0.13) * (Math.random() < 0.5 ? -1 : 1) };
    }
    var i;
    for (i = 0; i < NW; i++) waves.push(one(K * rnd(0.8, 1.2)));
    detK = K * 2.3;
    for (i = 0; i < ND; i++) waves.push(one(detK * rnd(0.85, 1.15)));
    foldW = (0.3 * foldPx) / sphere.R;
  }

  var builtFor = "";

  function layout() {
    var rect = stage ? stage.getBoundingClientRect() : { left: cssW * 0.5, top: 80, width: cssW * 0.45, height: cssH * 0.7 };
    wide = cssW > 920;
    PARALLAX = wide ? 0.45 : 1; // on phones the scene sits below the copy and must scroll with it
    stageBox = { left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height };

    if (wide) {
      sphere.R = Math.max(rect.height * 0.98, rect.width * 0.92);
      sphere.x = stageBox.left + rect.width * 0.6;
      domeTop = stageBox.top + rect.height * 0.36;
    } else {
      sphere.R = Math.max(rect.width * 1.05, 320);
      sphere.x = stageBox.left + rect.width * 0.5;
      domeTop = stageBox.top + rect.height * 0.44;
    }
    sphere.y = domeTop + sphere.R;

    // Rebuild only when the layout really changed, so a small resize does not reshuffle the scene.
    var key = [wide ? 1 : 0, Math.round(rect.width / 40), Math.round(rect.height / 40)].join(":");
    if (key !== builtFor) {
      builtFor = key;
      buildWaves();
      buildNeurons();
      born = time;
    }
    onScroll();
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var s = Math.max(0.5, Math.min(dpr, Math.sqrt(2.6e6 / Math.max(1, w * h))) * scaleMul);
    cssW = w;
    cssH = h;
    scale = s;
    canvas.width = Math.max(1, Math.round(w * s));
    canvas.height = Math.max(1, Math.round(h * s));
    if (ncanvas) {
      ndpr = dpr;
      ncanvas.width = Math.max(1, Math.round(w * dpr));
      ncanvas.height = Math.max(1, Math.round(h * dpr));
    }
    layout();
    if (reduceMotion) settle();
  }

  function onScroll() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    // Dim once the scene's own space has scrolled up past the middle of the screen.
    var vh = Math.max(1, window.innerHeight);
    var mid = stageBox.top + stageBox.height * 0.5;
    var past = scrollY - Math.max(0, mid - vh * 0.5);
    gain = 1 - 0.7 * clamp(past / (0.8 * vh), 0, 1);
    if (reduceMotion && waves.length) render();
  }

  // ---- Input -------------------------------------------------------------

  var QUIET = "a, button, input, textarea, select, label, summary, iframe, [data-no-excite]";
  function quiet(target) {
    return !!(target && target.closest && target.closest(QUIET));
  }

  window.addEventListener(
    "pointermove",
    function (e) {
      if (hold.active) {
        hold.x = e.clientX;
        hold.y = e.clientY;
      }
      if (e.pointerType === "touch") return;
      var now = performance.now();
      var dx = e.clientX - pointer.x;
      var dy = e.clientY - pointer.y;
      var dt = Math.max(8, now - pointer.lastMove);
      var speed = pointer.inside ? Math.sqrt(dx * dx + dy * dy) / dt : 0; // px per ms
      if (pointer.inside) yawVel = clamp(yawVel + dx * 0.0007, -1.3, 1.3); // a sideways flick spins it
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = e.clientX / Math.max(1, cssW);
      pointer.ny = e.clientY / Math.max(1, cssH);
      pointer.inside = true;
      pointer.lastMove = now;
      pointer.target = Math.min(1, Math.max(pointer.target, 0.3 + speed * 0.5));
      if (audio && speed > 0.6 && pick(e.clientX, e.clientY)) audio.dust(pointer.nx, Math.min(1, speed * 0.28));
    },
    { passive: true }
  );

  document.documentElement.addEventListener("mouseleave", function () {
    pointer.inside = false;
  });
  window.addEventListener("blur", function () {
    pointer.inside = false;
    letGo();
  });

  // Mouse and pen react on press, so rapid clicking registers every time.
  // Touch reacts on tap or on a held press, so scrolling stays silent.
  var touchPending = false;

  document.addEventListener("pointerdown", function (e) {
    if (e.button > 0 || quiet(e.target)) return;
    press(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      touchPending = true;
      return;
    }
    excite(e.clientX, e.clientY, 1, false);
  });

  document.addEventListener("pointerup", function (e) {
    if (e.pointerType === "touch" && touchPending) {
      touchPending = false;
      var charged = hold.active && hold.charge > 0.06;
      if (!charged && !quiet(e.target)) excite(e.clientX, e.clientY, 1, false);
    }
    letGo();
  });

  document.addEventListener("pointercancel", function () {
    // The browser took over (a scroll, usually): drop the press quietly.
    touchPending = false;
    hold.active = false;
    hold.charge = 0;
    if (audio) audio.charge(0);
  });

  // Sound toggle
  var toggles = document.querySelectorAll("[data-cortex-sound]");
  function paintToggles() {
    var on = audio ? audio.isEnabled() : false;
    toggles.forEach(function (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var label = btn.querySelector("[data-cortex-sound-label]");
      if (label) label.textContent = on ? "Sound on" : "Sound off";
    });
  }
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!audio) return;
      audio.setEnabled(!audio.isEnabled());
      if (audio.isEnabled()) {
        var rect = btn.getBoundingClientRect();
        excite(rect.left + rect.width / 2, rect.top - 60, 0.8, false);
      }
    });
  });
  if (audio) audio.onChange(paintToggles);
  paintToggles();

  // ---- Lifecycle ---------------------------------------------------------

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas);
    if (stage) new ResizeObserver(layout).observe(stage);
  } else {
    window.addEventListener("resize", resize);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stop();
      letGo();
    } else {
      start();
    }
  });
  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    stop();
  });

  updateRot();
  resize();
  document.documentElement.classList.add("has-cortex");
  if (!reduceMotion) start();
})();
