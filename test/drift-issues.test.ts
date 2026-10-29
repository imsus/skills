import { expect, test } from "bun:test";
import { Effect } from "effect";
import { syncDriftIssues } from "../src/drift/issues";
import { decodeReport, encodeReport, type DriftEntry } from "../src/drift/shapes";
import { memoryIssues } from "./helpers/layers";

const A = "0123456789abcdef0123456789abcdef01234567";
const B = "fedcba9876543210fedcba9876543210fedcba98";

const drifted = (latest: string): DriftEntry["outcome"] => ({
  _tag: "Drifted",
  latestSha: latest,
  compareUrl: `https://github.com/someone/skills/compare/${A}...${latest}`,
});

function entry(outcome: DriftEntry["outcome"] = drifted(B)): DriftEntry {
  return {
    skill: "imsus-foo", category: "web", path: "skills/web/imsus-foo",
    upstream: { repo: "someone/skills", path: "skills/foo", sha: A },
    outcome,
  };
}

/** Run the sync against the in-memory tracker. */
function sync(tracker: ReturnType<typeof memoryIssues>, entries: DriftEntry[]) {
  return Effect.runPromise(syncDriftIssues(entries).pipe(Effect.provide(tracker.layer)));
}

test("a drifted fork opens exactly one issue naming the fork with the compare URL", async () => {
  const tracker = memoryIssues();
  await sync(tracker, [entry()]);
  expect(tracker.issues).toHaveLength(1);
  expect(tracker.issues[0]!.title).toBe("Drift: web/imsus-foo");
  expect(tracker.issues[0]!.body).toContain(`https://github.com/someone/skills/compare/${A}...${B}`);
});

test("a second run updates the open issue instead of duplicating it", async () => {
  const tracker = memoryIssues();
  await sync(tracker, [entry()]);
  const C = "1111111111111111111111111111111111111111";
  await sync(tracker, [entry(drifted(C))]);
  expect(tracker.issues).toHaveLength(1);
  expect(tracker.issues[0]!.body).toContain(`...${C}`);
});

test("an unreachable fork opens an issue with the error", async () => {
  const tracker = memoryIssues();
  await sync(tracker, [entry({ _tag: "Unreachable", error: "GitHub API 404" })]);
  expect(tracker.issues).toHaveLength(1);
  expect(tracker.issues[0]!.body).toContain("GitHub API 404");
});

test("up-to-date forks and an empty list open no issues", async () => {
  const tracker = memoryIssues();
  await sync(tracker, []);
  await sync(tracker, [entry({ _tag: "UpToDate", latestSha: A })]);
  expect(tracker.issues).toHaveLength(0);
});

// ---- The drift.json edge ----------------------------------------------------

const wire = (over: Record<string, unknown> = {}) => ({
  skill: "imsus-foo", category: "web", path: "skills/web/imsus-foo",
  upstreamRepo: "someone/skills", upstreamPath: "skills/foo",
  outcome: "drifted", recordedSha: A, latestSha: B,
  compareUrl: `https://github.com/someone/skills/compare/${A}...${B}`, error: null, ...over,
});

const rejected = (value: unknown) =>
  Effect.runPromise(Effect.flip(decodeReport("drift.json", JSON.stringify(value))).pipe(Effect.map((e) => e._tag)));

test("drift --json output decodes into domain entries and encodes back", async () => {
  const entries = [
    entry(),
    entry({ _tag: "UpToDate", latestSha: A }),
    entry({ _tag: "Unreachable", error: "GitHub API 404" }),
  ];
  const text = await Effect.runPromise(encodeReport(entries));
  expect(await Effect.runPromise(decodeReport("drift.json", text))).toEqual(entries);
  expect(JSON.parse(text)[2]).toEqual(
    wire({ outcome: "unreachable", latestSha: null, compareUrl: null, error: "GitHub API 404" }),
  );
});

test("a drift report whose entry contradicts its outcome is rejected", async () => {
  expect(await rejected([wire({ compareUrl: null })])).toBe("DriftReportError");
  expect(await rejected([wire({ outcome: "unreachable" })])).toBe("DriftReportError");
  expect(await rejected([wire({ outcome: "nonsense" })])).toBe("DriftReportError");
});

test("a drift report that is not a JSON array of entries is rejected", async () => {
  expect(await rejected({ skill: "x" })).toBe("DriftReportError");
  expect(await rejected([wire({ recordedSha: undefined })])).toBe("DriftReportError");
  const bad = await Effect.runPromise(Effect.flip(decodeReport("drift.json", "{nope")));
  expect(bad.path).toBe("drift.json");
});
