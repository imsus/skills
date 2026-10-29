#!/usr/bin/env bun
// Usage: bun run scripts/drift-issues.ts <drift.json>
// Opens or updates one issue per drifted/unreachable fork from `drift --json` output.
import { Effect, Layer } from "effect";
import { IssueClient } from "../src/drift/issue-client";
import { syncDriftIssuesFromFile } from "../src/drift/issues";
import { RepoFs } from "../src/repo-fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: bun run scripts/drift-issues.ts <drift.json>");
  process.exit(2);
}

const live = Layer.mergeAll(RepoFs.layer(process.cwd()), IssueClient.layerGh);

const program = syncDriftIssuesFromFile(file).pipe(
  Effect.as(0),
  Effect.catchTags({
    DriftReportError: (e) => Effect.sync(() => (console.error(`${e.path}: ${e.message}`), 1)),
    IssueClientError: (e) => Effect.sync(() => (console.error(e.message), 1)),
  }),
);

process.exit(await Effect.runPromise(program.pipe(Effect.provide(live))));
