import { describe, expect, it } from 'vitest';
import inputs from '../src/data/evaluation/inputs.json';
import rawOracles from './evaluation/oracles.json';
import { compareOutcome, evaluateSuite, ExpectationSchema } from '../src/server/evaluation/system-a';
import { analyzeSyntheticCase } from '../src/server/simulation';
import { ModelUnavailableError } from '../src/server/agents/kyc-verification';

const expectations = ExpectationSchema.array().parse(rawOracles);
const base = expectations[0];
const baseInput = inputs[0];
const options = { suite: 'discovery' as const, version: 'unit-only', mode: 'simulation' as const };

describe('independent System A evaluator', () => {
  it('keeps discovery, validation and holdout IDs disjoint', () => {
    const ids = expectations.map(item => item.caseId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(expectations.map(item => item.suite))).toEqual(new Set(['discovery', 'validation', 'holdout']));
    expect(inputs).toHaveLength(ids.length);
  });

  it('detects omissions, false positives and status differences independently', () => {
    const actual = analyzeSyntheticCase(baseInput, base.evaluationDate);
    const result = compareOutcome({ ...base, expectedCodes: ['INE_EXPIRED'], expectedStatus: 'REQUIRES_REVIEW' }, {
      ...actual, findings: [{ code: 'RFC_MISMATCH', severity: 'WARNING', message: 'Test observation', evidence: [], sourceIds: [] }],
    });
    expect(result).toMatchObject({ omissions: ['INE_EXPIRED'], falsePositives: ['RFC_MISMATCH'], statusMismatch: true, passed: false });
  });

  it('passes a clean control without sharing its oracle with the runner', async () => {
    let argumentsReceived: unknown[] = [];
    const report = await evaluateSuite(inputs, [base], options, (...args) => {
      argumentsReceived = args;
      return analyzeSyntheticCase(...args);
    });
    expect(argumentsReceived).toEqual([baseInput, base.evaluationDate]);
    expect(report.metric).toEqual({ passed: 1, total: 1, completed: 1, unavailable: 0, omissions: 0, falsePositives: 0, statusMismatches: 0 });
    expect(report.results[0].output?.runId).toBeTruthy();
  });

  it('rejects wrong case identity, false mode and malformed output', async () => {
    const actual = analyzeSyntheticCase(baseInput, base.evaluationDate);
    for (const altered of [{ ...actual, caseId: 'another-case' }, { ...actual, executionMode: 'real', simulated: false }, {}]) {
      const report = await evaluateSuite(inputs, [base], options, () => altered);
      expect(report.metric.passed).toBe(0);
      expect(report.results[0]).toMatchObject({ status: 'failed', error: 'INVALID_EXECUTION_OUTPUT' });
    }
  });

  it('records model unavailability separately, without leaking upstream text', async () => {
    const report = await evaluateSuite(inputs, [base], { ...options, mode: 'real' }, () => {
      throw new ModelUnavailableError('sk-private-secret Bearer confidential');
    });
    expect(report.executionMode).toBe('unavailable');
    expect(report.metric).toMatchObject({ passed: 0, total: 1, completed: 0, unavailable: 1, omissions: 0 });
    expect(JSON.stringify(report)).not.toContain('private-secret');
  });

  it('rejects empty suites, missing inputs and duplicate IDs before running', async () => {
    const neverRun = () => { throw new Error('Runner must not execute'); };
    await expect(evaluateSuite(inputs, [], options, neverRun)).rejects.toThrow('Empty suite');
    await expect(evaluateSuite([], [base], options, neverRun)).rejects.toThrow('Missing input');
    await expect(evaluateSuite(inputs, [base, base], options, neverRun)).rejects.toThrow('duplicate');
  });

  it('uses a fixed cutoff even when the machine clock changes', () => {
    const input = { ...baseInput, ineExpires: '2026-11-09' };
    expect(analyzeSyntheticCase(input, '2026-11-09').findings).toEqual([]);
    expect(analyzeSyntheticCase(input, '2026-11-10').findings.map(item => item.code)).toEqual(['INE_EXPIRED']);
    expect(() => analyzeSyntheticCase(input, 'not-a-date')).toThrow();
  });
});
