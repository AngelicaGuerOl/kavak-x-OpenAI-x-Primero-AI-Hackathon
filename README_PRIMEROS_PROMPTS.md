# SRI Finance — prompts de trabajo por etapas

Este archivo conserva los prompts de la primera iteración y añade los siguientes prompts, ordenados para continuar paso a paso con dos personas. El producto completo y sus objetivos están en [README.md](README.md); el orden de hitos y criterios está en [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Cómo trabajar paso a paso

1. Ambos lean `README.md`, `AGENTS.md`, `CONTRACTS.md` e `IMPLEMENTATION_PLAN.md`.
2. Revisen los contratos actuales de análisis. Para esta primera iteración, considérenlos congelados; no amplíen contratos de Learning o Workflow todavía.
3. Persona 1 trabaja solo en interfaz. Persona 2 trabaja solo en backend/agentes. Si comparten checkout, coordinen commits y no editen archivos de la otra persona.
4. Cada persona entrega su primer resultado pequeño y las verificaciones que realmente ejecutó.
5. Integren y revisen juntos el recorrido KYC → Verification en un expediente sintético.
6. Deténganse para revisar el resultado antes de solicitar los prompts de la siguiente etapa. No intenten implementar todo el MVP en esta primera iteración.

## Prompt 1 — Persona de frontend

```text
Eres responsable del frontend de SRI Finance para la primera iteración. Lee README.md, AGENTS.md, CONTRACTS.md, IMPLEMENTATION_PLAN.md y revisa el estado real del repositorio antes de modificar archivos.

OBJETIVO DE ESTA ITERACIÓN
Crear una interfaz mínima y usable para seleccionar un expediente sintético, ejecutar su análisis y entender el resultado del flujo KYC → Verification.

ENTREGABLES
- Una página inicial clara para la demo.
- Selector de expedientes sintéticos basado en los IDs disponibles en el backend.
- Botón para llamar a POST /api/cases/analyze.
- Presentación legible del estado, hallazgos, evidencia y traza de agentes/herramientas.
- Estados de carga, error y resultado correcto.
- Mensaje claro para MODEL_UNAVAILABLE, explicando que se necesita configuración local de acceso al modelo.
- Indicador visible que distinga `executionMode: "real"` de `executionMode: "simulation"`.
- Aviso breve: los datos y verificaciones son sintéticos y los resultados requieren revisión humana.

LÍMITES
- Modifica solo `src/app` fuera de `src/app/api` y `src/components`.
- No cambies contratos, API, lógica de servidor ni pruebas. Si el contrato no alcanza para mostrar algo, anótalo para acordarlo con la otra persona.
- No agregues todavía Learning Lab, Reflection, memoria RSI, Builder ni financiamiento automotriz.
- No inventes resultados, trazas, verificaciones oficiales ni decisiones de crédito.
- Mantén el diseño acotado: primero debe funcionar el recorrido, luego se refina visualmente.

AL CERRAR
- Comprueba el frontend con `npm run build` si las dependencias están instaladas.
- Resume archivos cambiados, cómo probar el recorrido y cualquier bloqueo. Distingue verificaciones reales de lo que quedó pendiente.
- Detente después de este entregable; no avances a la siguiente etapa sin revisar la integración.
```

## Prompt 2 — Persona de backend y agentes

```text
Eres responsable del backend y los agentes de SRI Finance para la primera iteración. Lee README.md, AGENTS.md, CONTRACTS.md, IMPLEMENTATION_PLAN.md y revisa el estado real del repositorio antes de modificar archivos. No dupliques trabajo que ya exista.

OBJETIVO DE ESTA ITERACIÓN
Verificar la integración de OpenAI Agents SDK y completar un flujo de análisis de apertura de cuenta con KYC Agent seguido por Verification Agent, usando únicamente datos sintéticos y herramientas simuladas autorizadas.

ESTADO QUE DEBES COMPROBAR
- Inspecciona la implementación existente en `src/server/agents/kyc-verification.ts`, la ruta `src/app/api/cases/analyze/route.ts`, los contratos y las pruebas.
- Comprueba si existe `OPENAI_API_KEY` sin imprimirla ni copiarla. Si falta, no simules éxito: informa que la ejecución real del modelo continúa pendiente y conserva el error `MODEL_UNAVAILABLE`.
- Distingue una instancia del SDK construida correctamente de una llamada real completada al modelo; no las reportes como lo mismo.

ENTREGABLES
- KYC Agent analiza el expediente sintético y prepara las verificaciones.
- Verification Agent utiliza las herramientas simuladas para contrastar evidencia y devolver hallazgos estructurados validados con Zod.
- El orquestador ejecuta los agentes en secuencia y devuelve el contrato vigente con estado de revisión humana, `runId`, timestamps y trazas.
- Las trazas de herramientas se registran solo si la herramienta realmente se ejecutó.
- El endpoint valida entrada, responde correctamente ante un caso inexistente y devuelve `MODEL_UNAVAILABLE` cuando no puede ejecutar el modelo real.
- Puede conservarse una ruta de simulación para desarrollo, pero siempre identificada como simulación y nunca como evidencia de agentes reales.

LÍMITES
- Modifica solo `src/server`, `src/app/api/cases/analyze`, `tests` y configuración de pruebas.
- No modifiques componentes o páginas visuales.
- No cambies `src/contracts` ni `CONTRACTS.md` unilateralmente. Si hace falta un cambio, detente, descríbelo y acuerda la nueva forma con la persona de frontend antes de tocar consumidores.
- No implementes aún Reflection, políticas de memoria, AgentSystemDefinition, Workflow Builder ni Sistema B.
- No conectes Buró, bancos, SAT, INE ni servicios externos reales. No tomes decisiones crediticias.

AL CERRAR
- Ejecuta `npm test` y `npm run build`.
- Si hay clave y acceso, realiza una llamada smoke real de KYC y Verification y guarda evidencia no sensible de la ejecución. Nunca expongas la clave.
- Si no hay acceso, informa exactamente qué comprobaste (por ejemplo, instalación/instanciación del SDK, validaciones, modo simulado y respuesta 503) y qué sigue bloqueado.
- Resume archivos modificados, pruebas ejecutadas y limitaciones. Detente después de este entregable; no avances a RSI o Sistema B.
```

## Estado encontrado antes del siguiente incremento

La primera iteración ya tiene una página para seleccionar y analizar cuatro expedientes, una ruta `POST /api/cases/analyze`, KYC y Verification implementados con OpenAI Agents SDK, herramientas sintéticas y una respuesta etiquetada como real solo tras completar ambas llamadas. La interfaz muestra modo, hallazgos, evidencia y trazas.

Todavía no hay OCR ni archivos de documentos en los fixtures. `src/server/core.ts` mantiene Learning y Workflow como simulaciones: no hay evaluador OCR, aprendizaje persistente aceptado ni un Builder que genere e instancie un sistema sucesor. Los contratos de Learning y Workflow aún no cubren ese ciclo. Por eso, los siguientes prompts avanzan primero con documentos y OCR; no vuelven a pedir rehacer la primera pantalla o el flujo KYC → Verification.

La última llamada de API registrada devolvió `429 credit_balance_exhausted`. Los prompts permiten avanzar con fixtures y evaluación local, pero exigen separar eso de una llamada OCR real y dejarla pendiente hasta que el acceso API funcione.

## Prompt 3 — Acordar y congelar contratos del incremento OCR

```text
Lee README.md, AGENTS.md, CONTRACTS.md, IMPLEMENTATION_PLAN.md, README_REGLAS_NEGOCIO_VERSIONES.md y este README. Inspecciona el código actual antes de proponer cambios.

OBJETIVO
Preparar el siguiente incremento: documentos sintéticos con OCR verificable para el flujo de apertura de cuenta. No rehagas lo que ya existe. En este paso todavía no implementes OCR.

ENTREGABLES
- Propuesta de contratos Zod/TypeScript para el documento sintético, extracción por campo con evidencia y resultado de evaluación contra ground truth independiente.
- Esquema de testcase que separe datos esperados del archivo/documento que verá el agente.
- Decisión de cómo transportar un documento sintético pequeño al agente usando la versión instalada de OpenAI Agents SDK. Verifica la documentación actual del SDK antes de elegir la API.
- Definición de estados para campo ausente, ilegible, contradictorio y extraído; nunca inferir un campo que no aparece.
- Lista de cambios por archivo, criterios de aceptación y riesgos/costo del uso de imágenes.

RESTRICCIONES
- Solo lectura: no modifiques archivos.
- Ground truth lo fija el testcase, nunca la salida del modelo.
- Usar únicamente documentos ficticios marcados “SINTÉTICO — SIN VALIDEZ OFICIAL”; no usar plantillas oficiales, logos ni personas reales.
- No afirmar que el API funciona: la última llamada devolvió `429 credit_balance_exhausted`.
- Mantener revisión humana y todas las reglas financieras invariantes.

CIERRE
Entrega una propuesta concreta y breve para revisión conjunta. No continúes a implementación.
```

Revisen la propuesta entre ambas personas y congelen `src/contracts` antes de dividir el trabajo.

## Prompt 4 — Persona backend: documentos sintéticos, OCR y evaluación

```text
Implementa solo el incremento OCR aprobado en el Prompt 3. Antes de editar, vuelve a inspeccionar el estado real y no repitas tareas ya realizadas.

ALCANCE
- Mantén KYC → Verification existente.
- Crea un conjunto pequeño de testcases sintéticos con ground truth independiente, separado por discovery, validation y holdout.
- Prepara un conjunto pequeño de testcases ficticios. OpenAI puede proponer escenarios y generar la apariencia visual de documentos sintéticos, pero primero fija y valida los valores esperados en fixtures independientes. El agente OCR recibe solo el artefacto, nunca el ground truth. Si la API no responde, conserva fixtures locales y registra el bloqueo.
- Implementa OCR como extracción estructurada con Zod: documento, campo, valor, página/evidencia y estado (extraído, ausente, ilegible o contradictorio). No adivines valores ausentes.
- Añade evaluador independiente que compare extracción con ground truth y mida exactitud por campo, omisiones y falsos positivos.
- Registra hash del artefacto, testcase/suite, modelo/modo, extracción, resultado y trazas sin guardar secretos.
- Conecta la extracción validada con KYC/Verification solo después de probarla de forma aislada.

RESTRICCIONES
- Modifica backend, fixtures y pruebas; no edites UI.
- Respeta los contratos congelados; si falta algo, detente y solicita acuerdo antes de cambiarlo.
- Documentos marcados “SINTÉTICO — SIN VALIDEZ OFICIAL”; no imites formatos oficiales.
- No consultes servicios reales ni tomes decisiones crediticias.
- Una simulación local no cuenta como ejecución real del modelo. Registra con precisión si API falló por saldo/configuración.

VERIFICACIÓN
- Ejecuta pruebas pertinentes y build; reporta comandos y resultados exactos.
- Presenta un caso en que la extracción coincide y uno con error/ambigüedad si el fixture lo permite. No fuerces una mejora.
- Detente al completar el OCR aislado e integrado; no implementes Reflection ni Builder todavía.
```

## Prompt 5 — Persona frontend: documentos y evidencia OCR

```text
Implementa la UI del incremento OCR usando únicamente los contratos ya congelados y la API acordada con backend. Revisa primero el estado real; la vista inicial de expedientes y análisis KYC → Verification ya existe.

ENTREGABLES
- En el expediente, mostrar los documentos sintéticos disponibles y permitir seleccionar uno para inspección.
- Mostrar extracción OCR por campo junto a su evidencia y página; distinguir extraído, ausente, ilegible y contradictorio.
- Mostrar el resultado de evaluación como comparación contra testcase solo en la vista de evaluación, nunca como contexto que se envía al agente.
- Estados de carga/error y etiqueta clara de ejecución real frente a fixture/simulación.
- Aviso de datos sintéticos y revisión humana.

LÍMITES
- Modifica solo `src/app` fuera de `src/app/api` y `src/components`.
- No cambies contratos, fixtures o lógica de servidor.
- No inventes texto reconocido, confianza, métricas ni documentos.
- Si falta endpoint o campo de contrato, documenta la dependencia y coordina con backend; no simules una respuesta real.

CIERRE
- Ejecuta build si las dependencias están disponibles.
- Resume archivos y verificaciones reales; detente al terminar esta UI.
```

## Prompt 6 — Integración OCR y cierre del incremento

```text
Integra el incremento OCR de SRI Finance. Lee el diff de ambas personas, los contratos y README_REGLAS_NEGOCIO_VERSIONES.md. No agregues alcance nuevo.

COMPRUEBA
1. Ground truth está definido antes e independientemente de cada salida OCR.
2. Los documentos están identificados como sintéticos y no imitan documentos oficiales.
3. El agente solo reporta extracción con evidencia y no inventa campos ausentes.
4. El evaluador calcula resultados con las expectativas del testcase, no con la salida del modelo.
5. Discovery, validation y holdout son conjuntos separados.
6. La UI etiqueta con precisión llamadas reales, resultados locales y errores de API.
7. KYC/Verification solo consumen extracción validada; decisiones finales siguen con revisión humana.

Ejecuta las pruebas y build pertinentes. Si hay acceso API, ejecuta al menos un OCR real y registra la traza sin datos sensibles. Si no, deja claro que la evidencia es local y que la llamada real sigue pendiente. Corrige defectos del incremento, registra la versión con SQLite y actualiza README_REGLAS_NEGOCIO_VERSIONES.md con solo lo implementado y comprobado. No afirmes mejora si los resultados no la muestran. Entrega archivos cambiados, verificaciones y pendientes.
```

Después de revisar el incremento OCR, continúen con los hitos de Reflection/memoria y Builder/Sistema B de `IMPLEMENTATION_PLAN.md`. Congelen los contratos correspondientes antes de abrir trabajo paralelo para esos hitos.

## Integración de la primera iteración

Cuando ambos terminen, revisen juntos:

1. El frontend consume el contrato existente sin cambios incompatibles.
2. El caso sintético elegido devuelve hallazgos y trazas válidas.
3. El modo real solo aparece después de llamadas reales al SDK; la simulación conserva su etiqueta.
4. Falta de API key se entiende como bloqueo de ejecución real y no como fallo oculto.
5. No hay aprobación/rechazo crediticio ni verificaciones oficiales.

Esta lista mantiene separada la primera iteración ya existente de los siguientes incrementos. Al completar OCR, agreguen prompts de Reflection/memoria y Builder/Sistema B a partir de la evidencia y contratos reales de esa etapa; no los implementen antes.
