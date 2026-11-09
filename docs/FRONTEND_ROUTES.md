# Ruta de construcción del frontend — SRI Finance

Esta guía describe **rutas web propuestas**, archivos y orden de trabajo para la persona responsable del frontend. El contrato vigente está en [`../CONTRACTS.md`](../CONTRACTS.md) y los tipos en `src/contracts`. Las rutas web pendientes de esta tabla son un plan, no pantallas ya implementadas.

## Área de trabajo

- Frontend: `src/app` **excepto** `src/app/api`, y `src/components`.
- Backend: `src/app/api`, `src/server`, fixtures y `tests`. El frontend consume sus respuestas, sin modificar la lógica financiera.
- Inicio local: `npm run dev` desde la raíz del repositorio; abrir `http://localhost:3000/`.
- Los cambios incompatibles en `src/contracts` se acuerdan con backend antes de editarlos.

## Rutas web y orden de implementación

| Paso | Ruta web | Archivo de Next.js | Estado | Qué debe mostrar | Endpoint |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | `src/app/page.tsx` | Parcial: pantalla de expedientes implementada | Selector de casos sintéticos, ejecución del análisis, estado, hallazgos, evidencia, orientación y traza | `POST /api/cases/analyze` |
| 2 | `/learning` | `src/app/learning/page.tsx` | Pendiente | Baseline medido, fallos, propuestas, validación, decisión de aceptación y versión de memoria | `POST /api/learning/run` |
| 3 | `/processes` | `src/app/processes/page.tsx` | Pendiente | Workflows baseline y learned, pasos y dependencias, resultados por caso y comparación de métricas | `POST /api/workflows/generate` |
| 4 | `/` como entrada a la demo completa | `src/app/page.tsx` y `src/app/layout.tsx` | Pendiente | Navegación funcional entre los tres recorridos; resumen de ejecuciones recientes y memoria activa solo si existen datos reales para mostrarlos | Respuestas de los tres endpoints, según la interacción |

El paso 4 **no implica inventar métricas** ni un endpoint de listado. Si el backend no expone ejecuciones recientes o memoria activa para consulta, el inicio debe ser una navegación clara al recorrido de la demo, sin afirmar que esos datos están disponibles.

## Componentes sugeridos por paso

1. **Expedientes:** extraer de `src/app/page.tsx` a `src/components/cases/` el selector, el resultado y sus pestañas. Un componente `AgentTrace` reutilizable puede mostrar las acciones registradas en las tres rutas.
2. **Aprendizaje:** crear `src/components/learning/LearningLab.tsx` y vistas pequeñas para métrica, fallos, propuestas y validación. Tomar números y versiones únicamente de `LearningRunResponse`.
3. **Procesos:** crear `src/components/processes/ProcessFactory.tsx`, una vista de pasos/dependencias y una comparación baseline/learned. Ambos lados deben corresponder a la misma suite recibida.
4. **Navegación y estados comunes:** mover el shell a `src/app/layout.tsx` o un componente compartido; crear estados de carga, error y vacío. Los enlaces de Aprendizaje y Procesos se activan al existir sus páginas.

## Llamadas y estados que debe manejar cada ruta

| Ruta | Body exacto inicial | Respuesta tipada | Estados de UI |
| --- | --- | --- | --- |
| `/` | `{ "caseId": "case-001" }` (o un ID disponible) | `AnalyzeResponse` | Sin selección, cargando, resultado, `ApiError` |
| `/learning` | `{ "suiteId": "onboarding-v1" }` | `LearningRunResponse` | Sin ejecución, cargando, resultado, `ApiError` |
| `/processes` | `{ "suiteId": "auto-financing-v1" }`; `memoryVersion` solo si proviene de aprendizaje aceptado | `GenerateWorkflowResponse` | Sin ejecución, cargando, resultado, `ApiError` |

Importar los tipos desde `src/contracts/api.ts`. Los errores del servidor tienen forma `ApiError` y códigos `INVALID_REQUEST`, `CASE_NOT_FOUND`, `MODEL_UNAVAILABLE` o `INTERNAL_ERROR`.

## Criterios para completar el recorrido

- Una persona puede abrir `/`, analizar un caso, ir a `/learning` y luego a `/processes` usando solo la interfaz.
- Cada pantalla presenta carga, error y resultado; no deja la respuesta como JSON crudo.
- La UI identifica datos sintéticos, distingue ejecución real de simulación según la respuesta y explica que los estados requieren revisión humana, sin aprobar ni rechazar crédito.
- Métricas, trazas, hallazgos y versiones provienen de respuestas del servidor. Si el modelo no está disponible, se muestra `MODEL_UNAVAILABLE` sin simular una ejecución real.
- Antes de declarar lista la demo: `npm run build`, `npm run test` y recorrido de los tres endpoints con casos sintéticos.

