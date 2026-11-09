# SRI Finance — Self-Improving Financial Intelligence

**Proyecto:** Kavak × OpenAI × Primero AI RSI Hackathon  
**Categoría:** Inteligencia artificial multiagente, automatización financiera y Recursive Self-Improvement (RSI).

## 1. Descripción general

SRI Finance es una plataforma multiagente de inteligencia artificial diseñada para transformar la manera en que las instituciones financieras gestionan solicitudes de clientes, verifican información, investigan inconsistencias y preparan procesos de contratación de productos financieros.

El sistema permitirá que diferentes agentes especializados trabajen de forma coordinada para analizar el expediente de una persona que solicita abrir una cuenta bancaria, revisar su documentación y detectar posibles problemas relacionados con identidad, información fiscal, comprobantes de ingresos, domicilio y requisitos administrativos.

También podrá analizar solicitudes previamente rechazadas, siempre que se disponga del motivo documentado del rechazo, para identificar qué problemas pueden corregirse, cuáles requieren una revisión adicional y qué pasos debería seguir el cliente.

Una vez analizada la solicitud, SRI Finance ofrecerá orientación informativa sobre productos como tarjetas de crédito, créditos personales, financiamiento automotriz y alternativas de vivienda, tomando en consideración las necesidades declaradas por el cliente y los requisitos públicos de cada producto.

El sistema no aprobará ni rechazará créditos automáticamente. Las decisiones financieras corresponderán a las instituciones y profesionales autorizados.

La innovación principal es que **SRI Finance no solamente ejecutará procesos: aprenderá de sus resultados y utilizará sus experiencias para construir nuevos procesos financieros**.

## 2. Problema que buscamos resolver

Actualmente, los procesos financieros pueden involucrar diferentes documentos, verificaciones, políticas, sistemas y áreas responsables.

Una solicitud puede presentar dificultades como:

- Documentación incompleta, vencida o inconsistente.
- Diferencias entre RFC, identificación, datos fiscales y solicitud.
- Comprobantes de ingresos contradictorios.
- Falta de autorizaciones para verificaciones específicas.
- Motivos de rechazo difíciles de comprender para el cliente.
- Procesos repetitivos que requieren intervención de varias áreas.
- Oportunidades de orientación financiera que no se identifican durante la atención.
- Errores operativos que vuelven a presentarse en solicitudes posteriores.

Los sistemas tradicionales pueden ejecutar reglas predefinidas, pero normalmente necesitan intervención de desarrolladores y especialistas para incorporar nuevos procesos y corregir problemas recurrentes.

SRI Finance busca investigar una alternativa: **un sistema capaz de evaluar su propio funcionamiento, aprender de los errores y mejorar la generación de futuros procesos, bajo controles verificables**.

## 3. Funcionamiento del sistema multiagente

La plataforma estará formada por agentes especializados que colaborarán sobre un expediente financiero compartido.

### Agente 1 — Onboarding & Identity Agent

Recibe la solicitud de apertura de cuenta y analiza la información disponible.

Identifica documentos requeridos, revisa campos de identificación y determina qué verificaciones deben ejecutarse.

Puede analizar INE, CURP, RFC, comprobantes de domicilio y formularios, utilizando datos estructurados y servicios simulados durante el hackathon.

### Agente 2 — Financial & Fiscal Agent

Organiza la información fiscal y financiera del solicitante.

Examina la consistencia entre ingresos declarados y comprobantes, identifica documentos faltantes y prepara observaciones para revisión.

No interpreta por sí solo esos datos como una autorización para conceder crédito.

### Agente 3 — Verification & Compliance Agent

Contrasta las conclusiones de los agentes anteriores con la evidencia disponible.

Utiliza herramientas autorizadas para verificar consistencia documental, requisitos configurados y existencia de autorizaciones.

Cuando encuentra contradicciones o información insuficiente, solicita aclaraciones o deriva el expediente a revisión humana.

### Agente 4 — Financial Opportunity Agent

Ayuda al cliente a explorar productos financieros según sus necesidades expresadas.

Puede presentar información de tarjetas, crédito personal, crédito automotriz y vivienda, así como requisitos generales, documentación pendiente y próximos pasos.

La ubicación podrá utilizarse para localizar sucursales o servicios disponibles, pero no para determinar solvencia crediticia. Las características demográficas sensibles no se utilizarán para aprobar, rechazar ni personalizar condiciones de crédito.

### Agente 5 — Reflection & Learning Agent

Analiza las ejecuciones de los otros agentes y recibe los errores identificados por un evaluador independiente.

Investiga por qué ocurrió cada fallo y propone mejoras a las instrucciones, herramientas, estrategias de verificación o generación de pruebas.

Cada propuesta se valida antes de incorporarse a la memoria persistente del sistema.

### Agente 6 — Workflow Builder Agent

Utiliza los aprendizajes verificados para construir nuevos procesos financieros.

Por ejemplo, después de aprender de los errores del proceso de apertura de cuentas, podrá generar un workflow diferente para preparar solicitudes de financiamiento automotriz.

El nuevo proceso contendrá verificaciones, dependencias, herramientas autorizadas, reglas de escalamiento y pruebas automáticas.

## 4. Recursive Self-Improvement

El componente más importante del proyecto será su motor de automejora.

SRI Finance funcionará mediante un ciclo:

**Ejecutar → Evaluar → Identificar errores → Reflexionar → Proponer mejoras → Probar → Aprender → Construir un nuevo sistema.**

El aprendizaje tendrá dos niveles.

**Primer nivel: mejora de la ejecución.**

Los agentes detectan errores, proponen correcciones y comprueban que las verificaciones funcionan mejor.

**Segundo nivel: mejora de la construcción de sistemas.**

El sistema identifica deficiencias en su propia estrategia de trabajo y modifica, tras validarlas, las instrucciones o políticas que utiliza para construir futuros procesos.

Por ejemplo, si descubre que un verificador no compara información entre documentos relacionados, podrá proponer una estrategia general de comprobaciones cruzadas y generación de pruebas negativas.

Posteriormente, Workflow Builder utilizará esa estrategia para construir un proceso distinto.

Las mejoras se conservarán únicamente cuando superen las evaluaciones. Los criterios financieros y controles obligatorios no podrán modificarse autónomamente.

## 5. Demostración del hackathon

La demostración utilizará dos sistemas financieros relacionados, pero diferentes.

**Sistema A: revisión de apertura de cuenta.**

Los agentes reciben expedientes bancarios ficticios, ejecutan verificaciones, identifican inconsistencias y producen un diagnóstico con evidencias.

Un evaluador independiente descubre fallos reales en las ejecuciones. Reflection analiza esos fallos y genera propuestas de mejora verificables.

**Sistema B: preparación de financiamiento automotriz.**

Workflow Builder recibe los requisitos de un nuevo proceso de financiamiento y utiliza el conocimiento obtenido del Sistema A para construir un workflow ejecutable.

Se generan dos versiones del Sistema B:

- Una sin los aprendizajes anteriores.
- Otra con los aprendizajes verificados.

Ambas se prueban mediante los mismos escenarios independientes.

Los resultados permitirán observar qué cambió, qué nuevas comprobaciones se incorporaron y si el aprendizaje mejoró el desempeño.

## 6. Arquitectura tecnológica

El proyecto utilizará:

- **Next.js y React:** interfaz para solicitudes, expedientes, agentes y resultados.
- **TypeScript y Node.js:** lógica de negocio, coordinación y ejecución de workflows.
- **OpenAI Agents SDK:** implementación de agentes especializados con herramientas.
- **Zod:** contratos y validación de respuestas estructuradas.
- **Vitest:** pruebas de regresión y evaluación de mejoras.
- **JSON:** expedientes sintéticos, memoria de aprendizaje y procesos generados.
- **Codex:** apoyo para planificación, desarrollo, revisión y pruebas.

Los agentes se comunicarán mediante resultados estructurados y serán coordinados por un orquestador.

Un catálogo controlado de herramientas permitirá ejecutar verificaciones y modificar estados dentro del simulador.

## 7. Datos y evaluación

Para el prototipo utilizaremos expedientes completamente sintéticos y servicios financieros simulados.

Podremos complementar las pruebas con datasets públicos de solicitudes bancarias y comportamiento crediticio, dejando claro qué campos contienen realmente y qué información es inventada para los escenarios.

Las verificaciones de INE, RFC, CURP, Buró de Crédito y situación fiscal no se presentarán como consultas oficiales.

Las pruebas medirán:

- Detección correcta de inconsistencias.
- Identificación de información faltante.
- Ejecución correcta de los pasos del workflow.
- Prevención de operaciones duplicadas.
- Cumplimiento de controles obligatorios.
- Transferencia de aprendizajes al nuevo sistema.
- Diferencia de resultados entre versiones con y sin memoria.

## 8. Alcance del MVP

El hackathon tendrá una duración de cinco horas de desarrollo para dos participantes.

La primera versión se enfocará en:

1. Revisión multiagente de expedientes ficticios de apertura de cuenta.
2. Verificaciones mediante herramientas simuladas.
3. Registro de decisiones, hallazgos y trazas de ejecución.
4. Detección de errores por pruebas automáticas.
5. Aprendizaje persistente mediante Reflection.
6. Construcción de un proceso diferente de financiamiento automotriz.
7. Comparación objetiva con y sin aprendizaje.
8. Dashboard para visualizar la evolución del sistema.

Las integraciones bancarias reales, el reconocimiento documental avanzado y la evaluación crediticia institucional quedarán fuera del MVP.

## 9. Propuesta de valor

SRI Finance explora cómo transformar sistemas financieros tradicionales, basados en procesos rígidos, en plataformas asistidas por agentes que puedan mejorar sus procedimientos a partir de experiencias verificables.

El objetivo no es reemplazar a los especialistas financieros ni automatizar decisiones de crédito sensibles.

El objetivo es **reducir errores de proceso, explicar incidencias, mejorar verificaciones y demostrar que los agentes pueden utilizar experiencias anteriores para construir nuevos sistemas de manera progresivamente más confiable**.

## 10. Pitch

"SRI Finance es una plataforma multiagente que transforma los procesos de atención y revisión bancaria. Sus agentes colaboran para verificar expedientes, investigar inconsistencias y orientar a los clientes. Pero lo más importante es que el sistema aprende de sus propios errores, mejora la manera en que construye procesos y utiliza esa experiencia para generar nuevas soluciones financieras. No solo desarrollamos agentes que ejecutan tareas: desarrollamos agentes que aprenden a construir mejores sistemas."

