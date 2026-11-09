import type { AgentTraceEntry } from './case';

export interface LearningRunRequest {
  /** Fixed fixture suite ID; the server owns the fixtures and expected results. */
  suiteId: 'onboarding-v1';
}

export interface EvaluationMetric {
  passed: number;
  total: number;
}

export interface EvaluationFailure {
  caseId: string;
  expectedCodes: string[];
  actualCodes: string[];
  explanation: string;
}

export interface LearningProposal {
  id: string;
  version: string;
  rule: string;
  sourceFailureIds: string[];
  status: 'ACCEPTED' | 'REJECTED';
  validation: EvaluationMetric;
}

export interface LearningRunResponse {
  runId: string;
  suiteId: 'onboarding-v1';
  baseline: EvaluationMetric;
  failures: EvaluationFailure[];
  proposals: LearningProposal[];
  activeMemoryVersion: string;
  agentTrace: AgentTraceEntry[];
  simulated: true;
}
