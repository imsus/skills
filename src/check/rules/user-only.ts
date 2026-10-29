import { Option } from "effect";
import { isUserOnly } from "../../meta-skills";
import { allSkills } from "../../repo";
import type { Rule, Violation } from "../rule";

/**
 * User-only skills (`isUserOnly`: imsus-ask, imsus-retro and every imsus-setup*) run only
 * when the user types them, so their frontmatter sets
 * `disable-model-invocation: true`. A missing SKILL.md is the skill rule's.
 */
export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const skill of allSkills(repo).filter((s) => isUserOnly(s.name))) {
    if (Option.exists(skill.skillMd, (md) => !md.disableModelInvocation)) {
      out.push({
        path: skill.path,
        rule: "user-only",
        message: "user-only skill must set disable-model-invocation: true in frontmatter",
      });
    }
  }
  return out;
};
