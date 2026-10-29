import type { Repo } from "../repo";

export interface Violation {
  /** Repo-relative path of the offending file or folder. */
  path: string;
  /** Stable rule id, e.g. `skill-prefix`. */
  rule: string;
  message: string;
}

/**
 * A check rule inspects the whole repo and returns every violation it finds.
 *
 * To add a rule, create `src/check/rules/<anything>.ts` that exports
 * `rule: Rule`. Rule files are discovered automatically; no registry to edit.
 */
export type Rule = (repo: Repo) => Violation[];
