import { describe, expect, it } from 'vitest';
import { AnalyzeResponseSchema } from '../src/contracts/case.schema';
import {
  compareSyntheticCaseFields,
  createKycAgent,
  createVerificationAgent,
  listSyntheticDocuments,
} from '../src/server/agents/kyc-verification';
import { analyze } from '../src/server/core';
import { POST as analyzePost } from '../src/app/api/cases/analyze/route';

describe('first technical milestone', () => {
  it('instantiates KYC and Verification agents from the installed OpenAI Agents SDK', () => {
    expect(createKycAgent().name).toBe('KYC Agent');
    expect(createVerificationAgent().name).toBe('Verification Agent');
  });

  it('validates the synthetic KYC → Verification development flow against the shared response contract', () => {
    const result = analyze('case-002');
    expect(result).not.toBeNull();
    expect(AnalyzeResponseSchema.parse(result)).toMatchObject({
      caseId: 'case-002',
      executionMode: 'simulation',
      simulated: true,
      findings: [{ code: 'RFC_MISMATCH' }],
      agentTrace: [{ agent: 'KYC' }, { agent: 'VERIFICATION' }],
    });
  });

  it('rejects contradictory real/simulated response metadata', () => {
    const result = analyze('case-001');
    expect(() => AnalyzeResponseSchema.parse({ ...result, executionMode: 'real' })).toThrow();
  });

  it('validates synthetic tool evidence and records execution only after successful tool work', () => {
    const syntheticCase = {
      id: 'case-test',
      rfc: 'AAA010101AA1',
      taxRfc: 'BBB010101BB2',
      ineExpires: '2030-01-01',
      address: false,
      documents: ['IDENTITY', 'RFC'],
    };
    const json = JSON.stringify(syntheticCase);
    const executed: string[] = [];
    expect(listSyntheticDocuments(json, () => executed.push('documents'))).toEqual({
      documents: ['IDENTITY', 'RFC'],
      addressPresent: false,
    });
    const result = compareSyntheticCaseFields(json, () => executed.push('comparison'));
    expect(result.findings.map(({ code }) => code)).toEqual(['ADDRESS_MISSING', 'RFC_MISMATCH']);
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: expect.any(String), evidence: expect.any(Array), sourceIds: expect.any(Array) })]));
    expect(executed).toEqual(['documents', 'comparison']);

    expect(() => listSyntheticDocuments('{', () => executed.push('invalid'))).toThrow();
    expect(executed).toEqual(['documents', 'comparison']);
  });

  it('does not label a request as a real agent run when the API key is missing', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const response = await analyzePost(new Request('http://localhost/api/cases/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: 'case-001' }),
      }));
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ error: { code: 'MODEL_UNAVAILABLE' } });
    } finally {
      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
      else delete process.env.OPENAI_API_KEY;
    }
  });

  it('validates request JSON and returns CASE_NOT_FOUND before requiring model access', async () => {
    const invalid = await analyzePost(new Request('http://localhost/api/cases/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    }));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });

    const missingCase = await analyzePost(new Request('http://localhost/api/cases/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'not-a-fixture' }),
    }));
    expect(missingCase.status).toBe(404);
    expect(await missingCase.json()).toMatchObject({ error: { code: 'CASE_NOT_FOUND' } });
  });
});
