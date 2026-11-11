/*
 * Site sound engine. Everything is noise: crushed (sample-and-hold) noise
 * for crunch, sparse impulses for crackle, low-passed bursts for body. There
 * are no oscillators, so nothing has a pitch and nothing can clash with music.
 *
 * Used by the cortex (clicks, holds, neurons firing) and the radio (static).
 * The audio context is only created from a user gesture.
 */
(function () {
  "use strict";

  var KEY = "cortex-sound";
  var LEVEL = 0.5; // overall loudness
  var DUCKED = 0.22; // while the radio plays

  var enabled = true;
  try {
    enabled = window.localStorage.getItem(KEY) !== "off";
  } catch (e) {}

  var ctx = null;
  var master = null;
  var crush = null;
  var send = null;
  var white = null;
  var crushed = null;
  var gravel = null;
  var ducked = false;
  var listeners = [];
  var lastHit = 0;
  var lastDust = 0;
  var lastSpike = 0;
  var staticNodes = null;
  var chargeNodes = null;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function buffer(seconds, fill) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    fill(buf.getChannelData(0), len);
    return buf;
  }

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();

    master = ctx.createGain();
    master.gain.value = ducked ? DUCKED : LEVEL;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 10;
    comp.ratio.value = 6;
    comp.attack.value = 0.002;
    comp.release.value = 0.1;
    master.connect(comp);
    comp.connect(ctx.destination);

    // Crunch bus: hard saturation, then quantised to a few levels.
    crush = ctx.createWaveShaper();
    var curve = new Float32Array(2048);
    for (var i = 0; i < curve.length; i++) {
      var x = (i / (curve.length - 1)) * 2 - 1;
      var y = Math.tanh(x * 4);
      curve[i] = Math.round(y * 5) / 5;
    }
    crush.curve = curve;
    var crushOut = ctx.createGain();
    crushOut.gain.value = 0.42;
    crush.connect(crushOut);
    crushOut.connect(master);

    white = buffer(2, function (d, len) {
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    });

    // Sample-and-hold noise: each value is held for a few samples, which is
    // what cheap digital audio sounds like.
    crushed = buffer(2, function (d, len) {
      var i = 0;
      while (i < len) {
        var v = Math.round((Math.random() * 2 - 1) * 4) / 4;
        var hold = 3 + Math.floor(Math.random() * 9);
        for (var k = 0; k < hold && i < len; k++) d[i++] = v;
      }
    });

    // Gravel: silence broken by small bursts, in clumps.
    gravel = buffer(3, function (d, len) {
      var env = 0;
      var density = 0.004;
      for (var i = 0; i < len; i++) {
        if (i % 2048 === 0) density = 0.0008 + Math.pow(Math.random(), 2) * 0.012;
        if (Math.random() < density) env = 0.25 + Math.random() * 0.75;
        d[i] = env * (Math.random() * 2 - 1);
        env *= 0.86 + Math.random() * 0.1;
      }
    });

    // A very small, dark room. Mostly dry: reverb softens crunch.
    var irLen = Math.floor(ctx.sampleRate * 0.7);
    var ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var data = ir.getChannelData(ch);
      var lp = 0;
      for (var j = 0; j < irLen; j++) {
        var t = j / irLen;
        lp += (Math.random() * 2 - 1 - lp) * (0.45 - 0.35 * t);
        data[j] = lp * Math.pow(1 - t, 3);
      }
    }
    var verb = ctx.createConvolver();
    verb.buffer = ir;
    var wet = ctx.createGain();
    wet.gain.value = 0.3;
    send = ctx.createGain();
    send.connect(verb);
    verb.connect(wet);
    wet.connect(master);

    return ctx;
  }

  function panner(x) {
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, x));
      return p;
    }
    return ctx.createGain();
  }

  /*
   * One burst of noise.
   *   o.buf   which noise
   *   o.type  filter type, o.freq, o.q
   *   o.dur   seconds, o.gain peak, o.pan -1..1
   *   o.crunch 0..1 how much goes through the crunch bus
   *   o.wet   reverb send
   */
  function burst(when, o) {
    var src = ctx.createBufferSource();
    src.buffer = o.buf;
    src.playbackRate.value = o.rate || 1;
    var f = ctx.createBiquadFilter();
    f.type = o.type || "bandpass";
    f.frequency.value = o.freq;
    f.Q.value = o.q == null ? 0.8 : o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), when + (o.attack || 0.001));
    g.gain.exponentialRampToValueAtTime(0.0001, when + o.dur);
    var p = panner(o.pan || 0);
    src.connect(f);
    f.connect(g);
    g.connect(p);

    var c = o.crunch == null ? 0 : o.crunch;
    if (c > 0) {
      var toCrush = ctx.createGain();
      toCrush.gain.value = c * 2.2; // drive
      p.connect(toCrush);
      toCrush.connect(crush);
    }
    if (c < 1) {
      var clean = ctx.createGain();
      clean.gain.value = 1 - c;
      p.connect(clean);
      clean.connect(master);
    }
    if (o.wet) {
      var s = ctx.createGain();
      s.gain.value = o.wet;
      p.connect(s);
      s.connect(send);
    }
    src.start(when, rand(0, o.buf.duration - o.dur - 0.1), o.dur + 0.05);
  }

  /*
   * A press on the cortex.
   * Slow presses get body and a crackling tail; fast ones become a dry roll.
   */
  function hit(nx, ny, strength) {
    if (!enabled) return;
    if (!ensure()) return;
    var now = ctx.currentTime;
    var gap = now - lastHit;
    if (gap < 0.016) return;
    lastHit = now;

    var s = Math.max(0.3, Math.min(1.4, strength == null ? 1 : strength));
    var roll = Math.max(0, Math.min(1, 1 - gap / 0.3));
    var open = 1 - roll;
    var pan = (nx - 0.5) * 1.4;
    var bright = 1 - Math.max(0, Math.min(1, ny));
    var t = now + 0.003;

    // Snap: the leading edge.
    burst(t, { buf: white, type: "highpass", freq: 4200 + bright * 3000, q: 0.5, dur: 0.008, gain: 0.3 * s, pan: pan });

    // Crunch: the main body, broad and crushed.
    burst(t, {
      buf: crushed,
      rate: rand(0.45, 1.3),
      type: "bandpass",
      freq: rand(500, 1500) + bright * 1600,
      q: rand(0.5, 1.4),
      dur: 0.03 + 0.09 * open * rand(0.6, 1),
      gain: 0.5 * s,
      pan: pan,
      crunch: 1,
      wet: 0.05 * open
    });

    // Thud: low, short, unpitched.
    if (open > 0.3) {
      burst(t, { buf: white, type: "lowpass", freq: rand(110, 170), q: 0.7, dur: 0.09, attack: 0.004, gain: 0.9 * s * open, pan: pan * 0.3 });
    }

    // Crackle: a tail of gravel.
    burst(t + 0.01, {
      buf: gravel,
      rate: rand(0.8, 1.7),
      type: "highpass",
      freq: rand(1200, 3600),
      q: 0.4,
      dur: 0.07 + 0.34 * open * Math.random(),
      gain: (0.26 + 0.2 * open) * s,
      pan: rand(-0.8, 0.8),
      crunch: 0.6,
      wet: 0.08
    });
  }

  // Letting go after a hold: the same idea, bigger and longer.
  function release(nx, ny, charge) {
    if (!enabled) return;
    if (!ensure()) return;
    var c = Math.max(0, Math.min(1, charge));
    var t = ctx.currentTime + 0.003;
    var pan = (nx - 0.5) * 1.2;
    lastHit = ctx.currentTime;
    burst(t, { buf: white, type: "highpass", freq: 3500, q: 0.5, dur: 0.012, gain: 0.35, pan: pan });
    burst(t, { buf: crushed, rate: rand(0.3, 0.6), type: "bandpass", freq: 700, q: 0.5, dur: 0.16 + 0.22 * c, gain: 0.55 + 0.25 * c, pan: pan, crunch: 1, wet: 0.1 });
    burst(t, { buf: white, type: "lowpass", freq: 120, q: 0.8, dur: 0.16 + 0.12 * c, attack: 0.005, gain: 1.0, pan: 0 });
    burst(t + 0.02, { buf: gravel, rate: rand(0.6, 1.0), type: "highpass", freq: 900, q: 0.4, dur: 0.45 + 0.6 * c, gain: 0.4 + 0.2 * c, pan: -pan * 0.5, crunch: 0.7, wet: 0.14 });
    burst(t + 0.05, { buf: gravel, rate: rand(1.3, 2.0), type: "highpass", freq: 3200, q: 0.4, dur: 0.3 + 0.5 * c, gain: 0.25, pan: pan, crunch: 0.4, wet: 0.1 });
  }

  // Holding down: a looped crackle that tightens and brightens as it charges.
  function charge(amount) {
    if (!enabled) amount = 0;
    if (amount <= 0) {
      if (chargeNodes) {
        var nodes = chargeNodes;
        chargeNodes = null;
        nodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        window.setTimeout(function () {
          try {
            nodes.src.stop();
          } catch (e) {}
        }, 250);
      }
      return;
    }
    if (!ensure()) return;
    if (!chargeNodes) {
      var src = ctx.createBufferSource();
      src.buffer = gravel;
      src.loop = true;
      var hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.Q.value = 0.5;
      var g = ctx.createGain();
      g.gain.value = 0;
      var drive = ctx.createGain();
      drive.gain.value = 1.6;
      src.connect(hp);
      hp.connect(g);
      g.connect(drive);
      drive.connect(crush);
      src.start(0, rand(0, 2));
      chargeNodes = { src: src, hp: hp, gain: g };
    }
    var a = Math.max(0, Math.min(1, amount));
    var now = ctx.currentTime;
    chargeNodes.gain.gain.setTargetAtTime(0.06 + 0.3 * a, now, 0.05);
    chargeNodes.hp.frequency.setTargetAtTime(500 + 3800 * a, now, 0.05);
    chargeNodes.src.playbackRate.setTargetAtTime(0.7 + 1.6 * a, now, 0.05);
  }

  // A neuron firing: one tiny crushed grain.
  function spike(nx) {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    if (now - lastSpike < 0.022) return;
    lastSpike = now;
    burst(now + 0.002, {
      buf: crushed,
      rate: rand(0.8, 2.2),
      type: "bandpass",
      freq: rand(1800, 5200),
      q: 1.2,
      dur: rand(0.006, 0.016),
      gain: rand(0.05, 0.11),
      pan: ((nx == null ? 0.5 : nx) - 0.5) * 1.6,
      crunch: 0.8
    });
  }

  // Stirring: sparse, quiet crackle.
  function dust(nx, amount) {
    if (!enabled || !ctx || ducked) return;
    var now = ctx.currentTime;
    if (now - lastDust < 0.035) return;
    if (Math.random() > amount) return;
    lastDust = now;
    burst(now + 0.002, {
      buf: gravel,
      rate: rand(1, 2),
      type: "highpass",
      freq: rand(2500, 6000),
      q: 0.4,
      dur: rand(0.02, 0.05),
      gain: rand(0.04, 0.1) * amount,
      pan: (nx - 0.5) * 1.6,
      crunch: 0.5
    });
  }

  // Radio tuning static. amount 0..1; 0 stops it.
  function setStatic(amount) {
    if (!enabled) amount = 0;
    if (amount <= 0) {
      if (staticNodes) {
        var nodes = staticNodes;
        staticNodes = null;
        nodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        window.setTimeout(function () {
          try {
            nodes.src.stop();
          } catch (e) {}
        }, 200);
      }
      return;
    }
    if (!ensure()) return;
    if (!staticNodes) {
      var src = ctx.createBufferSource();
      src.buffer = white;
      src.loop = true;
      var bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.5;
      var g = ctx.createGain();
      g.gain.value = 0;
      src.connect(bp);
      bp.connect(g);
      // Static bypasses the duck so it is audible over a track change.
      g.connect(ctx.destination);
      src.start();
      staticNodes = { src: src, band: bp, gain: g };
    }
    staticNodes.gain.gain.setTargetAtTime(0.04 * amount, ctx.currentTime, 0.02);
    staticNodes.band.frequency.setTargetAtTime(900 + 3200 * amount + rand(-300, 300), ctx.currentTime, 0.04);
  }

  // A small relay click when a station locks in.
  function tick() {
    if (!enabled) return;
    if (!ensure()) return;
    var t = ctx.currentTime + 0.002;
    burst(t, { buf: white, type: "bandpass", freq: 1400, q: 2, dur: 0.016, gain: 0.3, pan: 0 });
    burst(t + 0.02, { buf: white, type: "highpass", freq: 3600, q: 0.5, dur: 0.008, gain: 0.14, pan: 0 });
  }

  window.siteAudio = {
    isEnabled: function () {
      return enabled;
    },
    setEnabled: function (value) {
      enabled = !!value;
      try {
        window.localStorage.setItem(KEY, enabled ? "on" : "off");
      } catch (e) {}
      if (!enabled) {
        setStatic(0);
        charge(0);
      }
      listeners.forEach(function (fn) {
        fn(enabled);
      });
    },
    onChange: function (fn) {
      listeners.push(fn);
    },
    // While music plays, everything here drops back.
    duck: function (value) {
      ducked = !!value;
      if (master) master.gain.setTargetAtTime(ducked ? DUCKED : LEVEL, ctx.currentTime, 0.15);
    },
    hit: hit,
    release: release,
    charge: charge,
    spike: spike,
    dust: dust,
    setStatic: setStatic,
    tick: tick
  };
})();
