---
name: sri-backend
description: Implement or review SRI Finance TypeScript server routes, contracts, simulated tools, Agents SDK orchestration, and persistence.
---

Use for work in `src/server`, `src/app/api`, `src/data`, and backend tests.

1. Inspect the route, contract, current orchestration, and fixtures involved. Read Next.js local docs before changing Next.js APIs.
2. Validate HTTP inputs and model outputs with Zod. Keep route handlers thin and domain logic out of UI code.
3. Use only the approved tool registry. Record traces after real tool execution and distinguish `real`, `simulation`, and `unavailable` modes.
4. Keep ground truth separate from agent context. Keep financial invariants in deterministic runtime controls.
5. Do not implement fallbacks that report success when the model call fails. Sanitize errors and protect API keys.
6. Add focused tests for changed behavior and run the relevant checks. Report checks and limitations accurately.
