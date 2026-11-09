---
name: rsi-evaluation
description: Evalúa el ciclo RSI de SRI Finance cuando se implementan o revisan aprendizaje, memoria, generación de workflows o comparación del Sistema B.
---

# Evaluación RSI de SRI Finance

Usa esta skill para construir o verificar evidencia de automejora; no para cambios de UI sin efecto en el experimento. Lee `CONTRACTS.md` y los contratos correspondientes antes de modificar las rutas o sus consumidores.

1. Ejecuta el Sistema A sobre fixtures sintéticos con expectativas escritas independientemente de la salida de los agentes. Conserva IDs, resultados y trazas.
2. Entrega a Reflection fallos observados. La propuesta debe nombrar el fallo, el cambio de estrategia y los casos que lo motivan.
3. Valida cada propuesta en casos distintos de los usados para descubrir el fallo. Registra resultados antes y después. Acepta la propuesta solo si corrige el fallo sin romper los controles invariantes; de otro modo consérvala como rechazada.
4. Versiona la memoria aceptada. Builder genera un workflow base y otro con esa memoria. Ambos deben ser JSON validado, con IDs de herramientas del catálogo aprobado. El motor debe imponer consentimiento y demás controles críticos incluso si el workflow los omite.
5. Ejecuta ambos workflows sobre exactamente la misma suite reservada del Sistema B. Calcula métricas desde resultados de ejecución, conserva resultados por caso y muestra diferencias sin atribuirlas a capacidades no probadas.

La evidencia mínima de la demo incluye versión de memoria, versiones de workflows, conjuntos de casos, resultados por caso, métricas y trazas. Si no hay acceso a OpenAI, se puede probar el motor con fixtures deterministas, pero se debe identificar esa ejecución como simulación del flujo y dejar la ejecución real de agentes como pendiente.
