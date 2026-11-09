---
name: sri-successor-builder
description: Build and validate a SRI Finance successor agent system from accepted RSI lessons using a Zod-validated definition and approved tools.
---

Use when implementing Reflection memory, AgentSystemDefinition, Builder, or successor execution.

1. Require a measured failure from the independent evaluator. Keep discovery cases separate from validation and final holdout cases.
2. Represent a proposed lesson as a constrained executable policy patch, not descriptive prose. Validate operations and parameters against an allowlist.
3. Validate candidate patches on different cases. Accept only when evidence shows the target behavior improved without regression; otherwise keep the proposal rejected with its reason.
4. Build a Zod-validated `AgentSystemDefinition` containing system/generation IDs, parent generation, goals, agent roles/instructions, authorized tool IDs, ordered workflow, accepted memory IDs, and successor links.
5. Instantiate agents only from approved roles and tools. Reject unknown identifiers and never execute arbitrary generated code.
6. Run baseline and successor on identical test cases and conditions. Persist definitions, accepted memory, run IDs, per-case results, metrics, and traces.
7. Successor invocation is coordinator-controlled and bounded: one handoff to the validated improved version after evaluation; no self-triggered loops and no call when no lesson was accepted.
8. Enforce financial safety invariants in runtime controls, outside learned policies.
