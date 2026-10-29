import { afterEach, expect, test } from "bun:test";
import { buildTree, category, categoryJson, CHANGELOG, runCli, skillMd, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

async function check(files: Record<string, string>) {
  tree = buildTree(files);
  return runCli(["check"], tree.root);
}

test("folder without imsus- prefix fails, naming folder and rule", async () => {
  const r = await check({
    ...category("web"),
    "skills/web/foo/SKILL.md": skillMd("foo"),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web/foo");
  expect(r.stderr).toContain("imsus-");
});

test("folder name differing from frontmatter name fails, naming both", async () => {
  const r = await check({
    ...category("web"),
    "skills/web/imsus-a/SKILL.md": skillMd("imsus-b"),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("imsus-a");
  expect(r.stderr).toContain("imsus-b");
});

test("missing or empty description fails", async () => {
  const r = await check({
    ...category("web"),
    "skills/web/imsus-a/SKILL.md": "---\nname: imsus-a\n---\n",
    "skills/web/imsus-b/SKILL.md": skillMd("imsus-b", ""),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web/imsus-a");
  expect(r.stderr).toContain("skills/web/imsus-b");
});

test("skill folder with no SKILL.md fails", async () => {
  const r = await check({
    ...category("web"),
    "skills/web/imsus-a/notes.md": "x",
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web/imsus-a");
  expect(r.stderr).toContain("SKILL.md");
});

test("same skill name in two categories fails, naming both paths", async () => {
  const r = await check({
    ...category("web", ["imsus-a"]),
    ...category("api", ["imsus-a"]),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web/imsus-a");
  expect(r.stderr).toContain("skills/api/imsus-a");
});

test("category with no metadata fails", async () => {
  const r = await check({ "skills/web/imsus-a/SKILL.md": skillMd("imsus-a") });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web");
  expect(r.stderr).toContain("category.json");
});

test("category with invalid semver or missing description fails", async () => {
  const r = await check({
    "skills/web/category.json": categoryJson("ok", "1.0"),
    "skills/api/category.json": JSON.stringify({ version: "1.0.0" }),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web");
  expect(r.stderr).toContain("skills/api");
});

test("accepts prerelease and build semver", async () => {
  const r = await check({
    "skills/web/category.json": categoryJson("ok", "1.2.3-beta.1+build.5"),
    "skills/web/CHANGELOG.md": CHANGELOG,
  });
  expect(r.code).toBe(0);
});

test("category without CHANGELOG.md fails, naming the category and file", async () => {
  const r = await check({ "skills/web/category.json": categoryJson() });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web");
  expect(r.stderr).toContain("CHANGELOG.md");
});

test("three different violations are all reported in one run", async () => {
  const r = await check({
    "skills/web/category.json": categoryJson("ok", "bad"),
    "skills/web/foo/SKILL.md": skillMd("foo"),
    "skills/web/imsus-x/notes.md": "x",
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/web/foo");
  expect(r.stderr).toContain("skills/web/imsus-x");
  expect(r.stderr).toContain("version");
});

test("fully valid tree exits 0 with no violations printed", async () => {
  const r = await check({ ...category("web", ["imsus-a"]), ...category("api", ["imsus-b"]) });
  expect(r.code).toBe(0);
  expect(r.stderr).toBe("");
});
