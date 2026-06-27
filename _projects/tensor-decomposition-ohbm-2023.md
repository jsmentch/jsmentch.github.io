---
layout: project
title: Brain networks via tensor decomposition
kicker: OHBM 2023 · Oral · Naturalistic fMRI · Tensor methods
subtitle: >-
  Identifying shared brain networks in a clinically rich dataset using NASCAR tensor decomposition on naturalistic movie-viewing and resting-state fMRI—without the independence constraints of conventional ICA.
stats:
  - label: Venue
    value: OHBM 2023 · Oral session
  - label: Methods
    value: NASCAR tensor decomposition · Gale–Shapley matching
  - label: Data
    value: Naturalistic movies · resting-state · clinical cohort
  - label: Role
    value: Speaker · lead presenter
links:
  - label: OHBM materials (GitHub)
    url: "https://github.com/jsmentch/ohbm_2023"
  - label: Recorded talk
    url: "https://www.youtube.com/watch?v=ytMdd_XGCN4"
  - label: Poster PDF
    url: "https://github.com/jsmentch/ohbm_2023/raw/main/mentch_ohbm2023_poster_v2.pdf"
  - label: Slides PDF
    url: "https://github.com/jsmentch/ohbm_2023/raw/main/OHBM_2023_talk_slides.pdf"
---

## Overview

Much of our knowledge of cognition comes from experiments with highly controlled stimuli. Everyday life is richer and more dynamic, and **naturalistic stimuli** have gained traction as a more ecologically valid way to study the brain. These paradigms are often used to examine **shared responses across groups**, but less work has targeted **individual differences** and **heterogeneous clinical populations**—including people with **autism spectrum condition (ASC)**, who show altered audiovisual perception and social communication.

Naturalistic data are also well suited to **data-driven network identification**. **Independent component analysis (ICA)** is an influential tool for finding brain networks, applied either per subject or after concatenating data temporally or spatially for group analysis (Calhoun et al., 2009). That concatenation into a 2D representation can discard **low-rank structure shared across subjects**, and ICA’s assumed **spatial or temporal independence** may not match biology given the extensive overlap between networks in space and time.

## Approach

An alternative is **NASCAR**—a stable, robust method for identifying brain networks and their temporal dynamics across subjects using **tensor decomposition** (Li et al., 2021), without imposing independence constraints.

In this work we applied NASCAR to **fMRI during naturalistic stimulation and at rest** in a **clinically rich dataset**, linking resting-state and movie-driven components and relating temporal modes to stimulus features.

## Supplementary figures

<p class="project-caption"><img src="{{ '/assets/projects/tensor-decomposition/gale-shapley.png' | relative_url }}" alt="Gale-Shapley matched spatial components from resting state and the movie The Present"></p>

Gale–Shapley matched spatial components from resting state (columns 1 and 2) and the movie *The Present*.

<p class="project-caption"><img src="{{ '/assets/projects/tensor-decomposition/movie-temporal-overview.png' | relative_url }}" alt="Temporal modes from Despicable Me with top five correlated movie features"></p>

Temporal modes from *Despicable Me* with the five most highly correlated movie features for each component.

## Collaborators & related links

- [Senseable Intelligence Group](https://sensein.group/) — research home for this work  
- [Jian Li (Andrew)](https://silencer1127.github.io/) — developed the **NASCAR** method; see his papers and well-documented Matlab code to try it  
- [Satra Ghosh](http://satra.cogitatum.org/) — supervisory team  

Poster, slides, and additional figures are in the [ohbm_2023 repository](https://github.com/jsmentch/ohbm_2023).

## My role

**Speaker** for the OHBM 2023 oral session. I presented the tensor-decomposition analysis of naturalistic and resting-state fMRI in a clinically rich cohort and prepared the poster and talk materials linked above.
