'use client';

import { useState } from 'react';
import type { AnalyzeResponse, ApiError } from '@/contracts/api';
import './page.css';

const caseIds = ['case-001', 'case-002', 'case-003', 'case-004'];
const tabs = ['Estado', 'Hallazgos', 'Evidencia', 'Orientación', 'Traza'] as const;
type Tab = typeof tabs[number];
const statusLabels: Record<AnalyzeResponse['status'], string> = {
  PENDING_INFORMATION: 'Información pendiente',
  REQUIRES_REVIEW: 'Requiere revisión',
  READY_FOR_HUMAN_REVIEW: 'Listo para revisión humana',
};

export default function Home() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [tab, setTab] = useState<Tab>('Estado');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAnalysis() {
    if (!caseId) return;
    setLoading(true); setError(''); setResult(null); setTab('Estado');
    try {
      const response = await fetch('/api/cases/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId }) });
      const data: AnalyzeResponse | ApiError = await response.json();
      if (!response.ok) {
        if (response.status === 503 && 'error' in data && data.error.code === 'MODEL_UNAVAILABLE') {
          throw new Error('El modelo no está disponible. Configura OPENAI_API_KEY en el servidor y reinicia la aplicación para ejecutar KYC y Verification.');
        }
        throw new Error('error' in data ? data.error.message : 'No se pudo analizar el expediente.');
      }
      setResult(data as AnalyzeResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.');
    } finally { setLoading(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Secciones"><div className="brand">SRI<span>Finance</span></div><nav className="side-nav" aria-label="Navegación principal"><span className="nav-item active">Expedientes</span></nav><p className="sidebar-note">Demo interna · Sin decisiones de crédito automáticas</p></aside>
    <main className="main-content">
      <header className="page-header"><div><h1>Expedientes sintéticos</h1><p>Preparación para revisión humana.</p></div><div className="synthetic-note"><strong>Datos sintéticos:</strong> información generada únicamente para demostración interna.</div></header>
      <div className="workspace">
        <section className="case-panel" aria-labelledby="case-title"><h2 id="case-title">Seleccionar expediente</h2><p>Elige un expediente sintético para analizar su contenido.</p><label className="sr-only" htmlFor="case-search">Buscar expediente</label><input id="case-search" className="case-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar expediente..." /><div className="case-list">{caseIds.filter(id => id.includes(query.trim().toLowerCase())).map(id => <button key={id} type="button" className={`case-row ${caseId === id ? 'selected' : ''}`} aria-pressed={caseId === id} onClick={() => { setCaseId(id); setResult(null); setError(''); }}><span className="folder-icon" aria-hidden="true" />{id}<span className="chevron" aria-hidden="true">›</span></button>)}{caseIds.every(id => !id.includes(query.trim().toLowerCase())) && <p className="quiet">No hay expedientes con ese ID.</p>}</div></section>
        <section className="result-panel" aria-label="Resultado del análisis"><div className="result-tabs" role="tablist" aria-label="Secciones del resultado">{tabs.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'current' : ''} onClick={() => setTab(item)}>{item}</button>)}</div><div className="result-body" role="tabpanel">
          {!result ? <div className="empty-state"><div className="empty-icon" aria-hidden="true"><span className="folder-icon" /></div><h2>{caseId ? `${caseId} está listo para analizarse` : 'Selecciona un expediente y analízalo'}</h2><p>El análisis mostrará el estado, los hallazgos, la evidencia, la orientación y la traza de agentes.</p><button className="primary-button" type="button" disabled={!caseId || loading} onClick={runAnalysis}>{loading ? 'Analizando expediente…' : 'Analizar expediente'}</button>{error && <p className="error-message" role="alert">{error}</p>}</div> : <div className="analysis-content"><div className="result-heading"><div><p className="run-id">{result.caseId} · ejecución {result.runId}</p><h2>{tab}</h2></div><button className="secondary-button" type="button" onClick={runAnalysis}>Volver a analizar</button></div><p className="mode-note">{result.executionMode === 'real' && !result.simulated ? 'Ejecución real de KYC y Verification' : result.executionMode === 'simulation' && result.simulated ? 'Ejecución simulada' : 'Modo de ejecución inconsistente'} · Herramientas y datos sintéticos · Requiere revisión humana</p>
            {tab === 'Estado' && <div><span className="status-badge">{statusLabels[result.status]}</span><p className="quiet">Este estado indica preparación del expediente para una persona revisora. No es una decisión crediticia.</p><dl className="summary-grid"><div><dt>Hallazgos</dt><dd>{result.findings.length}</dd></div><div><dt>Acciones registradas</dt><dd>{result.agentTrace.length}</dd></div><div><dt>Orientaciones</dt><dd>{result.productGuidance.length}</dd></div></dl></div>}
            {tab === 'Hallazgos' && (result.findings.length ? <ul className="detail-list">{result.findings.map((finding, index) => <li key={`${finding.code}-${index}`}><small>{finding.severity}</small><h3>{finding.message}</h3><p>Código: {finding.code}</p></li>)}</ul> : <p className="quiet">No se registraron hallazgos en esta ejecución.</p>)}
            {tab === 'Evidencia' && (result.findings.length ? <ul className="detail-list">{result.findings.map((finding, index) => <li key={`${finding.code}-${index}`}><h3>{finding.message}</h3><p><strong>Evidencia:</strong> {finding.evidence.join(' · ') || 'No especificada'}</p><p><strong>Fuentes:</strong> {finding.sourceIds.join(' · ') || 'No especificadas'}</p></li>)}</ul> : <p className="quiet">No hay evidencia asociada a hallazgos.</p>)}
            {tab === 'Orientación' && (result.productGuidance.length ? <ul className="detail-list">{result.productGuidance.map((item, index) => <li key={`${item.product}-${index}`}><h3>{item.product}</h3><p>{item.nextStep}</p><p>{item.disclaimer}</p></li>)}</ul> : <p className="quiet">No se generó orientación de producto para este expediente.</p>)}
            {tab === 'Traza' && (result.agentTrace.length ? <ol className="detail-list">{result.agentTrace.map((entry, index) => <li key={`${entry.timestamp}-${index}`}><small>{entry.agent} · <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString('es-MX')}</time></small><h3>{entry.action}</h3><p>{entry.result}</p>{entry.toolId && <p>Herramienta: {entry.toolId}</p>}</li>)}</ol> : <p className="quiet">No se registraron acciones de agentes.</p>)}
          </div>}
        </div></section>
      </div>
    </main>
  </div>;
}
