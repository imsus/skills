import { afterEach, beforeEach, expect, test } from "bun:test";
import { cpSync, mkdtempSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * imsus-retro's find-session.mjs, run under Node (its only runtime) against a
 * redacted fixture shaped on real Claude Code transcript lines. The fixture is
 * copied so mtimes (which git does not keep) can be set: session 1 is newer.
 */

const SCRIPT = resolve(import.meta.dir, "../skills/meta/imsus-retro/scripts/find-session.mjs");
const FIXTURE = resolve(import.meta.dir, "fixtures/find-session");
const S1 = "aaaaaaaa-0000-0000-0000-000000000001";
const S2 = "bbbbbbbb-0000-0000-0000-000000000002";

let projects: string;
beforeEach(() => {
  projects = mkdtempSync(join(tmpdir(), "find-session-"));
  cpSync(FIXTURE, projects, { recursive: true });
  const dir = join(projects, "-fixture-project");
  utimesSync(join(dir, `${S2}.jsonl`), new Date("2026-10-28T09:00:00Z"), new Date("2026-10-28T09:00:00Z"));
  utimesSync(join(dir, `${S1}.jsonl`), new Date("2026-10-29T09:00:00Z"), new Date("2026-10-29T09:00:00Z"));
});
afterEach(() => rmSync(projects, { recursive: true, force: true }));

function run(args: string[], env: Record<string, string> = {}) {
  const { CLAUDE_CODE_SESSION_ID: _, ...rest } = Bun.env;
  const proc = Bun.spawnSync(["node", SCRIPT, "--projects-dir", projects, ...args], {
    env: { ...rest, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = proc.stdout.toString();
  return { code: proc.exitCode, stdout, stderr: proc.stderr.toString(), json: proc.exitCode === 0 ? JSON.parse(stdout) : null };
}

test("encodes the cwd like Claude Code and extracts the latest session", () => {
  const r = run(["--cwd", "/fixture/project"]);
  expect(r.stderr).toBe("");
  expect(r.json.projectDir).toBe(join(projects, "-fixture-project"));
  expect(r.json.selectedBy).toBe("latest");
  expect(r.json.session.id).toBe(S1);
  expect(r.json.session.malformedLines).toBe(1);
});

test("first prompt skips meta records and is truncated", () => {
  const { json } = run(["--cwd", "/fixture/project"]);
  expect(json.firstPrompt.text.startsWith("<command-name>/implement</command-name>")).toBe(true);
  expect(json.firstPrompt.text).toMatch(/… \[\+\d+ chars\]$/);
  expect(json.firstPrompt.text.length).toBeLessThan(330);
});

test("models and effort per turn, subagent models, errors, retry gap, turns, compactions", () => {
  const { json } = run(["--cwd", "/fixture/project"]);
  expect(json.models).toEqual([
    { model: "claude-opus-5-5", effort: "medium", turns: 2 },
    { model: "claude-sonnet-5-5", effort: "high", turns: 1 },
  ]);
  expect(json.subagentModels.shown).toEqual([{ agentId: "a1", description: "Implement #42", resolvedModel: "claude-sonnet-5-5" }]);
  expect(json.subagents.shown[0]).toMatchObject({ id: "agent-a1", agentType: "general-purpose", toolErrors: 1 });
  expect(json.toolErrors.count).toBe(1);
  expect(json.toolErrors.shown[0].tool).toBe("Bash");
  expect(json.toolErrors.shown[0].text.length).toBeLessThan(230);
  expect(json.apiErrors.shown[0]).toMatchObject({ attempt: 1, networkDown: true, message: "Connection refused (ECONNREFUSED)" });
  expect(json.apiErrorMessages.shown[0].error).toBe("rate_limit");
  expect(json.retryGap).toMatchObject({ available: true, gapMs: 2000, costUSD: 1.23 });
  expect(json.turnDurations).toMatchObject({ count: 2, totalMs: 50000, maxMs: 40000 });
  expect(json.compactions.shown[0]).toEqual({ at: "2026-10-29T08:00:33.000Z", trigger: "manual", preTokens: 500000 });
});

test("CLAUDE_CODE_SESSION_ID picks the current session over the latest", () => {
  const { json } = run(["--cwd", "/fixture/project"], { CLAUDE_CODE_SESSION_ID: S2 });
  expect(json.selectedBy).toBe("CLAUDE_CODE_SESSION_ID");
  expect(json.session.id).toBe(S2);
  expect(json.retryGap.available).toBe(false);
});

test("--session takes an id or a transcript path, including a subagent's", () => {
  expect(run(["--cwd", "/fixture/project", "--session", S2]).json.session.id).toBe(S2);
  const sub = run(["--session", join(projects, "-fixture-project", S1, "subagents", "agent-a1.jsonl")]).json;
  expect(sub.firstPrompt.text).toBe("You are an implementer for #42 (redacted brief)");
  expect(sub.toolErrors.count).toBe(1);
});

test("a .claude/worktrees cwd falls back to the main checkout's folder", () => {
  const { json } = run(["--cwd", "/fixture/project/.claude/worktrees/agent-x"]);
  expect(json.projectDir).toBe(join(projects, "-fixture-project"));
});

test("--list shows sessions newest first; an unknown project fails with what was tried", () => {
  const list = run(["--cwd", "/fixture/project", "--list"]).json;
  expect(list.sessions.shown.map((s: { id: string }) => s.id)).toEqual([S1, S2]);
  const missing = run(["--cwd", "/nowhere"]);
  expect(missing.code).toBe(1);
  expect(missing.stderr).toContain("-nowhere");
});
