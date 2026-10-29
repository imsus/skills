import { category, categoryJson, type Files } from "./tree";

/** A category with explicit metadata, for tests that need distinct versions. */
export function categoryWith(
  name: string,
  skills: string[],
  description: string,
  version: string,
): Files {
  return {
    ...category(name, skills),
    [`skills/${name}/category.json`]: categoryJson(description, version),
  };
}
