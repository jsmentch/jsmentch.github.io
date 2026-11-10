/*
 * Site radio: flips through Jeff XR tracks using Spotify's embed.
 * Nothing is requested from Spotify until the visitor opens the radio.
 * Tracks live in _data/radio.yml.
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
  var toggle = $("[data-radio-toggle]");
  var panel = $("[data-radio-panel]");
  var closeBtn = $("[data-radio-close]");
  var dial = $("[data-radio-dial]");
  var needle = $("[data-radio-needle]");
  var freqEl = $("[data-radio-freq]");
  var titleEl = $("[data-radio-title]");
  var artistsEl = $("[data-radio-artists]");
  var countEl = $("[data-radio-count]");
  var nowEl = $("[data-radio-now]");
  var statusEl = $("[data-radio-status]");
  var embedEl = $("[data-radio-embed]");

  var INDEX_KEY = "radio-station";
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

  // Spread stations across the FM band, like presets on a dial.
  var LOW = 88.1;
  var HIGH = 107.9;
  function freqFor(i) {
    if (tracks.length === 1) return 98.1;
    var f = LOW + ((HIGH - LOW) * i) / (tracks.length - 1);
    return Math.round(f * 10) / 10;
  }
  function posFor(i) {
    return 6 + (88 * (freqFor(i) - LOW)) / (HIGH - LOW); // percent along the dial
  }

  var marks = tracks.map(function (track, i) {
    var mark = document.createElement("button");
    mark.type = "button";
    mark.className = "radio-mark";
    mark.style.left = posFor(i) + "%";
    mark.setAttribute("aria-label", "Station " + freqFor(i).toFixed(1) + ": " + track.title);
    mark.addEventListener("click", function () {
      select(i, true);
    });
    dial.appendChild(mark);
    return mark;
  });

  function paint() {
    var track = tracks[index];
    freqEl.textContent = freqFor(index).toFixed(1);
    titleEl.textContent = track.title;
    artistsEl.textContent = track.artists || "";
    countEl.textContent = index + 1 + " / " + tracks.length;
    needle.style.left = posFor(index) + "%";
    marks.forEach(function (mark, i) {
      if (i === index) mark.setAttribute("aria-current", "true");
      else mark.removeAttribute("aria-current");
    });
    nowEl.textContent = playing ? track.title : "Jeff XR";
    root.classList.toggle("is-playing", playing);
  }

  function setPlaying(value) {
    if (playing === value) return;
    playing = value;
    window.__radioPlaying = value; // the cortex chime stays quiet while music plays
    paint();
  }

  function ripple() {
    if (!window.cortexExcite) return;
    var rect = toggle.getBoundingClientRect();
    window.cortexExcite(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.55, true);
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
    paint();
    ripple();
    if (controller) {
      controller.loadUri(tracks[index].uri);
      // Some browsers only allow playback from a press inside the player
      // itself. Ask anyway; the Spotify play button remains as the fallback.
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
          // Radio behaviour: when a track runs out, move to the next station.
          if (ended && !endHandled) {
            endHandled = true;
            select(index + 1, true);
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
      statusEl.innerHTML = "";
      statusEl.appendChild(document.createTextNode("Spotify did not load. "));
      var link = document.createElement("a");
      link.href = "https://open.spotify.com/track/" + tracks[index].uri.split(":").pop();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open this track on Spotify";
      statusEl.appendChild(link);
    };
    document.head.appendChild(script);
  }

  function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    loadApi();
    ripple();
  }

  function close() {
    panel.hidden = true; // the player keeps running, so music continues
    toggle.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
  }

  toggle.addEventListener("click", function () {
    if (panel.hidden) open();
    else close();
  });
  closeBtn.addEventListener("click", function () {
    close();
    toggle.focus();
  });
  $("[data-radio-prev]").addEventListener("click", function () {
    select(index - 1, true);
  });
  $("[data-radio-next]").addEventListener("click", function () {
    select(index + 1, true);
  });

  root.addEventListener("keydown", function (e) {
    if (panel.hidden) return;
    if (e.key === "Escape") {
      close();
      toggle.focus();
    } else if (e.key === "ArrowRight") {
      select(index + 1, true);
    } else if (e.key === "ArrowLeft") {
      select(index - 1, true);
    }
  });

  paint();
})();
