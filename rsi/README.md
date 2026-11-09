# Codex RSI History

La integración de la PR #4 conservó los snapshots locales `v004` y `v005`. Los
snapshots originalmente llamados `v004`, `v005` y `v006` en la rama de la PR se
archivaron sin alterar sus contenidos como `v006`, `v007` y `v008`. Sus versiones,
ejecuciones y artefactos se importaron a `history.sqlite` con esa correspondencia;
las dos líneas de desarrollo siguen siendo ramas históricas distintas.

This directory preserves each reviewed iteration of the Codex-assisted project.

## Hackathon rubric: two version tracks

The SQLite `versions` table and folders such as `v001`/`v002` record **Codex development iterations**: changes to business logic, harness, skills/context and tests. They are not automatically the financial product's Gen0/Gen1 successor systems.

The product RSI demo must separately record a system generation chain: initial account-opening system → accepted evidence-backed lesson → Builder-generated auto-financing successor. Persist each generated `AgentSystemDefinition`, parent generation, inherited lesson/policy, evaluation case IDs and per-case results. A second successor (for example, card preparation) is optional and only follows a real Gen1 failure.

Codex's contribution is shown through repository context, planning, read-only delegation, skills, test-driven changes and this version history. This improves the workflow and artifacts Codex uses in the project; it does not retrain Codex's underlying model. Codex does not need an API key to edit, plan, or run offline tests. The hackathon's primary app demo does need API access to execute its financial agents with OpenAI Agents SDK; local tests are useful but do not substitute for those live agent traces.

## What is versioned

Each `versions/vNNN/` snapshot has four areas:

- `business_logic/`: server agents, domain logic, API routes and shared contracts.
- `harness/`: tests, test runner/configuration and project rules needed to reproduce checks.
- `skills/`: repository skills and the project prompts/context that guided Codex.
- `testcases/`: case/test definitions and the actual run report for that version.

`history.sqlite` is the queryable source of truth for versions, file hashes, test runs, per-test outcomes/failures and improvement decisions. The database does not contain `.env.local` or API keys. Never copy secrets into snapshots, test output, skills or prompts.

## First baseline (current implementation)

The initial snapshot is `v001`. It captures the current KYC/Verification implementation and existing test harness. Its first recorded test run is an **offline unit-test run**, not a live model run or an independent financial evaluation. The current fixture rules are still embedded in server code; move them into independent evaluation fixtures in a later planned increment rather than treating unit tests as proof of RSI.

## Commands

Run these from the repository root:

```bash
python3 scripts/rsi_history.py init
python3 scripts/rsi_history.py snapshot --summary "Baseline: KYC and Verification foundation"
python3 scripts/rsi_history.py test --version v001 --suite first-milestone --mode offline
python3 scripts/rsi_history.py history
```

After reviewing an actual change, snapshot the next version (the script chooses the next `vNNN`) and run its tests:

```bash
python3 scripts/rsi_history.py snapshot --summary "Describe the reviewed change"
python3 scripts/rsi_history.py test --version v002 --suite first-milestone --mode offline
```

Register an independent domain expectation before running the relevant evaluator:

```bash
python3 scripts/rsi_history.py case \
  --case-id kyc-rfc-mismatch-01 \
  --suite discovery \
  --source src/data/kyc-cases.json \
  --description "RFC in request differs from synthetic tax record" \
  --expected "Finding RFC_MISMATCH and route to human review" \
  --case-type domain
```

Record a proposed/accepted/rejected correction only after a real test result exists:

```bash
python3 scripts/rsi_history.py improvement \
  --from-version v001 \
  --to-version v002 \
  --summary "What failed and what was learned" \
  --change "Concrete executable code or policy delta" \
  --failures "test-file.ts::suite > failing case" \
  --validation-run RUN_ID \
  --decision accepted \
  --reason "Observed validation result; no invariant regressed"
```

If an earlier JSON-only Vitest run did not preserve import/setup failures by testcase, attach those failures to its existing run with `import-suite-failures`; this keeps the observed failure and its correction in the same history.

Do not mark a patch accepted based only on the model's explanation. The linked validation run and results are the evidence. Keep discovery, validation and final-test suites separate when the domain evaluator is added.
