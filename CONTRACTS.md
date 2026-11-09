# SRI Finance — contrato frontend/backend v1

Fuente de verdad: `src/contracts/*.ts`. Ambos equipos pueden importar los tipos desde `src/contracts/api.ts`. Los cambios incompatibles requieren acuerdo previo.

| Método y ruta | Body | Respuesta 200 |
| --- | --- | --- |
| `POST /api/cases/analyze` | `AnalyzeRequest` | `AnalyzeResponse` |
| `POST /api/learning/run` | `LearningRunRequest` | `LearningRunResponse` |
| `POST /api/workflows/generate` | `GenerateWorkflowRequest` | `GenerateWorkflowResponse` |

El backend valida cada body y devuelve JSON. Errores: `400 INVALID_REQUEST`, `404 CASE_NOT_FOUND`, `503 MODEL_UNAVAILABLE` o `500 INTERNAL_ERROR`, todos con forma `ApiError`. Los IDs de casos y suites vienen de fixtures sintéticos del servidor. El frontend no envía documentos personales ni resultados esperados.

## Secuencia para la demo

1. Frontend llama a `analyze` con `{ "caseId": "case-001" }`. Presenta estado, hallazgos, orientación y trazas. `READY_FOR_HUMAN_REVIEW` no significa aprobación.
2. Llama a `learning/run` con `{ "suiteId": "onboarding-v1" }`. Presenta fallos medidos, propuestas y resultado de validación. Solo `ACCEPTED` se incorpora a memoria.
3. Llama a `workflows/generate` con `{ "suiteId": "auto-financing-v1" }`. Muestra los dos workflows y sus resultados sobre **la misma suite**. `baseline` no usa memoria; `learned` usa únicamente memoria aceptada.

## Reglas de integración

- `agentTrace` registra acciones ejecutadas y herramientas consultadas; no es texto inventado para la UI.
- `metric.passed/total` sale de evaluación de fixtures independientes, no de valores escritos a mano en el frontend.
- `WorkflowDefinition.steps[].toolId` debe estar en `ApprovedToolId`; el motor rechaza cualquier otro ID y nunca ejecuta código generado.
- Todas las verificaciones y datos son simulados (`simulated: true`). Ningún estado representa decisión crediticia.
- Los timestamps se serializan como cadenas ISO 8601. Las listas vacías son `[]`, nunca `null`.

## Reparto

**Frontend:** `src/app` excepto `src/app/api`, y `src/components`. Puede crear mocks tipados con `satisfies AnalyzeResponse`, `LearningRunResponse` y `GenerateWorkflowResponse` hasta integrar las rutas.

**Backend:** `src/server`, `src/app/api`, fixtures y `tests`. Implementa validación Zod a partir de estos contratos y entrega únicamente respuestas que los cumplan.
