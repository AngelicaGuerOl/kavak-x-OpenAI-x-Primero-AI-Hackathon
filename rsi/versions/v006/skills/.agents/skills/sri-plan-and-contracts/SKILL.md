---
name: sri-plan-and-contracts
description: Plan a SRI Finance increment from repository evidence, split work between two developers, and freeze shared API contracts before parallel implementation.
---

Use when planning a milestone or changing a frontend/backend boundary.

1. Read only project docs and implementation relevant to the milestone. Start with `AGENTS.md`, `IMPLEMENTATION_PLAN.md`, `CONTRACTS.md`, and affected code.
2. Mark findings implemented, partial, or proposed. Cite repository paths; do not infer completion from plans or type declarations alone.
3. Define a vertical slice, dependencies, owner per file area, acceptance criteria, and exact checks.
4. Before parallel work, agree on request/response Zod schemas, errors, execution mode, and trace shape. Record the freeze in `CONTRACTS.md` or the milestone record.
5. Assign disjoint frontend/backend scopes. If a shared contract must change, pause both implementations, agree, then update both consumers.
6. Report unresolved decisions. Do not implement during a planning-only request.
