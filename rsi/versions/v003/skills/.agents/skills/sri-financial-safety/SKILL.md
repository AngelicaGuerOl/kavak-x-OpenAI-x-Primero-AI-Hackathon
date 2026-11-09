---
name: sri-financial-safety
description: Review SRI Finance code, agent instructions, test data, and UI for financial safety, consent, privacy, and human-review requirements.
---

Use when reviewing a financial workflow, product agent, generated system, or synthetic dataset for safety-sensitive behavior.

1. Verify that test and demo data are synthetic and clearly labeled; never include API keys or real applicant documents in logs or snapshots.
2. Confirm the system does not approve/reject credit, estimate eligibility from sensitive demographics or geographic proxies, or claim official external verification.
3. Confirm any simulated credit-bureau-like check requires explicit consent and that missing consent blocks execution in deterministic code.
4. Confirm generated workflows use only approved tools, cannot execute arbitrary generated code, and remain subject to human review.
5. Treat these controls as immutable across Reflection, memory patches, and successor generations.
6. Report only actionable findings with severity, file path, evidence, and a suggested correction. Do not modify files during a review-only request.
