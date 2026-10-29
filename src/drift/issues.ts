import { Effect } from "effect";
import { DriftReportError } from "../errors";
import { RepoFs } from "../repo-fs";
import { DRIFT_LABEL, IssueClient } from "./issue-client";
import { decodeReport, type DriftEntry } from "./shapes";

export const issueTitle = (e: DriftEntry) => `Drift: ${e.category}/${e.skill}`;

/** The issue text for a fork that needs attention; null for an up-to-date fork. */
function issueBody(e: DriftEntry): string | null {
  const where = `\`${e.path}\``;
  const { repo, path, sha } = e.upstream;
  switch (e.outcome._tag) {
    case "Unreachable":
      return [
        `Upstream of ${where} could not be checked.`,
        "",
        `- Upstream: ${repo} (${path})`,
        `- Recorded SHA: ${sha}`,
        `- Error: ${e.outcome.error}`,
      ].join("\n");
    case "UpToDate":
      return null;
    case "Drifted":
      return [
        `Upstream of ${where} has new commits since the recorded SHA.`,
        "",
        `- Upstream: ${repo} (${path})`,
        `- Recorded SHA: ${sha}`,
        `- Latest SHA: ${e.outcome.latestSha}`,
        `- Compare: ${e.outcome.compareUrl}`,
      ].join("\n");
  }
}

/** Open or update one issue per drifted or unreachable fork. Never closes anything. */
export const syncDriftIssues = (entries: readonly DriftEntry[]) =>
  Effect.gen(function* () {
    const issues = yield* IssueClient;
    for (const e of entries) {
      const body = issueBody(e);
      if (body === null) continue;
      const title = issueTitle(e);
      const existing = yield* issues.findOpen(title);
      if (existing) yield* issues.update(existing.number, body);
      else yield* issues.create({ title, body, labels: [DRIFT_LABEL] });
    }
  });

/** `scripts/drift-issues.ts`: read `drift --json` output from `file`, then sync the issues. */
export const syncDriftIssuesFromFile = (file: string) =>
  Effect.gen(function* () {
    const fs = yield* RepoFs;
    const text = yield* fs.readText(file);
    if (text === null) return yield* new DriftReportError({ path: file, message: "no such file" });
    yield* syncDriftIssues(yield* decodeReport(file, text));
  }).pipe(
    Effect.catchTag("RepoFsError", (e) => Effect.fail(new DriftReportError({ path: e.path, message: e.message }))),
  );
