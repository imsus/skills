import { afterEach, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { categoryWith } from "./helpers/manifest";
import { buildTree, category, runCli, skillMd, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

const MANIFEST = ".claude-plugin/marketplace.json";
const read = () => readFileSync(join(tree.root, MANIFEST), "utf8");

test("two categories yield two plugins with their own skills and versions", async () => {
  tree = buildTree({
    ...categoryWith("web", ["imsus-b", "imsus-a"], "Web stuff.", "2.1.0"),
    ...categoryWith("laravel", ["imsus-fp"], "Laravel stuff.", "1.0.3"),
  });
  expect((await runCli(["manifest"], tree.root)).code).toBe(0);
  const m = JSON.parse(read());
  expect(m.plugins).toEqual([
    {
      name: "laravel",
      source: "./",
      description: "Laravel stuff.",
      version: "1.0.3",
      skills: ["./skills/laravel/imsus-fp"],
    },
    {
      name: "web",
      source: "./",
      description: "Web stuff.",
      version: "2.1.0",
      skills: ["./skills/web/imsus-a", "./skills/web/imsus-b"],
    },
  ]);
});

test("object keys are sorted alphabetically at every level", async () => {
  tree = buildTree(categoryWith("web", ["imsus-a"], "Web stuff.", "2.1.0"));
  await runCli(["manifest"], tree.root);
  const m = JSON.parse(read());
  expect(Object.keys(m)).toEqual(["description", "name", "owner", "plugins"]);
  expect(Object.keys(m.owner)).toEqual(["name", "url"]);
  expect(Object.keys(m.plugins[0])).toEqual(["description", "name", "skills", "source", "version"]);
});

test("running manifest twice is byte-identical", async () => {
  tree = buildTree({ ...category("web", ["imsus-a"]), ...category("laravel", ["imsus-b"]) });
  await runCli(["manifest"], tree.root);
  const first = read();
  await runCli(["manifest"], tree.root);
  expect(read()).toBe(first);
  expect(first.endsWith("}\n")).toBe(true);
});

test("empty repo yields a valid manifest with no plugins", async () => {
  tree = buildTree();
  expect((await runCli(["manifest"], tree.root)).code).toBe(0);
  const m = JSON.parse(read());
  expect(m.plugins).toEqual([]);
  expect(typeof m.name).toBe("string");
  expect(typeof m.owner.name).toBe("string");
});

test("a category without loaded metadata gets no plugin", async () => {
  tree = buildTree({
    ...category("web", ["imsus-a"]),
    "skills/bare/imsus-x/SKILL.md": skillMd("imsus-x"),
  });
  await runCli(["manifest"], tree.root);
  expect(JSON.parse(read()).plugins.map((p: { name: string }) => p.name)).toEqual(["web"]);
});

test("check exits 0 right after manifest", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  await runCli(["manifest"], tree.root);
  expect((await runCli(["manifest", "--check"], tree.root)).code).toBe(0);
});

test("check does not write the manifest", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  const r = await runCli(["manifest", "--check"], tree.root);
  expect(r.code).not.toBe(0);
  expect(existsSync(join(tree.root, MANIFEST))).toBe(false);
});

test("adding a skill without regenerating makes check fail as stale", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  await runCli(["manifest"], tree.root);
  mkdirSync(join(tree.root, "skills/web/imsus-new"), { recursive: true });
  writeFileSync(join(tree.root, "skills/web/imsus-new/SKILL.md"), skillMd("imsus-new"));
  const r = await runCli(["manifest", "--check"], tree.root);
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("stale");
});
