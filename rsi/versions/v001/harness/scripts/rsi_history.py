#!/usr/bin/env python3
"""Version and evaluation history for the SRI Finance Codex improvement loop."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "rsi" / "history.sqlite"
VERSIONS_DIR = ROOT / "rsi" / "versions"

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS versions (
  version_id TEXT PRIMARY KEY,
  parent_version_id TEXT REFERENCES versions(version_id),
  created_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_commit TEXT,
  artifact_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'snapshot'
);
CREATE TABLE IF NOT EXISTS artifacts (
  artifact_id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id TEXT NOT NULL REFERENCES versions(version_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  sha256 TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS test_cases (
  case_id TEXT PRIMARY KEY,
  suite TEXT NOT NULL,
  source_file TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_behavior TEXT NOT NULL,
  case_type TEXT NOT NULL DEFAULT 'unit'
);
CREATE TABLE IF NOT EXISTS test_runs (
  run_id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES versions(version_id),
  suite TEXT NOT NULL,
  mode TEXT NOT NULL,
  command TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  status TEXT NOT NULL,
  passed INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  skipped INTEGER NOT NULL,
  raw_report_path TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS test_results (
  result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  case_id TEXT NOT NULL REFERENCES test_cases(case_id),
  status TEXT NOT NULL,
  duration_ms REAL,
  failure_message TEXT,
  actual_summary TEXT
);
CREATE TABLE IF NOT EXISTS improvements (
  improvement_id TEXT PRIMARY KEY,
  from_version_id TEXT NOT NULL REFERENCES versions(version_id),
  to_version_id TEXT REFERENCES versions(version_id),
  created_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_failure_case_ids TEXT NOT NULL,
  executable_change TEXT NOT NULL,
  validation_run_id TEXT REFERENCES test_runs(run_id),
  decision TEXT NOT NULL DEFAULT 'proposed',
  decision_reason TEXT
);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def copy_tree(source: Path, destination: Path) -> None:
    if source.exists():
        shutil.copytree(source, destination, dirs_exist_ok=True, ignore=shutil.ignore_patterns(
            "node_modules", ".next", ".git", "__pycache__", "*.pyc", ".env*", "history.sqlite"
        ))


def snapshot(args: argparse.Namespace) -> None:
    conn = connect()
    latest = conn.execute("SELECT version_id FROM versions ORDER BY created_at DESC LIMIT 1").fetchone()
    version_number = 1 if latest is None else int(latest["version_id"].lstrip("v")) + 1
    version_id = f"v{version_number:03d}"
    version_dir = VERSIONS_DIR / version_id
    if version_dir.exists():
        raise SystemExit(f"Snapshot already exists: {version_dir}")

    (version_dir / "business_logic").mkdir(parents=True)
    (version_dir / "harness").mkdir(parents=True)
    (version_dir / "skills").mkdir(parents=True)
    (version_dir / "testcases").mkdir(parents=True)

    copy_tree(ROOT / "src" / "server", version_dir / "business_logic" / "src" / "server")
    copy_tree(ROOT / "src" / "contracts", version_dir / "business_logic" / "src" / "contracts")
    copy_tree(ROOT / "src" / "app" / "api", version_dir / "business_logic" / "src" / "app" / "api")
    copy_tree(ROOT / "tests", version_dir / "harness" / "tests")
    copy_tree(ROOT / "scripts", version_dir / "harness" / "scripts")
    for filename in ("package.json", "package-lock.json", "vitest.config.mts", "AGENTS.md", "CONTRACTS.md"):
        source = ROOT / filename
        if source.is_file():
            shutil.copy2(source, version_dir / "harness" / filename)
    copy_tree(ROOT / ".agents" / "skills", version_dir / "skills" / ".agents" / "skills")
    for filename in ("README.md", "README_PRIMEROS_PROMPTS.md", "IMPLEMENTATION_PLAN.md", "README_SPRINT_CHECKLIST.md"):
        source = ROOT / filename
        if source.is_file():
            shutil.copy2(source, version_dir / "skills" / filename)

    fixtures = ROOT / "src" / "data"
    if fixtures.exists():
        copy_tree(fixtures, version_dir / "testcases" / "fixtures")
    copy_tree(ROOT / "tests", version_dir / "testcases" / "test_definitions")
    (version_dir / "testcases" / "README.md").write_text(
        "# Test cases in this snapshot\n\n"
        "Test definitions are copied from `test_definitions/`; execution results are recorded "
        "as JSON here and indexed in the shared SQLite history. Domain fixtures and independent "
        "evaluation oracles must remain separate when they are added.\n",
        encoding="utf-8",
    )

    try:
        commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, capture_output=True, check=True).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        commit = None
    parent_id = latest["version_id"] if latest else None
    created_at = now_iso()
    conn.execute(
        "INSERT INTO versions(version_id,parent_version_id,created_at,summary,source_commit,artifact_path) VALUES(?,?,?,?,?,?)",
        (version_id, parent_id, created_at, args.summary, commit, str(version_dir.relative_to(ROOT))),
    )
    for file in version_dir.rglob("*"):
        if not file.is_file():
            continue
        relative = str(file.relative_to(version_dir))
        category = relative.split("/", 1)[0]
        conn.execute(
            "INSERT INTO artifacts(version_id,category,relative_path,sha256) VALUES(?,?,?,?)",
            (version_id, category, relative, sha256_file(file)),
        )
    conn.commit()
    conn.close()
    print(f"Created {version_id}: {version_dir.relative_to(ROOT)}")
    print(f"History database: {DB_PATH.relative_to(ROOT)}")


def run_tests(args: argparse.Namespace) -> None:
    conn = connect()
    version = conn.execute("SELECT version_id FROM versions WHERE version_id=?", (args.version,)).fetchone()
    if not version:
        raise SystemExit(f"Unknown version {args.version}; create a snapshot first")
    run_id = str(uuid.uuid4())
    started = now_iso()
    report_fd, report_name = tempfile.mkstemp(prefix="sri-vitest-", suffix=".json")
    os.close(report_fd)
    Path(report_name).unlink(missing_ok=True)
    command = ["npm", "test", "--", "--reporter=json", "--outputFile", report_name]
    completed = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    finished = now_iso()
    try:
        report = json.loads(Path(report_name).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        print(completed.stdout)
        print(completed.stderr, file=sys.stderr)
        raise SystemExit("Vitest did not produce a parseable JSON report; run `npm test` and inspect its output.")

    results: list[dict] = []
    for file_result in report.get("testResults", []):
        source_file = file_result.get("name", "unknown")
        for assertion in file_result.get("assertionResults", []):
            title = " > ".join(assertion.get("ancestorTitles", []) + [assertion.get("title", "unnamed test")])
            case_id = f"{Path(source_file).name}::{title}"
            status = assertion.get("status", "unknown")
            failure = "\n".join(assertion.get("failureMessages", [])) or None
            expected = f"Vitest test passes: {title}"
            conn.execute(
                "INSERT INTO test_cases(case_id,suite,source_file,description,expected_behavior,case_type) VALUES(?,?,?,?,?,'unit') "
                "ON CONFLICT(case_id) DO UPDATE SET suite=excluded.suite,source_file=excluded.source_file,description=excluded.description,expected_behavior=excluded.expected_behavior",
                (case_id, args.suite, str(Path(source_file).relative_to(ROOT)), title, expected),
            )
            results.append({"case_id": case_id, "suite": args.suite, "source_file": str(Path(source_file).relative_to(ROOT)), "description": title, "expected": expected, "status": status, "failure": failure, "duration_ms": assertion.get("duration")})

    summary = report.get("numPassedTests", 0), report.get("numFailedTests", 0), report.get("numPendingTests", 0)
    run_status = "passed" if completed.returncode == 0 else "failed"
    raw_report = VERSIONS_DIR / args.version / "testcases" / f"run-{run_id}.json"
    raw_report.parent.mkdir(parents=True, exist_ok=True)
    raw_report.write_text(json.dumps({"run_id": run_id, "version_id": args.version, "started_at": started, "finished_at": finished, "mode": args.mode, "command": command, "summary": {"passed": summary[0], "failed": summary[1], "skipped": summary[2]}, "test_results": results}, indent=2), encoding="utf-8")
    conn.execute(
        "INSERT INTO test_runs(run_id,version_id,suite,mode,command,started_at,finished_at,status,passed,failed,skipped,raw_report_path) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        (run_id, args.version, args.suite, args.mode, " ".join(command[:-1] + ["<report-path>"]), started, finished, run_status, *summary, str(raw_report.relative_to(ROOT))),
    )
    for item in results:
        conn.execute(
            "INSERT INTO test_results(run_id,case_id,status,duration_ms,failure_message,actual_summary) VALUES(?,?,?,?,?,?)",
            (run_id, item["case_id"], item["status"], item["duration_ms"], item["failure"], "passed" if item["status"] == "passed" else item["failure"]),
        )
    conn.commit()
    conn.close()
    print(completed.stdout)
    if completed.stderr:
        print(completed.stderr, file=sys.stderr)
    print(f"Recorded {run_id}: {summary[0]} passed, {summary[1]} failed, {summary[2]} skipped")
    print(f"SQLite: {DB_PATH.relative_to(ROOT)}")
    print(f"Run report: {raw_report.relative_to(ROOT)}")
    if completed.returncode:
        raise SystemExit(completed.returncode)


def show_history(_: argparse.Namespace) -> None:
    conn = connect()
    for version in conn.execute("SELECT version_id,created_at,summary,status,source_commit FROM versions ORDER BY created_at"):
        print(f"{version['version_id']} [{version['status']}] {version['created_at']} — {version['summary']} (commit {version['source_commit'] or 'unavailable'})")
        for run in conn.execute("SELECT run_id,suite,mode,status,passed,failed,skipped FROM test_runs WHERE version_id=? ORDER BY started_at", (version["version_id"],)):
            print(f"  run {run['run_id']}: {run['suite']} / {run['mode']} / {run['status']} — {run['passed']} passed, {run['failed']} failed, {run['skipped']} skipped")
    conn.close()


def record_improvement(args: argparse.Namespace) -> None:
    conn = connect()
    source = conn.execute("SELECT version_id FROM versions WHERE version_id=?", (args.from_version,)).fetchone()
    if not source:
        raise SystemExit(f"Unknown source version {args.from_version}")
    if args.to_version and not conn.execute("SELECT 1 FROM versions WHERE version_id=?", (args.to_version,)).fetchone():
        raise SystemExit(f"Unknown target version {args.to_version}; create its snapshot first")
    if args.validation_run and not conn.execute("SELECT 1 FROM test_runs WHERE run_id=?", (args.validation_run,)).fetchone():
        raise SystemExit(f"Unknown validation run {args.validation_run}")
    failure_ids = [value.strip() for value in args.failures.split(",") if value.strip()]
    for case_id in failure_ids:
        if not conn.execute("SELECT 1 FROM test_cases WHERE case_id=?", (case_id,)).fetchone():
            raise SystemExit(f"Unknown failure case {case_id}; record its test run first")
    improvement_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO improvements(improvement_id,from_version_id,to_version_id,created_at,summary,source_failure_case_ids,executable_change,validation_run_id,decision,decision_reason) VALUES(?,?,?,?,?,?,?,?,?,?)",
        (improvement_id, args.from_version, args.to_version, now_iso(), args.summary, json.dumps(failure_ids), args.change, args.validation_run, args.decision, args.reason),
    )
    conn.commit()
    conn.close()
    print(f"Recorded improvement {improvement_id} ({args.decision})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(required=True)
    init_parser = subparsers.add_parser("init", help="Initialize the SQLite history database")
    init_parser.set_defaults(func=lambda _: print(f"Initialized {DB_PATH.relative_to(ROOT)}"))
    snapshot_parser = subparsers.add_parser("snapshot", help="Create the next immutable version snapshot")
    snapshot_parser.add_argument("--summary", required=True)
    snapshot_parser.set_defaults(func=snapshot)
    tests_parser = subparsers.add_parser("test", help="Run Vitest and persist case-by-case outcomes")
    tests_parser.add_argument("--version", required=True)
    tests_parser.add_argument("--suite", default="vitest")
    tests_parser.add_argument("--mode", choices=("real", "simulation", "offline"), default="offline")
    tests_parser.set_defaults(func=run_tests)
    history_parser = subparsers.add_parser("history", help="Show versions and evaluation runs")
    history_parser.set_defaults(func=show_history)
    improvement_parser = subparsers.add_parser("improvement", help="Record a proposed/validated improvement")
    improvement_parser.add_argument("--from-version", required=True)
    improvement_parser.add_argument("--to-version")
    improvement_parser.add_argument("--summary", required=True)
    improvement_parser.add_argument("--change", required=True, help="Executable policy/code change; describe the actual patch, not a wish")
    improvement_parser.add_argument("--failures", default="", help="Comma-separated recorded test case IDs that motivated it")
    improvement_parser.add_argument("--validation-run")
    improvement_parser.add_argument("--decision", choices=("proposed", "accepted", "rejected"), default="proposed")
    improvement_parser.add_argument("--reason", default="")
    improvement_parser.set_defaults(func=record_improvement)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
