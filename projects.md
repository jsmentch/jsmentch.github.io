---
layout: page
title: Projects
permalink: /projects
wide: true
---

<section class="projects-intro">
  <p class="eyebrow">Portfolio</p>
  <p class="lead">A growing map of research systems, machine learning projects, and visual experiments. These are written as project snapshots for now, with room to expand each into a full case study.</p>
</section>

<div class="project-grid">
  <a class="project-card feature" id="naturalistic-encoding" href="{{ '/projects/naturalistic-encoding/' | relative_url }}">
    <div class="project-visual project-visual-metrics" aria-hidden="true">
      <div class="project-metric">
        <span class="project-metric-value">171</span>
        <small class="project-metric-label">participants</small>
      </div>
      <span class="project-metric-sep" aria-hidden="true"></span>
      <div class="project-metric">
        <span class="project-metric-value">280M+</span>
        <small class="project-metric-label">model fits</small>
      </div>
    </div>
    <div class="project-body">
      <p class="project-type">PhD thesis · Preregistered fMRI · Multimodal ML</p>
      <h2>Naturalistic neural encoding in autism</h2>
      <p>Built a preregistered multimodal modeling pipeline linking movie features to whole-brain fMRI in 171 youth, revealing where sensory and higher-level representations diverge in autism.</p>
      <ul class="project-tags">
        <li>Python</li>
        <li>Predictive modeling</li>
        <li>fMRI</li>
        <li>Multimodal ML</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="image2reverb" href="{{ '/projects/image2reverb/' | relative_url }}">
    <div class="project-visual project-visual-wave" aria-hidden="true"></div>
    <div class="project-body">
      <p class="project-type">ICCV 2021 · Cross-modal generation</p>
      <h2>Image2Reverb</h2>
      <p>An end-to-end model that predicts acoustic impulse responses from RGB images of spaces, enabling geometry-aware reverb synthesis from visual scenes.</p>
      <ul class="project-tags">
        <li>PyTorch</li>
        <li>CNNs</li>
        <li>Audio</li>
        <li>Computer vision</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="speech-challenge" href="{{ '/projects/pediatric-speech-dataset/' | relative_url }}">
    <div class="project-visual project-visual-speech" aria-hidden="true">
      <span>0.97</span>
      <small>top AUROC</small>
    </div>
    <div class="project-body">
      <p class="project-type">Dataset engineering · Public ML challenge</p>
      <h2>Pediatric speech dataset</h2>
      <p>Preprocessing and feature extraction pipelines for anonymized child speech recordings, supporting an ML challenge focused on automated speech recognition for early literacy assessment.</p>
      <ul class="project-tags">
        <li>Speech</li>
        <li>Feature extraction</li>
        <li>Dataset curation</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="vr-eye-tracking" href="{{ '/projects/naturalistic-gaze-salience/' | relative_url }}">
    <div class="project-visual project-visual-vr" aria-hidden="true">
      <span>360°</span>
      <small>Gaze · Salience</small>
    </div>
    <div class="project-body">
      <p class="project-type">VR · Eye-tracking · Visual attention</p>
      <h2>Naturalistic gaze and salience</h2>
      <p>End-to-end VR eye-tracking and salience modeling workflows for studying attention in immersive 360 degree scenes, including autism-relevant behavioral markers.</p>
      <ul class="project-tags">
        <li>VR</li>
        <li>Eye-tracking</li>
        <li>Salience models</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="neuroscout-feature-visualizer" href="{{ '/projects/neuroscout-feature-visualizer/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--viz" aria-hidden="true">
      <span>p5</span>
      <small>features · viz</small>
    </div>
    <div class="project-body">
      <p class="project-type">Neuroscience · Data Visualization · JavaScript</p>
      <h2>Neuroscout Feature Visualizer</h2>
      <p>A browser-based p5.js tool for exploring AudioSet and other features extracted from naturalistic movie stimuli, built to make high-dimensional annotations easier to inspect and explain.</p>
      <ul class="project-tags">
        <li>JavaScript</li>
        <li>p5.js</li>
        <li>Data Viz</li>
        <li>Neuroscout</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="audiovisual-annotation-platform" href="{{ '/projects/audiovisual-annotation-platform/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--web" aria-hidden="true">
      <span>Web</span>
      <small>annotate · ship</small>
    </div>
    <div class="project-body">
      <p class="project-type">Web Tools · Annotation · Research Infrastructure</p>
      <h2>Audiovisual annotation platform</h2>
      <p>Built and deployed a flexible web-based platform for labeling naturalistic movie stimuli for downstream neuroimaging, behavioral, and ML studies.</p>
      <ul class="project-tags">
        <li>Web App</li>
        <li>Annotation</li>
        <li>Research Ops</li>
        <li>Multimodal Data</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="gaba-binocular-rivalry" href="{{ '/projects/gaba-binocular-rivalry-j-neurosci/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--pharma" aria-hidden="true">
      <span>BR</span>
      <small>GABA · pharma</small>
    </div>
    <div class="project-body">
      <p class="project-type">Psychophysics · Pharmacology · Clinical Research</p>
      <h2>GABAergic inhibition and perceptual awareness</h2>
      <p>Co-first-author pharmacology study showing that both GABA_A and GABA_B modulation increased perceptual suppression during binocular rivalry, providing causal evidence linking inhibition to perceptual awareness.</p>
      <ul class="project-tags">
        <li>Psychophysics</li>
        <li>Pharmacology</li>
        <li>Autism</li>
        <li>Clinical Studies</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="binocular-rivalry-eeg-cb" href="{{ '/projects/binocular-rivalry-eeg-current-biology/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--eeg" aria-hidden="true">
      <span>EEG</span>
      <small>rivalry · autism</small>
    </div>
    <div class="project-body">
      <p class="project-type">EEG · Autism · Computational Neuroscience</p>
      <h2>Slower binocular rivalry in the autistic brain</h2>
      <p>Co-authored EEG study showing slower neural and behavioral rivalry dynamics in autism, with neural signals predicting symptom severity and classifying diagnostic status.</p>
      <ul class="project-tags">
        <li>EEG</li>
        <li>SSVEP</li>
        <li>Autism</li>
        <li>Perception</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="dartmouth-thesis-music" href="{{ '/projects/dartmouth-thesis-naturalistic-music/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--music" aria-hidden="true">
      <span>MA</span>
      <small>music · fMRI</small>
    </div>
    <div class="project-body">
      <p class="project-type">Audio · fMRI · Thesis</p>
      <h2>Naturalistic music and neural representation</h2>
      <p>Master’s thesis linking naturalistic music stimuli to brain responses using computational modeling and a large-scale audio corpus.</p>
      <ul class="project-tags">
        <li>Audio</li>
        <li>Modeling</li>
        <li>fMRI</li>
        <li>Thesis</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="alzheimers-trials-abington" href="{{ '/projects/alzheimers-clinical-trials-abington/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--clinical" aria-hidden="true">
      <span>II / III</span>
      <small>Alzheimer’s trials</small>
    </div>
    <div class="project-body">
      <p class="project-type">Clinical Research · Trials · Translational Medicine</p>
      <h2>Alzheimer’s clinical trial coordination</h2>
      <p>Coordinated Phase II/III Alzheimer’s clinical trials, working directly with patients, caregivers, clinicians, and study protocols to support compliant, patient-centered research execution.</p>
      <ul class="project-tags">
        <li>Clinical Research</li>
        <li>Alzheimer’s</li>
        <li>Trials</li>
        <li>Operations</li>
      </ul>
    </div>
  </a>

  <a class="project-card" id="deep-sea-marine-biology" href="{{ '/projects/deep-sea-marine-biology/' | relative_url }}">
    <div class="project-visual project-visual-badge project-visual-badge--field" aria-hidden="true">
      <span>Field</span>
      <small>deep sea · bio</small>
    </div>
    <div class="project-body">
      <p class="project-type">Field Research · Biology · Early Work</p>
      <h2>Deep-sea marine biology</h2>
      <p>Early research experience that taught me how to work carefully with unfamiliar systems, collect data under constraints, and stay curious outside the path I eventually took into ML and neuroscience.</p>
      <ul class="project-tags">
        <li>Fieldwork</li>
        <li>Biology</li>
        <li>Research</li>
        <li>Exploration</li>
      </ul>
    </div>
  </a>

  {% comment %} Add new project cards above this row (infrared stays last). {% endcomment %}
  <a class="project-card" id="infrared-camera" href="{{ '/projects/infrared-camera-conversion/' | relative_url }}">
    <div class="project-visual">
      <img src="{{ '/assets/ir/1.jpg' | relative_url }}" alt="IR sample: my mom and François">
    </div>
    <div class="project-body">
      <p class="project-type">Photography · Hardware · DIY</p>
      <h2>Infrared &amp; full-spectrum camera mods</h2>
      <p>A curiosity-driven side project in hardware and imaging: modifying old cameras for near-infrared photography and experimenting with optics, disassembly, and post-processing.</p>
      <ul class="project-tags">
        <li>Photography</li>
        <li>Hardware</li>
        <li>Infrared</li>
      </ul>
    </div>
  </a>
</div>
