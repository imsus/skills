import { afterEach, expect, test } from "bun:test";
import { buildTree, category, runCli, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

test("a stray file directly under skills/ is reported by the layout rule", async () => {
  tree = buildTree({ ...category("web", ["imsus-a"]), "skills/notes.txt": "x" });
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("skills/notes.txt: [layout]");
});

test("a stray file inside a category is reported, but category.json and CHANGELOG.md are not", async () => {
  tree = buildTree({ ...category("web", ["imsus-a"]), "skills/web/README.md": "x" });
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("skills/web/README.md: [layout]");
  expect(r.stderr).not.toContain("category.json: [layout]");
  expect(r.stderr).not.toContain("CHANGELOG.md: [layout]");
});

test("hidden files such as .DS_Store are ignored at both levels", async () => {
  tree = buildTree({ ...category("web", ["imsus-a"]), "skills/.DS_Store": "x", "skills/web/.DS_Store": "x" });
  expect((await runCli(["check"], tree.root)).code).toBe(0);
});
