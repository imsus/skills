import { parseFrontmatter } from "../../frontmatter";
import type { Rule, Violation } from "../rule";

const PREFIX = "imsus-";

export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const cat of repo.categories) {
    for (const skill of cat.skills) {
      const v = (rule: string, message: string) => out.push({ path: skill.path, rule, message });
      if (!skill.name.startsWith(PREFIX)) {
        v("skill-prefix", `folder name "${skill.name}" must start with "${PREFIX}"`);
      }
      if (skill.skillMd === null) {
        v("skill-md-missing", "folder has no SKILL.md");
        continue;
      }
      const fm = parseFrontmatter(skill.skillMd) ?? {};
      if (fm.name !== skill.name) {
        v("skill-name", `folder name "${skill.name}" must equal frontmatter name "${fm.name ?? ""}"`);
      }
      if (!fm.description?.trim()) {
        v("skill-description", "frontmatter description is missing or empty");
      }
    }
  }

  const byName = new Map<string, string[]>();
  for (const cat of repo.categories) {
    for (const skill of cat.skills) byName.set(skill.name, [...(byName.get(skill.name) ?? []), skill.path]);
  }
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
