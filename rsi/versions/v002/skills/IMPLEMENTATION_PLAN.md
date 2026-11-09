# SRI Finance — plan de implementación por etapas

Este plan convierte el alcance de [README.md](README.md) en una secuencia de trabajo revisable para dos personas. Parte del estado actual del repositorio: Next.js y contratos ya existen; `src/server/core.ts` contiene una simulación determinista mínima; las tres rutas API responden; la UI es una página JSON; aún no hay agentes OpenAI en ejecución, memoria RSI funcional, suite de pruebas ni dashboard.

## Resultado que buscamos

Una demo reproducible, ejecutada con el OpenAI Agents SDK, que recorra el ciclo completo:

**Sistema A (apertura de cuenta) → evaluación independiente → fallo observado → Reflection propone una política ejecutable → validación en casos nuevos → memoria versionada → Builder produce un `AgentSystemDefinition` → backend instancia y ejecuta Sistema B (preparación automotriz) → comparación con y sin memoria sobre los mismos casos → dashboard con trazas reales.**

La aceptación principal exige trazas reales de múltiples agentes ejecutados con OpenAI Agents SDK, y que Builder genere e instancie el sistema B para ejecutarlo. La simulación determinista solo es respaldo para desarrollar y depurar; nunca se presenta como evidencia de agentes de IA reales. Si no hay acceso al modelo, se declara el hito real bloqueado y la demo como simulada/incompleta respecto del criterio principal.

### Alcance cerrado del MVP: cuatro agentes

1. **KYC Agent:** revisa requisitos y documentos sintéticos de apertura de cuenta.
2. **Verification Agent:** ejecuta herramientas simuladas autorizadas, contrasta evidencias y escala discrepancias a revisión humana.
3. **Reflection Agent:** recibe errores medidos por el evaluador independiente y propone cambios ejecutables de política de generación.
4. **Workflow Builder Agent:** genera una definición validada que el backend instancia con el SDK.

Las funciones fiscales y de productos son módulos/herramientas reutilizables, no agentes adicionales para este MVP.

## Acuerdos para trabajar juntos

- Primero se acuerdan y congelan los contratos de `src/contracts`. Frontend y backend no inventan respuestas por separado.
- Una persona toma **Frontend**: `src/app` excepto `src/app/api`, y `src/components`.
- La otra toma **Backend**: `src/server`, `src/app/api`, `src/data` y `tests`.
- Usen ramas o worktrees separados si trabajan desde dos sesiones. Integren por etapas pequeñas; no editen el mismo archivo simultáneamente.
- Los cambios a contratos se proponen en una rama y se comunican antes de cambiar consumidores.
- Toda integración se hace contra endpoints locales y fixtures; no se suben secretos ni expedientes reales.
- Si el tiempo se reduce, preservar la demo RSI completa en modo determinista antes de ampliar productos o pantallas.

### Archivos que son la fuente de verdad

- `README.md`: propósito, problema, alcance y pitch del producto.
- `AGENTS.md`: cómo trabajar en este repositorio, límites y verificaciones.
- `CONTRACTS.md` y `src/contracts/**`: acuerdos entre UI y API.
- Este archivo: orden de implementación, responsables, dependencias y criterios de aceptación.
- `.codex/config.toml` sería configuración de proyecto ilustrativa; la configuración del workspace puede limitar o prevalecer sobre ella.
- `~/.codex/AGENTS.md` sería contexto personal, no debe versionarse ni editarse como parte de este repositorio.

## Hito 0 — Puerta de viabilidad SDK (minutos 0–15)

**Responsable:** backend principal; frontend revisa contratos existentes en paralelo, sin cambiar su forma.

1. Instalar dependencias desde el lockfile y confirmar Node/npm.
2. Confirmar si hay clave/modelo configurado sin imprimir ni copiar secretos.
3. Ejecutar un smoke test real de `Agent` + `run` con un prompt pequeño; comprobar respuesta, duración y traza/metadata del SDK. No basta con importar el paquete.
4. Guardar el resultado de viabilidad (éxito/fallo, modelo utilizado, causa; nunca la clave) y decidir modo real o modo de contingencia.

**Criterio de salida:** llamada real al modelo confirmada. Si falla por clave, cuota, red o acceso al modelo, registrar la causa y probar resolución dentro de esta ventana; luego continuar construyendo, pero marcar explícitamente el criterio principal como pendiente.

**Estado comprobado en este repositorio:** instalado `@openai/agents` 0.21.0; las instancias `KYC Agent` y `Verification Agent` se construyen correctamente. No existe `OPENAI_API_KEY` en el entorno revisado, por lo que la llamada real al modelo no se pudo confirmar todavía. El endpoint responde `MODEL_UNAVAILABLE` en vez de etiquetar el simulador como ejecución real.

## Hito 0B — Preparación y reducción de incertidumbre (minutos 15–30)

**Responsable:** ambos, antes de repartir código. **Modo:** solo lectura y síntesis.

1. Leer `README.md`, `AGENTS.md`, `CONTRACTS.md`, contratos actuales, rutas y `core.ts`.
2. Revisar `git status`, dependencias disponibles y configuración local sin revelar valores de secretos.
3. Hacer tres análisis independientes, sin modificar archivos:
   - **Data/API:** inventario de fixtures, esquema de caso, contratos, errores y cambios mínimos necesarios.
   - **Frontend/UI:** recorrido de dashboard, casos, detalle, Learning Lab y Process Factory; datos que necesita cada estado.
   - **QA/RSI:** escenarios, oráculos independientes, holdout, invariantes y evidencia por ejecución.
4. Sintetizar decisiones y riesgos en una revisión corta antes de codificar.

**Brief reutilizable para cada analista:** “Analiza únicamente [área]. No edites archivos. Devuelve decisiones, rutas/contratos afectados, evidencia del repositorio, riesgos, dependencias y criterios de aceptación. Señala incertidumbres; no inventes funcionalidades existentes.”

**Criterio de salida:** alcance MVP acordado, archivos de cada persona delimitados y decisiones abiertas resueltas o anotadas.

## Hito 1 — Congelar contratos y modelo de datos (minutos 30–45)

**Responsables:** backend propone; frontend revisa; ambos aceptan. **Bloquea:** desarrollo paralelo de UI y API.

Definir en `src/contracts` y documentar en `CONTRACTS.md`:

- `CaseFixture`: identificador, documentos/atributos sintéticos, interés declarado, consentimiento explícito donde aplique y expectativa independiente del evaluador.
- `AnalyzeRequest` / `AnalyzeResponse`: estado de preparación, hallazgos con evidencia y fuente, guía informativa, modo (`agent` o `simulation`), `runId` y traza ejecutada.
- `LearningRunRequest` / `LearningRunResponse`: suite, fallos observados, propuestas, casos de descubrimiento y validación separados, decisión de aceptación/rechazo y versión de memoria.
- `AgentSystemDefinition`: Zod schema versionado con `systemId`, objetivo, lista de agentes permitidos, objetivos por agente, instrucciones, `ApprovedToolId[]` por agente, workflow ordenado/dependencias, política de generación aplicada y `memoryVersion`.
- `GenerateWorkflowRequest` / `GenerateWorkflowResponse`: suite fija, definiciones baseline/learned, resultados de instanciación/ejecución, resultados por caso, métricas calculadas, versiones y trazas.
- Errores HTTP consistentes: `INVALID_REQUEST`, `CASE_NOT_FOUND`, `MODEL_UNAVAILABLE`, `INTERNAL_ERROR`.
- Estados nunca significan aprobación/rechazo crediticio. Todo resultado del simulador identifica `simulated: true`.

Usar tipos TypeScript compartidos y esquemas Zod en límites HTTP, salidas estructuradas de agentes y workflows. `ApprovedToolId` debe ser una unión cerrada; el motor rechaza IDs desconocidos y nunca ejecuta código generado.

**Criterio de salida:** frontend puede construir pantallas con tipos/imports reales; backend puede implementar endpoints sin cambiar la forma acordada.

## Hito 2 — Sistema A y backend ejecutable (minutos 45–150)

**Responsable principal:** backend. **Frontend en paralelo:** crear estructura visual y navegación con fixtures tipados, sin alterar contratos.

Backend:

1. Extraer los cuatro casos actuales de `core.ts` a `src/data/cases.json` y añadir escenarios mínimos de INE vencida, nombre contradictorio, ingresos/documento discordantes y consulta sin consentimiento.
2. Separar las expectativas del evaluador de la lógica que produce hallazgos; no derivarlas de la salida del sistema.
3. Crear catálogo cerrado de herramientas simuladas: presencia documental, comparación de campos, vigencia, requisitos y consentimiento.
4. Crear orquestador que registra cada acción y resultado real de herramienta con timestamps, modo y `runId`.
5. Implementar KYC Agent y Verification Agent con Agents SDK, salidas Zod y herramientas simuladas. Fiscal/financiero queda como herramienta/módulo.
6. El orquestador debe ejecutar ambos agentes de manera real, preservar resultados y herramientas por etapa y producir trazas comprobables.
7. Mantener un adaptador determinista para desarrollo sin credenciales, etiquetado `simulation`; no sumar sus resultados a evidencia real de agentes.

Frontend en paralelo:

1. Crear layout de aplicación, navegación y componentes reutilizables.
2. Implementar lista/selector de expedientes sintéticos y detalle del expediente.
3. Mostrar loading/error/success, evidencia, herramientas y traza; distinguir modo simulado.
4. Usar tipos de `src/contracts`, sin mocks incompatibles.

**Criterio de salida:** analizar un caso completo produce respuesta tipada y trazas de herramientas ejecutadas; la UI lo representa sin JSON crudo.

## Hito 3 — Evaluación independiente y RSI (minutos 150–225)

**Responsable principal:** backend; QA revisa independencia de oráculos; frontend implementa Learning Lab en paralelo.

1. Mantener suites separadas: descubrimiento, validación y test final reservado.
2. Comparar ejecuciones reales de Sistema A con expectativas independientes.
3. Reflection produce `GenerationPolicyPatch` estructurado, no texto libre: operaciones permitidas y parámetros acotados para modificar estrategia/pasos del Builder.
4. Aplicar el patch sobre la política de generación en un entorno candidato. Rechazar claves/opciones desconocidas.
5. Validar en casos distintos; aceptar solo si los resultados medidos justifican el cambio y no rompe invariantes.
6. Versionar el patch aceptado como memoria ejecutable y conservar evidencia de propuestas rechazadas.

**Invariantes no aprendibles:** no decisión crediticia automática, consentimiento obligatorio, herramientas allowlist, datos sintéticos, revisión humana y no ejecutar código generado. El evaluador y runtime imponen estos controles fuera de la memoria.

**Criterio de salida:** el Learning Lab muestra métricas obtenidas al ejecutar fixtures, fallo, propuesta, validación y versión aceptada/rechazada. No fabrica aprendizaje si no hubo error real.

## Hito 4 — Builder y ejecución del Sistema B (minutos 225–270)

**Responsable principal:** backend; frontend desarrolla Process Factory.

1. Builder recibe requisitos automotrices y política baseline o patch de memoria aceptado.
2. Produce `AgentSystemDefinition` validado por Zod: nuevos agentes definidos desde roles aprobados, objetivos, instrucciones, herramientas autorizadas y workflow.
3. Backend instancia cada agente como `Agent` del SDK, resolviendo herramientas desde el registro cerrado; rechaza herramientas o roles no autorizados.
4. Ejecuta la definición para preparar financiamiento automotriz. No emite aprobaciones.
5. Ejecuta baseline y learned en exactamente los mismos casos reservados; conserva definiciones, trazas reales, resultados y métricas.

**Criterio de salida:** se observa una diferencia verificable entre procesos y resultados, o se reporta honestamente que no hubo aprendizaje válido. No se atribuye mejora si las métricas no la prueban.

## Hito 5 — Integración, verificación y demo (minutos 270–300)

**Responsables:** ambos.

Pantallas MVP:

- **Dashboard:** estado de ejecuciones recientes, memoria activa y acceso a los tres recorridos.
- **Cases:** selector/formulario sintético, documentos y análisis.
- **Detalle:** estado, incidencias con evidencia, guía informativa y timeline de agentes/herramientas.
- **Learning Lab:** baseline, fallos, reflexión, pruebas de validación y memoria.
- **Process Factory:** workflows JSON legibles, pasos/dependencias y comparación con/sin memoria sobre los mismos casos.

Conectar `POST /api/cases/analyze`, `POST /api/learning/run` y `POST /api/workflows/generate`. Manejar errores y estados de carga. La UI debe indicar claramente información simulada y que los resultados requieren revisión humana.

**Criterio de salida:** una persona puede ejecutar la demo de principio a fin desde el dashboard, sin editar JSON ni abrir terminal.

**Responsables:** ambos. Ejecutar pruebas y build, recorrer análisis KYC/Verification, Learning y Factory; revisar modos, trazas, mismo holdout, invariantes, errores HTTP y que no haya secretos expuestos. Preparar demo reproducible de tres minutos.

**Aceptación principal:** trazas de ejecución reales de al menos KYC y Verification mediante SDK, además de Builder ejecutando un `AgentSystemDefinition` generado por él mediante SDK en Sistema B. Si falta credencial/acceso, el reporte indica claramente que esta aceptación no se cumplió.

## Orden de prioridad si el tiempo aprieta

1. Puerta de viabilidad real del SDK y contratos congelados.
2. Dos agentes reales (KYC + Verification) y traza con evidencia de herramientas.
3. Evaluador independiente y división discovery/validation/test.
4. Reflection patch ejecutable, validado y guardado como memoria.
5. Builder produce e instancia el sistema B por SDK.
6. Comparación honesta con/sin memoria sobre el mismo holdout.
7. UI para enseñar resultados y trazas.
8. Refinamiento visual y amplitud de productos.

## Uso de Codex en este proyecto

- **Plan Mode:** usarlo antes de iniciar cada hito grande para leer estado/evidencia, aclarar decisiones, definir alcance y verificaciones; implementar después de revisar el plan.
- **Esfuerzo de razonamiento:** predeterminado para búsquedas simples; subirlo para arquitectura, seguridad financiera, contratos y revisión del RSI. Elegir el modelo disponible según calidad/latencia; las etiquetas de modelo son ejemplos y no garantizan disponibilidad.
- **Subagentes:** encargar tareas acotadas de solo lectura (Data/API, UI, QA). Incluir objetivo, archivos a inspeccionar, prohibición de editar y formato de evidencia. Sintetizar resultados antes de cambiar contratos.
- **Goal Mode:** objetivo sugerido: “Completar una demo RSI reproducible de SRI Finance con Sistema A, memoria validada, Sistema B y evidencia en UI”. Mantenerlo activo entre hitos; actualizar alcance con nueva evidencia y pausar/retomar cuando lo decida el usuario.
- **Skills/MCP/plugins:** añadir solo si resuelven una tarea concreta del proyecto. La skill `rsi-evaluation` guía el ciclo RSI; no introducir integraciones externas innecesarias en el MVP.
- **Iteraciones:** cada hito termina con revisión del diff, verificaciones pertinentes y una versión/commit pequeño que permita volver atrás.

## Calendario estricto: 5 horas / 2 personas

| Tiempo | Backend / agentes | Frontend |
| --- | --- | --- |
| 00:00–00:15 | Smoke test real de Agents SDK; confirmar API key/modelo | Leer pantallas y contrato actual; preparar dudas, sin cambiar contrato |
| 00:15–00:30 | Data/API y arquitectura de tools/agentes (read-only) | UI/inbox y estados (read-only); ambos comparten decisiones |
| 00:30–00:45 | Proponer schemas Zod/API | Revisar y aceptar contrato; **freeze al minuto 45** |
| 00:45–02:30 | KYC, Verification, herramientas simuladas, trazas y endpoints | Layout, Cases, detalle, timeline conectados a contrato congelado |
| 02:30–03:45 | Evaluador, Reflection patch, validación y memoria versionada | Learning Lab con resultados de API reales |
| 03:45–04:30 | Builder, AgentSystemDefinition, instancia y ejecución del sistema B | Process Factory y comparación sobre mismas filas de resultados |
| 04:30–05:00 | Pruebas, build y demo end-to-end; corregir fallos críticos | Integración final, estados de error/modo, demo y revisión visual |

No se amplía el alcance para recuperar tiempo perdido. Si el smoke test real no pasa, dedicar un bloque corto a diagnosticar configuración; continuar con código tipado, dejando claro que el criterio principal de agentes reales permanece pendiente hasta ejecutar llamadas reales.

## Riesgos y decisiones que deben quedar visibles

- Si no hay API key o acceso al modelo, la demo puede probar el motor en modo determinista, pero no se presenta como ejecución real de agentes.
- Para demostrar RSI sin resultados inventados, los fixtures de descubrimiento deben contener un fallo conocido del baseline; los casos de validación y prueba deben ser distintos.
- No hay conexión real con Buró, SAT, INE ni bancos. Los nombres de herramientas reflejan simulaciones.
- No se desarrollará aprobación crediticia, scoring sensible ni ejecución de código generado.
- No guardar datos reales, secretos ni trazas que contengan información sensible.
