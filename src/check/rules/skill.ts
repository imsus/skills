import { Option } from "effect";
import { allSkills } from "../../repo";
import type { Rule, Violation } from "../rule";

const PREFIX = "imsus-";

/** Naming and SKILL.md rules for every skill, own or fork. */
export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  const skills = allSkills(repo);
  for (const skill of skills) {
    const report = (id: string, message: string) => out.push({ path: skill.path, rule: id, message });
    if (!skill.name.startsWith(PREFIX)) {
      report("skill-prefix", `folder name "${skill.name}" must start with "${PREFIX}"`);
    }
    if (Option.isNone(skill.skillMd)) {
      report("skill-md-missing", "folder has no SKILL.md");
      continue;
    }
    const md = skill.skillMd.value;
    if (md.name !== skill.name) {
      report("skill-name", `folder name "${skill.name}" must equal frontmatter name "${md.name ?? ""}"`);
    }
    if (!md.description?.trim()) {
      report("skill-description", "frontmatter description is missing or empty");
    }
  }

  const byName = new Map<string, string[]>();
  for (const skill of skills) byName.set(skill.name, [...(byName.get(skill.name) ?? []), skill.path]);
  for (const [name, paths] of byName) {
    if (paths.length > 1) {
      out.push({
        path: paths[0]!,
        rule: "skill-unique",
        message: `skill name "${name}" appears in more than one category: ${paths.join(", ")}`,
      });
    }
  }
  return out;
};
