import { expect, test } from "bun:test";
import type { DriftEntry } from "../src/drift/run";
import { syncDriftIssues, type IssueClient } from "../src/drift/issues";

const A = "0123456789abcdef0123456789abcdef01234567";
const B = "fedcba9876543210fedcba9876543210fedcba98";

function entry(over: Partial<DriftEntry> = {}): DriftEntry {
  return {
    skill: "imsus-foo", category: "web", path: "skills/web/imsus-foo",
    upstreamRepo: "someone/skills", upstreamPath: "skills/foo",
    outcome: "drifted", recordedSha: A, latestSha: B,
    compareUrl: `https://github.com/someone/skills/compare/${A}...${B}`, error: null, ...over,
  };
}

function fakeClient() {
  const issues: { number: number; title: string; body: string; labels: string[] }[] = [];
  const client: IssueClient = {
    async findOpen(title) { return issues.find((i) => i.title === title) ?? null; },
    async create(i) { issues.push({ number: issues.length + 1, ...i }); },
    async update(number, body) { issues.find((i) => i.number === number)!.body = body; },
  };
  return { client, issues };
}

test("a drifted fork opens exactly one issue naming the fork with the compare URL", async () => {
  const { client, issues } = fakeClient();
  await syncDriftIssues([entry()], client);
  expect(issues).toHaveLength(1);
  expect(issues[0]!.title).toBe("Drift: web/imsus-foo");
  expect(issues[0]!.body).toContain(entry().compareUrl!);
});

test("a second run updates the open issue instead of duplicating it", async () => {
  const { client, issues } = fakeClient();
  await syncDriftIssues([entry()], client);
  const C = "1111111111111111111111111111111111111111";
  await syncDriftIssues([entry({ latestSha: C, compareUrl: `https://github.com/someone/skills/compare/${A}...${C}` })], client);
  expect(issues).toHaveLength(1);
  expect(issues[0]!.body).toContain(`...${C}`);
});

test("an unreachable fork opens an issue with the error", async () => {
  const { client, issues } = fakeClient();
  await syncDriftIssues([entry({ outcome: "unreachable", latestSha: null, compareUrl: null, error: "GitHub API 404" })], client);
  expect(issues).toHaveLength(1);
  expect(issues[0]!.body).toContain("GitHub API 404");
});

test("up-to-date forks and an empty list open no issues", async () => {
  const { client, issues } = fakeClient();
  await syncDriftIssues([], client);
  await syncDriftIssues([entry({ outcome: "up-to-date", compareUrl: null })], client);
  expect(issues).toHaveLength(0);
});
