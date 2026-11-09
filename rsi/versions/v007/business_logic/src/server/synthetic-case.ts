import { z } from 'zod';
import type { CaseStatus, Finding } from '@/contracts/case';

export const EvaluationDateSchema = z.iso.date();
export const SyntheticCaseSchema = z.object({
  id: z.string().min(1),
  rfc: z.string(),
  taxRfc: z.string(),
  curp: z.string().optional(),
  ineExpires: z.iso.date(),
  address: z.boolean(),
  documents: z.array(z.string()),
});
export type SyntheticCase = z.infer<typeof SyntheticCaseSchema>;

export function evaluationDate(value = new Date().toISOString().slice(0, 10)) {
  return EvaluationDateSchema.parse(value);
}

export function preparationStatus(findings: Finding[]): CaseStatus {
  return findings.some(finding => finding.code === 'ADDRESS_MISSING')
    ? 'PENDING_INFORMATION'
    : findings.length ? 'REQUIRES_REVIEW' : 'READY_FOR_HUMAN_REVIEW';
}
