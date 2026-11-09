---
name: sri-agent-runtime
description: Implement or review SRI Finance product agents and OpenAI Agents SDK orchestration with structured outputs, allowlisted simulated tools, and truthful traces.
---

Use for product-agent runtime changes, SDK calls, handoffs, or traces. Do not use for Codex subagent configuration alone.

1. Inspect the installed SDK version and consult current official documentation for uncertain runtime behavior before coding.
2. Define each specialist's objective, input, Zod output, allowed tools, and handoff target. Keep sequence and state in the orchestrator.
3. Invoke tools only from the closed registry. Record a tool trace only after its handler ran; validate model output before using it.
4. Mark each run `real`, `simulation`, or `unavailable`. A constructed Agent instance is not evidence of a completed model call. Preserve sanitized errors and never log API keys.
5. Enforce synthetic-only inputs, human review, no credit approvals/rejections, and consent checks outside learned instructions so Reflection cannot weaken them.
6. Avoid unbounded handoff/recursion. A successor may run only when the coordinator supplies a validated successor definition and accepted memory version; cap one successor handoff per case and preserve parent/child run IDs.
7. Test required tool use, malformed output, unavailable API, and successful runs separately. Never count deterministic fallback as a real-agent result.
