import { allSkills, isFork } from "../../repo";
import { parseUpstream, UPSTREAM_FILE } from "../../upstream";
import type { Rule, Violation } from "../rule";

/** A fork needs valid `UPSTREAM.md` frontmatter and its upstream `LICENSE`. */
export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const skill of allSkills(repo).filter(isFork)) {
    const parsed = parseUpstream(skill.upstreamMd);
    if (!parsed.ok) {
      for (const p of parsed.problems) {
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
