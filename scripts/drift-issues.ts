#!/usr/bin/env bun
// Usage: bun run scripts/drift-issues.ts <drift.json>
// Opens or updates one issue per drifted/unreachable fork from `drift --json` output.
import { readFileSync } from "node:fs";
import { syncDriftIssues, type IssueClient } from "../src/drift/issues";
import type { DriftEntry } from "../src/drift/run";

async function gh(args: string[]): Promise<string> {
  const p = Bun.spawn(["gh", ...args], { stdout: "pipe", stderr: "inherit" });
  const out = await new Response(p.stdout).text();
  if ((await p.exited) !== 0) throw new Error(`gh ${args.join(" ")} failed`);
  return out;
}

const ghClient: IssueClient = {
  async findOpen(title) {
    const list = JSON.parse(
      await gh(["issue", "list", "--label", "drift", "--state", "open", "--limit", "1000", "--json", "number,title"]),
    ) as { number: number; title: string }[];
    return list.find((i) => i.title === title) ?? null;
  },
  async create({ title, body, labels }) {
    await gh(["issue", "create", "--title", title, "--body", body, ...labels.flatMap((l) => ["--label", l])]);
  },
  async update(number, body) {
    await gh(["issue", "edit", String(number), "--body", body]);
  },
};

const file = process.argv[2];
if (!file) {
  console.error("usage: bun run scripts/drift-issues.ts <drift.json>");
  process.exit(2);
}
await syncDriftIssues(JSON.parse(readFileSync(file, "utf8")) as DriftEntry[], ghClient);
