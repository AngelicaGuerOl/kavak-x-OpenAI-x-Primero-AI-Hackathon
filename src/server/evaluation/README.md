# System A evaluation

Inputs live in `src/data/evaluation/inputs.json`; independently authored oracles
live in `tests/evaluation/oracles.json`. Agents and tools never import oracles.
The legacy learning endpoint keeps its original four-case simulation; this
increment does not implement Reflection, memory or Builder.

The cutoff date is explicit per oracle (2026-11-09); execution timestamps are UTC.
Expiry is inclusive. IDs and data are synthetic. Missing identity and missing
address documents are legitimate document-completeness requirements; evaluating
these hypotheses does not change baseline rules to manufacture a failure.

Before executing, register each oracle with `scripts/rsi_history.py case`, using
`expectedBehavior()` JSON (evaluationDate, expectedCodes, expectedStatus) as the
expected behavior. Create the next snapshot after reviewing the patch. Then run:

```bash
SRI_EVALUATION_VERSION=vNNN npm test -- tests/system-a-evidence.test.ts
SRI_EVALUATION_VERSION=vNNN SRI_EVALUATION_MODE=real SRI_EVALUATION_SUITE=discovery SRI_EVALUATION_SMOKE=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run tests/system-a-evidence.test.ts
python3 scripts/rsi_history.py test --version vNNN --suite system-a-unit --mode offline
```

Replace vNNN with the created version. Ordinary `npm test` skips the operational
entry point. The real smoke loads `.env.local` with Node before Vitest starts and evaluates
one control, not the whole suite. Vitest uses NODE_ENV=test, where Next
environment loading deliberately omits `.env.local`; do not rely on implicit
loading. The SDK resolves its model from OPENAI_DEFAULT_MODEL or its installed
default; model access errors remain unavailable results. No fallback runs on model failure. An unavailable
model is recorded separately from a financial/domain mismatch. Domain failures
do not make this operational recording command fail: consult its report and
SQLite test_results, not the Vitest pass count, for domain outcomes.

Each report preserves input hash, suite hash, snapshot, cutoff, expected and
actual output, trace and run IDs, omissions, false positives, status mismatch and
mode. Results are appended as new files and rows, never overwriting old reports.
Holdout may be evaluated to record baseline, but must not be used to tune patches;
if its results inform changes, prepare a new untouched final-test suite.

SQLite's current history command executes Vitest, not a domain evaluator. The
separate entry point above records domain test_runs/test_results in the same
schema. A harness pass is not evidence that all financial scenarios passed.
