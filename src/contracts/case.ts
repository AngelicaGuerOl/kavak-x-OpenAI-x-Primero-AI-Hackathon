/** All records and document checks in the MVP are synthetic. */
export type CaseStatus =
  | 'PENDING_INFORMATION'
  | 'REQUIRES_REVIEW'
  | 'READY_FOR_HUMAN_REVIEW';

export type DocumentKind =
  | 'IDENTITY'
  | 'CURP'
  | 'RFC'
  | 'ADDRESS'
  | 'TAX_RECORD'
  | 'INCOME';

export interface CaseSummary {
  id: string;
  applicantName: string;
  requestedProduct: 'ACCOUNT' | 'AUTO_FINANCING';
  declaredInterest?: 'CARD' | 'AUTO_FINANCING' | 'HOUSING';
  documents: Array<{ kind: DocumentKind; present: boolean }>;
}

export interface AnalyzeRequest {
  caseId: string;
}

export interface Finding {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  evidence: string[];
  /** Document or simulated tool IDs, never an unsupported official verification claim. */
  sourceIds: string[];
}

export interface AgentTraceEntry {
  agent: 'KYC' | 'VERIFICATION' | 'PRODUCT' | 'REFLECTION' | 'BUILDER' | 'ORCHESTRATOR';
  action: string;
  result: string;
  toolId?: string;
  timestamp: string; // ISO 8601
}

export interface ProductGuidance {
  product: 'CARD' | 'AUTO_FINANCING' | 'HOUSING';
  nextStep: string;
  disclaimer: string;
}

export interface AnalyzeResponse {
  caseId: string;
  runId: string;
  status: CaseStatus;
  findings: Finding[];
  agentTrace: AgentTraceEntry[];
  productGuidance: ProductGuidance[];
  simulated: true;
}
