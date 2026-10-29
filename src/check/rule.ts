import { Schema } from "effect";
import type { Repo } from "../repo";

/** One broken convention, located at a repo-relative path. */
export const Violation = Schema.Struct({
  /** Repo-relative path of the offending file or folder. */
  path: Schema.String,
  /** Stable rule id, e.g. `skill-prefix`. */
  rule: Schema.String,
  message: Schema.String,
});
export type Violation = typeof Violation.Type;

/**
 * A check rule inspects the whole repo and returns every violation it finds.
 * Rules are pure: everything they need is already in the `Repo`.
 *
 * To add a rule, create `src/check/rules/<anything>.ts` that exports
 * `rule: Rule`. Rule files are discovered automatically; no registry to edit.
 */
export type Rule = (repo: Repo) => Violation[];
