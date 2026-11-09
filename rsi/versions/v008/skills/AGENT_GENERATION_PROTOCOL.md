# SRI Finance — protocolo de generaciones de agentes

Este archivo define el relevo de agentes financieros sucesores. **No activa por sí solo llamadas automáticas:** el runtime actual implementa KYC y Verification; Reflection y Builder todavía requieren implementación real.

## Dos grupos distintos

- **Agentes de Codex:** roles de desarrollo en `.codex/config.toml` (arquitectura, contratos, frontend, backend, QA/RSI y seguridad).
- **Agentes del producto:** KYC, Verification, Reflection y Workflow Builder, ejecutados por la aplicación mediante OpenAI Agents SDK.

No confundir la delegación de Codex con una ejecución del producto ni contar una como evidencia de la otra.

## Regla de sucesión

Cada especialista tendrá identidad y generación (por ejemplo `kyc-g0` y `kyc-g1`), `parentAgentId`, versión de instrucciones/política y memory IDs aceptados.

1. El agente de la generación activa procesa el caso y conserva su traza.
2. Un evaluador independiente compara la salida con ground truth y registra fallos medidos.
3. Reflection propone un cambio ejecutable; solo entra a memoria después de pasar casos de validación distintos.
4. Builder genera un sucesor a partir de la definición base y de la memoria aprobada. Zod valida la definición; el registro cerrado limita roles y herramientas.
5. El orquestador conserva la relación padre/sucesor. En una ejecución posterior, puede entregar el caso al sucesor validado y comparar ambas versiones bajo las mismas condiciones.
6. Se permite un máximo de un relevo a un sucesor por caso. El sucesor no se invoca recursivamente. Una nueva generación requiere otro ciclo de evaluación.
7. Sin lección aceptada, no se crea ni invoca una versión mejorada. El baseline sigue activo y no se atribuye mejora.

## Mapa inicial

| Especialista | Generación base | Sucesor | Estado |
|---|---|---|---|
| KYC | `kyc-g0` | `kyc-g1` | Base en código; sucesor pendiente de lección validada |
| Verification | `verification-g0` | `verification-g1` | Base en código; sucesor pendiente de lección validada |
| Reflection | `reflection-g0` | `reflection-g1` | Por implementar |
| Workflow Builder | `builder-g0` | `builder-g1` | Por implementar |

Los IDs son convenciones para futuras definiciones; no representan agentes mejorados que ya se ejecuten.

## Contrato mínimo de handoff futuro

```ts
type AgentHandoff = {
  caseId: string;
  parentRunId: string;
  parentAgentId: string;
  successorAgentId: string;
  acceptedMemoryVersion: string;
  reason: string;
  handoffDepth: 1;
};
```

Rechazar el handoff si falta memoria aceptada, la definición sucesora no fue validada, el ID no está en el catálogo, o `handoffDepth` excede `1`. El agente no puede declararse mejorado ni cambiar su código durante la ejecución.

## Configuración de Codex

Los roles viven en `.codex/config.toml` y sus instrucciones en `.codex/agents/*.toml`. Las skills viven en `.agents/skills/*/SKILL.md`. Codex carga configuración de proyecto cuando el repositorio está marcado como confiable. Revisar la configuración en una sesión nueva después de confiar o recargar el proyecto.
