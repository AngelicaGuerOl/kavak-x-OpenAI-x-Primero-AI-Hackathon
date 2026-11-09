import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({ caseId: z.string().min(1) }).strict();
export const FindingSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  message: z.string(),
  evidence: z.array(z.string()),
  sourceIds: z.array(z.string()),
});
export const AgentTraceEntrySchema = z.object({
  agent: z.enum(['KYC', 'VERIFICATION', 'REFLECTION', 'BUILDER', 'ORCHESTRATOR']),
  action: z.string(),
  result: z.string(),
  toolId: z.string().optional(),
  timestamp: z.string().datetime(),
});
export const AnalyzeResponseSchema = z.object({
  caseId: z.string(),
  runId: z.string().min(1),
  status: z.enum(['PENDING_INFORMATION', 'REQUIRES_REVIEW', 'READY_FOR_HUMAN_REVIEW']),
  findings: z.array(FindingSchema),
  reviewItems: z.array(z.object({
    findingCode: z.string().min(1),
    document: z.string().min(1),
    field: z.string().min(1),
    proposedAction: z.string().min(1),
  })),
  agentTrace: z.array(AgentTraceEntrySchema).min(2),
  productGuidance: z.array(z.object({ product: z.enum(['CARD', 'AUTO_FINANCING', 'HOUSING']), nextStep: z.string(), disclaimer: z.string() })),
  executionMode: z.enum(['real', 'simulation']),
  simulated: z.boolean(),
}).refine((response) => response.simulated === (response.executionMode === 'simulation'), {
  message: 'simulated debe coincidir con executionMode',
});
