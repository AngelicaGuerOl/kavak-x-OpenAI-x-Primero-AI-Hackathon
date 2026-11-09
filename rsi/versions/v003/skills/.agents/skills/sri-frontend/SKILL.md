---
name: sri-frontend
description: Implement or review the SRI Finance Next.js interface against frozen API contracts, with clear real, simulated, and unavailable states.
---

Use for changes in `src/app` (outside API routes) or `src/components`.

1. Inspect the affected page/component, its contract, and the relevant API route before editing.
2. Keep domain rules and API keys on the server. Consume shared TypeScript contracts; coordinate incompatible changes before implementation.
3. Represent loading, success, empty, and error states. Label simulated data and live model execution distinctly.
4. Show findings with evidence and source; never imply official verification, credit approval, or a decision that the API did not return.
5. Keep the UI focused on the current milestone and use synthetic fixture data only.
6. Run the narrowest relevant checks, then build when appropriate. Report actual commands and outcomes.
