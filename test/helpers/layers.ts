import { Effect, Layer } from "effect";
import type { NewIssue } from "../../src/drift/issue-client";
import { IssueClient } from "../../src/drift/issue-client";
import { Stdio } from "../../src/stdio";

/** Test layer for `Stdio`: lines land in the given arrays instead of the process streams. */
export const captureStdio = (out: string[], err: string[]) =>
  Layer.succeed(
    Stdio,
    Stdio.of({
      out: (line) => Effect.sync(() => void out.push(line)),
      err: (line) => Effect.sync(() => void err.push(line)),
    }),
  );

export interface FakeIssue extends NewIssue {
  number: number;
}

/** Test layer for `IssueClient`: an in-memory tracker. Read `issues` after the run. */
export function memoryIssues() {
  const issues: FakeIssue[] = [];
  const layer = Layer.succeed(
    IssueClient,
    IssueClient.of({
      findOpen: (title) => Effect.sync(() => issues.find((i) => i.title === title) ?? null),
      create: (issue) => Effect.sync(() => void issues.push({ number: issues.length + 1, ...issue })),
      update: (number, body) =>
        Effect.sync(() => {
          issues.find((i) => i.number === number)!.body = body;
        }),
    }),
  );
  return { layer, issues };
}
