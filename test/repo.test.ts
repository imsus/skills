import { afterEach, expect, test } from "bun:test";
import { readRepo } from "../src/repo";
import { buildTree, category, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

test("repo with no skills directory has no categories", () => {
  tree = buildTree();
  expect(readRepo(tree.root).categories).toEqual([]);
});

test("finds categories, their metadata and skill folders, sorted", () => {
  tree = buildTree({
    ...category("web", ["imsus-b", "imsus-a"]),
    ...category("api", ["imsus-c"]),
    "skills/web/imsus-a/UPSTREAM.md": "---\n---\n",
  });
  const repo = readRepo(tree.root);
  expect(repo.categories.map((c) => c.name)).toEqual(["api", "web"]);
  const web = repo.categories[1]!;
  expect(web.meta).toEqual({
    status: "loaded",
    data: { description: "A category.", version: "1.0.0" },
  });
  expect(web.skills.map((s) => s.name)).toEqual(["imsus-a", "imsus-b"]);
  expect(web.skills[0]!.path).toBe("skills/web/imsus-a");
  expect(web.skills[0]!.files).toContain("UPSTREAM.md");
  expect(web.skills[0]!.isFork).toBe(true);
  expect(web.skills[1]!.isFork).toBe(false);
  expect(web.skills[1]!.skillMd).toContain("name: imsus-b");
});

test("reports missing and unreadable category metadata", () => {
  tree = buildTree({
    "skills/none/imsus-x/SKILL.md": "x",
    "skills/bad/category.json": "{nope",
  });
  const [bad, none] = readRepo(tree.root).categories;
  expect(bad!.meta.status).toBe("unreadable");
  expect(none!.meta).toEqual({ status: "missing" });
});
