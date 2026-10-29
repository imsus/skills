import { Result } from "effect";
import { allSkills, isFork } from "../../repo";
import { UPSTREAM_FILE } from "../../upstream";
import type { Rule, Violation } from "../rule";

/** A fork needs valid `UPSTREAM.md` frontmatter and its upstream `LICENSE`. */
export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const skill of allSkills(repo).filter(isFork)) {
    if (Result.isFailure(skill.upstream)) {
      for (const p of skill.upstream.failure.problems) {
        out.push({ path: skill.path, rule: "fork-upstream", message: `${UPSTREAM_FILE}: ${p}` });
      }
    }
    if (!skill.files.includes("LICENSE")) {
      out.push({
        path: skill.path,
        rule: "fork-license",
        message: "fork must carry the upstream LICENSE in its folder",
      });
    }
  }
  return out;
};
