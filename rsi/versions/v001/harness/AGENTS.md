# SRI Finance — instrucciones del proyecto

## Objetivo

Construir una demo de cinco horas para dos desarrolladores: agentes que revisan expedientes bancarios **sintéticos**, miden errores, validan un aprendizaje y lo aplican al generar un segundo proceso de preparación de financiamiento automotriz.

## Acuerdos de trabajo

- Stack objetivo: Next.js App Router, TypeScript estricto, Tailwind, OpenAI Agents SDK, Zod y Vitest. Mantener frontend y backend en un solo proyecto cuando se inicialice la app.
- Frontend: `src/app` salvo `src/app/api`, y `src/components`. Backend: `src/server`, `src/app/api`, fixtures y `tests`.
- `src/contracts` es compartido. Leer [CONTRACTS.md](CONTRACTS.md) al cambiar endpoints o consumidores; acordar cualquier cambio incompatible antes de editarlo.
- Mantener reglas del dominio fuera de componentes React. Validar entradas HTTP, salidas de agentes y definiciones de workflows en el servidor.
- Usar únicamente herramientas simuladas del catálogo cerrado. El motor debe rechazar IDs desconocidos y nunca ejecutar código generado por IA.
- Registrar trazas y resultados de evaluación reales; no presentar mocks ni métricas supuestas como ejecuciones reales.
- Proteger la clave de API: solo variables del servidor, nunca código cliente ni repositorio.

## Límites financieros

- No aprobar ni rechazar crédito automáticamente. Los estados del expediente solo indican preparación para revisión humana.
- No conectar sistemas bancarios ni Buró reales. Una consulta simulada que represente Buró requiere consentimiento explícito en el fixture.
- No usar datos demográficos protegidos ni ubicación como proxy de elegibilidad crediticia.
- Reflection puede proponer mejoras de estrategia, pero no cambiar políticas bancarias ni controles de consentimiento.

## Evidencia RSI

Al implementar o revisar el ciclo RSI, usar la skill `$rsi-evaluation`. El resultado debe mostrar: errores del Sistema A medidos contra fixtures independientes; propuesta y validación; memoria versionada solo si se acepta; Sistema B ejecutable con herramientas aprobadas; comparación con y sin memoria en los mismos casos; trazas y versiones conservadas.

## Verificación

Ejecutar los checks pertinentes al cambio. Antes de declarar lista la demo, correr `npm run build`, `npm run test` y el recorrido de los tres endpoints con casos sintéticos. Si falta configuración o acceso al modelo, reportarlo con precisión; no afirmar que hubo ejecución real.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
