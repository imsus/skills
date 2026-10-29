import { Option } from "effect";
import { parseFrontmatter } from "../../frontmatter";
import { allSkills } from "../../repo";
import type { Rule, Violation } from "../rule";

const isUserOnly = (name: string) => name === "imsus-ask" || name === "imsus-retro" || name.startsWith("imsus-setup");

/**
 * User-only skills (imsus-ask, imsus-retro and every imsus-setup*) run only
 * when the user types them, so their frontmatter sets
 * `disable-model-invocation: true`. A missing SKILL.md is the skill rule's.
 */
export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const skill of allSkills(repo).filter((s) => isUserOnly(s.name))) {
    if (Option.isNone(skill.skillMd)) continue;
    const fm = parseFrontmatter(skill.skillMd.value) ?? {};
    if (fm["disable-model-invocation"] !== "true") {
      out.push({
        path: skill.path,
        rule: "user-only",
        message: "user-only skill must set disable-model-invocation: true in frontmatter",
      });
    }
  }
  return out;
};
