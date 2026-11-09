import { describe, expect, it } from 'vitest';
import { AnalyzeResponseSchema } from '../src/contracts/case.schema';
import { createKycAgent, createVerificationAgent } from '../src/server/agents/kyc-verification';
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
});
