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
