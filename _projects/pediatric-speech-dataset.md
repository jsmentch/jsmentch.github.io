---
layout: project
title: ReadNet pediatric speech dataset
description: >-
  Dataset engineering, QA/QC, and public ML challenge preparation for ReadNet, a child speech dataset supporting automated early literacy screening and reading-risk prediction research.
kicker: Dataset engineering · Child speech · Public ML challenge · Early literacy
subtitle: >-
  Dataset engineering, QA/QC, and challenge preparation for a large-scale child speech resource supporting automated early literacy screening.
stats:
  - label: Challenge
    value: Public DrivenData ML competition
  - label: Submissions
    value: "315"
  - label: Top score
    value: 0.97 AUROC
  - label: Data
    value: Anonymized child speech + literacy assessment data
  - label: Scope
    value: Tens of thousands of annotated speech samples
  - label: Role
    value: Lead data engineer/data scientist, year one
links:
  - label: ReadNet Project
    url: "https://reacheveryreader.gse.harvard.edu/readnet-project/"
  - label: DrivenData Challenge
    url: "https://www.drivendata.org/competitions/298/literacy-screening/"
  - label: Winners Blog
    url: "https://drivendata.co/blog/goodnight-moon-winners"
  - label: Benchmark Blog
    url: "https://drivendata.co/blog/literacy-screening-benchmark"
  - label: Winners GitHub
    url: "https://github.com/drivendataorg/goodnight-moon"
  - label: Case Study
    url: "https://drivendata.co/case-studies/crowdsourcing-solutions-for-ai-assisted-early-literacy-screening"
---

I led the first-year data engineering and dataset preparation work for ReadNet, a cross-institution effort to use child speech data for earlier detection of reading challenges. My work focused on turning sensitive, heterogeneous pediatric speech recordings and assessment metadata into a standardized, quality-controlled, challenge-ready dataset for machine learning teams.

## Project snapshot

ReadNet uses speech data to accelerate progress toward early detection and prevention of reading challenges. The project created a large open database of anonymized, annotated child speech samples, reading assessment data, and later reading outcomes from students screened for reading risk in kindergarten.

The goal was to make this kind of data useful for scalable modeling: improving automated scoring of early literacy assessments, supporting prediction of future reading risk, and helping researchers evaluate tools that could make in-school screening more efficient, valid, scalable, and equitable.

My role was to make the data usable, reliable, and safe for modeling. I owned the first-year dataset processing and preparation work leading up to the public ML challenge, then helped hand off the technical pipeline to a dedicated researcher we hired and ramped up while continuing to advise the project in a technical role.

## What I built

- Built preprocessing workflows for anonymized pediatric speech recordings and reading assessment metadata.
- Standardized heterogeneous files, labels, task outputs, and participant/session metadata into modeling-ready formats.
- Developed automated QA/QC checks to identify missing files, inconsistent labels, corrupted audio, task mismatches, and metadata errors.
- Used diarization, ASR, alignment, and fuzzy matching workflows to validate and reconcile speech/audio annotations.
- Supervised and coordinated research assistants performing manual review, annotation checks, and quality-control passes.
- Maintained protected data with secure handling practices and reproducible versioning workflows, including DataLad-based data management.
- Packaged and documented challenge-ready data for external modeling teams and downstream handoff.

## Technical focus

<div class="project-approach-grid">
  <div class="project-approach-card">
    <h3>Data standardization</h3>
    <p>Converted heterogeneous child speech recordings, assessment outputs, task labels, and metadata into consistent formats that could support modeling, scoring, and external challenge release.</p>
  </div>
  <div class="project-approach-card">
    <h3>Speech preprocessing</h3>
    <p>Worked across diarization, ASR, segmentation, alignment, fuzzy transcript matching, normalization, and audio-quality checks to make child speech data usable at scale.</p>
  </div>
  <div class="project-approach-card">
    <h3>QA/QC automation</h3>
    <p>Built automated validation checks for missingness, inconsistent task labels, metadata mismatches, corrupted files, annotation errors, and other failure modes before public release.</p>
  </div>
  <div class="project-approach-card">
    <h3>Secure data operations</h3>
    <p>Maintained sensitive pediatric data using secure workflows, careful access controls, reproducible versioning, and structured handoff documentation.</p>
  </div>
</div>

## Challenge impact

The resulting dataset supported the Goodnight Moon, Hello Early Literacy Screening challenge on DrivenData. Participants generated 315 submissions, and the winning solutions achieved 0.97 AUROC on the competition test set. The prize-winning solutions and write-ups were released openly, creating a public reference point for future work on automated literacy screening.

<nav class="project-link-list" aria-label="Challenge links">
  <a href="https://www.drivendata.org/competitions/298/literacy-screening/" target="_blank" rel="noopener noreferrer">DrivenData Challenge</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://drivendata.co/blog/goodnight-moon-winners" target="_blank" rel="noopener noreferrer">Winners Blog</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://drivendata.co/blog/literacy-screening-benchmark" target="_blank" rel="noopener noreferrer">Benchmark Blog</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://github.com/drivendataorg/goodnight-moon" target="_blank" rel="noopener noreferrer">Winners GitHub</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://drivendata.co/case-studies/crowdsourcing-solutions-for-ai-assisted-early-literacy-screening" target="_blank" rel="noopener noreferrer">Case Study</a>
</nav>

> Public ML challenges are only as strong as the datasets behind them. This project required turning sensitive, messy, real-world child speech data into a benchmark that external teams could actually use.

## Why this matters

Early reading difficulties are most effectively addressed when risk is identified early, but manual literacy screening can be time-consuming, inconsistent, and difficult to scale. ReadNet helps address that bottleneck by creating a high-quality speech dataset for automated scoring and reading-risk prediction research.

- Supports scalable early literacy screening.
- Creates a benchmark for child speech and reading-risk modeling.
- Helps evaluate whether models trained on anonymized speech can generalize to real screening conditions.
- Connects speech technology, education research, and practical school-based assessment needs.
- Demonstrates how careful data engineering can make sensitive human data useful for responsible ML.

## My role

I was the lead data engineer/data scientist for the first year of the project. I owned dataset processing and preparation leading up to the public ML challenge, including preprocessing, standardization, QA/QC automation, annotation validation, secure data handling, and challenge-ready packaging.

I also supervised research assistants performing manual review and data-quality checks, coordinated technical decisions with collaborators across institutions, and helped hire, onboard, and ramp up the dedicated researcher who later took over day-to-day technical development. After the handoff, I continued advising the project in a technical role.

## Collaborators and support

ReadNet was a collaboration across the Gabrieli Lab, Quantitative Methodology and Innovation at the Florida Center for Reading Research, and the Senseable Intelligence Group. The project was supported by gifts from Schmidt Futures and Citadel founder and CEO Ken Griffin.

<nav class="project-link-list" aria-label="Collaborator links">
  <a href="https://reacheveryreader.gse.harvard.edu/readnet-project/" target="_blank" rel="noopener noreferrer">ReadNet Project</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://reacheveryreader.gse.harvard.edu/" target="_blank" rel="noopener noreferrer">Reach Every Reader</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://gablab.mit.edu/" target="_blank" rel="noopener noreferrer">Gabrieli Lab</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://fcrr.org/" target="_blank" rel="noopener noreferrer">Florida Center for Reading Research</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://fcrr.org/reach-every-reader" target="_blank" rel="noopener noreferrer">Reach Every Reader at FCRR</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://sensein.group/" target="_blank" rel="noopener noreferrer">Senseable Intelligence Group</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://www.schmidtfutures.org/" target="_blank" rel="noopener noreferrer">Schmidt Futures</a>
  <span class="project-link-sep" aria-hidden="true">|</span>
  <a href="https://www.citadel.com/" target="_blank" rel="noopener noreferrer">Citadel</a>
</nav>
