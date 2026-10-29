import { CATEGORY_META_FILE, CHANGELOG_FILE } from "../../repo";
import type { Rule, Violation } from "../rule";

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const cat of repo.categories) {
    const report = (id: string, message: string) => out.push({ path: cat.path, rule: id, message });
    if (cat.meta.status === "missing") {
      report("category-meta", `missing ${CATEGORY_META_FILE}`);
    } else if (cat.meta.status === "unreadable") {
      report("category-meta", `${CATEGORY_META_FILE} is unreadable: ${cat.meta.error}`);
    } else {
      const { description, version } = cat.meta.data;
      if (typeof description !== "string" || !description.trim()) {
        report("category-description", `${CATEGORY_META_FILE} description is missing or empty`);
      }
      if (typeof version !== "string" || !SEMVER.test(version)) {
        report("category-version", `${CATEGORY_META_FILE} version ${JSON.stringify(version)} is not valid semver`);
      }
    }
    if (!cat.files.includes(CHANGELOG_FILE)) {
      report("category-changelog", `missing ${CHANGELOG_FILE}`);
    }
  }
  return out;
};
