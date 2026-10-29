import { CATEGORY_META_FILE, CHANGELOG_FILE, SKILLS_DIR } from "../../repo";
import type { Rule, Violation } from "../rule";

const visible = (name: string) => !name.startsWith(".");

/**
 * Skill folders sit exactly two levels deep: `skills/<category>/<skill>/`.
 * Anything else directly under `skills/` or inside a category is reported,
 * except the category's own `category.json` and `CHANGELOG.md` and hidden
 * entries (which the reader skips).
 */
export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  const categories = new Set<string>(repo.categories.map((c) => c.name));
  for (const name of repo.files.filter(visible).filter((n) => !categories.has(n))) {
    out.push({ path: `${SKILLS_DIR}/${name}`, rule: "layout", message: "expected a category folder, found a file" });
  }
  for (const cat of repo.categories) {
    const skills = new Set<string>(cat.skills.map((s) => s.name));
    const own = new Set([CATEGORY_META_FILE, CHANGELOG_FILE]);
    for (const name of cat.files.filter(visible).filter((n) => !skills.has(n) && !own.has(n))) {
      out.push({ path: `${cat.path}/${name}`, rule: "layout", message: "expected a skill folder, found a file" });
    }
  }
  return out;
};
