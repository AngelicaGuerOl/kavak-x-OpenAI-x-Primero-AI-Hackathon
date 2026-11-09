import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ModelUnavailableError } from '@/server/agents/kyc-verification';
import { AnalyzeResponseSchema } from '@/contracts/case.schema';
import type { AnalyzeResponse } from '@/contracts/case';
import { SyntheticCaseSchema, EvaluationDateSchema, type SyntheticCase } from '@/server/synthetic-case';

export const ExpectationSchema = z.object({
  caseId: z.string().min(1),
  suite: z.enum(['discovery', 'validation', 'holdout']),
  evaluationDate: EvaluationDateSchema,
  expectedCodes: z.array(z.string()).refine(codes => new Set(codes).size === codes.length),
  expectedStatus: z.enum(['PENDING_INFORMATION', 'REQUIRES_REVIEW', 'READY_FOR_HUMAN_REVIEW']),
  description: z.string(),
}).strict();
export type Expectation = z.infer<typeof ExpectationSchema>;
export type CaseRunner = (input: SyntheticCase, date: string) => Promise<unknown> | unknown;

export function expectedBehavior(expectation: Expectation) {
  return JSON.stringify({ evaluationDate: expectation.evaluationDate, expectedCodes: expectation.expectedCodes, expectedStatus: expectation.expectedStatus });
}

export function compareOutcome(expectation: Expectation, actual: AnalyzeResponse) {
  const actualCodes = [...new Set(actual.findings.map(finding => finding.code))].sort();
  const omissions = expectation.expectedCodes.filter(code => !actualCodes.includes(code)).sort();
  const falsePositives = actualCodes.filter(code => !expectation.expectedCodes.includes(code));
  const statusMismatch = actual.status !== expectation.expectedStatus;
  return { actualCodes, omissions, falsePositives, statusMismatch,
    passed: omissions.length === 0 && falsePositives.length === 0 && !statusMismatch };
}

export async function evaluateSuite(
  inputs: unknown[], expectations: Expectation[],
  options: { suite: Expectation['suite']; version: string; mode: 'simulation' | 'real'; model?: string },
  runner: CaseRunner,
) {
  const selected = expectations.map(item => ExpectationSchema.parse(item)).filter(item => item.suite === options.suite);
  const records = inputs.map(input => SyntheticCaseSchema.parse(input));
  if (!selected.length || new Set(selected.map(item => item.caseId)).size !== selected.length ||
      new Set(records.map(item => item.id)).size !== records.length) throw new Error('Empty suite or duplicate case IDs');
  const entries = selected.map(expectation => {
    const input = records.find(record => record.id === expectation.caseId);
    if (!input) throw new Error(`Missing input: ${expectation.caseId}`);
    return { expectation, input };
  });
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const results = [];
  for (const { expectation, input } of entries) {
    const started = performance.now();
    const metadata = { caseId: input.id, suite: options.suite, evaluationRunId: runId,
      version: options.version, evaluationDate: expectation.evaluationDate, expectation,
      inputHash: createHash('sha256').update(JSON.stringify(input)).digest('hex') };
    try {
      // Only the input and date cross the runner boundary. Never pass an oracle.
      const output = AnalyzeResponseSchema.parse(await runner(structuredClone(input), expectation.evaluationDate));
      if (output.caseId !== input.id || output.executionMode !== options.mode) throw new Error('Output identity or mode mismatch');
      const comparison = compareOutcome(expectation, output);
      results.push({ ...metadata, ...comparison, status: comparison.passed ? 'passed' as const : 'failed' as const,
        output, durationMs: performance.now() - started, error: null, partialExecution: null });
    } catch (error) {
      // Upstream error messages may contain credentials. Preserve only controlled errors.
      const unavailable = error instanceof ModelUnavailableError;
      const safe = unavailable && /^((KYC Agent|Verification Agent): [A-Za-z0-9_ ]+|OPENAI_API_KEY no está configurada)$/.test(error.message)
        ? error.message : unavailable ? 'MODEL_UNAVAILABLE' : 'INVALID_EXECUTION_OUTPUT';
      results.push({ ...metadata, status: unavailable ? 'unavailable' as const : 'failed' as const,
        passed: false, output: null, omissions: [], falsePositives: [], statusMismatch: null, actualCodes: [],
        durationMs: performance.now() - started, error: safe,
        partialExecution: unavailable ? { runId: error.runId ?? null, agentTrace: error.agentTrace } : null });
    }
  }
  const completed = results.filter(result => result.output !== null);
  return { runId, version: options.version, suite: options.suite, requestedMode: options.mode,
    executionMode: completed.length ? options.mode : 'unavailable' as const,
    model: options.mode === 'real' ? options.model ?? 'SDK default' : null,
    startedAt, finishedAt: new Date().toISOString(),
    suiteHash: createHash('sha256').update(JSON.stringify(entries)).digest('hex'),
    metric: { passed: results.filter(result => result.passed).length, total: results.length,
      completed: completed.length, unavailable: results.filter(result => result.status === 'unavailable').length,
      omissions: results.reduce((n, result) => n + result.omissions.length, 0),
      falsePositives: results.reduce((n, result) => n + result.falsePositives.length, 0),
      statusMismatches: results.filter(result => result.statusMismatch === true).length },
    results };
}
export type EvaluationReport = Awaited<ReturnType<typeof evaluateSuite>>;
