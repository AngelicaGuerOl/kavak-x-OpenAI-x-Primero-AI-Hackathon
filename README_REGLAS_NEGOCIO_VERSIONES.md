# SRI Finance — reglas de negocio por versión

Este documento separa las reglas que realmente están en cada snapshot de las reglas propuestas para las siguientes iteraciones. La numeración `vNNN` identifica snapshots del repositorio (lógica, harness, skills y casos); `G0`, `G1` y `G2` identifica generaciones del sistema financiero que produce Builder. No son la misma versión.

El historial técnico está en `rsi/history.sqlite`; los snapshots inmutables están en `rsi/versions/`. No interpretar una regla propuesta como resultado ya demostrado.

## Reglas invariantes para todas las versiones

Estas reglas no las puede cambiar Reflection, una skill ni un workflow generado:

1. Usar datos y documentos sintéticos en pruebas y demos.
2. No aprobar ni rechazar créditos. Los estados solo describen información pendiente, necesidad de revisión o preparación para revisión humana.
3. No consultar bancos, SAT, INE, CURP/RFC oficiales ni Buró reales en el MVP.
4. No usar demografía sensible ni ubicación como proxy de elegibilidad.
5. El consentimiento es obligatorio para cualquier herramienta simulada que represente una consulta crediticia.
6. Ejecutar únicamente herramientas incluidas en el catálogo aprobado; no ejecutar código arbitrario generado por IA.
7. Conservar evidencia, modo de ejecución, testcases y trazas; marcar si una ejecución fue con LLM o determinista.
8. No aceptar una lección por su explicación: debe corregir un fallo observado en casos distintos y preservar las invariantes.

## Snapshots existentes

### v001 — baseline de KYC/Verification y harness inicial

**Estado:** snapshot existente en `rsi/versions/v001/`.

**Reglas de negocio implementadas:**

- Caso sintético con RFC de solicitud, RFC fiscal, fecha de vigencia de identidad, presencia de domicilio y lista de tipos documentales.
- `ADDRESS_MISSING` si no hay comprobante de domicilio.
- `RFC_MISMATCH` si el RFC de solicitud difiere del RFC fiscal sintético.
- `INE_EXPIRED` si la fecha de vigencia es anterior a la fecha actual.
- Falta de domicilio produce `PENDING_INFORMATION`; otros hallazgos producen `REQUIRES_REVIEW`; sin hallazgos, `READY_FOR_HUMAN_REVIEW`.
- Ningún estado equivale a aprobación o rechazo financiero.
- KYC Agent usa `list_synthetic_documents`; Verification Agent usa `compare_synthetic_case_fields`. La comparación es simulada y no consulta un registro oficial.
- El endpoint real intenta usar OpenAI Agents SDK; si la llamada falla, el resultado no se presenta como ejecución exitosa del agente.

**Lo que aún no implementaba:** OCR, procesamiento de archivos, fixtures de documentos por separado, evaluador de dominio independiente completo, memoria RSI aceptada, AgentSystemDefinition generado y sucesor ejecutado.

**Resultado de pruebas registrado:** seis assertions pasaron y dos suites archivadas fallaron porque Vitest intentó cargar pruebas copiadas dentro de `rsi/versions/`. Esas fueron fallas del harness, no fallas de negocio financiera. SQLite conserva el error.

### v002 — aislamiento del harness de snapshots

**Cambio respecto a v001:** Vitest quedó limitado a `tests/**/*.test.ts`, evitando ejecutar las copias archivadas de versiones anteriores. El script de historial ahora conserva fallos de import/setup por testcase.

**Reglas de negocio:** iguales a v001; no se cambió el comportamiento de KYC/Verification.

**Resultado de validación registrado:** seis pruebas activas pasaron, cero fallaron. La corrección aceptada fue del harness, no una mejora medida de detección financiera.

### v003 — roles, skills y protocolo de sucesión

Snapshot del contexto de desarrollo; no representa un sucesor financiero ejecutado.

### Evaluación independiente del Sistema A — snapshots importados v006 y v007

Fixtures separados, fecha de corte explícita, herramientas vinculadas al caso del servidor,
evaluador por caso y persistencia en SQLite. El snapshot importado v007 documenta la carga explícita del entorno
para pruebas reales. La evaluación local registrada pasa 10 de 13 casos; los fallos de
presencia documental permanecen como evidencia, sin lección financiera aceptada.

### Incremento documental actual — generación y acceso API comprobados

- La clave autentica y una llamada Responses con `gpt-6-luna` terminó correctamente.
- KYC y Verification completaron un caso real mediante Agents SDK; evidencia en el
  run `8621a201-3b09-492d-bab5-007916d77e76` de v007. No implica evaluación real de toda la suite.
- El modelo predeterminado anterior no estaba disponible. `.env.local` ahora configura
  `OPENAI_DEFAULT_MODEL=gpt-6-luna`; no se versiona ese archivo ni su clave.
- Seis expedientes documentales sintéticos, 24 páginas PDF y 24 PNGs. Escenarios:
  completo, RFC contradictorio, vigencia vencida, domicilio ausente, ingreso sin dato
  e ingresos contradictorios. Discovery, validation y holdout tienen IDs distintos.
- Inputs y oráculos independientes registrados antes de renderizar. Texto visible
  validado con pdftotext e inspección visual de todas las páginas.
- Diseño original y marca visible SINTÉTICO — SIN VALIDEZ OFICIAL en cada página;
  nombres inventados e identificadores DEMO inválidos para trámites oficiales.
- OpenAI eligió únicamente color/layout de una lista cerrada. El render PDF/PNG fue
  local y determinista; no se ejecutó código generado por el modelo.
- Hashes, páginas, generador, suites y expectativas conservados en manifest y tabla
  SQLite `synthetic_document_artifacts`. Los bytes se archivan con los fixtures.
- **Pendiente:** agente OCR, exactitud por campo, casos ilegibles, integración de
  extracción con KYC, Reflection, memoria y Builder. Verificar texto PDF no es OCR.

## Especificación de documentos y OCR

La generación documental descrita arriba ya existe. Las reglas de extracción y evaluación
OCR que siguen son requisitos del próximo incremento; no resultados demostrados.

### Generación de documentos sintéticos

- Crear primero un testcase estructurado con valores de referencia (`ground truth`) deterministas, por ejemplo campos presentes, campos faltantes, contradicciones, vigencias y calidad de imagen.
- Usar el modelo de OpenAI para generar variaciones visuales/layout basadas en esos valores fijos. El modelo no inventa el `ground truth` ni define el resultado esperado.
- Marcar cada artefacto de forma visible como **SINTÉTICO — SIN VALIDEZ OFICIAL**. No copiar logos oficiales, plantillas de documentos gubernamentales ni datos de personas reales.
- Verificar automáticamente que el texto visible generado corresponda con el testcase. Si no coincide, descartar el artefacto o registrarlo como caso de OCR corrupto; nunca corregir silenciosamente su expectativa.
- Guardar ID de caso, hash del archivo, formato/página, campos esperados y versión del generador en SQLite.

### Reglas del OCR

- El agente OCR extrae campos visibles; no decide autenticidad, elegibilidad ni aprobación.
- Salida estructurada por documento/campo: `documentType`, `fieldName`, `value`, `page`, `evidenceText` y `confidence` si el modelo lo devuelve.
- Cada valor debe apuntar al documento/página que lo originó. Un dato ausente se informa como ausente, no se adivina.
- `confidence` es una señal orientativa no calibrada, no una prueba. Contradicciones, ilegibilidad o baja certeza llevan a aclaración/revisión humana.
- Verification compara la extracción OCR con el resto del expediente y con la verdad de referencia solo en el evaluador; no debe recibir las respuestas esperadas como contexto de producción.
- El evaluador mide exactitud por campo, documentos faltantes/vencidos detectados, contradicciones detectadas y falsos positivos. Los casos de descubrimiento, validación y holdout permanecen separados.

La OpenAI Responses API acepta imágenes para análisis visual y PDFs como archivos; en PDFs, los modelos con visión procesan texto y páginas visuales. La imagen/PDF añade tokens de entrada y costo de API, por lo que hay que medir tamaño, detalle y gasto en el conjunto sintético antes de ampliar casos. Ver [guía oficial de imágenes y visión](https://developers.openai.com/api/docs/guides/images-vision) y [guía oficial de archivos](https://developers.openai.com/api/docs/guides/file-inputs).

## Generaciones financieras propuestas

### G0 — Apertura de cuenta

KYC y Verification revisan documentos sintéticos y producen observaciones con evidencia. El evaluador debe descubrir fallas reales; candidatos como una contradicción omitida o documento ilegible son hipótesis, no fallos garantizados.

### G1 — Preparación de financiamiento automotriz

Builder genera un `AgentSystemDefinition` validado con los agentes, objetivos, instrucciones, herramientas aprobadas y workflow. G1 hereda únicamente lecciones aceptadas de G0, se ejecuta con revisión humana y se evalúa en los mismos casos semánticos acordados para la comparación.

### G2 — Preparación de solicitud de tarjeta (stretch)

Solo se construye si G1 produce un fallo real, Reflection lo convierte en una lección validada y hay tiempo. Debe heredar las lecciones anteriores aprobadas; no se fabrica un segundo error para completar la narrativa.

## Qué registrar en cada testcase y ejecución

- Versión snapshot (`vNNN`) y generación de producto (`G0`, `G1`, `G2`).
- ID/suite (`discovery`, `validation`, `holdout`) y expectativa independiente.
- Hash del documento, campos esperados y salida OCR extraída.
- Salida del agente y resultado real de cada herramienta ejecutada.
- Resultado por campo/caso, causa del fallo, modelo/mode y versiones de prompt/skill/policy.
- Lección propuesta, cambio ejecutable, suite de validación, decisión aceptada/rechazada y razón.
- Definición generada, generación padre, memoria heredada y comparación de resultados sobre los mismos casos.

## Cómo registrar una nueva versión

Después de implementar y revisar un incremento, crea un snapshot y registra la suite que realmente ejecutaste. El comando `test` de este script ejecuta Vitest; todavía no ejecuta OCR ni una evaluación de documentos. No registres `real` si no hubo una llamada exitosa al modelo.

```bash
python3 scripts/rsi_history.py snapshot --summary "Describe business-rule, OCR, harness, or skill change"
python3 scripts/rsi_history.py test --version vNNN --suite unit --mode offline
python3 scripts/rsi_history.py history
```

Sustituye `vNNN` por el snapshot recién creado. Registra expectations antes de correr la suite y enlaza cualquier mejora con el run de validación. Usa `real` solo si se hizo una llamada real al modelo; usa `simulation` u `offline` para los otros modos.
