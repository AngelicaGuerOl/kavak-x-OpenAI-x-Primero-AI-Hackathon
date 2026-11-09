'use client';

import { useState } from 'react';
import type { ApiError, GenerateWorkflowResponse, LearningRunResponse } from '@/contracts/api';
import type { AgentTraceEntry } from '@/contracts/case';
import type { EvaluationMetric } from '@/contracts/agent-result';
import type { WorkflowEvaluation } from '@/contracts/workflow';
import './learning-workflow.css';

type Section = 'learning' | 'workflow';

async function postRun<T extends object>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: T | ApiError = await response.json();
  if (!response.ok) {
    throw new Error('error' in data ? data.error.message : 'No se pudo completar la ejecución.');
  }
  return data as T;
}

function Metric({ value }: { value: EvaluationMetric }) {
  return <div className="lw-metric">
    <strong>{value.total > 0 ? `${value.passed}/${value.total}` : 'Pendiente'}</strong>
    <span>{value.total > 0 ? 'casos que cumplieron la expectativa' : 'No hay casos evaluados en esta suite'}</span>
  </div>;
}

function Trace({ entries }: { entries: AgentTraceEntry[] }) {
  return <section className="lw-section" aria-label="Traza de ejecución">
    <h3>Traza registrada</h3>
    {entries.length ? <ol className="lw-list">{entries.map((entry, index) => <li key={`${entry.timestamp}-${index}`}>
      <small>{entry.agent} · <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString('es-MX')}</time></small>
      <strong>{entry.action}</strong><p>{entry.result}</p>
      {entry.toolId && <p>Herramienta: {entry.toolId}</p>}
    </li>)}</ol> : <p className="lw-muted">No se registraron acciones.</p>}
  </section>;
}

function Learning() {
  const [result, setResult] = useState<LearningRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true); setError(''); setResult(null);
    try {
      setResult(await postRun<LearningRunResponse>('/api/learning/run', { suiteId: 'onboarding-v1' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.');
    } finally { setLoading(false); }
  }

  return <div className="lw-panel">
    <div className="lw-heading"><div><p className="lw-kicker">02 / Aprendizaje</p><h2>Evaluación del Sistema A</h2><p>Contrasta el análisis con expectativas independientes de expedientes sintéticos.</p></div><button type="button" onClick={run} disabled={loading} className="lw-button">{loading ? 'Evaluando…' : result ? 'Volver a evaluar' : 'Ejecutar evaluación'}</button></div>
    {loading && <p className="lw-notice" role="status">Evaluando la suite onboarding-v1…</p>}
    {error && <p className="lw-error" role="alert">{error}</p>}
    {!result && !loading && !error && <p className="lw-notice">Aún no se ejecutó esta evaluación. Las métricas aparecerán después de recibir una respuesta del servidor.</p>}
    {result && <div className="lw-results">
      <p className="lw-mode">Ejecución simulada · Suite {result.suiteId} · ID {result.runId}</p>
      <section className="lw-section"><h3>Resultado base</h3><Metric value={result.baseline} />
        {result.failures.length ? <ul className="lw-list">{result.failures.map(failure => <li key={failure.caseId}><strong>{failure.caseId}</strong><p>{failure.explanation}</p><p>Esperado: {failure.expectedCodes.join(', ') || 'sin hallazgos'} · Obtenido: {failure.actualCodes.join(', ') || 'sin hallazgos'}</p></li>)}</ul> : <p className="lw-muted">No se observaron diferencias en los casos evaluados.</p>}
      </section>
      <section className="lw-section"><h3>Propuestas y memoria</h3><p className="lw-muted">Memoria activa: {result.activeMemoryVersion === 'none' ? 'ninguna' : result.activeMemoryVersion}</p>
        {result.proposals.length ? <ul className="lw-list">{result.proposals.map(proposal => <li key={proposal.id}><small>{proposal.status === 'ACCEPTED' ? 'Aceptada' : 'Rechazada'} · versión {proposal.version}</small><strong>{proposal.rule}</strong><p>Fallos de origen: {proposal.sourceFailureIds.join(', ') || 'no registrados'}</p><Metric value={proposal.validation} /></li>)}</ul> : <p className="lw-notice">No se registraron propuestas. No hay aprendizaje aceptado que aplicar.</p>}
      </section>
      <Trace entries={result.agentTrace} />
    </div>}
  </div>;
}

function WorkflowCard({ title, evaluation }: { title: string; evaluation: WorkflowEvaluation }) {
  const { workflow, metric, caseResults } = evaluation;
  return <section className="lw-workflow-card"><p className="lw-kicker">{title}</p><h3>{workflow.title}</h3><p className="lw-muted">Workflow {workflow.id} · versión {workflow.version} · memoria {workflow.memoryVersion ?? 'ninguna'}</p><Metric value={metric} />
    <h4>Pasos aprobados</h4><ol className="lw-steps">{workflow.steps.map(step => <li key={step.id}><strong>{step.toolId}</strong><span>{step.description}</span></li>)}</ol>
    <h4>Resultados por caso</h4>{caseResults.length ? <ul className="lw-list">{caseResults.map(item => <li key={item.caseId}><strong>{item.caseId}</strong><p>Códigos: {item.findingCodes.join(', ') || 'sin hallazgos'}</p>{item.findings.map((finding, index) => <p key={`${finding.code}-${index}`}>{finding.message} · Evidencia: {finding.evidence.join(', ') || 'no especificada'} · Fuentes: {finding.sourceIds.join(', ') || 'no especificadas'}</p>)}</li>)}</ul> : <p className="lw-muted">No hay resultados por caso registrados.</p>}
  </section>;
}

function Workflow() {
  const [result, setResult] = useState<GenerateWorkflowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true); setError(''); setResult(null);
    try {
      setResult(await postRun<GenerateWorkflowResponse>('/api/workflows/generate', { suiteId: 'auto-financing-v1' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.');
    } finally { setLoading(false); }
  }

  return <div className="lw-panel">
    <div className="lw-heading"><div><p className="lw-kicker">03 / Proceso sucesor</p><h2>Preparación de financiamiento automotriz</h2><p>Inspecciona las definiciones y la evaluación que entregue el servidor.</p></div><button type="button" onClick={run} disabled={loading} className="lw-button">{loading ? 'Generando…' : result ? 'Volver a generar' : 'Generar procesos'}</button></div>
    {loading && <p className="lw-notice" role="status">Solicitando workflows para auto-financing-v1…</p>}
    {error && <p className="lw-error" role="alert">{error}</p>}
    {!result && !loading && !error && <p className="lw-notice">Aún no se generaron procesos. La comparación aparecerá cuando el servidor entregue resultados evaluados.</p>}
    {result && <div className="lw-results"><p className="lw-mode">Ejecución simulada · Suite {result.suiteId} · ID {result.runId}</p>
      {result.learned.workflow.memoryVersion === null && <p className="lw-notice">No hay memoria aceptada aplicada al segundo proceso. La versión aprendida sigue pendiente.</p>}
      {(result.baseline.metric.total === 0 || result.learned.metric.total === 0) && <p className="lw-notice">Comparación pendiente: la suite todavía no contiene resultados evaluados para ambos procesos.</p>}
      <div className="lw-workflows"><WorkflowCard title="Proceso base" evaluation={result.baseline} /><WorkflowCard title={result.learned.workflow.memoryVersion ? 'Proceso con memoria' : 'Segundo proceso sin memoria'} evaluation={result.learned} /></div>
      <Trace entries={result.agentTrace} />
    </div>}
  </div>;
}

export default function LearningWorkflow({ section }: { section: Section }) {
  return section === 'learning' ? <Learning /> : <Workflow />;
}
