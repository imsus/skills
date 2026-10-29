import { readFileSync } from "node:fs";
import type { Command } from "../command";
import { syncDriftIssues, type IssueClient } from "../drift/issues";
import type { DriftEntry } from "../drift/run";

async function gh(args: string[]): Promise<string> {
  const p = Bun.spawn(["gh", ...args], { stdout: "pipe", stderr: "inherit" });
  const out = await new Response(p.stdout).text();
  if ((await p.exited) !== 0) throw new Error(`gh ${args.join(" ")} failed`);
  return out;
}

const ghClient: IssueClient = {
  async findOpen(title) {
    const list = JSON.parse(
      await gh(["issue", "list", "--state", "open", "--label", "drift", "--search", `"${title}" in:title`, "--json", "number,title"]),
    ) as { number: number; title: string }[];
    return list.find((i) => i.title === title) ?? null;
  },
  async create({ title, body, labels }) {
    const url = (await gh(["issue", "create", "--title", title, "--body", body, ...labels.flatMap((l) => ["--label", l])])).trim();
    return Number(url.split("/").pop());
  },
  async update(number, body) {
    await gh(["issue", "edit", String(number), "--body", body]);
  },
};

export const command: Command = {
  name: "drift-issues",
  summary: "Open or update one issue per drifted/unreachable fork from a `drift --json` file",
  async run({ args, err }) {
    const file = args[0];
    if (!file) {
      err("usage: drift-issues <drift.json>");
      return 2;
    }
    await syncDriftIssues(JSON.parse(readFileSync(file, "utf8")) as DriftEntry[], ghClient);
    return 0;
  },
};
