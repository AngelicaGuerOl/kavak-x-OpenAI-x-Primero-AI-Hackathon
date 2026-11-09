---
name: sri-version-history
description: Snapshot SRI Finance business logic, Codex harness, skills, and testcase evidence in the repository's SQLite history.
---

Use after a reviewed change to business logic, harness, project instructions, or skills, or when inspecting version/evaluation history.

1. Inspect `scripts/rsi_history.py --help` and `rsi/README.md` before using history commands; do not guess arguments.
2. Create a new immutable snapshot after reviewing the implementation diff. Never overwrite an older snapshot.
3. Record the actual test suite, execution mode, case-level failures, and sanitized report. Use `real` only when model/API execution succeeded; otherwise use `simulation` or `offline` as appropriate.
4. Keep Codex snapshots (`vNNN`) distinct from financial-agent generations (`G0`, `G1`, ...).
5. Link improvement proposals to observed failure IDs and validation runs. Do not accept improvements without independent evidence.
6. Confirm `.env.local`, API keys, personal data, and other secrets are excluded from snapshots and reports.
