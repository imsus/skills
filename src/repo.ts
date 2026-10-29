import { Effect, Schema } from "effect";
import { CategoryJsonUnreadable } from "./errors";
import { RepoFs } from "./repo-fs";
import { UPSTREAM_FILE } from "./upstream";

/** Directory under the repo root that holds the categories. */
export const SKILLS_DIR = "skills";
/** Category metadata file: `skills/<category>/category.json`. */
export const CATEGORY_META_FILE = "category.json";
/** Category changelog file: `skills/<category>/CHANGELOG.md`. */
export const CHANGELOG_FILE = "CHANGELOG.md";

// ---- Shapes ---------------------------------------------------------------

/**
 * The edge for `category.json`: a JSON object. `description` and `version`
 * stay `unknown` here because judging them is the category rules' job (each
 * failure carries its own rule id).
 */
export const CategoryJson = Schema.Struct({
  description: Schema.optionalKey(Schema.Unknown),
  version: Schema.optionalKey(Schema.Unknown),
});

/** What reading a category's metadata file produced. The contents are not validated. */
export const CategoryMeta = Schema.Union([
  Schema.TaggedStruct("Missing", {}),
  Schema.TaggedStruct("Unreadable", { error: Schema.String }),
  Schema.TaggedStruct("Loaded", CategoryJson.fields),
]);
export type CategoryMeta = typeof CategoryMeta.Type;

const SkillFields = {
  /** Folder name, e.g. `imsus-foo`. */
  name: Schema.String,
  /** Repo-relative path, e.g. `skills/web/imsus-foo`. */
  path: Schema.String,
  /** Category this folder sits in. */
  category: Schema.String,
  /** Names of the entries directly inside the folder, sorted. */
  files: Schema.Array(Schema.String),
  /** Contents of `SKILL.md`, or null if absent. */
  skillMd: Schema.NullOr(Schema.String),
};

/** A skill the curator wrote from scratch. */
export const OwnSkill = Schema.TaggedStruct("Own", SkillFields);
/** A skill copied from an upstream. A skill is a fork exactly when its folder contains `UPSTREAM.md`. */
export const ForkSkill = Schema.TaggedStruct("Fork", { ...SkillFields, upstreamMd: Schema.String });

export const Skill = Schema.Union([OwnSkill, ForkSkill]);
export type OwnSkill = typeof OwnSkill.Type;
export type ForkSkill = typeof ForkSkill.Type;
export type Skill = typeof Skill.Type;

export const Category = Schema.Struct({
  /** Folder name under `skills/`. */
  name: Schema.String,
  /** Repo-relative path, e.g. `skills/web`. */
  path: Schema.String,
  meta: CategoryMeta,
  /** Names of the entries directly inside the category folder, sorted. */
  files: Schema.Array(Schema.String),
  /** Skill folders, sorted by name. */
  skills: Schema.Array(Skill),
});
export type Category = typeof Category.Type;

export const Repo = Schema.Struct({
  /** Categories, sorted by name. */
  categories: Schema.Array(Category),
});
export type Repo = typeof Repo.Type;

export const isFork = (skill: Skill): skill is ForkSkill => skill._tag === "Fork";

/** Every skill folder in the repo, category by category. */
export const allSkills = (repo: Repo): Skill[] => repo.categories.flatMap((c) => c.skills);

// ---- Reading --------------------------------------------------------------

const decodeCategoryJson = Schema.decodeUnknownEffect(CategoryJson);

/** `category.json` text -> Loaded. The JSON parser's own message is kept for malformed text. */
const parseCategoryJson = (text: string) =>
  Effect.gen(function* () {
    const json = yield* Effect.try({
      try: () => JSON.parse(text) as unknown,
      catch: (e) => new CategoryJsonUnreadable({ message: e instanceof Error ? e.message : String(e) }),
    });
    const data = yield* decodeCategoryJson(json).pipe(
      Effect.mapError(() => new CategoryJsonUnreadable({ message: "not a JSON object" })),
    );
    return { _tag: "Loaded", ...data } as const;
  });

const readMeta = Effect.fnUntraced(
  function* (categoryPath: string) {
    const fs = yield* RepoFs;
    const text = yield* fs.readText(`${categoryPath}/${CATEGORY_META_FILE}`);
    if (text === null) return { _tag: "Missing" } as CategoryMeta;
    return (yield* parseCategoryJson(text)) as CategoryMeta;
  },
  Effect.catchTag("CategoryJsonUnreadable", (e) => Effect.succeed({ _tag: "Unreadable", error: e.message } as CategoryMeta)),
);

const readSkill = Effect.fnUntraced(function* (category: string, name: string) {
  const fs = yield* RepoFs;
  const path = `${SKILLS_DIR}/${category}/${name}`;
  const files = yield* fs.list(path);
  const skillMd = yield* fs.readText(`${path}/SKILL.md`);
  const base = { name, path, category, files, skillMd };
  if (!files.includes(UPSTREAM_FILE)) return { _tag: "Own", ...base } as Skill;
  const upstreamMd = yield* fs.readText(`${path}/${UPSTREAM_FILE}`);
  return { _tag: "Fork", ...base, upstreamMd: upstreamMd ?? "" } as Skill;
});

const readCategory = Effect.fnUntraced(function* (name: string) {
  const fs = yield* RepoFs;
  const path = `${SKILLS_DIR}/${name}`;
  return {
    name,
    path,
    meta: yield* readMeta(path),
    files: yield* fs.list(path),
    skills: yield* Effect.forEach(yield* fs.listDirs(path), (skill) => readSkill(name, skill)),
  } satisfies Category;
});

/** Read the repo layout. Malformed content is data (`Unreadable`), never an error; rules report it. */
export const readRepo = Effect.gen(function* () {
  const fs = yield* RepoFs;
  const categories = yield* Effect.forEach(yield* fs.listDirs(SKILLS_DIR), (name) => readCategory(name));
  return { categories } satisfies Repo;
});
