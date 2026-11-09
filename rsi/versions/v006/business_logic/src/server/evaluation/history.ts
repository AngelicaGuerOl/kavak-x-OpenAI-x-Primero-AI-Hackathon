import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expectedBehavior, type EvaluationReport, type Expectation } from './system-a';

/** Preflight must run before invoking a runner, not only before writing results. */
export function assertRegisteredExpectations(expectations: Expectation[], root = process.cwd()) {
  const db = new DatabaseSync(join(root, 'rsi/history.sqlite'), { readOnly: true });
  try {
    for (const expectation of expectations) {
      const registered = db.prepare('SELECT expected_behavior,suite,case_type FROM test_cases WHERE case_id=?').get(expectation.caseId);
      if (!registered || registered.expected_behavior !== expectedBehavior(expectation) ||
          registered.suite !== expectation.suite || registered.case_type !== 'domain') {
        throw new Error(`Register independent expectation before execution: ${expectation.caseId}`);
      }
    }
  } finally { db.close(); }
}

/** Append domain evidence using the existing history schema; never infer oracles here. */
export function recordEvaluation(report: EvaluationReport, root = process.cwd()) {
  if (!/^v\d{3,}$/.test(report.version)) throw new Error('Invalid snapshot version');
  assertRegisteredExpectations(report.results.map(result => result.expectation), root);
  const db = new DatabaseSync(join(root, 'rsi/history.sqlite'));
  db.exec('PRAGMA foreign_keys=ON');
  let path: string;
  try {
    if (!db.prepare('SELECT 1 FROM versions WHERE version_id=?').get(report.version)) throw new Error('Snapshot must exist before recording');
    path = join(root, 'rsi/versions', report.version, 'testcases', `domain-${report.runId}.json`);
    const content = JSON.stringify(report, null, 2) + '\n';
    mkdirSync(join(root, 'rsi/versions', report.version, 'testcases'), { recursive: true });
    db.exec('BEGIN IMMEDIATE');
    const failed = report.results.filter(result => result.status === 'failed').length;
    db.prepare('INSERT INTO test_runs(run_id,version_id,suite,mode,command,started_at,finished_at,status,passed,failed,skipped,raw_report_path) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(report.runId, report.version, report.suite, report.executionMode,
        'vitest run tests/system-a-evidence.test.ts', report.startedAt, report.finishedAt,
        report.metric.unavailable ? 'unavailable' : failed ? 'failed' : 'passed',
        report.metric.passed, failed, report.metric.unavailable, relative(root, path));
    for (const result of report.results) {
      db.prepare('INSERT INTO test_results(run_id,case_id,status,duration_ms,failure_message,actual_summary) VALUES(?,?,?,?,?,?)')
        .run(report.runId, result.caseId, result.status, result.durationMs,
          result.passed ? null : JSON.stringify({ omissions: result.omissions, falsePositives: result.falsePositives, statusMismatch: result.statusMismatch, error: result.error }),
          JSON.stringify(result));
    }
    db.prepare('INSERT INTO artifacts(version_id,category,relative_path,sha256) VALUES(?,?,?,?)')
      .run(report.version, 'testcases', relative(join(root, 'rsi/versions', report.version), path), createHash('sha256').update(content).digest('hex'));
    writeFileSync(path, content, { flag: 'wx' });
    db.exec('COMMIT');
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  } finally { db.close(); }
  return path;
}
