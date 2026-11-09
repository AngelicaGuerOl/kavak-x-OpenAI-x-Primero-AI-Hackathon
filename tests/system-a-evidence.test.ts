import { it } from 'vitest';
import { getDefaultModel } from '@openai/agents';
import inputs from '../src/data/evaluation/inputs.json';
import rawExpectations from './evaluation/oracles.json';
import { evaluateSuite, ExpectationSchema } from '../src/server/evaluation/system-a';
import { recordEvaluation, assertRegisteredExpectations } from '../src/server/evaluation/history';
import { analyzeSyntheticCase } from '../src/server/simulation';
import { analyzeWithAgents } from '../src/server/agents/kyc-verification';

// Operational entry point. Ordinary unit runs never spend API tokens or write history.
it.skipIf(!process.env.SRI_EVALUATION_VERSION)('records independently registered System A evidence', async () => {
  const mode = process.env.SRI_EVALUATION_MODE ?? 'simulation';
  if (mode !== 'simulation' && mode !== 'real') throw new Error('Invalid evaluation mode');
  const expectations = ExpectationSchema.array().parse(rawExpectations);
  const suiteNames = process.env.SRI_EVALUATION_SUITE ? [process.env.SRI_EVALUATION_SUITE] : ['discovery', 'validation', 'holdout'];
  for (const name of suiteNames) {
    const suite = ExpectationSchema.shape.suite.parse(name);
    // Smoke uses only the first original control; unavailable is recorded, not a pass.
    const selected = process.env.SRI_EVALUATION_SMOKE === '1'
      ? expectations.filter(item => item.suite === suite).slice(0, 1) : expectations;
    assertRegisteredExpectations(selected.filter(item => item.suite === suite));
    const report = await evaluateSuite(inputs, selected, {
      suite, version: process.env.SRI_EVALUATION_VERSION!, mode,
      model: mode === 'real' ? getDefaultModel() : undefined,
    }, mode === 'real' ? analyzeWithAgents : analyzeSyntheticCase);
    const path = recordEvaluation(report);
    console.log(JSON.stringify({ suite, executionMode: report.executionMode, metric: report.metric, path }));
  }
}, 90000);
