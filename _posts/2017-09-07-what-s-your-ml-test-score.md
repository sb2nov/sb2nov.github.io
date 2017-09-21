---
layout: post
title: What's your ML test score?
category:
- Machine Learning
- Papers
excerpt: "Paper summary: What's your ML test score? A rubric for ML testing and monitoring of production systems."
---

Using machine-learning systems in production is very different from running offline experiments as you run into problems such as train/test skew, latency and resource requirements. The paper [What’s your ML Test Score?](https://research.google.com/pubs/pub45742.html) by Eric Breck etc. provides a rubric for measuring the quality of ML system design.

The rubric has four sections so we'll go over each of them.

### Tests for Features and Data

- Distributions of each feature
- Features are same in both the training and serving stack
- Relationship between different features and targets
- Privacy control in model training
- Cost of computing each feature
- Does not contain features determined unsuitable for use
- Time to add new features to production

Points around expensive and redundant features are important as they can affect the ability of the system to meet the desired latency and throughput requirements. One options to solve such issues is to pre-cache expensive features and use them at prediction time but this can yield to a lot of redundant compute.

I liked the point around making sure we're not using features determined un-suitable in the context of ML Fairness as we could potentially ban features such as gender etc.

### Tests for Model Development

- Model code goes through code review
- Offline proxy metrics are measuring what will be A/B tested
- Hyperparameter tuning
- Effect of model staleness
- Simple models as a baseline
- Model performs well across different data slices
- Test for implicit bias in the model or data

Touches on aspects of good design principles such as optimizing for the right metrics, measuring staleness and updating the model on time. The point around good performance on different data slices is specially valid when majority data to the website might come from English speaking or developed countries etc.

### Tests for ML Infrastructure

- Reproducibility of model training
- Integrations tests for the ML systems
- Quality tests before deployment of the model
- Ability to rollback deployed models
- Testing via a canary process

Here most points are easy to follow in this list but something that I have found hard in experience is the quality tests. One example being recommendation systems, since the output of the system may change from time to time. It is hard to write automated tests that measure quality; interested in learning how others solve this problem.

### Monitoring Tests for ML Systems

- Upstream instability in features, both in training and serving
- Data invariants hold in training and serving inputs
- Model staleness
- Train/Test skew in features and inputs
- Slow leak regression in latency, throughput etc.
- Regression in prediction quality

This was a fantastic list as it covers a lot of hidden problems in model serving. As models get larger it can get expensive to serve them or features get more expensive to compute. Useful tools could be monitoring success metrics as a time-series and seeing if we hit consistent performance. Another could be to always have a small A/B test running against the old / baseline model.

The paper touches on basic problems that you run into quite often but are not talked about much in the ML community. Curious to know, how the problems around feature engineering and model complexity evolve with advent of Deep Learning models.

### References

- [1] Breck, E., Cai, S., Nielsen, E., Salib, M., & Sculley, D. (2016). What’s your ML Test Score? A rubric for ML production systems. Reliable Machine Learning in the Wild - NIPS 2016 Workshop, (NIPS).
