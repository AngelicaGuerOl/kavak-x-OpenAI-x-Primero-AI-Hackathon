# SRI Finance — checklist del sprint

Guía operativa para construir SRI Finance por incrementos con dos personas y un límite de cinco horas. El alcance completo está en [README.md](README.md), la arquitectura y las decisiones en [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), y los prompts de inicio por rol en [README_PRIMEROS_PROMPTS.md](README_PRIMEROS_PROMPTS.md).

## Objetivo de la demo

La rúbrica da 25 % a impacto, aplicación de Codex, habilidades y demo. Codex es el agente de desarrollo: mejora el contexto, harness, skills/políticas y código del repositorio; esto no reentrena el modelo. Los sistemas financieros sucesores son el producto que Codex construye.

Demostrar una cadena verificable y honesta:

**Gen 0 (apertura de cuenta) → KYC/Verification → evaluación independiente → falla observada → patch ejecutable → validación en casos distintos → memoria versionada → Builder crea Gen 1 (preparación automotriz) → ejecución y comparación sobre los mismos casos → SQLite. Gen 2 (tarjetas) es opcional si Gen 1 revela otro fallo real.**

La aceptación principal es que agentes reales del OpenAI Agents SDK ejecuten el sistema inicial, que el sucesor herede una lección validada y se compare con el sistema inicial en los mismos casos. La API no se necesita para que Codex trabaje ni para ejecutar el harness local, pero sí para las llamadas LLM de la app y la evidencia principal de agentes reales. El modo determinista sirve para depuración y no se presenta como traza LLM. Todos los expedientes son sintéticos y requieren revisión humana.

## Estado inicial observado

Al comenzar este checklist:

- [x] Hay contratos iniciales, endpoints para análisis/aprendizaje/workflow y una implementación KYC/Verification en backend.
- [x] Existe validación Zod para el contrato de análisis y pruebas del primer hito.
- [ ] El frontend funcional aún no está construido; `src/components` no existe y la página actual necesita integración del recorrido.
- [ ] No está terminado el evaluador independiente, Reflection, la memoria ejecutable ni la persistencia versionada.
- [ ] No está terminado `AgentSystemDefinition`, la instancia dinámica de agentes ni la ejecución comparable de Sistema B.
- [ ] Las llamadas LLM de la aplicación requieren API disponible; esto no bloquea el trabajo de Codex ni la evaluación local, pero cualquier modo determinista debe etiquetarse.
- [ ] En la última prueba, la API respondió `credit_balance_exhausted`; confirmar saldo en la organización de la clave antes de reclamar una ejecución real.
- [ ] Los snapshots `v001/v002` registran iteraciones de Codex/harness, no son todavía generaciones de producto Gen0/Gen1.

Antes de trabajar, revisar `git status` e integrar cualquier cambio pendiente. No sobrescribir ni descartar trabajo de la otra persona.

## Reglas de coordinación

- Backend/agentes: `src/server`, `src/app/api`, `src/data`, `tests`.
- Frontend: `src/app` excepto `src/app/api`, y `src/components`.
- Contratos: `src/contracts` y `CONTRACTS.md` se acuerdan y congelan antes del trabajo paralelo de cada etapa.
- Cuando un contrato necesite cambiar, quien lo propone explica el cambio y la otra persona lo acepta antes de editar consumidores.
- Trabajar en ramas/worktrees separados si es posible. Si comparten checkout, anunciar archivos que se editarán y evitar cambios simultáneos en el mismo archivo.
- Al terminar cada hito: integrar, revisar el diff, ejecutar sus verificaciones y decidir juntos si se continúa.
- No introducir datos reales, claves en el repositorio, consultas bancarias reales, scoring sensible ni decisiones crediticias automáticas.

## Sprint de cinco horas

### 00:00–00:15 — Puerta de viabilidad de API y Agents SDK

**Backend**

- [ ] Confirmar que `.env.local` carga la variable sin imprimirla.
- [ ] Ejecutar una llamada real pequeña con `Agent` + `run`.
- [ ] Correr KYC y Verification con un caso sintético y comprobar herramientas/trazas reales.
- [ ] Registrar resultado y error sin guardar la clave.
- [ ] Ejecutar baseline local y confirmar snapshot/harness SQLite.

**Frontend**

- [ ] Leer README, plan, instrucciones y contrato vigente.
- [ ] Identificar estados que necesita presentar el endpoint actual; no cambiar contratos aún.

**Puerta de salida:** respuesta real del modelo y trazas de KYC/Verification. Si falla por saldo/acceso, registrar el bloqueo y continuar tareas independientes; no declarar cumplida la ejecución real.

### 00:15–00:30 — Revisión conjunta de alcance y contratos

**Backend/Data API**

- [ ] Revisar fixtures, esquema de casos, request/response y errores HTTP existentes.
- [ ] Enumerar campos necesarios para KYC, Verification, trazas y modo de ejecución.

**Frontend/UI**

- [ ] Esbozar recorrido mínimo: seleccionar caso, ejecutar, revisar resultado y traza.
- [ ] Confirmar que `MODEL_UNAVAILABLE`, `simulation` y `real` pueden mostrarse sin ambigüedad.

**QA/RSI (análisis read-only)**

- [ ] Proponer escenarios sintéticos y expectativas independientes.
- [ ] Separar casos de descubrimiento, validación y prueba reservada.
- [ ] Enumerar controles inmutables: revisión humana, consentimiento, allowlist de herramientas y no aprobación crediticia.

**Puerta de salida:** decisiones compartidas anotadas; aún no iniciar desarrollo paralelo si el contrato no está acordado.

### 00:30–00:45 — Congelar contratos

**Ambas personas**

- [ ] Acordar los esquemas Zod y tipos TypeScript del hito en curso.
- [ ] Acordar forma de hallazgos, evidencia, modo, `runId` y traza de agentes/herramientas.
- [ ] Acordar errores HTTP y estado de revisión humana.
- [ ] Actualizar `CONTRACTS.md` si hace falta y congelar el contrato para el resto de esta etapa.

**Puerta de salida:** frontend puede integrar sin adivinar respuestas y backend puede implementar sin cambiar la forma acordada.

### 00:45–02:30 — Sistema A: KYC + Verification y UI de análisis

**Backend/agentes**

- [ ] Mantener fixtures sintéticos separados de las expectativas del evaluador.
- [ ] Implementar KYC Agent con salida estructurada Zod y herramienta de lectura documental simulada.
- [ ] Implementar Verification Agent con salida Zod y herramienta simulada de contraste.
- [ ] Ejecutar ambos en secuencia con OpenAI Agents SDK.
- [ ] Registrar una traza solo después de cada llamada real al agente y cada ejecución real de herramienta.
- [ ] Validar la respuesta final contra el contrato.
- [ ] Devolver `MODEL_UNAVAILABLE` cuando no se pueda llamar al modelo; marcar cualquier fallback como simulación.
- [ ] Cubrir caso válido, caso inexistente, contrato inválido y modo sin credenciales.

**Frontend**

- [ ] Crear layout mínimo y selector de casos sintéticos.
- [ ] Conectar `POST /api/cases/analyze` al contrato congelado.
- [ ] Presentar estados de carga, error, resultado, hallazgos, evidencia y timeline.
- [ ] Mostrar distintivo de modo real/simulado y aviso de revisión humana.
- [ ] Evitar JSON crudo, resultados ficticios y aprobaciones.

**Puerta de salida:** una persona puede ejecutar un caso desde la UI y entender qué hicieron KYC y Verification.

### 02:30–03:45 — Evaluación, Reflection y memoria

**Backend/QA**

- [ ] Definir evaluador independiente de las salidas de los agentes.
- [ ] Ejecutar Sistema A contra oráculos escritos independientemente.
- [ ] Conservar fallos observados y evidencia, sin fabricar errores para forzar mejora.
- [ ] Enviar esos fallos a Reflection Agent.
- [ ] Hacer que Reflection proponga un `GenerationPolicyPatch` estructurado, acotado y ejecutable; no aceptar solo texto descriptivo.
- [ ] Aplicar la política en un candidato y validar en casos distintos a los de descubrimiento.
- [ ] Aceptar/versionar solo si la evaluación muestra mejora y las invariantes siguen pasando; guardar también propuestas rechazadas.

**Frontend**

- [ ] Construir Learning Lab con baseline, fallos, propuesta, validación y memoria activa.
- [ ] Mostrar resultados medidos y casos usados; diferenciar descubrimiento de validación.
- [ ] Indicar claramente cuando no hubo fallo o mejora suficiente para aceptar memoria.

**Controles que el aprendizaje no puede cambiar:** herramientas permitidas, consentimiento, datos sintéticos, revisión humana, prohibición de decisiones crediticias y prohibición de ejecutar código generado.

**Puerta de salida:** existe una decisión de memoria respaldada por evaluación reproducible, sea aceptación o rechazo.

### 03:45–04:30 — Builder y Gen 1 automotriz

**Backend/agentes**

- [ ] Definir schema Zod de `AgentSystemDefinition`: ID/versión, objetivo, agentes, objetivos individuales, instrucciones, herramientas aprobadas, workflow/dependencias, política aplicada y memoria usada.
- [ ] Registrar Gen0/Gen1 por separado de snapshots Codex; enlazar sucesor, lección, definición y resultados en SQLite.
- [ ] Implementar Workflow Builder Agent para producir esa definición.
- [ ] Rechazar roles, herramientas, dependencias o campos no permitidos.
- [ ] Instanciar la definición como sistema ejecutable con Agents SDK usando roles y herramientas del registro cerrado. El motor local ayuda a depurar, pero no sustituye la ejecución SDK de la demo.
- [ ] Ejecutar el sistema generado en tareas de preparación automotriz con decisión final reservada a revisión humana.
- [ ] Generar baseline sin memoria y learned con memoria aceptada.
- [ ] Ejecutar las dos definiciones sobre exactamente los mismos casos reservados y conservar salida, métricas y trazas por caso.

**Frontend**

- [ ] Crear Process Factory para mostrar definición de agentes y pasos del workflow.
- [ ] Comparar baseline/learned con los mismos IDs de casos.
- [ ] Mostrar cambios ejecutables de política y diferencias observadas; no afirmar mejora si las métricas no la respaldan.

**Puerta de salida:** Builder generó y el backend ejecutó un sucesor que hereda la lección aceptada; comparación con los mismos casos y modo declarado.

### 04:30–05:00 — Integración final y demo

**Ambas personas**

- [ ] Integrar cambios y revisar `git diff`.
- [ ] Ejecutar `npm test` y `npm run build`.
- [ ] Recorrer desde la UI: Sistema A → evaluación/Reflection → Sistema B → comparación.
- [ ] Confirmar que las trazas representan llamadas/herramientas efectivamente ejecutadas y que el modo (LLM o determinista) está correctamente indicado.
- [ ] Confirmar separación entre discovery, validation y test final.
- [ ] Verificar invariantes financieras, datos sintéticos y ausencia de secretos.
- [ ] Preparar demo de tres minutos y notas del modo real/simulado.
- [ ] Anotar limitaciones y cualquier criterio de aceptación que no se haya cumplido.

## Demo: guion oficial de tres minutos

- [ ] **0:00–0:40 — Sistema inicial:** problema en una frase, ejecutar caso, mostrar resultado esperado y falla realmente detectada.
- [ ] **0:40–1:45 — Lección y sucesor:** enseñar evidencia, patch guardado, validación con casos distintos y cambio ejecutable heredado por Gen 1; ejecutar al sucesor.
- [ ] **1:45–3:00 — Comparación y Codex:** correr ambas generaciones sobre los mismos casos, mostrar métricas reales, qué sigue fallando y cómo se usó Codex.
- [ ] Preparar preguntas para dos minutos: mostrar ejecución, lección y cambio heredado; explicar qué resultado refutaría la mejora.
- [ ] Aclarar qué código/contexto existía previamente y qué se creó en el hackathon.

## Mapeo de rúbrica (25 % cada criterio)

- [ ] **Impacto:** usuario/problema y métrica adecuada, como fallos por lote o detecciones correctas. No inventar ahorro de tiempo.
- [ ] **Aplicación de Codex:** enseñar AGENTS.md, planificación, análisis delegado, iteraciones y SQLite.
- [ ] **Habilidades:** enseñar señal de fallo, lección persistida y el cambio ejecutable que hereda el sucesor.
- [ ] **Demo/presentación:** secuencia de falla → aprendizaje → generación → comparación; distinguir sistema, Codex e intervención humana.

## Criterios de aceptación del sprint

- [ ] KYC y Verification ejecutados con Agents SDK y trazas reales en el criterio principal; modo local/determinista solo se usa como respaldo, claramente marcado.
- [ ] Herramientas simuladas allowlist ejecutadas y con evidencia en la traza.
- [ ] Evaluador independiente compara resultados contra expectativas separadas.
- [ ] Casos de descubrimiento, validación y test final son conjuntos distintos.
- [ ] Reflection genera una política que cambia el comportamiento del Builder de forma ejecutable.
- [ ] Aprendizaje se acepta solo con validación y no puede alterar controles financieros obligatorios.
- [ ] Builder genera un `AgentSystemDefinition` validado y el backend instancia/ejecuta Gen 1.
- [ ] Sistema inicial y sucesor corren sobre los mismos casos semánticos; métricas salen de resultados por caso.
- [ ] Cada versión, ejecución, fallo, propuesta y resultado de validación queda en SQLite.
- [ ] UI refleja fielmente modo, evidencia, trazas, errores y revisión humana.
- [ ] Build, pruebas y demo completados, o bloqueos descritos sin afirmar éxito.

## Pausa al final de cada incremento

Antes de abrir la siguiente etapa, revisar en conjunto:

- Qué se implementó y qué quedó pendiente.
- Qué archivos/contratos cambiaron.
- Qué comandos se ejecutaron y cuáles fueron sus resultados.
- Si hay evidencia real de llamadas al modelo o solo simulación.
- Qué riesgo o decisión afecta el siguiente paso.

El próximo prompt debe enfocarse solo en el incremento aprobado; no pedir que se implemente el MVP completo de una sola vez.
