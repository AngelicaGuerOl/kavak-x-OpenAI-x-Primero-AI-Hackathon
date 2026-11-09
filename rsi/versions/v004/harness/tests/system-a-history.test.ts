import { mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, it } from 'vitest';
import inputs from '../src/data/evaluation/inputs.json';
import oracles from './evaluation/oracles.json';
import { assertRegisteredExpectations, recordEvaluation } from '../src/server/evaluation/history';
import { evaluateSuite, expectedBehavior, ExpectationSchema } from '../src/server/evaluation/system-a';
import { analyzeSyntheticCase } from '../src/server/simulation';

let root: string;
afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); });
it('requires pre-registered oracles and appends queryable immutable domain evidence', async () => {
  root = mkdtempSync(join(tmpdir(), 'sri-history-test-'));
  mkdirSync(join(root, 'rsi'));
  // Use the actual Python schema so compatibility is tested, not assumed.
  const schema = readFileSync('scripts/rsi_history.py', 'utf8').match(/SCHEMA = """([\s\S]*?)"""/)?.[1];
  if (!schema) throw new Error('History schema not found');
  const db = new DatabaseSync(join(root, 'rsi/history.sqlite'));
  db.exec(schema);
  db.prepare('INSERT INTO versions(version_id,created_at,summary,artifact_path) VALUES(?,?,?,?)').run('v999', new Date().toISOString(), 'Unit fixture', 'rsi/versions/v999');
  const expectation = ExpectationSchema.parse(oracles[0]);
  expect(() => assertRegisteredExpectations([expectation], root)).toThrow('Register independent');
  db.prepare('INSERT INTO test_cases(case_id,suite,source_file,description,expected_behavior,case_type) VALUES(?,?,?,?,?,?)')
    .run(expectation.caseId, expectation.suite, 'tests/evaluation/oracles.json', expectation.description, expectedBehavior(expectation), 'domain');
  assertRegisteredExpectations([expectation], root);
  const report = await evaluateSuite(inputs, [expectation], { suite: 'discovery', version: 'v999', mode: 'simulation' }, analyzeSyntheticCase);
  const path = recordEvaluation(report, root);
  const original = readFileSync(path, 'utf8');
  expect(JSON.parse(original).results[0].output.caseId).toBe(expectation.caseId);
  expect(db.prepare('SELECT mode,passed FROM test_runs WHERE run_id=?').get(report.runId)).toMatchObject({ mode: 'simulation', passed: 1 });
  expect(JSON.parse(String(db.prepare('SELECT actual_summary FROM test_results WHERE run_id=?').get(report.runId)?.actual_summary)).evaluationDate).toBe('2026-11-09');
  expect(() => recordEvaluation(report, root)).toThrow();
  expect(readFileSync(path, 'utf8')).toBe(original);
  expect(db.prepare('SELECT COUNT(*) as n FROM test_runs').get()?.n).toBe(1);
  db.close();
});
