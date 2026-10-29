import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Directory under the repo root that holds the categories. */
export const SKILLS_DIR = "skills";
/** Category metadata file: `skills/<category>/category.json`. */
export const CATEGORY_META_FILE = "category.json";

/**
 * Raw result of reading a category's metadata file. The reader does not
 * validate the contents (that is a check rule's job).
 */
export type CategoryMeta =
  | { status: "missing" }
  | { status: "unreadable"; error: string }
  | { status: "loaded"; data: Record<string, unknown> };

export interface SkillFolder {
  /** Folder name, e.g. `imsus-foo`. */
  name: string;
  /** Repo-relative path, e.g. `skills/web/imsus-foo`. */
  path: string;
  /** Absolute path. */
  dir: string;
  /** Category this folder sits in. */
  category: string;
  /** Names of the entries directly inside the folder, sorted. */
  files: string[];
  /** Contents of `SKILL.md`, or null if absent. */
  skillMd: string | null;
  /** A skill is a fork exactly when its folder contains `UPSTREAM.md`. */
  isFork: boolean;
}

export interface Category {
  /** Folder name under `skills/`. */
  name: string;
  /** Repo-relative path, e.g. `skills/web`. */
  path: string;
  dir: string;
  meta: CategoryMeta;
  /** Skill folders, sorted by name. */
  skills: SkillFolder[];
}

export interface Repo {
  root: string;
  /** Categories, sorted by name. */
  categories: Category[];
}

function subdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => !n.startsWith(".") && statSync(join(dir, n)).isDirectory())
    .sort();
}

function readMeta(categoryDir: string): CategoryMeta {
  const file = join(categoryDir, CATEGORY_META_FILE);
  if (!existsSync(file)) return { status: "missing" };
  try {
    const data: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { status: "unreadable", error: "not a JSON object" };
    }
    return { status: "loaded", data: data as Record<string, unknown> };
  } catch (e) {
    return { status: "unreadable", error: (e as Error).message };
  }
}

function readSkill(root: string, category: string, name: string): SkillFolder {
  const path = `${SKILLS_DIR}/${category}/${name}`;
  const dir = join(root, path);
  const files = readdirSync(dir).sort();
  const skillMdPath = join(dir, "SKILL.md");
  return {
    name,
    path,
    dir,
    category,
    files,
    skillMd: existsSync(skillMdPath) ? readFileSync(skillMdPath, "utf8") : null,
    isFork: files.includes("UPSTREAM.md"),
  };
}

/** Read the repo layout. Never throws on malformed content; rules report it. */
export function readRepo(root: string): Repo {
  const skillsRoot = join(root, SKILLS_DIR);
  const categories = subdirs(skillsRoot).map((name): Category => {
    const dir = join(skillsRoot, name);
    return {
      name,
      path: `${SKILLS_DIR}/${name}`,
      dir,
      meta: readMeta(dir),
      skills: subdirs(dir).map((skill) => readSkill(root, name, skill)),
    };
  });
  return { root, categories };
}

/** Every skill folder in the repo, category by category. */
export function allSkills(repo: Repo): SkillFolder[] {
  return repo.categories.flatMap((c) => c.skills);
}
