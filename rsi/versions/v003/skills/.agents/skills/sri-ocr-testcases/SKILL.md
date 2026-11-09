---
name: sri-ocr-testcases
description: Create and evaluate synthetic OCR document cases for SRI Finance while keeping ground truth independent from model extraction.
---

Use when preparing synthetic document fixtures, OCR extraction, or OCR evaluations.

1. Define and validate testcase ground truth first. Keep it in evaluator-only data never sent to the OCR agent.
2. Let an OpenAI model propose scenario variants or document appearance only when API access is available. Validate artifacts against fixed values; reject mismatches or label them as intentional OCR-corruption cases. Never derive expected values from OCR output.
3. Use fictional names and values, original layouts, and a visible `SINTÉTICO — SIN VALIDEZ OFICIAL` mark. Do not reproduce government templates, official logos, real identifiers, or real people.
4. Require field-level extraction with document/page and visible evidence. Distinguish absent, illegible, and contradictory values; do not guess. Treat confidence as an uncalibrated hint, not proof.
5. Keep discovery, validation, and holdout suites disjoint. Measure field accuracy, omissions, contradiction detection, and false positives against the independent oracle.
6. Record artifact hash, case/suite ID, model/mode, extraction, and evaluator result without secrets. Report API failure as a blocker, not a successful OCR run.
