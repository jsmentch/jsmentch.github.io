# Site TODO

Running list from the November 2026 site review. Not published (excluded in `_config.yml`).

## Front page

- [x] Replace the encoding-model graphic with an interactive cortex shader (mouse-reactive, click to excite, sound)
- [x] Add a radio that flips through Jeff XR tracks on Spotify
- [ ] Decide whether the cortex field should also appear (dimmed) on inner pages
- [x] v1 visual: points that flow in and assemble a brain (folds, cerebellum, brainstem), scatter on click (`assets/js/cortex.js`)
- [x] v1 sound: percussive, textural, non-tonal engine shared by the cortex and the radio (`assets/js/audio.js`)
- [x] v1 radio: cream-and-ink set with a draggable tuner and static, opens to centre with the page blurred, nav entry and a one-time hint
- [x] v2 visual: a turning 3D cortical surface (monochrome) with ragdoll neurons of five types wired into three networks; click waves, hold-to-charge, hover lamp and brushing (`assets/js/cortex.js`)
- [x] v2 sound: all noise, crushed and crackly, quieter (`assets/js/audio.js`)
- [x] v2 radio: graphite body so it stops outshining the page
- [x] Background lab at `/lab/`: live controls for the cortex and its sound, presets, copy settings (`lab/index.html`, `assets/js/lab.js`)
- [x] Dial in the background in the lab, then bake the chosen settings into the defaults in `assets/js/cortex.js` and `assets/js/audio.js`
- [ ] Decide whether `/lab/` ships (it is `noindex` and unlinked) or is removed before launch
- [ ] Listen and tune: click crunch, hold crackle, neuron ticks, tuning static, and how far they drop while the radio plays (`assets/js/audio.js`)
- [ ] Check the cortex and radio in Safari and on a real phone
- [ ] Radio stops when navigating to another page (each page reloads the player). Keeping it playing needs in-page navigation
- [ ] Add more stations in `_data/radio.yml` (currently the six Spotify top tracks)
- [ ] Remove the now-unused encoding-diagram CSS from `assets/css/main.css` (`.hero-visual`, `.instrument-*`, `.encoding-diagram`, `.feature-*`, `.weight-*`, `.cortex-map` rules)
- [ ] Cut the repeated "speech, audio, movies, gaze, behavior, brain data" list (appears in eyebrow, tagline, stats, ticker, cards)
- [ ] Replace the three generic cards (Signal modeling / Human data / Research Tools) with real work: figures, audio, a face
- [ ] Add a contact call to action and a publications strip
- [ ] Optional second interactive module: Image2Reverb "hear this room" demo (needs audio clips we are allowed to host)

## Content that is thin or stale (needs input from Jeff)

- [ ] Current role: About says "recently completed my PhD" and nothing about now
- [ ] VR eye-tracking page is one paragraph plus a TODO, yet is featured second on the home page. Needs the Sci Rep 2020 link, a pipeline schematic, example gaze overlays
- [ ] Missing paper links: J Neurosci (GABA rivalry), Current Biology (EEG rivalry), Dartmouth thesis
- [ ] Tensor decomposition page reads as an abstract with no stated result; embed the recorded talk
- [ ] Image2Reverb page: no figures or audio, role is vague (see the TODO comment at the bottom of the file)
- [ ] Neuroscout tools: annotation platform has no screenshot or link
- [ ] Marine biology and Alzheimer's pages: no specifics (lab, dates, what was done)
- [ ] Resume PDF still says "in review, eLife" and lists a different email than the site
- [ ] Add a publications list, LinkedIn, and Google Scholar. Footer still links Twitter
- [ ] Site email is the MIT address; confirm it still works after graduation
- [ ] Larger About portrait (current file is 320px, shown at 108px)
- [ ] The published eLife / bioRxiv title itself reads "Pregistered" (the site matches the record). Worth fixing with the journal in the next version

## Content to trim

- [ ] Projects index: 13 equal cards. Feature 4-5, move the rest to a compact "earlier work" list
- [ ] Project cards: 12 of 13 use a word in a box instead of an image
- [ ] Encoding page: the same seven links appear three times; "Technical approach" restates "What I built"
- [ ] ReadNet page: role is described three times; collaborator links include Citadel's homepage
- [ ] Infrared page: the five Sony teardown photos appear twice
- [ ] Remove self-justifying lines ("I like including this project because it shows range") and heavy bolding in the shorter pages
- [ ] Inconsistent heading case (e.g. "Naturalistic Gaze And Salience", "Why It Matters")

## Bugs

- [x] Canonical and `og:url` pointed to `jsmentch.github.io` instead of `jeffmentch.com`
- [x] Two `<title>` tags; SEO tags rendered outside `<head>`
- [x] No favicon, no share image
- [x] Inter was named in CSS but never loaded (now loaded from Google Fonts; self-host the font files later if a third-party request is unwanted)
- [x] Dead Universal Analytics script (stopped collecting in 2023). Removed; add a GA4 or Plausible ID if analytics are wanted
- [x] Heavy images: infrared page ~39 MB, tensor figure 7 MB
- [x] Dead links in About (Dartmouth Digital Musics, Penn State, caglab.org, old SHBT URL)
- [x] Stella countdown page had no `noindex`
- [ ] `assets/diybar/` is unused by any page. Left in place in case something external links to it; delete if not
- [ ] Editor backup files are tracked in git (`_includes/analytics.html~`, `_layouts/default.html~`, `assets/css/style.scss~`)
- [ ] `theme: jekyll-swiss` is still declared although every layout is overridden
- [ ] `_posts/` is empty, so `feed.xml` is an empty feed
