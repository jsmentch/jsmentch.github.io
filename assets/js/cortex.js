/*
 * Cortex field: a single-pass WebGL shader that draws a morphing, cortex-like
 * fold pattern (a random-wave field, the same maths behind labyrinth / Turing
 * patterns) with an activation overlay. The pointer stirs it, a click sends an
 * excitation wave through it and plays a note.
 *
 * No dependencies. Pauses when the tab is hidden. Honors reduced motion.
 */
(function () {
  "use strict";

  var canvas = document.querySelector("[data-cortex]");
  if (!canvas) return;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false });
  } catch (e) {}

  if (!gl) {
    canvas.parentNode && canvas.parentNode.removeChild(canvas);
    return;
  }

  var WAVES = 9;
  var RIPPLES = 6;

  var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  var precision = highp && highp.precision > 0 ? "highp" : "mediump";

  var VERT = "attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }";

  var FRAG = [
    "precision " + precision + " float;",
    "#define WAVES " + WAVES,
    "#define RIPPLES " + RIPPLES,
    "uniform vec2 uRes;",      // canvas size in CSS px
    "uniform float uScale;",   // device px per CSS px
    "uniform float uTime;",
    "uniform vec3 uWaves[WAVES];",     // kx, ky, phase
    "uniform vec3 uPointer;",          // x, y (CSS px, top-left origin), energy
    "uniform vec4 uRipples[RIPPLES];", // x, y, age (s), strength
    "uniform float uDim;",             // 1 at top of page, lower once scrolled
    "uniform float uWide;",            // 1 = two-column hero, 0 = phone
    "",
    "vec3 palette(float t) {",
    "  vec3 c0 = vec3(0.17, 0.20, 0.56);", // indigo
    "  vec3 c1 = vec3(0.30, 0.70, 0.98);", // sky
    "  vec3 c2 = vec3(0.43, 0.91, 0.72);", // mint
    "  vec3 c3 = vec3(0.97, 0.70, 0.40);", // amber
    "  vec3 c4 = vec3(0.96, 0.36, 0.47);", // coral
    "  vec3 c = mix(c0, c1, smoothstep(0.0, 0.26, t));",
    "  c = mix(c, c2, smoothstep(0.22, 0.5, t));",
    "  c = mix(c, c3, smoothstep(0.5, 0.78, t));",
    "  c = mix(c, c4, smoothstep(0.78, 1.0, t));",
    "  return c;",
    "}",
    "",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
    "",
    "void main() {",
    "  vec2 p = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;",
    "  vec2 uv = p / uRes;",
    "",
    // Pointer: a soft lens that magnifies the folds and wakes them up.
    "  vec2 dp = p - uPointer.xy;",
    "  float pg = uPointer.z * exp(-dot(dp, dp) / (210.0 * 210.0));",
    "  vec2 warp = -dp * pg * 0.2;",
    "",
    // Clicks: expanding excitation rings.
    "  float exc = 0.0;",
    "  float kick = 0.0;",
    "  for (int i = 0; i < RIPPLES; i++) {",
    "    vec4 rp = uRipples[i];",
    "    if (rp.w > 0.0) {",
    "      vec2 d = p - rp.xy;",
    "      float dist = length(d);",
    "      float rad = rp.z * 440.0;",
    "      float x = (dist - rad) / (44.0 + rp.z * 46.0);",
    "      float ring = exp(-x * x) * rp.w;",
    "      float inner = (1.0 - smoothstep(rad * 0.4, rad, dist)) * rp.w * 0.24 * exp(-rp.z * 0.9);",
    "      exc += ring + inner;",
    "      kick += ring;",
    "      warp += d / (dist + 1.0) * ring * 15.0;",
    "    }",
    "  }",
    "",
    "  vec2 q = p + warp;",
    "  q += 20.0 * vec2(sin(q.y * 0.0061 + uTime * 0.11), cos(q.x * 0.0057 - uTime * 0.09));",
    "",
    // Random-wave field: equal-wavelength plane waves in many directions.
    // Its zero set is a labyrinth of even-width folds.
    "  float h = 0.0;",
    "  vec2 g = vec2(0.0);",
    "  for (int i = 0; i < WAVES; i++) {",
    "    vec3 w = uWaves[i];",
    "    float ph = dot(w.xy, q) + w.z + kick * (1.1 + 0.35 * float(i));",
    "    h += cos(ph);",
    "    g -= w.xy * sin(ph);",
    "  }",
    "  float sd = h / max(length(g), 1e-4);", // signed distance to the nearest fold wall, in px
    "  float ad = abs(sd);",
    "  float aa = 0.9 / uScale;",
    "  float gyrus = smoothstep(-aa, aa, sd);",
    "  float body = gyrus * (0.55 + 0.45 * smoothstep(0.0, 9.0, ad));",
    "  float edge = 1.0 - smoothstep(0.5, 2.0 + aa, ad);",
    "",
    // Slow resting activity that drifts across the sheet.
    "  float b1 = sin(p.x * 0.0042 + uTime * 0.11 + 1.3 * sin(p.y * 0.0036 - uTime * 0.07));",
    "  float b2 = sin(p.y * 0.0051 - uTime * 0.09 + 1.1 * sin(p.x * 0.0031 + uTime * 0.05) + 2.0);",
    "  float rest = smoothstep(0.08, 0.92, 0.5 + 0.5 * b1 * b2);",
    "",
    // Keep the copy legible: quiet on the left on wide screens, quiet overall on phones.
    "  float wideFocus = mix(0.2, 1.0, smoothstep(0.2, 0.74, uv.x));",
    "  float narrowFocus = mix(0.3, 0.62, smoothstep(0.3, 0.95, uv.y));",
    "  float focus = mix(narrowFocus, wideFocus, uWide) * uDim;",
    "  float quiet = mix(0.62, mix(0.4, 1.0, smoothstep(0.14, 0.62, uv.x)), uWide);",
    "",
    "  float a = rest * 0.46 * focus + (pg * 0.62 + exc) * quiet;",
    "  a *= 0.74 + 0.26 * gyrus;",
    "",
    "  vec3 bg = vec3(0.0275, 0.0275, 0.0235);",
    "  float gray = mix(0.031, 0.088, body);",
    "  float reveal = clamp(focus + (pg * 0.8 + exc * 0.6) * quiet, 0.0, 1.0);",
    "  vec3 col = mix(bg, vec3(gray, gray, gray * 0.96), reveal);",
    "",
    "  vec3 pal = palette(clamp(a, 0.0, 1.15) / 1.15);",
    "  float alpha = smoothstep(0.05, 0.56, a);",
    "  col = mix(col, pal * (0.24 + 0.76 * body), alpha * 0.8);",
    "  col += pal * edge * alpha * 0.32;",
    "  col += vec3(1.0, 0.94, 0.88) * max(a - 1.0, 0.0) * 0.55 * body;",
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
  if (!vs || !fs || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.parentNode && canvas.parentNode.removeChild(canvas);
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["uRes", "uScale", "uTime", "uWaves", "uPointer", "uRipples", "uDim", "uWide"].forEach(function (name) {
    U[name] = gl.getUniformLocation(prog, name);
  });

  // ---- State -------------------------------------------------------------

  var cssW = 1;
  var cssH = 1;
  var scale = 1;
  var wide = true;
  var waves = [];
  var waveData = new Float32Array(WAVES * 3);
  var rippleData = new Float32Array(RIPPLES * 4);
  var ripples = [];
  var pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, energy: 0, target: 0, lastMove: 0, inside: false };
  var time = Math.random() * 40;
  var last = 0;
  var running = false;
  var raf = 0;
  var dim = 1;

  function buildWaves() {
    var lambda = wide ? 46 : 36; // fold wavelength in CSS px
    waves = [];
    for (var i = 0; i < WAVES; i++) {
      var theta = (Math.PI * (i + Math.random() * 0.85)) / WAVES;
      var k = ((2 * Math.PI) / lambda) * (0.9 + Math.random() * 0.2);
      waves.push({
        kx: Math.cos(theta) * k,
        ky: Math.sin(theta) * k,
        phase: Math.random() * Math.PI * 2,
        speed: (0.07 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1)
      });
    }
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Cap the pixel budget so large or dense screens stay light.
    var budget = 2.1e6;
    var s = Math.min(dpr, Math.sqrt(budget / Math.max(1, w * h)));
    s = Math.max(0.6, s);
    var wasWide = wide;
    wide = w > 920;
    cssW = w;
    cssH = h;
    scale = s;
    canvas.width = Math.max(1, Math.round(w * s));
    canvas.height = Math.max(1, Math.round(h * s));
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!waves.length || wasWide !== wide) buildWaves();
    if (!running) draw(0);
  }

  function updateDim() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var t = Math.min(1, Math.max(0, y / (0.85 * Math.max(1, window.innerHeight))));
    dim = 1 - 0.68 * t;
    if (!running) draw(0);
  }

  function draw(dt) {
    time += dt;

    // Pointer easing
    var now = performance.now();
    if (pointer.inside) {
      var idle = now - pointer.lastMove;
      pointer.target = idle > 900 ? 0.34 : Math.max(pointer.target * Math.pow(0.2, dt), 0.34);
    } else {
      pointer.target = 0;
    }
    var follow = 1 - Math.pow(0.0015, dt || 0.016);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;
    pointer.energy += (pointer.target - pointer.energy) * (1 - Math.pow(0.02, dt || 0.016));

    for (var i = 0; i < WAVES; i++) {
      var w = waves[i];
      waveData[i * 3] = w.kx;
      waveData[i * 3 + 1] = w.ky;
      waveData[i * 3 + 2] = w.phase + w.speed * time;
    }

    var live = [];
    for (var r = 0; r < ripples.length; r++) {
      var rp = ripples[r];
      rp.age += dt;
      if (rp.age < 3.6) live.push(rp);
    }
    ripples = live;
    for (var j = 0; j < RIPPLES; j++) {
      var o = j * 4;
      var item = ripples[j];
      if (item) {
        var fade = Math.exp(-item.age * 1.15) * Math.min(1, item.age * 14);
        rippleData[o] = item.x;
        rippleData[o + 1] = item.y;
        rippleData[o + 2] = item.age;
        rippleData[o + 3] = item.strength * fade;
      } else {
        rippleData[o] = rippleData[o + 1] = rippleData[o + 2] = rippleData[o + 3] = 0;
      }
    }

    gl.uniform2f(U.uRes, cssW, cssH);
    gl.uniform1f(U.uScale, scale);
    gl.uniform1f(U.uTime, time);
    gl.uniform3fv(U.uWaves, waveData);
    gl.uniform3f(U.uPointer, pointer.x, pointer.y, pointer.energy);
    gl.uniform4fv(U.uRipples, rippleData);
    gl.uniform1f(U.uDim, dim);
    gl.uniform1f(U.uWide, wide ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(t) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
    last = t;
    draw(dt);
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

  // With reduced motion we draw still frames, but a click still gets a short,
  // contained response so the page does not feel dead.
  var burstTimer = 0;
  function burst() {
    if (!reduceMotion) return;
    var began = performance.now();
    var prev = began;
    window.clearInterval(burstTimer);
    burstTimer = window.setInterval(function () {
      var now = performance.now();
      draw(Math.min(0.05, (now - prev) / 1000));
      prev = now;
      if (now - began > 3600) window.clearInterval(burstTimer);
    }, 33);
  }

  // ---- Sound -------------------------------------------------------------

  var SOUND_KEY = "cortex-sound";
  var soundOn = true;
  try {
    soundOn = window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch (e) {}

  var audio = null;
  var SCALE = [0, 2, 4, 7, 9]; // major pentatonic: any two notes agree

  function buildAudio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    var ctx = new Ctx();

    var master = ctx.createGain();
    master.gain.value = 0.5;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp);
    comp.connect(ctx.destination);

    // A synthetic room: decaying filtered noise as an impulse response.
    var seconds = 3.2;
    var len = Math.floor(ctx.sampleRate * seconds);
    var ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var data = ir.getChannelData(ch);
      var lp = 0;
      for (var i = 0; i < len; i++) {
        var t = i / len;
        var white = Math.random() * 2 - 1;
        lp += (white - lp) * (0.55 - 0.45 * t); // darker as it decays
        data[i] = lp * Math.pow(1 - t, 3.2);
      }
    }
    var verb = ctx.createConvolver();
    verb.buffer = ir;
    var wet = ctx.createGain();
    wet.gain.value = 0.55;
    verb.connect(wet);
    wet.connect(master);

    var delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.31;
    var fb = ctx.createGain();
    fb.gain.value = 0.32;
    var tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1800;
    delay.connect(tone);
    tone.connect(fb);
    fb.connect(delay);
    var echo = ctx.createGain();
    echo.gain.value = 0.3;
    tone.connect(echo);
    echo.connect(master);
    echo.connect(verb);

    var bus = ctx.createGain();
    bus.connect(master);
    bus.connect(verb);
    bus.connect(delay);

    return { ctx: ctx, bus: bus };
  }

  function voice(freq, when, gain, bright) {
    var ctx = audio.ctx;
    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(gain, when + 0.006);
    out.gain.exponentialRampToValueAtTime(gain * 0.35, when + 0.22);
    out.gain.exponentialRampToValueAtTime(0.0001, when + 2.2);

    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(900 + bright * 5200, when);
    filter.frequency.exponentialRampToValueAtTime(500 + bright * 900, when + 1.4);
    filter.connect(out);
    out.connect(audio.bus);

    // Body: a sine with a soft triangle octave and a quiet inharmonic partial,
    // which reads as a struck glass or mallet tone.
    var parts = [
      { type: "sine", ratio: 1, level: 1 },
      { type: "triangle", ratio: 2, level: 0.22 + bright * 0.2 },
      { type: "sine", ratio: 2.76, level: 0.1 },
      { type: "sine", ratio: 0.5, level: 0.3 }
    ];
    parts.forEach(function (part) {
      var osc = ctx.createOscillator();
      osc.type = part.type;
      osc.frequency.setValueAtTime(freq * part.ratio, when);
      var g = ctx.createGain();
      g.gain.value = part.level;
      osc.connect(g);
      g.connect(filter);
      osc.start(when);
      osc.stop(when + 2.3);
    });
  }

  function chime(nx, ny, strength) {
    if (!soundOn || window.__radioPlaying) return;
    if (!audio) audio = buildAudio();
    if (!audio) return;
    if (audio.ctx.state === "suspended") audio.ctx.resume();

    var steps = SCALE.length * 3; // three octaves, left to right
    var idx = Math.max(0, Math.min(steps - 1, Math.floor(nx * steps)));
    var semis = SCALE[idx % SCALE.length] + 12 * Math.floor(idx / SCALE.length);
    var freq = 146.83 * Math.pow(2, semis / 12); // from D3
    var bright = 1 - Math.max(0, Math.min(1, ny));
    var now = audio.ctx.currentTime + 0.005;
    var gain = 0.2 * Math.max(0.4, Math.min(1, strength));

    voice(freq, now, gain, bright);
    voice(freq * 1.5, now + 0.085, gain * 0.32, bright * 0.8); // a fifth above, just behind
  }

  // ---- Interaction -------------------------------------------------------

  function excite(x, y, strength, silent) {
    var s = strength == null ? 1 : strength;
    ripples.push({ x: x, y: y, age: 0, strength: s });
    if (ripples.length > RIPPLES) ripples.shift();
    if (!silent) chime(x / Math.max(1, cssW), y / Math.max(1, cssH), s);
    burst();
  }

  window.cortexExcite = excite;

  window.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType === "touch") return;
      var now = performance.now();
      var dx = e.clientX - pointer.tx;
      var dy = e.clientY - pointer.ty;
      var dt = Math.max(8, now - pointer.lastMove);
      var speed = Math.sqrt(dx * dx + dy * dy) / dt; // px per ms
      if (!pointer.inside) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      pointer.inside = true;
      pointer.lastMove = now;
      pointer.target = Math.min(1, Math.max(pointer.target, 0.34 + speed * 0.5));
      if (reduceMotion) draw(0.016);
    },
    { passive: true }
  );

  document.documentElement.addEventListener("mouseleave", function () {
    pointer.inside = false;
  });
  window.addEventListener("blur", function () {
    pointer.inside = false;
  });

  var QUIET = "a, button, input, textarea, select, label, summary, iframe, [data-no-excite]";

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button > 0) return;
    var target = e.target;
    if (target && target.closest && target.closest(QUIET)) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length) return; // the visitor is selecting text
    excite(e.clientX, e.clientY, 1, false);
  });

  // Sound toggle
  var toggles = document.querySelectorAll("[data-cortex-sound]");
  function paintToggles() {
    toggles.forEach(function (btn) {
      btn.setAttribute("aria-pressed", soundOn ? "true" : "false");
      var label = btn.querySelector("[data-cortex-sound-label]");
      if (label) label.textContent = soundOn ? "Sound on" : "Sound off";
    });
  }
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      soundOn = !soundOn;
      try {
        window.localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
      } catch (e) {}
      paintToggles();
      if (soundOn) {
        var rect = btn.getBoundingClientRect();
        excite(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.7, false);
      }
    });
  });
  paintToggles();

  // ---- Lifecycle ---------------------------------------------------------

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }
  window.addEventListener("scroll", updateDim, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    stop();
  });

  resize();
  updateDim();
  document.documentElement.classList.add("has-cortex");
  if (reduceMotion) draw(0);
  else start();
})();
