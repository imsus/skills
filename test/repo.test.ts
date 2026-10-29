import { afterEach, expect, test } from "bun:test";
import { Effect, Option } from "effect";
import { readRepo } from "../src/repo";
import { RepoFs } from "../src/repo-fs";
import { buildTree, category, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

/** Read the throwaway tree through the real `RepoFs` layer. */
const read = () => Effect.runPromise(readRepo.pipe(Effect.provide(RepoFs.layer(tree.root))));

test("repo with no skills directory has no categories", async () => {
  tree = buildTree();
  expect((await read()).categories).toEqual([]);
});

test("finds categories, their metadata and skill folders, sorted", async () => {
  tree = buildTree({
    ...category("web", ["imsus-b", "imsus-a"]),
    ...category("api", ["imsus-c"]),
    "skills/web/imsus-a/UPSTREAM.md": "---\n---\n",
  });
  const repo = await read();
  expect(repo.categories.map((c) => String(c.name))).toEqual(["api", "web"]);
  const web = repo.categories[1]!;
  expect(web.meta).toEqual({ _tag: "Loaded", description: "A category.", version: "1.0.0" });
  expect(web.skills.map((s) => String(s.name))).toEqual(["imsus-a", "imsus-b"]);
  expect(web.skills[0]!.path).toBe("skills/web/imsus-a");
  expect(web.skills[0]!.files).toContain("UPSTREAM.md");
  expect(web.skills[0]!._tag).toBe("Fork");
  expect(web.skills[1]!._tag).toBe("Own");
  expect(Option.getOrThrow(web.skills[1]!.skillMd)).toEqual({
    name: "imsus-b",
    description: "Does a thing.",
    disableModelInvocation: false,
    body: "\n# imsus-b\n",
  });
});

test("decodes SKILL.md frontmatter once: missing fields stay absent, the user-only flag is a boolean", async () => {
  tree = buildTree({
    ...category("web"),
    "skills/web/imsus-a/SKILL.md": "---\nname: imsus-a\ndisable-model-invocation: true\n---\nRoutes.\n",
    "skills/web/imsus-b/SKILL.md": "# No frontmatter\n",
    "skills/web/imsus-c/notes.md": "x",
  });
  const [a, b, c] = (await read()).categories[0]!.skills.map((s) => s.skillMd);
  expect(Option.getOrThrow(a!)).toEqual({ name: "imsus-a", disableModelInvocation: true, body: "Routes.\n" });
  expect(Option.getOrThrow(b!)).toEqual({ disableModelInvocation: false, body: "# No frontmatter\n" });
  expect(Option.isNone(c!)).toBe(true);
});

test("reports missing and unreadable category metadata", async () => {
  tree = buildTree({
    "skills/none/imsus-x/SKILL.md": "x",
    "skills/bad/category.json": "{nope",
  });
  const [bad, none] = (await read()).categories;
  expect(bad!.meta._tag).toBe("Unreadable");
  expect(none!.meta).toEqual({ _tag: "Missing" });
});

test("category.json that is valid JSON but not an object is unreadable", async () => {
  tree = buildTree({
    "skills/arr/category.json": "[1]",
    "skills/nul/category.json": "null",
    "skills/str/category.json": '"x"',
  });
  const metas = (await read()).categories.map((c) => c.meta);
  expect(metas).toEqual([
    { _tag: "Unreadable", error: "not a JSON object" },
    { _tag: "Unreadable", error: "not a JSON object" },
    { _tag: "Unreadable", error: "not a JSON object" },
  ]);
});
