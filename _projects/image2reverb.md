---
layout: project
title: Image2Reverb
kicker: ICCV 2021 · Cross-modal generation
subtitle: Generating plausible acoustic impulse responses from images of spaces.
stats:
  - label: Venue
    value: ICCV 2021
  - label: Task
    value: Image-to-audio room acoustics
  - label: Data
    value: 11K+ image-audio pairs
links:
  - label: ICCV paper
    url: https://openaccess.thecvf.com/content/ICCV2021/html/Singh_Image2Reverb_Cross-Modal_Reverb_Impulse_Response_Synthesis_ICCV_2021_paper.html
  - label: MIT Media Lab record
    url: https://www.media.mit.edu/publications/image2reverb-cross-modal-reverb-impulse-response-synthesis/
  - label: PDF
    url: https://openaccess.thecvf.com/content/ICCV2021/papers/Singh_Image2Reverb_Cross-Modal_Reverb_Impulse_Response_Synthesis_ICCV_2021_paper.pdf
  - label: Code
    url: https://github.com/nikhilsinghmus/image2reverb
---

## Why It Matters

Room acoustics are usually measured by recording an impulse response: a compact representation of how a space transforms sound. Those recordings can be expensive, time-consuming, or impossible to collect for inaccessible, fictional, historical, or user-generated environments.

Image2Reverb asked a strange and useful question: can a model infer enough about a room from a single image to synthesize a plausible acoustic response for that space?

## What We Built

Image2Reverb is an end-to-end neural system that generates an audio impulse response from an image of an acoustic environment. In practice, this means translating visual information about a space into an audio filter that can be convolved with dry speech, music, or other sound to make it feel like it occurred in the pictured environment.

The model combines an image encoder, monocular depth estimation, and a conditional GAN. Images are represented as RGB plus a depth channel estimated with Monodepth2; the scene encoder uses a Places365-pretrained ResNet50; the generator produces log-magnitude spectrograms corresponding to impulse responses. The training objective includes adversarial loss, reconstruction loss, and a differentiable proxy for T60, a standard measure of how long reverberation takes to decay.

## Data And Evaluation

The dataset combined 265 spaces, 1,169 images, and 738 impulse responses into 11,234 paired examples. Because real paired room-image and impulse-response data are scarce, the dataset included a mixture of direct pairings and weaker supervision from plausible image-response matches.

The system was evaluated with quantitative T60 error, ablations, and a human expert study. In the expert study, 31 participants with audio experience rated real and generated reverbs for quality and image-audio match across small, medium, large, and outdoor scenes. The strongest results were for indoor spaces; outdoor and visually misleading scenes exposed important limitations.

## What It Enables

The paper demonstrates generated impulse responses for real rooms, musical spaces, paintings, animations, video game screenshots, DALL-E-generated spaces, panoramic/VR imagery, historical places, and video conference backgrounds. The broader idea is simple and powerful: make visually grounded acoustic simulation available even when direct measurement is unavailable.

## My Role

This project sits at the intersection of audio, perception, machine learning, and empirical evaluation: a very Jeff-shaped intersection. I was a co-author on the ICCV paper and contributed to the work connecting acoustic representations, perceptual plausibility, and model evaluation.

This section is intentionally conservative for now. The next improvement should be a more precise account of my role from project notes: what I built, analyzed, wrote, evaluated, or designed.

## How To Improve This Page

This is the first pass. Useful additions would be:

- A figure or short visual diagram showing image input, predicted impulse response, and convolved output.
- A few example spaces with before/after audio clips if we have permission to host them.
- A tighter description of my exact contributions from memory or project notes.
- Selected figures from the paper or supplement if we want to reproduce them here.
- A note about limitations: outdoor scenes, reflections, murals, shadows, and scale ambiguity.
