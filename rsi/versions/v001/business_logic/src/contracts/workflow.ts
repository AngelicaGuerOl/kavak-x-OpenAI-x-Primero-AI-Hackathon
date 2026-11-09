import type { AgentTraceEntry, Finding } from './case';
import type { EvaluationMetric } from './agent-result';

export type ApprovedToolId =
  | 'check_document_presence'
  | 'compare_shared_fields'
  | 'check_document_expiry'
  | 'check_consent'
  | 'lookup_product_requirements';

export interface WorkflowStep {
  id: string;
  toolId: ApprovedToolId;
  description: string;
  /** IDs of preceding steps; empty for an initial step. */
  dependsOn: string[];
}

export interface WorkflowDefinition {
  id: string;
  version: string;
  kind: 'AUTO_FINANCING_PREPARATION';
  title: string;
  steps: WorkflowStep[];
  memoryVersion: string | null;
}

export interface GenerateWorkflowRequest {
  suiteId: 'auto-financing-v1';
  /** Accepted learning version from /api/learning/run; omitted means current accepted memory. */
  memoryVersion?: string;
}

export interface WorkflowCaseResult {
  caseId: string;
  findingCodes: string[];
  findings: Finding[];
}

export interface WorkflowEvaluation {
  workflow: WorkflowDefinition;
  metric: EvaluationMetric;
  caseResults: WorkflowCaseResult[];
}

export interface GenerateWorkflowResponse {
  runId: string;
  suiteId: 'auto-financing-v1';
  baseline: WorkflowEvaluation;
  learned: WorkflowEvaluation;
  agentTrace: AgentTraceEntry[];
  simulated: true;
}
