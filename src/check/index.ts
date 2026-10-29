import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Effect } from "effect";
import type { Command } from "../command";
import { reportFsError } from "../report";
import { readRepo } from "../repo";
import { Stdio } from "../stdio";
import type { Rule, Violation } from "./rule";

const RULES_DIR = join(import.meta.dir, "rules");

/** Load every `rules/*.ts` module's `rule` export, in filename order. A broken rule module is a defect. */
const loadRules = Effect.promise(async (): Promise<Rule[]> => {
  const files = readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();
  const rules: Rule[] = [];
  for (const f of files) {
    const mod = (await import(join(RULES_DIR, f))) as { rule?: Rule };
    if (typeof mod.rule === "function") rules.push(mod.rule);
  }
  return rules;
});

export const collectViolations = Effect.gen(function* () {
  const repo = yield* readRepo;
  const rules = yield* loadRules;
  return rules.flatMap((rule): Violation[] => rule(repo));
});

export const command: Command = {
  name: "check",
  summary: "Validate every skill folder against the repo conventions",
  run: () =>
    Effect.gen(function* () {
      const io = yield* Stdio;
      const violations = yield* collectViolations;
      if (violations.length === 0) {
        yield* io.out("check: ok");
        return 0;
      }
      for (const v of violations) yield* io.err(`${v.path}: [${v.rule}] ${v.message}`);
      yield* io.err(`check: ${violations.length} violation(s)`);
      return 1;
    }).pipe(Effect.catchTag("RepoFsError", reportFsError)),
};
