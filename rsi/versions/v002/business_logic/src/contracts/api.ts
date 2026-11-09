export type { AnalyzeRequest, AnalyzeResponse } from './case';
export type { LearningRunRequest, LearningRunResponse } from './agent-result';
export type { GenerateWorkflowRequest, GenerateWorkflowResponse } from './workflow';

export interface ApiError {
  error: {
    code: 'INVALID_REQUEST' | 'CASE_NOT_FOUND' | 'MODEL_UNAVAILABLE' | 'INTERNAL_ERROR';
    message: string;
  };
}
