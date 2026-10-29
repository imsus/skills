import { afterEach, expect, test } from "bun:test";
import { buildTree, category, runCli, type Files, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

async function check(files: Files) {
  tree = buildTree(files);
  return runCli(["check"], tree.root);
}

function askMd(body: string, description = "Routes to the next skill."): string {
  return `---\nname: imsus-ask\ndescription: ${description}\ndisable-model-invocation: true\n---\n\n${body}\n`;
}

test("router naming every other skill passes", async () => {
  const r = await check({
    ...category("web", ["imsus-a"]),
    ...category("meta"),
    "skills/meta/imsus-ask/SKILL.md": askMd("Use /imsus-a for web work."),
  });
  expect(r.stderr).toBe("");
  expect(r.code).toBe(0);
});

test("skill missing from the router fails, naming it", async () => {
  const r = await check({
    ...category("web", ["imsus-a", "imsus-b"]),
    ...category("meta"),
    "skills/meta/imsus-ask/SKILL.md": askMd("Use /imsus-a for web work."),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/meta/imsus-ask");
  expect(r.stderr).toContain("/imsus-b");
  expect(r.stderr).not.toContain("/imsus-a\n");
});

test("router naming a skill that does not exist fails, naming it", async () => {
  const r = await check({
    ...category("web", ["imsus-a"]),
    ...category("meta"),
    "skills/meta/imsus-ask/SKILL.md": askMd("Use /imsus-a, or /imsus-gone."),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("/imsus-gone");
});

test("a mention only in the router's frontmatter does not count", async () => {
  const r = await check({
    ...category("web", ["imsus-a"]),
    ...category("meta"),
    "skills/meta/imsus-ask/SKILL.md": askMd("No routes yet.", "Routes to /imsus-a."),
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("/imsus-a");
});

test("a tree without imsus-ask reports no router violations", async () => {
  const r = await check({ ...category("web", ["imsus-a"]) });
  expect(r.stderr).toBe("");
  expect(r.code).toBe(0);
});
