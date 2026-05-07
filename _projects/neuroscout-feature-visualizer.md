---
layout: project
title: Neuroscout web tools
kicker: Web App · Visualization · Annotation
subtitle: >-
  Browser tools for naturalistic movie research in the Neuroscout ecosystem: a p5.js feature visualizer for high-dimensional stimulus annotations, plus a web platform we used to label audiovisual movies for downstream neuroimaging, behavior, and ML.
stats:
  - label: Stack
    value: JavaScript · p5.js · web platform
  - label: Ecosystem
    value: Neuroscout · naturalistic stimuli
  - label: Outputs
    value: Explorable features · structured labels
links:
  - label: Live feature visualizer
    url: "https://jsmentch.github.io/feature_visualizer/visualizer/"
  - label: Feature visualizer repository
    url: "https://github.com/jsmentch/feature_visualizer"
---

## Overview

This entry combines two related pieces of **lab infrastructure** for the same workflow: understanding and annotating **naturalistic movies** for neuroscience.

The **feature visualizer** is an interactive **p5.js** sketch that plots feature time series from Neuroscout / AudioSet-style extractors so researchers can see what the model is tracking moment by moment—turning opaque vectors into something **inspectable**.

Alongside that, I **built and deployed a web-based annotation platform** for **manual labeling** of movie stimuli: flexible task flows, structured exports for modeling, and collaboration across labs. Same motivation as the visualizer—**high-dimensional, messy stimulus data** needs tooling people can actually use.

## Feature visualizer

- Visualizes **feature time series** aligned to naturalistic stimuli  
- Supports feature sets available through **Neuroscout**  
- Connects **extraction pipelines** to human-interpretable events during a film  

## Annotation platform

- **Flexible labeling** workflows for different studies  
- **Structured outputs** for neuroimaging, behavioral, and ML pipelines  
- **Deployment** and integration with ongoing projects and collaborators  

## Why it matters

Both pieces reflect the same habit: **research infrastructure** that makes messy inputs **debuggable and reusable**—whether you are exploring features visually or producing labels for the next analysis stage.

## My role

Designed and built the **p5.js** visualizer and its integration with feature tables; **designed, implemented, and deployed** the annotation platform and supported its use in downstream workflows.
