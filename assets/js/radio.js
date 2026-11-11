/*
 * Site radio: a small set that tunes between Jeff XR tracks on Spotify.
 *
 * - Nothing is requested from Spotify until the visitor opens the radio.
 * - Opening brings the set to the centre and blurs the page behind it.
 *   Closing sends it back to its dock; the music keeps playing.
 * - Drag the tuner (or use the arrow keys) to change station. There is
 *   static between stations.
 * - Tracks live in _data/radio.yml.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-radio]");
  if (!root) return;

  var tracks = [];
  try {
    tracks = JSON.parse(root.querySelector("[data-radio-tracks]").textContent) || [];
  } catch (e) {}
  if (!tracks.length) return;

  var $ = function (sel) {
    return root.querySelector(sel);
  };
  var dock = $("[data-radio-dock]");
  var hint = $("[data-radio-hint]");
  var backdrop = $("[data-radio-backdrop]");
  var set = $("[data-radio-set]");
  var closeBtn = $("[data-radio-close]");
  var scale = $("[data-radio-scale]");
  var range = $("[data-radio-range]");
  var freqEl = $("[data-radio-freq]");
  var stateEl = $("[data-radio-state]");
  var titleEl = $("[data-radio-title]");
  var artistsEl = $("[data-radio-artists]");
  var countEl = $("[data-radio-count]");
  var statusEl = $("[data-radio-status]");
  var embedEl = $("[data-radio-embed]");
  var html = document.documentElement;
  var audio = window.siteAudio;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var INDEX_KEY = "radio-station";
  var HINT_KEY = "radio-hint-seen";
  var index = 0;
  try {
    var saved = parseInt(window.sessionStorage.getItem(INDEX_KEY), 10);
    if (saved >= 0 && saved < tracks.length) index = saved;
  } catch (e) {}

  var controller = null;
  var apiRequested = false;
  var playing = false;
  var wantPlay = false;
  var endHandled = false;
  var selectedAt = 0;
  var isOpen = false;
  var opener = null;
  var tuning = false;

  // Stations sit evenly across the FM band, like presets.
  var LOW = 88.1;
  var HIGH = 107.9;
  var last = Math.max(1, tracks.length - 1);

  function freqAt(pos) {
    return LOW + ((HIGH - LOW) * pos) / last;
  }

  tracks.forEach(function (track, i) {
    var mark = document.createElement("span");
    mark.className = "radio-mark";
    mark.style.left = (i / last) * 100 + "%";
    scale.appendChild(mark);
  });
  var marks = scale.querySelectorAll(".radio-mark");

  function paint(pos) {
    var at = pos == null ? index : pos;
    var nearest = Math.max(0, Math.min(tracks.length - 1, Math.round(at)));
    var track = tracks[nearest];
    freqEl.textContent = freqAt(at).toFixed(1);
    titleEl.textContent = track.title;
    artistsEl.textContent = track.artists || "";
    countEl.textContent = nearest + 1 + " of " + tracks.length;
    range.setAttribute("aria-valuetext", freqAt(nearest).toFixed(1) + " FM, " + track.title);
    for (var i = 0; i < marks.length; i++) {
      marks[i].classList.toggle("is-current", i === nearest);
    }
    stateEl.textContent = playing ? "On air" : "Off air";
    root.classList.toggle("is-playing", playing);
    html.classList.toggle("radio-playing", playing);
    dock.setAttribute(
      "aria-label",
      playing ? "Open the radio. Now playing: " + tracks[index].title : "Open the radio: music by Jeff XR"
    );
    dock.title = playing ? tracks[index].title + " / Jeff XR" : "Radio";
  }

  function setPlaying(value) {
    if (playing === value) return;
    playing = value;
    window.__radioPlaying = value;
    // Music playing: the cortex percussion drops back and plays along quietly.
    if (audio) audio.duck(value);
    paint();
  }

  function tryPlay() {
    if (!controller || !wantPlay) return;
    try {
      controller.play();
    } catch (e) {}
  }

  function select(i, autoplay) {
    index = (i + tracks.length) % tracks.length;
    try {
      window.sessionStorage.setItem(INDEX_KEY, String(index));
    } catch (e) {}
    endHandled = false;
    selectedAt = Date.now();
    wantPlay = !!autoplay;
    range.value = String(index);
    paint();
    if (audio && isOpen) audio.tick();
    if (controller) {
      controller.loadUri(tracks[index].uri);
      // Some browsers only start playback from a press inside the player
      // itself. Ask anyway; Spotify's own play button is the fallback.
      window.setTimeout(tryPlay, 700);
    }
  }

  function onReady(IFrameAPI) {
    IFrameAPI.createController(
      embedEl,
      { uri: tracks[index].uri, width: "100%", height: 80 },
      function (ctrl) {
        controller = ctrl;
        statusEl.hidden = true;

        ctrl.addListener("ready", function () {
          tryPlay();
        });

        ctrl.addListener("playback_update", function (e) {
          var d = (e && e.data) || {};
          // Spotify reports the end of a track (or preview) as position reaching
          // duration, without a pause. Events just after a station change can
          // still belong to the previous track, so those are ignored.
          var settled = Date.now() - selectedAt > 1500;
          var ended = settled && d.duration > 0 && d.position >= d.duration - 350;
          setPlaying(!ended && !d.isPaused && !d.isBuffering && d.position > 0);
          if (!d.isPaused) wantPlay = false;
          if (ended && !endHandled) {
            endHandled = true;
            select(index + 1, true); // radio behaviour: on to the next station
          }
        });
      }
    );
  }

  function loadApi() {
    if (apiRequested) return;
    apiRequested = true;
    var previous = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = function (IFrameAPI) {
      if (typeof previous === "function") previous(IFrameAPI);
      onReady(IFrameAPI);
    };
    var script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = function () {
      statusEl.hidden = false;
      statusEl.textContent = "Spotify did not load. ";
      var link = document.createElement("a");
      link.href = "https://open.spotify.com/track/" + tracks[index].uri.split(":").pop();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open this track there";
      statusEl.appendChild(link);
    };
    document.head.appendChild(script);
  }

  // ---- Open and close ----------------------------------------------------

  var others = [];

  function setInert(value) {
    if (value) {
      others = Array.prototype.filter.call(document.body.children, function (el) {
        return el !== root && el.tagName !== "SCRIPT";
      });
      others.forEach(function (el) {
        el.setAttribute("inert", "");
      });
    } else {
      others.forEach(function (el) {
        el.removeAttribute("inert");
      });
      others = [];
    }
  }

  // The set flies between its dock and the centre of the screen.
  function flight() {
    var from = dock.getBoundingClientRect();
    var to = set.getBoundingClientRect();
    var dx = from.left + from.width / 2 - (to.left + to.width / 2);
    var dy = from.top + from.height / 2 - (to.top + to.height / 2);
    var s = Math.max(0.08, from.width / Math.max(1, to.width));
    return "translate(" + dx + "px, " + dy + "px) scale(" + s + ") rotate(8deg)";
  }

  var anim = null;

  function open(from) {
    if (isOpen) return;
    isOpen = true;
    opener = from || dock;
    dismissHint();
    root.classList.add("is-open");
    html.classList.add("radio-open");
    setInert(true);
    loadApi();
    paint();

    if (anim) anim.cancel();
    if (set.animate && !reduceMotion) {
      anim = set.animate(
        [
          { transform: flight(), opacity: 0.2 },
          { transform: "none", opacity: 1 }
        ],
        { duration: 620, easing: "cubic-bezier(0.2, 1.35, 0.35, 1)" }
      );
    }
    window.setTimeout(function () {
      if (isOpen) range.focus({ preventScroll: true });
    }, 60);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    stopStatic();
    html.classList.remove("radio-open");
    setInert(false);

    function done() {
      root.classList.remove("is-open"); // hidden, but the player keeps running
    }
    if (anim) anim.cancel();
    if (set.animate && !reduceMotion) {
      anim = set.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: flight(), opacity: 0 }
        ],
        { duration: 300, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)" }
      );
      anim.onfinish = done;
    } else {
      done();
    }
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest && e.target.closest("[data-radio-open]");
    if (!trigger) return;
    e.preventDefault();
    if (isOpen) close();
    else open(trigger);
  });
  backdrop.addEventListener("click", close);
  closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      // Keep focus inside the set while it is open.
      var items = set.querySelectorAll("button, a[href], input");
      if (!items.length) return;
      var first = items[0];
      var lastItem = items[items.length - 1];
      var activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === "IFRAME") return;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && activeEl === lastItem) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // ---- Tuning ------------------------------------------------------------

  function stopStatic() {
    tuning = false;
    if (audio) audio.setStatic(0);
  }

  range.addEventListener("input", function () {
    var pos = parseFloat(range.value);
    var off = Math.abs(pos - Math.round(pos)); // 0 on a station, 0.5 between two
    tuning = true;
    paint(pos);
    root.classList.toggle("is-between", off > 0.12);
    if (audio) audio.setStatic(Math.min(1, off * 2.4));
  });

  function settle() {
    if (!tuning) return;
    var target = Math.round(parseFloat(range.value));
    stopStatic();
    root.classList.remove("is-between");
    if (target !== index) select(target, true);
    else {
      range.value = String(index);
      paint();
    }
  }
  range.addEventListener("change", settle);
  range.addEventListener("pointerup", settle);
  range.addEventListener("blur", settle);

  // Arrow keys step station to station instead of creeping along the dial.
  range.addEventListener("keydown", function (e) {
    var step = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") step = 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") step = -1;
    if (!step) return;
    e.preventDefault();
    select(index + step, true);
  });

  $("[data-radio-prev]").addEventListener("click", function () {
    select(index - 1, true);
  });
  $("[data-radio-next]").addEventListener("click", function () {
    select(index + 1, true);
  });

  // ---- A nudge towards the radio -----------------------------------------

  var hintTimer = 0;

  function dismissHint() {
    window.clearTimeout(hintTimer);
    if (hint.hidden) return;
    hint.classList.remove("is-shown");
    window.setTimeout(function () {
      hint.hidden = true;
    }, 400);
  }

  var seen = false;
  try {
    seen = window.sessionStorage.getItem(HINT_KEY) === "1";
  } catch (e) {}

  if (!seen) {
    window.setTimeout(function () {
      if (isOpen) return;
      try {
        window.sessionStorage.setItem(HINT_KEY, "1");
      } catch (e) {}
      hint.hidden = false;
      // Next frame, so the entrance transition runs.
      window.requestAnimationFrame(function () {
        hint.classList.add("is-shown");
        root.classList.add("is-nudging");
      });
      hintTimer = window.setTimeout(function () {
        dismissHint();
        root.classList.remove("is-nudging");
      }, 9000);
    }, 4200);
  }

  range.value = String(index);
  paint();
})();
