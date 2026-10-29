import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readRepo } from "../repo";
import type { Command } from "../command";
import type { Rule, Violation } from "./rule";

const RULES_DIR = join(import.meta.dir, "rules");

/** Load every `rules/*.ts` module's `rule` export, in filename order. */
async function loadRules(): Promise<Rule[]> {
  const files = readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();
  const rules: Rule[] = [];
  for (const f of files) {
    const mod = (await import(join(RULES_DIR, f))) as { rule?: Rule };
    if (typeof mod.rule === "function") rules.push(mod.rule);
  }
  return rules;
}

export async function collectViolations(root: string): Promise<Violation[]> {
  const repo = readRepo(root);
  return (await loadRules()).flatMap((rule) => rule(repo));
}

export const command: Command = {
  name: "check",
  summary: "Validate every skill folder against the repo conventions",
  async run({ root, out, err }) {
    const violations = await collectViolations(root);
    if (violations.length === 0) {
      out("check: ok");
      return 0;
    }
    for (const v of violations) err(`${v.path}: [${v.rule}] ${v.message}`);
    err(`check: ${violations.length} violation(s)`);
    return 1;
  },
};
