import type { AnalyzeResponse } from '@/contracts/case';
import './case-monitor.css';

export default function CaseMonitor({ result }: { result: AnalyzeResponse }) {
  return <section className="case-monitor" aria-label="Monitor del expediente">
    <p className="monitor-intro">Ubicación por documento y campo del fixture sintético. Esta demo no recibe archivos ni puede señalar páginas o fragmentos exactos.</p>
    {result.reviewItems.length === 0 ? <div className="monitor-clear"><strong>Sin partes señaladas</strong><p>No se detectaron hallazgos en este expediente. La revisión humana sigue siendo necesaria.</p></div> :
      <ol className="monitor-list">{result.reviewItems.map((item, index) => {
        const finding = result.findings.find((entry) => entry.code === item.findingCode);
        return <li key={`${item.findingCode}-${index}`} className="monitor-card">
          <div className="monitor-card-header"><span className="monitor-index">{String(index + 1).padStart(2, '0')}</span><div><small>Documento o sección</small><h3>{item.document}</h3></div><span className="monitor-severity">{finding?.severity ?? 'REVISAR'}</span></div>
          <dl className="monitor-facts"><div><dt>Campo señalado</dt><dd>{item.field}</dd></div><div><dt>Hallazgo</dt><dd>{finding?.message ?? item.findingCode}</dd></div></dl>
          <div className="monitor-evidence"><strong>Evidencia registrada</strong>{finding?.evidence.length ? <ul>{finding.evidence.map((evidence, evidenceIndex) => <li key={evidenceIndex}>{evidence}</li>)}</ul> : <p>No se registró evidencia detallada.</p>}<small>Fuente: {finding?.sourceIds.join(', ') || 'no especificada'}</small></div>
          <div className="monitor-proposal"><small>Propuesta para revisión humana</small><p>{item.proposedAction}</p></div>
        </li>;
      })}</ol>}
  </section>;
}
