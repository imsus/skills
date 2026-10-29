import { Array, Effect, Match, Option } from "effect";
import { DriftReportError } from "../errors";
import { RepoFs } from "../repo-fs";
import { DRIFT_LABEL, IssueClient } from "./issue-client";
import { decodeReport, type DriftEntry } from "./shapes";

export const issueTitle = (e: DriftEntry) => `Drift: ${e.category}/${e.skill}`;

/** The issue text for a fork that needs attention; none for an up-to-date fork. */
function issueBody(e: DriftEntry): Option.Option<string> {
  const where = `\`${e.path}\``;
  const { repo, path, sha } = e.upstream;
  return Match.valueTags(e.outcome, {
    UpToDate: () => Option.none<string>(),
    Drifted: (o) =>
      Option.some(
        [
          `Upstream of ${where} has new commits since the recorded SHA.`,
          "",
          `- Upstream: ${repo} (${path})`,
          `- Recorded SHA: ${sha}`,
          `- Latest SHA: ${o.latestSha}`,
          `- Compare: ${o.compareUrl}`,
        ].join("\n"),
      ),
    Unreachable: (o) =>
      Option.some(
        [
          `Upstream of ${where} could not be checked.`,
          "",
          `- Upstream: ${repo} (${path})`,
          `- Recorded SHA: ${sha}`,
          `- Error: ${o.error}`,
        ].join("\n"),
      ),
  });
}

/** Open or update one issue per drifted or unreachable fork. Never closes anything. */
export const syncDriftIssues = (entries: readonly DriftEntry[]) =>
  Effect.gen(function* () {
    const issues = yield* IssueClient;
    const open = yield* issues.listOpen();
    for (const e of entries) {
      const body = issueBody(e);
      if (Option.isNone(body)) continue;
      const title = issueTitle(e);
      const existing = Array.findFirst(open, (i) => i.title === title);
      if (Option.isSome(existing)) yield* issues.update(existing.value.number, body.value);
      else yield* issues.create({ title, body: body.value, labels: [DRIFT_LABEL] });
    }
  });

/** `scripts/drift-issues.ts`: read `drift --json` output from `file`, then sync the issues. */
export const syncDriftIssuesFromFile = (file: string) =>
  Effect.gen(function* () {
    const fs = yield* RepoFs;
    const text = yield* fs.readText(file);
    const entries = yield* Option.match(text, {
      onNone: () => Effect.fail(new DriftReportError({ path: file, message: "no such file" })),
      onSome: (t) => decodeReport(file, t),
    });
    yield* syncDriftIssues(entries);
  }).pipe(
    Effect.catchTag("RepoFsError", (e) => Effect.fail(new DriftReportError({ path: e.path, message: e.message }))),
  );
