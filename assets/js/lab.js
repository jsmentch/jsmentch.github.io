/*
 * Cortex lab: live controls for the home page background and its sound.
 *
 * Every change applies immediately and is remembered in this browser
 * (localStorage "cortex-lab-params"). "Copy" puts the changed settings on the
 * clipboard as JSON, ready to be baked into the site's defaults.
 *
 * Keys: H hides the panel, R reseeds, T toggles the page text.
 */
(function () {
  "use strict";

  var C = window.cortex;
  var A = window.siteAudio;
  var STORE = "cortex-lab-params";
  var PRESETS = "cortex-lab-presets";

  var panel = document.createElement("aside");
  panel.className = "lab";
  panel.setAttribute("data-no-excite", "");
  panel.setAttribute("aria-label", "Cortex lab controls");
  document.body.appendChild(panel);

  if (!C) {
    panel.innerHTML = '<p class="lab-empty">The cortex did not start here (WebGL is unavailable or too limited).</p>';
    return;
  }

  // ---- What can be tuned -------------------------------------------------
  // [key, label, min, max, step, flags]   flags: r = rebuilds the scene, a = sound

  var GROUPS = [
    ["Surface", true, [
      ["foldSize", "Fold size", 20, 140, 1, "r"],
      ["foldWidth", "Gyrus roundness", 0.1, 0.6, 0.01],
      ["depth", "Depth", 0, 1.6, 0.01],
      ["detail", "Micro texture", 0, 0.25, 0.005],
      ["detailScale", "Texture scale", 1.2, 5, 0.1, "r"],
      ["morph", "Morph speed", 0, 4, 0.05]
    ]],
    ["Light", true, [
      ["brightness", "Brightness", 0.3, 2, 0.01],
      ["sulcusShade", "Light in sulci", 0, 0.6, 0.01],
      ["shine", "Shine", 0, 1.2, 0.01],
      ["rim", "Rim light", 0, 0.5, 0.01],
      ["warmth", "Cool / warm", -1, 1, 0.01],
      ["lightAzimuth", "Light direction", -180, 180, 1],
      ["lightElevation", "Light height", 5, 85, 1]
    ]],
    ["Framing", false, [
      ["size", "Size", 0.5, 2.2, 0.01, "r"],
      ["horizon", "Horizon", 0, 0.9, 0.01, "r"],
      ["centerX", "Centre", 0, 1, 0.01, "r"],
      ["textShield", "Behind text", 0, 1, 0.01],
      ["fadeLength", "Bottom fade", 20, 400, 5]
    ]],
    ["Motion", false, [
      ["spin", "Spin", 0, 0.3, 0.002],
      ["tilt", "Follow pointer", 0, 3, 0.05],
      ["flick", "Flick to spin", 0, 4, 0.05],
      ["lamp", "Pointer light", 0, 0.6, 0.01],
      ["lampSize", "Pointer light size", 0.005, 0.15, 0.005]
    ]],
    ["Waves and colour", false, [
      ["waveSpeed", "Wave speed", 0.1, 2, 0.01],
      ["waveLife", "Wave reach", 0.8, 8, 0.1],
      ["waveWidth", "Wave width", 0.01, 0.15, 0.005],
      ["waveDecay", "Wave fade", 0.1, 3, 0.05],
      ["swell", "Swell", 0, 4, 0.05],
      ["foldKick", "Fold disturbance", 0, 3, 0.05],
      ["colorAmount", "Colour", 0, 1, 0.01],
      ["hueStep", "Colour change per click", 0, 0.5, 0.01],
      ["holdTime", "Hold to full charge (s)", 0.3, 4, 0.05],
      ["holdPress", "Hold press-in", 0, 3, 0.05],
      ["storm", "Release storm length", 0, 3, 0.05]
    ]],
    ["Neurons", false, [
      ["neurons", "Show neurons", 0, 1, 1, "b"],
      ["neuronCount", "Count", 0, 2.5, 0.05, "r"],
      ["cellScale", "Cell size", 0.5, 2, 0.01, "r"],
      ["stiffness", "Stiffness", 0.2, 3, 0.05],
      ["damping", "Damping", 0.2, 3, 0.05],
      ["push", "Pointer push", 0, 3, 0.05],
      ["axonOpacity", "Axon visibility", 0, 0.6, 0.01],
      ["cellOpacity", "Cell visibility", 0, 1, 0.01],
      ["links", "Connections", 0, 1, 0.01, "r"],
      ["roots", "Axons into cortex", 0, 1, 0.01, "r"],
      ["refractory", "Rest between firing (s)", 0.1, 3, 0.05],
      ["pulseSpeed", "Pulse speed", 80, 1200, 10],
      ["netHue", "Network colours", 0, 1, 0.01]
    ]],
    ["Sound", false, [
      ["level", "Volume", 0, 1, 0.01, "a"],
      ["duck", "Under the radio", 0, 1, 0.01, "a"],
      ["crunch", "Crunch", 0, 2, 0.01, "a"],
      ["thud", "Thud", 0, 2, 0.01, "a"],
      ["crackle", "Crackle", 0, 3, 0.01, "a"],
      ["room", "Room", 0, 1, 0.01, "a"],
      ["ticks", "Neuron ticks", 0, 3, 0.01, "a"]
    ]]
  ];

  // Starting points to react to. Each lists only what differs from the site.
  var BUILT_IN = {
    "Site default": {},
    "Fine grain": { cortex: { foldSize: 34, foldWidth: 0.26, depth: 0.62, detail: 0.08, shine: 0.22, spin: 0.02, waveWidth: 0.03 } },
    "Deep folds": { cortex: { foldSize: 82, foldWidth: 0.42, depth: 1.15, sulcusShade: 0.04, shine: 0.5, lightElevation: 24, lightAzimuth: 40 } },
    "Moonlit": { cortex: { warmth: -0.7, brightness: 0.85, rim: 0.28, shine: 0.62, sulcusShade: 0.06, colorAmount: 0.75 } },
    "Planet": { cortex: { size: 1.7, horizon: 0.55, centerX: 0.5, spin: 0.05, textShield: 0.35 } },
    "Quiet": { cortex: { neurons: false, brightness: 0.8, spin: 0.014, morph: 0.5, waveSpeed: 0.42, waveDecay: 1.2 }, audio: { level: 0.35, crackle: 0.5 } },
    "Electric": { cortex: { colorAmount: 1, hueStep: 0.33, waveSpeed: 0.95, swell: 2.6, foldKick: 1.8, pulseSpeed: 520, refractory: 0.5, links: 0.85 }, audio: { crunch: 1.4, crackle: 1.6 } }
  };

  // ---- Helpers -----------------------------------------------------------

  function target(flags) {
    return flags && flags.indexOf("a") >= 0 ? A && A.params : C.params;
  }
  function defaultsFor(flags) {
    return flags && flags.indexOf("a") >= 0 ? A && A.defaults : C.defaults;
  }
  function decimals(step) {
    return step >= 1 ? 0 : Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  }
  function diff(now, base) {
    var out = {};
    if (!now || !base) return out;
    for (var k in base) {
      if (typeof base[k] === "number" ? Math.abs(now[k] - base[k]) > 1e-9 : now[k] !== base[k]) out[k] = now[k];
    }
    return out;
  }
  function snapshot() {
    return { cortex: diff(C.params, C.defaults), audio: diff(A && A.params, A && A.defaults) };
  }
  function save() {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(snapshot()));
    } catch (e) {}
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-shown");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-shown");
    }, 1600);
  }

  var rebuildTimer = 0;
  function rebuildSoon() {
    window.clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(function () {
      C.rebuild();
    }, 180);
  }

  // ---- Panel -------------------------------------------------------------

  var head = el("div", "lab-head");
  var title = el("p", "lab-title", "Cortex lab");
  var fps = el("span", "lab-fps", "");
  var hideBtn = el("button", "lab-icon", "Hide");
  hideBtn.type = "button";
  hideBtn.title = "Hide the panel (H)";
  head.appendChild(title);
  head.appendChild(fps);
  head.appendChild(hideBtn);
  panel.appendChild(head);

  // Presets
  var presetRow = el("div", "lab-row");
  var presetSel = el("select", "lab-select");
  presetSel.setAttribute("aria-label", "Preset");
  var saveBtn = el("button", "lab-btn", "Save as");
  saveBtn.type = "button";
  var delBtn = el("button", "lab-btn lab-btn--quiet", "Delete");
  delBtn.type = "button";
  presetRow.appendChild(presetSel);
  presetRow.appendChild(saveBtn);
  presetRow.appendChild(delBtn);
  panel.appendChild(presetRow);

  var nameRow = el("div", "lab-row lab-name");
  nameRow.hidden = true;
  var nameInput = el("input", "lab-input");
  nameInput.type = "text";
  nameInput.placeholder = "Name this look";
  var nameOk = el("button", "lab-btn", "Save");
  nameOk.type = "button";
  nameRow.appendChild(nameInput);
  nameRow.appendChild(nameOk);
  panel.appendChild(nameRow);

  // Actions
  var actions = el("div", "lab-row lab-actions");
  function action(label, tip, fn) {
    var b = el("button", "lab-btn", label);
    b.type = "button";
    b.title = tip;
    b.addEventListener("click", fn);
    actions.appendChild(b);
    return b;
  }
  action("Reseed", "New folds and a new neuron layout (R)", function () {
    C.reseed();
  });
  action("Reset", "Back to the site's current settings", function () {
    applyPreset({});
    presetSel.value = "Site default";
    toast("Reset to site default");
  });
  action("Copy", "Copy the changed settings as JSON", copy);
  var textBtn = action("Text", "Show or hide the page text (T)", toggleText);
  textBtn.setAttribute("aria-pressed", "true");
  panel.appendChild(actions);

  var body = el("div", "lab-body");
  panel.appendChild(body);

  var toastEl = el("p", "lab-toast");
  panel.appendChild(toastEl);

  var rows = [];

  GROUPS.forEach(function (group) {
    var det = el("details", "lab-group");
    det.open = group[1];
    var sum = el("summary", null, group[0]);
    det.appendChild(sum);

    group[2].forEach(function (spec) {
      var key = spec[0];
      var flags = spec[5] || "";
      var obj = target(flags);
      if (!obj) return;
      var row = el("label", "lab-ctl");
      var name = el("span", "lab-ctl-name", spec[1]);
      name.title = "Double-click to reset";
      var val = el("span", "lab-ctl-val");
      var input = el("input");
      var isBool = flags.indexOf("b") >= 0;

      if (isBool) {
        input.type = "checkbox";
        row.classList.add("lab-ctl--bool");
      } else {
        input.type = "range";
        input.min = spec[2];
        input.max = spec[3];
        input.step = spec[4];
      }

      function paint() {
        var v = obj[key];
        var d = defaultsFor(flags)[key];
        if (isBool) {
          input.checked = !!v;
          val.textContent = v ? "on" : "off";
        } else {
          input.value = v;
          val.textContent = Number(v).toFixed(decimals(spec[4]));
        }
        row.classList.toggle("is-changed", v !== d);
      }

      function set(v) {
        obj[key] = v;
        paint();
        if (flags.indexOf("r") >= 0) rebuildSoon();
        if (flags.indexOf("a") >= 0 && A) A.refresh();
        save();
      }

      input.addEventListener("input", function () {
        set(isBool ? input.checked : parseFloat(input.value));
      });
      input.addEventListener("change", function () {
        set(isBool ? input.checked : parseFloat(input.value));
      });
      name.addEventListener("dblclick", function (e) {
        e.preventDefault();
        set(defaultsFor(flags)[key]);
      });

      row.appendChild(name);
      row.appendChild(val);
      row.appendChild(input);
      det.appendChild(row);
      rows.push(paint);
      paint();
    });

    body.appendChild(det);
  });

  function repaint() {
    rows.forEach(function (fn) {
      fn();
    });
  }

  // ---- Presets -----------------------------------------------------------

  function userPresets() {
    try {
      return JSON.parse(window.localStorage.getItem(PRESETS) || "{}");
    } catch (e) {
      return {};
    }
  }

  function fillPresets(selected) {
    presetSel.innerHTML = "";
    var g1 = el("optgroup");
    g1.label = "Starting points";
    Object.keys(BUILT_IN).forEach(function (n) {
      g1.appendChild(new Option(n, n));
    });
    presetSel.appendChild(g1);
    var mine = userPresets();
    var names = Object.keys(mine);
    if (names.length) {
      var g2 = el("optgroup");
      g2.label = "Saved";
      names.forEach(function (n) {
        g2.appendChild(new Option(n, "user:" + n));
      });
      presetSel.appendChild(g2);
    }
    var custom = new Option("Current (unsaved)", "");
    presetSel.insertBefore(custom, presetSel.firstChild);
    presetSel.value = selected || "";
    delBtn.disabled = presetSel.value.indexOf("user:") !== 0;
  }

  function applyPreset(p) {
    var k;
    for (k in C.defaults) C.params[k] = C.defaults[k];
    if (A) for (k in A.defaults) A.params[k] = A.defaults[k];
    var c = p.cortex || {};
    var a = p.audio || {};
    for (k in c) if (k in C.defaults) C.params[k] = c[k];
    if (A) for (k in a) if (k in A.defaults) A.params[k] = a[k];
    if (A) A.refresh();
    C.rebuild();
    repaint();
    save();
  }

  presetSel.addEventListener("change", function () {
    var v = presetSel.value;
    delBtn.disabled = v.indexOf("user:") !== 0;
    if (!v) return;
    if (v.indexOf("user:") === 0) applyPreset(userPresets()[v.slice(5)] || {});
    else applyPreset(BUILT_IN[v] || {});
  });

  saveBtn.addEventListener("click", function () {
    nameRow.hidden = !nameRow.hidden;
    if (!nameRow.hidden) nameInput.focus();
  });

  function savePreset() {
    var n = nameInput.value.trim();
    if (!n) return;
    var mine = userPresets();
    mine[n] = snapshot();
    try {
      window.localStorage.setItem(PRESETS, JSON.stringify(mine));
    } catch (e) {}
    nameInput.value = "";
    nameRow.hidden = true;
    fillPresets("user:" + n);
    toast("Saved “" + n + "”");
  }
  nameOk.addEventListener("click", savePreset);
  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") savePreset();
    if (e.key === "Escape") nameRow.hidden = true;
  });

  delBtn.addEventListener("click", function () {
    var v = presetSel.value;
    if (v.indexOf("user:") !== 0) return;
    var mine = userPresets();
    delete mine[v.slice(5)];
    try {
      window.localStorage.setItem(PRESETS, JSON.stringify(mine));
    } catch (e) {}
    fillPresets("");
    toast("Deleted");
  });

  // Any slider move means the look is no longer exactly a preset.
  body.addEventListener("input", function () {
    presetSel.value = "";
    delBtn.disabled = true;
  });

  fillPresets("");

  // ---- Actions -----------------------------------------------------------

  function copy() {
    var text = JSON.stringify(snapshot(), null, 2);
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast("Copied settings");
      } catch (e) {
        toast("Copy failed");
      }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast("Copied settings");
      }, fallback);
    } else {
      fallback();
    }
  }

  function toggleText() {
    var off = document.body.classList.toggle("lab-no-text");
    textBtn.setAttribute("aria-pressed", off ? "false" : "true");
  }

  function togglePanel() {
    var hidden = panel.classList.toggle("is-hidden");
    hideBtn.textContent = hidden ? "Lab" : "Hide";
    hideBtn.title = hidden ? "Show the panel (H)" : "Hide the panel (H)";
  }
  hideBtn.addEventListener("click", togglePanel);

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" && t.type === "text")) return;
    if (t && (t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === "h") togglePanel();
    else if (k === "r") C.reseed();
    else if (k === "t") toggleText();
  });

  // ---- Frame rate --------------------------------------------------------

  var frames = 0;
  var since = performance.now();
  (function tick(now) {
    frames++;
    if (now - since > 500) {
      fps.textContent = Math.round((frames * 1000) / (now - since)) + " fps";
      frames = 0;
      since = now;
    }
    window.requestAnimationFrame(tick);
  })(since);
})();
