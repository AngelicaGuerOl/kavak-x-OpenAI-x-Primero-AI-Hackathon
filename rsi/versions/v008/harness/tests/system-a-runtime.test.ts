import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RunContext, type Agent } from '@openai/agents';
import { analyzeWithAgents, createKycAgent, createVerificationAgent } from '../src/server/agents/kyc-verification';
import inputs from '../src/data/cases.json';
import type { AnalyzeResponse } from '../src/contracts/case';

const sdkRun = vi.hoisted(() => vi.fn());
vi.mock('@openai/agents', async importOriginal => ({ ...await importOriginal<typeof import('@openai/agents')>(), run: sdkRun }));

async function invoke(agent: Pick<Agent, 'tools' | 'name'>, args = '{}') {
  const tool = agent.tools[0];
  if (tool.type !== 'function') throw new Error('Expected registered function tool');
  return JSON.parse(String(await tool.invoke(new RunContext(), args)));
}

beforeEach(() => { sdkRun.mockReset(); vi.stubEnv('OPENAI_API_KEY', 'test-only-placeholder'); });
afterEach(() => vi.unstubAllEnvs());

describe('server-bound System A runtime (mocked model, offline)', () => {
  it('does not allow model arguments or input mutation to replace server evidence', async () => {
    const original = structuredClone(inputs[1]);
    const trace: AnalyzeResponse['agentTrace'] = [];
    const agent = createVerificationAgent(original, [], [], '2026-11-09', trace);
    original.taxRfc = original.rfc;
    const result = await invoke(agent);
    expect(result.findings.map((finding: { code: string }) => finding.code)).toEqual(['RFC_MISMATCH']);
    expect(trace).toHaveLength(1);
    expect(trace[0].toolId).toBe('compare_synthetic_case_fields');
    // Strict tool schemas reject replacement fields; callback must not execute.
    await invoke(agent, JSON.stringify({ caseJson: JSON.stringify(inputs[0]) })).catch(() => undefined);
    expect(trace).toHaveLength(1);
  });

  it('rejects tool execution with no server case context', async () => {
    const calls: string[] = [];
    const agent = createKycAgent(undefined, calls);
    await invoke(agent).catch(() => undefined);
    expect(calls).toEqual([]);
  });

  it('runs the two stages and records only executed tool work', async () => {
    sdkRun.mockImplementation(async (agent: Pick<Agent, 'tools' | 'name'>) => {
      const evidence = await invoke(agent);
      return { finalOutput: agent.name === 'KYC Agent'
        ? { documentKinds: evidence.documents, questionsForVerification: ['Compare RFC'], summary: 'Synthetic document inventory' }
        : { findings: evidence.findings, summary: 'Synthetic evidence checked' } };
    });
    const result = await analyzeWithAgents(inputs[1], '2026-11-09');
    expect(sdkRun).toHaveBeenCalledTimes(2);
    expect(result.findings.map(item => item.code)).toEqual(['RFC_MISMATCH']);
    expect(result.agentTrace.filter(item => item.toolId).map(item => item.toolId))
      .toEqual(['list_synthetic_documents', 'compare_synthetic_case_fields']);
    expect(result.status).toBe('REQUIRES_REVIEW');
    // This assertion tests orchestration with a mocked model; it is not live evidence.
  });

  it('rejects required-tool omission, malformed output and unsupported findings', async () => {
    sdkRun.mockResolvedValue({ finalOutput: { documentKinds: inputs[0].documents, questionsForVerification: [], summary: 'No tool' } });
    await expect(analyzeWithAgents(inputs[0])).rejects.toThrow('no ejecutó');
    sdkRun.mockResolvedValue({ finalOutput: {} });
    await expect(analyzeWithAgents(inputs[0])).rejects.toThrow('estructurada');
    sdkRun.mockImplementation(async (agent: Pick<Agent, 'tools' | 'name'>) => {
      const evidence = await invoke(agent);
      return { finalOutput: agent.name === 'KYC Agent'
        ? { documentKinds: evidence.documents, questionsForVerification: [], summary: 'Inventory' }
        : { findings: [], summary: 'Omitted tool finding' } };
    });
    await expect(analyzeWithAgents(inputs[1])).rejects.toThrow('no coinciden');
  });

  it('preserves partial tool traces and sanitizes failed model requests', async () => {
    sdkRun.mockImplementation(async (agent: Pick<Agent, 'tools' | 'name'>) => {
      await invoke(agent);
      throw Object.assign(new Error('sk-secret Bearer sensitive'), { status: 429, code: 'credit_balance_exhausted' });
    });
    const error = await analyzeWithAgents(inputs[0]).catch(error => error);
    expect(error.message).toBe('KYC Agent: credit_balance_exhausted');
    expect(error.runId).toBeTruthy();
    expect(error.agentTrace).toHaveLength(1);
    expect(JSON.stringify(error)).not.toContain('sk-secret');
  });
});
