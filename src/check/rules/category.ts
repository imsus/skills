import { Schema } from "effect";
import { CATEGORY_META_FILE, CHANGELOG_FILE } from "../../repo";
import type { Rule, Violation } from "../rule";

const Semver = Schema.String.check(
  Schema.isPattern(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  ),
);
const NonBlank = Schema.String.check(Schema.isPattern(/\S/));
const isSemver = Schema.is(Semver);
const isNonBlank = Schema.is(NonBlank);

export const rule: Rule = (repo) => {
  const out: Violation[] = [];
  for (const cat of repo.categories) {
    const report = (id: string, message: string) => out.push({ path: cat.path, rule: id, message });
    if (cat.meta._tag === "Missing") {
      report("category-meta", `missing ${CATEGORY_META_FILE}`);
    } else if (cat.meta._tag === "Unreadable") {
      report("category-meta", `${CATEGORY_META_FILE} is unreadable: ${cat.meta.error}`);
    } else {
      const { description, version } = cat.meta;
      if (!isNonBlank(description)) {
        report("category-description", `${CATEGORY_META_FILE} description is missing or empty`);
      }
      if (!isSemver(version)) {
        report("category-version", `${CATEGORY_META_FILE} version ${JSON.stringify(version)} is not valid semver`);
      }
    }
    if (!cat.files.includes(CHANGELOG_FILE)) {
      report("category-changelog", `missing ${CHANGELOG_FILE}`);
    }
  }
  return out;
};
