import { Option } from "effect";
import { META_SKILLS } from "../../meta-skills";
import { allSkills } from "../../repo";
import type { Rule, Violation } from "../rule";

/** A `/imsus-<name>` slash command, not a path segment such as `skills/meta/imsus-ask`. */
const MENTION = /(?<![\w./-])\/(imsus-[a-z0-9]+(?:-[a-z0-9]+)*)/g;

/**
 * Router coverage: imsus-ask's SKILL.md names every other skill as
 * `/imsus-<name>`, and every `/imsus-*` it names is a skill. Only the SKILL.md
 * body counts: the frontmatter description is not a route, and the generated
 * `references/` (the catalog) would list every skill whether routed or not.
 * A tree without imsus-ask has no router, so nothing is reported.
 */
export const rule: Rule = (repo) => {
  const skills = allSkills(repo);
  const router = skills.find((s) => s.name === META_SKILLS.router);
  if (!router || Option.isNone(router.skillMd)) return [];

  const mentioned = new Set([...router.skillMd.value.body.matchAll(MENTION)].map((m) => m[1]!));
  const names = new Set<string>(skills.map((s) => s.name));
  const out: Violation[] = [];
  const report = (message: string) => out.push({ path: router.path, rule: "router-coverage", message });
  for (const name of [...names].filter((n) => n !== META_SKILLS.router && !mentioned.has(n))) {
    report(`SKILL.md does not route to /${name}`);
  }
  for (const name of [...mentioned].filter((n) => !names.has(n))) {
    report(`SKILL.md routes to /${name}, which is not a skill`);
  }
  return out;
};
