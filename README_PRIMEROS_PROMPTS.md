# SRI Finance — primeros prompts de trabajo

Este archivo contiene únicamente los prompts para iniciar la primera iteración con dos personas. El producto completo y sus objetivos están en [README.md](README.md); el orden de hitos y criterios está en [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

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

## Integración de esta primera iteración

Cuando ambos terminen, revisen juntos:

1. El frontend consume el contrato existente sin cambios incompatibles.
2. El caso sintético elegido devuelve hallazgos y trazas válidas.
3. El modo real solo aparece después de llamadas reales al SDK; la simulación conserva su etiqueta.
4. Falta de API key se entiende como bloqueo de ejecución real y no como fallo oculto.
5. No hay aprobación/rechazo crediticio ni verificaciones oficiales.

Después de esta revisión se define el siguiente incremento (por ejemplo, fixtures y evaluación independiente). Este archivo no pretende reemplazar los prompts de hitos posteriores.
