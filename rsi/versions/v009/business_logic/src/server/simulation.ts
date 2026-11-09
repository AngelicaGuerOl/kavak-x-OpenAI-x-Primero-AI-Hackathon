import type { AnalyzeResponse } from '@/contracts/case';
import { AnalyzeResponseSchema } from '@/contracts/case.schema';
import { cases } from '@/server/cases';
import { compareSyntheticCaseFields, listSyntheticDocuments } from '@/server/agents/kyc-verification';
import { SyntheticCaseSchema, evaluationDate, preparationStatus } from '@/server/synthetic-case';
import { createReviewItems } from '@/server/review-monitor';

export function analyzeSyntheticCase(input: unknown, asOf: string): AnalyzeResponse {
  const record = SyntheticCaseSchema.parse(input);
  const date = evaluationDate(asOf);
  const json = JSON.stringify(record);
  const documents = listSyntheticDocuments(json);
  const { findings } = compareSyntheticCaseFields(json, undefined, date);
  return AnalyzeResponseSchema.parse({
    caseId: record.id,
    runId: crypto.randomUUID(),
    status: preparationStatus(findings),
    findings,
    reviewItems: createReviewItems(findings),
    agentTrace: [
      { agent: 'KYC', toolId: 'list_synthetic_documents', action: 'Simulación: listar documentos', result: JSON.stringify(documents), timestamp: new Date().toISOString() },
      { agent: 'VERIFICATION', toolId: 'compare_synthetic_case_fields', action: 'Simulación: contrastar evidencia', result: JSON.stringify({ findings, evaluationDate: date }), timestamp: new Date().toISOString() },
    ],
    productGuidance: [], executionMode: 'simulation', simulated: true,
  });
}

export function analyze(caseId: string, asOf?: string): AnalyzeResponse | null {
  const record = cases.find(entry => entry.id === caseId);
  return record ? analyzeSyntheticCase(record, evaluationDate(asOf)) : null;
}
