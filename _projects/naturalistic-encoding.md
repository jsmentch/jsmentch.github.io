---
layout: project
title: Naturalistic neural encoding in autism
kicker: PhD thesis · Preregistered fMRI · Multimodal ML
subtitle: >-
  I built a large-scale predictive modeling pipeline that links rich, real-world movie features to whole-brain fMRI responses in children and adolescents, then used it to test how sensory and high-level information are represented differently in autistic and non-autistic youths.
stats:
  - label: Dataset
    value: 171 children and adolescents from the Healthy Brain Network (HBN)
  - label: Data type
    value: Naturalistic movie-viewing surface fMRI
  - label: Modeling
    value: Multimodal stacked encoding models
  - label: Statistical design
    value: Preregistered analysis, FDR-controlled inference, multi-threshold motion QC
  - label: Focus
    value: Feature engineering, predictive modeling, validation, interpretable inference, large-scale neural data
links:
  - label: Preregistration (primary)
    url: "https://osf.io/h92gr"
  - label: Preregistration (revision)
    url: "https://osf.io/47kj6"
---

## Why this project matters

Most neuroscience studies simplify the world into isolated stimuli and tightly controlled tasks. This project asked whether we could instead model brain responses to complex, naturalistic audiovisual input at scale, while still maintaining interpretable, statistically rigorous conclusions.

From a machine learning perspective, this was a real-world multimodal prediction problem:

- high-dimensional, noisy data
- multiple competing feature spaces
- strict validation requirements
- interpretable model decomposition
- inference under heavy multiple-comparison burden
- robustness to data quality variation

## What I built

I developed an end-to-end modeling pipeline that:

- transformed long-form movies into aligned audio and visual feature timelines
- constructed multimodal feature spaces spanning low-level to high-level information
- fit whole-brain cortical encoding models that predicted fMRI responses from those features
- quantified which kinds of features best explained activity across cortex
- tested whether those representation profiles differed by diagnosis, age, and symptom burden
- evaluated robustness across multiple motion-quality thresholds to rule out artifacts

In practical terms, this was a large supervised learning and inference pipeline built for messy real-world human data.

## Core technical components

### Multimodal feature engineering

I generated synchronized feature spaces from continuous movie stimuli, spanning:

- low-level visual structure such as luminance and motion energy
- higher-level visual content such as faces and bodies
- low-level audio structure
- higher-level auditory categories such as speech and music

### Predictive modeling

I used stacked encoding models to predict cortical fMRI time series from these feature sets. This allowed the models to estimate both:

- overall predictive performance
- relative weighting across competing feature banks, such as low- versus high-level visual information or visual versus auditory information

### Statistical inference and validation

The analysis was designed to prioritize rigor:

- hypotheses and analysis choices were preregistered before outcome analysis
- group effects were tested at the parcel/ROI level
- false discovery rate correction was applied across cortex
- analyses were repeated under multiple framewise-displacement thresholds to assess sensitivity to motion and data quality
- aggregate model behavior was first validated against known sensory hierarchies before testing group differences

## Key findings

The main result was not a simple global difference in sensory responsiveness. Instead, the data supported a more specific story about where and how information weighting changes.

### Main conclusions

- I found no support for the preregistered hypothesis that autism would show enhanced low-level encoding in primary sensory cortices.
- In higher-order regions, especially posterior superior temporal sulcus (pSTS) and nearby integrative cortex, autistic participants showed a relative shift toward lower-level over higher-level visual feature weighting.
- Exploratory analyses suggested reduced high-level visual encoding in socially relevant and face-sensitive cortical parcels.
- A preregistered high–low weighting gradient in STS tracked autism-related social phenotype.
- Visual–auditory modality balance in primary sensory regions was largely preserved.
- Developmental effects were prominent, with strong age-related changes in encoding and modality tuning.

### Interpretation

The results were more consistent with differences in downstream integration and weighting of information than with a broad early-sensory enhancement account.

## Why this is relevant outside academia

This project demonstrates skills that transfer directly to applied ML and data science roles:

- building predictive pipelines for large, noisy, multimodal datasets
- turning unstructured real-world input into analysis-ready features
- designing models that are both accurate and interpretable
- validating systems against expected structure before drawing substantive conclusions
- communicating nuanced results, including negative findings, without oversimplifying
- managing tradeoffs between data quality, sample size, and statistical confidence
- working with preregistration, reproducibility, and transparent analytical decision-making

## My role

I led the analysis design and implementation with guidance from my supervisory team at MIT and Harvard. My contributions included:

- feature construction
- multimodal encoding pipeline development
- cortical summarization
- statistical inference
- visualization
- interpretation
- manuscript and dissertation analysis

## Publication status

This work forms a central part of my dissertation and an *eLife* submission with Yibei Chen, Tamara Vanderwal, and Satra Ghosh. Until a public manuscript or DOI is available, the preregistrations remain the external methodological record.

Links to **Preregistration (primary)** and **Preregistration (revision)** appear in the buttons above.

## Short version

I built a preregistered multimodal ML pipeline that predicts whole-brain fMRI responses to real-world movies and used it to test how low- and high-level information is weighted across cortex in autism. The work combines large-scale feature engineering, interpretable predictive modeling, rigorous statistical validation, and clinically relevant inference on noisy human data.

## Disclosure

This page is a concise project summary for portfolio purposes. Full methodological detail, thresholds, robustness analyses, comorbidity analyses, and limitations are documented in the preregistrations and manuscript.
