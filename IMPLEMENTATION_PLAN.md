# SRI Finance — plan de implementación por etapas

Este plan convierte el alcance de [README.md](README.md) en una secuencia de trabajo revisable para dos personas. Parte del estado actual del repositorio: Next.js y contratos ya existen; `src/server/core.ts` contiene una simulación determinista mínima; las tres rutas API responden; la UI es una página JSON; aún no hay agentes OpenAI en ejecución, memoria RSI funcional, suite de pruebas ni dashboard.

## Resultado que buscamos

Una demo reproducible que muestre cómo Codex usa fallos medidos para mejorar las instrucciones, políticas y el harness que aplica al construir sistemas financieros sucesores:

**Generación 0 (apertura de cuenta) → evaluación independiente → fallo observado → lección ejecutable → validación en casos distintos → memoria versionada → Builder crea Generación 1 (preparación automotriz) → ejecución y comparación sobre el mismo conjunto de evaluación → evidencia guardada en SQLite.**

La rúbrica evalúa por igual impacto, aplicación de Codex, uso creativo de habilidades y demostración. Codex es el agente de desarrollo: contexto versionado, planes, delegación read-only, harness, skills/políticas y correcciones comprobadas muestran cómo se aplicó. Esto no modifica ni reentrena los pesos del modelo. Los agentes de SRI Finance son los agentes del producto y deben ejecutarse con OpenAI Agents SDK en la demo principal; la API key y saldo API son necesarios para esas llamadas. Codex puede seguir trabajando en el repositorio sin la API key.

La aceptación principal para RSI es que una falla observada provoque un cambio ejecutable y validado que el Builder herede al generar y ejecutar un sucesor funcional mediante Agents SDK. El sistema inicial y su sucesor se comparan sobre los mismos casos semánticos de evaluación. El modo local/determinista sirve para desarrollar y depurar, pero no cuenta como evidencia de ejecución real de agentes en la demo principal.

### Cadena de generaciones para la demo

- **Generación 0:** revisión de apertura de cuenta; ejecutar casos sintéticos y dejar que el evaluador revele fallos reales. Contradicciones entre campos y reenvíos duplicados son hipótesis para probar, no fallos que se deban dar por ciertos.
- **Lección 1:** Reflection/Codex convierte un fallo observado en un patch ejecutable, crea una prueba y valida en ejemplos distintos. La lección se acepta o rechaza con evidencia.
- **Generación 1:** Builder produce preparación automotriz y hereda el patch aceptado. Debe correr y exponer las reglas y herramientas que heredó.
- **Generación 2, opcional:** solo si Gen1 descubre otro fallo real y hay tiempo; puede ser preparación de tarjetas que hereda lecciones aceptadas. No inventar una segunda lección para completar la historia.

El dashboard enseña ejecución/fallo inicial, lección con su fuente, el cambio ejecutable del sucesor, resultados antes/después sobre los mismos casos y qué sigue fallando.

### Evidencia de uso de Codex (25 %)

- `AGENTS.md` fija contexto, convenciones, límites y verificaciones.
- Plan Mode y briefs de subagentes read-only reducen incertidumbre antes de implementar.
- Goal Mode mantiene el objetivo entre hitos y permite ajustar alcance con evidencia.
- Skills y harness se versionan junto con lógica y testcases.
- `rsi/history.sqlite` muestra qué falló, qué cambió y cómo respondió la validación.
- La demo distingue acciones hechas por Codex, acciones del sistema financiero y decisiones/intervenciones humanas.

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

## Hito 0 — Puerta de viabilidad de API/Agents SDK (minutos 0–15)

**Responsable:** backend; frontend revisa el recorrido en paralelo.

1. Confirmar Node/dependencias y que `.env.local` carga `OPENAI_API_KEY` sin imprimirla.
2. Ejecutar una llamada pequeña real con Agents SDK (`Agent` + `run`) y verificar respuesta del modelo.
3. Ejecutar smoke test de KYC y Verification sobre un expediente sintético y confirmar herramientas/trazas reales.
4. Registrar modo/modelo, resultado y errores sin guardar la clave.
5. Ejecutar baseline local/harness y confirmar snapshot SQLite para conservar el estado inicial.

**Criterio de salida:** llamadas reales de KYC y Verification completadas mediante el SDK. Si falla por saldo/acceso/configuración, diagnosticarlo y registrarlo; continuar implementando lo independiente, pero la aceptación de demo real queda pendiente.

**Estado comprobado en este repositorio:** la key de `.env.local` se leyó y la solicitud llegó a OpenAI, pero respondió `429 credit_balance_exhausted`. La conexión está configurada; falta saldo API en la organización de esa clave para comprobar una ejecución exitosa.

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
- Persistencia en SQLite separa iteraciones de Codex (`v001`, `v002`, etc.) de generaciones de producto (`G0`, `G1`, `G2`): cada generación enlaza definición, padre, lecciones heredadas, casos y ejecuciones.
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
2. Comparar ejecuciones reproducibles de Sistema A con expectativas independientes; registrar si el modo fue LLM o local/determinista.
3. Reflection produce `GenerationPolicyPatch` estructurado, no texto libre: operaciones permitidas y parámetros acotados para modificar estrategia/pasos del Builder.
4. Aplicar el patch sobre la política de generación en un entorno candidato. Rechazar claves/opciones desconocidas.
5. Validar en casos distintos; aceptar solo si los resultados medidos justifican el cambio y no rompe invariantes.
6. Versionar el patch aceptado como memoria ejecutable y conservar evidencia de propuestas rechazadas.

**Invariantes no aprendibles:** no decisión crediticia automática, consentimiento obligatorio, herramientas allowlist, datos sintéticos, revisión humana y no ejecutar código generado. El evaluador y runtime imponen estos controles fuera de la memoria.

**Criterio de salida:** el Learning Lab muestra métricas obtenidas al ejecutar fixtures, fallo, propuesta, validación y versión aceptada/rechazada. No fabrica aprendizaje si no hubo error real.

## Hito 4 — Builder y ejecución de Generación 1 (minutos 225–270)

**Responsable principal:** backend; frontend desarrolla Process Factory.

1. Builder recibe requisitos automotrices y un patch aceptado a partir de evidencia medida.
2. Produce `AgentSystemDefinition` validado por Zod: nuevos agentes definidos desde roles aprobados, objetivos, instrucciones, herramientas autorizadas y workflow.
3. Backend instancia la definición como sistema ejecutable con Agents SDK, resolviendo roles y herramientas desde el registro cerrado; rechaza herramientas o roles no autorizados. El modo local puede depurar el workflow, pero no satisface la ejecución real requerida para la demo principal.
4. Ejecuta la definición para preparar financiamiento automotriz. No emite aprobaciones.
5. Ejecuta el sistema inicial y el sucesor sobre los mismos casos semánticos; conserva definiciones, modo, resultados por caso y métricas.
6. Conserva trazas reales de Builder y agentes del sistema sucesor. Si una prueba local usa el motor determinista, se etiqueta como tal y queda fuera de la comparación de ejecución LLM.
7. Registrar la relación de sucesión en SQLite: generación padre, generación nueva, versión/policy patch heredado y conjunto de casos usado.
7. Registrar la relación de sucesión en SQLite: generación padre, generación nueva, versión/policy patch heredado y conjunto de casos usado.

**Criterio de salida:** Builder generó e instancia un sucesor ejecutable que hereda la lección validada; la comparación usa los mismos casos y modo declarado. No se atribuye mejora si las métricas no la prueban.

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

**Aceptación principal:** trazas reales de KYC y Verification con Agents SDK; fallo reproducible; lección ejecutable validada con casos distintos; `AgentSystemDefinition` generado por Builder e instanciado/ejecutado con SDK como sucesor; comparación en los mismos casos; historial de versiones. La ejecución local se conserva como evidencia de harness, no como sustituto de las trazas LLM.

## Orden de prioridad si el tiempo aprieta

1. Contratos y harness reproducible con expectativas independientes.
2. Sistema inicial con falla medida y explicable.
3. Lección ejecutable de Reflection, validada en casos distintos.
4. Builder produce e instancia un sucesor que hereda la lección.
5. Comparación honesta en los mismos casos, modo y métricas.
6. UI que enseña la secuencia y la aplicación de Codex.
7. Generación 2 si el sucesor descubre otro fallo real.
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
| 00:00–00:15 | Smoke test API real, Agents SDK, KYC/Verification y baseline SQLite | Leer rúbrica, contexto y recorrido UI; preparar dudas sin cambiar contrato |
| 00:15–00:30 | Data/API y arquitectura de tools/agentes (read-only) | UI/inbox y estados (read-only); ambos comparten decisiones |
| 00:30–00:45 | Proponer schemas Zod/API | Revisar y aceptar contrato; **freeze al minuto 45** |
| 00:45–02:30 | Sistema inicial ejecutable, herramientas simuladas, trazas y endpoints | Layout, Cases, detalle y timeline conectados al contrato |
| 02:30–03:45 | Evaluador, Reflection patch, validación y memoria versionada | Learning Lab con resultados medidos y evidencia de Codex |
| 03:45–04:30 | Builder, AgentSystemDefinition, instancia y ejecución del sucesor | Process Factory y comparación sobre los mismos casos |
| 04:30–05:00 | Pruebas/build, revisar evidencia/historial y preparar demo 3 min + Q&A 2 min | Integración, comparación visual y explicación de Codex/límites |

No se amplía el alcance para recuperar tiempo perdido. Si runtime API no está habilitado, continuar el trabajo de Codex/harness que no dependa de ella, registrar el bloqueo y no presentar la demo como ejecución real hasta resolverlo.

## Riesgos y decisiones que deben quedar visibles

- Si no hay saldo API, Codex aún puede ejecutar harness, registrar fallos y modificar lógica/skills localmente; la demo de agentes de la aplicación permanece incompleta respecto al criterio de ejecución real.
- No se fuerza un fallo conocido. Se prueban escenarios exploratorios y el evaluador identifica fallos observados; validación y test final usan casos distintos de discovery.
- No hay conexión real con Buró, SAT, INE ni bancos. Los nombres de herramientas reflejan simulaciones.
- No se desarrollará aprobación crediticia, scoring sensible ni ejecución de código generado.
- No guardar datos reales, secretos ni trazas que contengan información sensible.
