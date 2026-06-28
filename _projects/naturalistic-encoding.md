---
layout: project
title: Naturalistic neural encoding in autism
description: >-
  A PhD thesis and eLife reviewed preprint project using multimodal encoding models to link naturalistic movie features with whole-brain fMRI responses in autism.
kicker: PhD thesis · eLife reviewed preprint · Naturalistic fMRI · Multimodal modeling
subtitle: >-
  I built a preregistered multimodal modeling pipeline that linked real-world movie features to whole-brain fMRI responses in 171 children and adolescents. The project tested where sensory and higher-level visual information are represented differently in autism, revealing a shift in feature weighting in pSTS and nearby social/integration cortex rather than a broad early-sensory enhancement effect.
stats:
  - label: Dataset
    value: 171 children and adolescents from the Healthy Brain Network
  - label: Data
    value: 15-minute naturalistic movie-viewing fMRI
  - label: Modeling
    value: Stacked ridge regression encoding models
  - label: Scale
    value: 280M+ grayordinate-wise model fits
  - label: Inference
    value: Cross-validation, permutation testing, FDR correction, preregistered hypotheses, multi-threshold motion QC
  - label: Output
    value: eLife reviewed preprint + Harvard dissertation
links:
  - label: eLife reviewed preprint
    url: "https://elifesciences.org/reviewed-preprints/111008"
  - label: DOI
    url: "https://doi.org/10.7554/eLife.111008.1"
  - label: PubMed
    url: "https://pubmed.ncbi.nlm.nih.gov/41929098/"
  - label: bioRxiv
    url: "https://www.biorxiv.org/content/10.64898/2026.03.23.713749v1"
  - label: Dissertation
    url: "https://www.proquest.com/docview/3308462552?pq-origsite=gscholar&fromopenview=true&sourcetype=Dissertations%20&%20Theses"
  - label: Preregistration (primary)
    url: "https://osf.io/h92gr"
  - label: Preregistration (revision)
    url: "https://osf.io/47kj6"
---

## Project snapshot

Many neuroscience studies use simplified stimuli or tightly controlled tasks. I wanted to test whether we could model brain responses to rich, naturalistic audiovisual input while still making statistically rigorous and interpretable claims.

This became a large-scale supervised learning and inference problem: transform continuous movies into aligned feature spaces, predict cortical fMRI responses, estimate how different feature classes contribute to those predictions, and test whether those representational profiles differ by diagnosis, age, and symptom burden.

## What I built

- Extracted and aligned multimodal audio and visual features from naturalistic movie stimuli.
- Built feature banks spanning low-level sensory structure and higher-level semantic/social content.
- Fit whole-brain encoding models to predict cortical fMRI responses from each feature space.
- Combined feature-specific models using stacked encoding to estimate relative feature weighting.
- Tested group, developmental, and symptom-related effects using preregistered analyses, FDR correction, and multiple motion-quality thresholds.
- Validated model behavior against expected sensory organization before interpreting autism-related differences.

## Modeling pipeline

The core technical task was to turn a naturalistic movie into structured feature timelines, predict brain responses from each feature space, and compare how different kinds of information were weighted across cortex.

<figure class="project-figure">
  <img src="{{ '/assets/projects/naturalistic-encoding/methods_modelAV.png' | relative_url }}" alt="Schematic of a stacked encoding model where movie stimuli are transformed into audio and visual features, separate encoding models predict brain activity, and a stacked model combines them to estimate feature weights." loading="lazy" width="1024" height="567">
  <figcaption>
    Stacked encoding model pipeline. Continuous movie stimuli were converted into synchronized audio and visual feature spaces. Feature-specific encoding models predicted fMRI responses, and a stacked model estimated how strongly each feature space contributed to brain activity.
    <span class="project-figure-source">Source: eLife reviewed preprint / dissertation</span>
  </figcaption>
</figure>

## Key result

The main finding was not a simple global increase in sensory responsiveness. Instead, autism-related differences were localized to how higher-order visual information was weighted in social and multisensory integration regions.

- No evidence supported the preregistered prediction that autism would show enhanced low-level encoding in primary sensory cortices.
- In pSTS and nearby social/integration cortex, autistic participants showed a relative shift toward lower-level over higher-level visual feature encoding.
- High–low visual weighting in pSTS tracked autism-related social phenotype.
- Audio–visual modality balance was broadly conserved across groups.
- Developmental effects were prominent, showing strong age-related changes in encoding and modality tuning.

<details class="project-disclosure">
  <summary>See technical result summary</summary>
  <div class="project-disclosure-body">
    <div class="project-figure-scroll">
      <figure class="project-figure project-figure--wide">
        <img src="{{ '/assets/projects/naturalistic-encoding/fig3.png' | relative_url }}" alt="Heatmap summarizing statistical effects across cortical parcels for diagnosis, social responsiveness scores, and sensory scores, with rows for visual and audio model metrics and columns for perceptual brain regions." loading="lazy" width="1024" height="549">
        <figcaption>
          Summary of diagnosis-, social-phenotype-, and sensory-phenotype-related effects across cortical parcels and model metrics. The strongest interpretable pattern was a shift in visual high- versus low-level feature weighting in pSTS and adjacent social/integration regions.
          <span class="project-figure-note">Symbols indicate effects that survived statistical thresholds across motion-quality sensitivity analyses.</span>
          <span class="project-figure-source">Source: eLife reviewed preprint / dissertation</span>
        </figcaption>
      </figure>
    </div>
  </div>
</details>

## Model validation

Before interpreting group differences, I checked whether the model behaved as expected across known sensory systems.

<div class="project-figure-scroll">
  <figure class="project-figure project-figure--wide">
    <img src="{{ '/assets/projects/naturalistic-encoding/fig2_audiovsvisual.png' | relative_url }}" alt="Box plots and cortical surface maps showing visual versus auditory perceptual preference across cortical parcels, with visual preference in visual regions and auditory preference in auditory regions." loading="lazy" width="1024" height="266">
    <figcaption>
      Model-derived auditory versus visual feature weighting recovered expected sensory organization across cortical regions, providing a validation check before testing autism-related group differences.
      <span class="project-figure-source">Source: eLife reviewed preprint / dissertation</span>
    </figcaption>
  </figure>
</div>

## Technical approach

<div class="project-approach-grid">
  <div class="project-approach-card">
    <h3>Multimodal feature engineering</h3>
    <p>Converted continuous movie stimuli into synchronized visual and auditory feature timelines, including low-level visual structure, higher-level visual content, low-level audio, speech/music, and other interpretable feature classes.</p>
  </div>
  <div class="project-approach-card">
    <h3>Predictive modeling</h3>
    <p>Fit feature-specific ridge encoding models and combined them with stacked models to estimate both predictive performance and the relative contribution of competing feature banks.</p>
  </div>
  <div class="project-approach-card">
    <h3>Statistical validation</h3>
    <p>Used held-out prediction, permutation testing, FDR-controlled inference, preregistered hypotheses, and repeated motion-threshold analyses to separate robust effects from noise and data-quality artifacts.</p>
  </div>
  <div class="project-approach-card">
    <h3>Interpretability</h3>
    <p>Reduced complex model outputs into interpretable cortical summaries, feature-weighting metrics, visualizations, and plain-language conclusions.</p>
  </div>
</div>

## Scientific framing

This study translated long-standing theories of autistic perception into testable model comparisons: low- versus high-level feature encoding and auditory versus visual feature weighting during movie viewing.

<figure class="project-figure project-figure--compact">
  <img src="{{ '/assets/projects/naturalistic-encoding/fig1_wcc_epf.png' | relative_url }}" alt="Conceptual diagram contrasting weak central coherence, enhanced perceptual functioning, visual dominance, and possible auditory dominance theories of perception in autism." loading="lazy" width="592" height="1024">
  <figcaption>
    The project contrasted theories of autistic perception: whether differences reflect enhanced low-level sensory encoding, reduced integration of higher-level information, or altered balance between auditory and visual information during naturalistic perception.
    <span class="project-figure-source">Source: eLife reviewed preprint / dissertation</span>
  </figcaption>
</figure>

## Why this matters beyond neuroscience

For me, this project was also a testbed for applied machine learning on messy, high-dimensional human data.

- Built predictive pipelines for noisy multimodal time-series data.
- Translated unstructured real-world inputs into analysis-ready features.
- Designed interpretable models rather than treating prediction as a black box.
- Balanced data quality, sample size, model complexity, and statistical confidence.
- Communicated nuanced results, including negative findings, without oversimplifying.
- Worked across neuroscience, machine learning, clinical research, and open-science constraints.

## My role

I led the analysis design and implementation with guidance from collaborators and advisors at MIT, Harvard, and UBC/BC Children’s Hospital. My contributions included feature construction, multimodal encoding pipeline development, model fitting, cortical summarization, statistical inference, visualization, interpretation, and dissertation/manuscript writing.

## Publication and thesis

This project is the central empirical work from my Harvard PhD dissertation and is now available as an eLife reviewed preprint.

- Mentch J, Chen Y, Vanderwal T, Ghosh SS. “Pregistered movie-fMRI analyses reveal altered visual feature encoding in autism in pSTS.” eLife reviewed preprint. DOI: [10.7554/eLife.111008.1](https://doi.org/10.7554/eLife.111008.1).
- Mentch JS. “Sensory Feature Representation in Autism: Insights From Naturalistic Neuroimaging.” Harvard University dissertation, 2026.

<nav class="project-link-list" aria-label="Publication links">
  <a href="https://elifesciences.org/reviewed-preprints/111008" target="_blank" rel="noopener noreferrer">eLife reviewed preprint</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://doi.org/10.7554/eLife.111008.1" target="_blank" rel="noopener noreferrer">DOI</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://pubmed.ncbi.nlm.nih.gov/41929098/" target="_blank" rel="noopener noreferrer">PubMed</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://www.biorxiv.org/content/10.64898/2026.03.23.713749v1" target="_blank" rel="noopener noreferrer">bioRxiv</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://www.proquest.com/docview/3308462552?pq-origsite=gscholar&fromopenview=true&sourcetype=Dissertations%20&%20Theses" target="_blank" rel="noopener noreferrer">Dissertation / ProQuest</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://osf.io/h92gr" target="_blank" rel="noopener noreferrer">Preregistration (primary)</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://osf.io/47kj6" target="_blank" rel="noopener noreferrer">Preregistration (revision)</a>
</nav>
