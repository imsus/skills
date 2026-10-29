import { Cause, Effect, Option, Schema } from "effect";
import { CategoryJsonUnreadable, InvalidUpstream, type RepoFsError } from "./errors";
import { CategoryName, SkillName } from "./ids";
import { RepoFs } from "./repo-fs";
import { parseUpstream, Upstream, UPSTREAM_FILE } from "./upstream";

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
  name: SkillName,
  /** Repo-relative path, e.g. `skills/web/imsus-foo`. */
  path: Schema.String,
  /** Category this folder sits in. */
  category: CategoryName,
  /** Names of the entries directly inside the folder, sorted. */
  files: Schema.Array(Schema.String),
  /** Contents of `SKILL.md`, if present. */
  skillMd: Schema.Option(Schema.String),
};

/** A skill the curator wrote from scratch. */
export const OwnSkill = Schema.TaggedStruct("Own", SkillFields);
/**
 * A skill copied from an upstream. A skill is a fork exactly when its folder
 * contains `UPSTREAM.md`, which is decoded once, when the repo is read: the
 * fork carries the `Upstream` it recorded or the `InvalidUpstream` problems.
 */
export const ForkSkill = Schema.TaggedStruct("Fork", {
  ...SkillFields,
  upstream: Schema.Result(Schema.toType(Upstream), InvalidUpstream),
});

export const Skill = Schema.Union([OwnSkill, ForkSkill]);
export type OwnSkill = typeof OwnSkill.Type;
export type ForkSkill = typeof ForkSkill.Type;
export type Skill = typeof Skill.Type;

export const Category = Schema.Struct({
  /** Folder name under `skills/`. */
  name: CategoryName,
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
  /** Names of the entries directly inside `skills/`, sorted. */
  files: Schema.Array(Schema.String),
  /** Categories, sorted by name. */
  categories: Schema.Array(Category),
});
export type Repo = typeof Repo.Type;

export const isFork = (skill: Skill): skill is ForkSkill => skill._tag === "Fork";

/** Every skill folder in the repo, category by category. */
export const allSkills = (repo: Repo): Skill[] => repo.categories.flatMap((c) => c.skills);

// ---- Reading --------------------------------------------------------------

const decodeCategoryJson = Schema.decodeUnknownEffect(CategoryJson);

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** `category.json` text -> Loaded. The JSON parser's own message is kept for malformed text. */
const parseCategoryJson = (text: string): Effect.Effect<CategoryMeta, CategoryJsonUnreadable> =>
  Effect.gen(function* () {
    const json = yield* Effect.try(() => JSON.parse(text) as unknown);
    const data = yield* decodeCategoryJson(json);
    return { _tag: "Loaded", ...data } as const;
  }).pipe(
    Effect.mapError(
      (e) => new CategoryJsonUnreadable({ message: Cause.isUnknownError(e) ? messageOf(e.cause) : "not a JSON object" }),
    ),
  );

const MISSING_META: CategoryMeta = { _tag: "Missing" };

const readMeta = (categoryPath: string): Effect.Effect<CategoryMeta, RepoFsError, RepoFs> =>
  Effect.gen(function* () {
    const fs = yield* RepoFs;
    const text = yield* fs.readText(`${categoryPath}/${CATEGORY_META_FILE}`);
    return yield* Option.match(text, { onNone: () => Effect.succeed(MISSING_META), onSome: parseCategoryJson });
  }).pipe(
    Effect.catchTag("CategoryJsonUnreadable", (e) =>
      Effect.succeed<CategoryMeta>({ _tag: "Unreadable", error: e.message }),
    ),
  );

/** A fork's `UPSTREAM.md`, decoded. A file that cannot be read is as invalid as one that does not parse. */
const readUpstream = (skillPath: string) =>
  Effect.gen(function* () {
    const fs = yield* RepoFs;
    const text = yield* fs.readText(`${skillPath}/${UPSTREAM_FILE}`);
    return yield* parseUpstream(skillPath, Option.getOrElse(text, () => ""));
  }).pipe(
    Effect.catchTag("RepoFsError", (e) =>
      Effect.fail(new InvalidUpstream({ path: skillPath, problems: [`cannot read ${UPSTREAM_FILE}: ${e.message}`] })),
    ),
  );

const readSkill = Effect.fnUntraced(function* (category: CategoryName, name: SkillName) {
  const fs = yield* RepoFs;
  const path = `${SKILLS_DIR}/${category}/${name}`;
  const files = yield* fs.list(path);
  const skillMd = yield* fs.readText(`${path}/SKILL.md`);
  const base = { name, path, category, files, skillMd };
  if (!files.includes(UPSTREAM_FILE)) return { _tag: "Own", ...base } satisfies OwnSkill;
  // Divergent strategy: this fork's invalid UPSTREAM.md is data on the fork, while the reads above stay fatal.
  const upstream = yield* Effect.result(readUpstream(path));
  return { _tag: "Fork", ...base, upstream } satisfies ForkSkill;
});

const readCategory = Effect.fnUntraced(function* (name: CategoryName) {
  const fs = yield* RepoFs;
  const path = `${SKILLS_DIR}/${name}`;
  return {
    name,
    path,
    meta: yield* readMeta(path),
    files: yield* fs.list(path),
    skills: yield* Effect.forEach(yield* fs.listDirs(path), (skill) => readSkill(name, SkillName.make(skill))),
  } satisfies Category;
});

/** Read the repo layout. Malformed content is data (`Unreadable`, `InvalidUpstream`), never an error; rules report it. */
export const readRepo = Effect.gen(function* () {
  const fs = yield* RepoFs;
  const files = yield* fs.list(SKILLS_DIR);
  const categories = yield* Effect.forEach(yield* fs.listDirs(SKILLS_DIR), (name) => readCategory(CategoryName.make(name)));
  return { files, categories } satisfies Repo;
});
