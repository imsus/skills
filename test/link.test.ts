import { afterEach, expect, test } from "bun:test";
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { buildTree, category, runCli, type Tree } from "./helpers/tree";

let tree: Tree;
let home: Tree | undefined;
afterEach(() => {
  tree?.cleanup();
  home?.cleanup();
  home = undefined;
});

const LINKS = ".claude/skills";
const link = (name: string) => join(tree.root, LINKS, name);

test("links every skill across categories into .claude/skills with relative links", async () => {
  tree = buildTree({ ...category("meta", ["imsus-ask"]), ...category("web", ["imsus-a", "imsus-b"]) });
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(0);
  expect(readlinkSync(link("imsus-ask"))).toBe("../../skills/meta/imsus-ask");
  expect(readlinkSync(link("imsus-a"))).toBe("../../skills/web/imsus-a");
  expect(realpathSync(link("imsus-b"))).toBe(realpathSync(join(tree.root, "skills/web/imsus-b")));
  expect(existsSync(join(link("imsus-ask"), "SKILL.md"))).toBe(true);
  expect(lstatSync(link("imsus-ask")).isSymbolicLink()).toBe(true);
});

test("a second run changes nothing and links nothing new", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  await runCli(["link"], tree.root);
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(0);
  expect(r.stdout).not.toContain("linked imsus-a");
  expect(r.stdout).toContain("1 unchanged");
  expect(readlinkSync(link("imsus-a"))).toBe("../../skills/web/imsus-a");
});

test("a real folder or a foreign link with a skill's name is reported, left alone, and fails the run", async () => {
  tree = buildTree({
    ...category("web", ["imsus-a", "imsus-b", "imsus-c"]),
    [`${LINKS}/imsus-a/SKILL.md`]: "installed copy\n",
  });
  symlinkSync("/somewhere/else/imsus-b", link("imsus-b"));
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(1);
  expect(readFileSync(join(link("imsus-a"), "SKILL.md"), "utf8")).toBe("installed copy\n");
  expect(lstatSync(link("imsus-a")).isSymbolicLink()).toBe(false);
  expect(readlinkSync(link("imsus-b"))).toBe("/somewhere/else/imsus-b");
  expect(readlinkSync(link("imsus-c"))).toBe("../../skills/web/imsus-c");
  expect(r.stderr).toContain("imsus-a");
  expect(r.stderr).toContain("imsus-b");
  expect(r.stdout).toContain("2 conflicts");
});

test("a link of ours to a skill that moved category is rewritten", async () => {
  tree = buildTree({ ...category("web", []), ...category("meta", ["imsus-a"]) });
  mkdirSync(join(tree.root, LINKS), { recursive: true });
  symlinkSync("../../skills/web/imsus-a", link("imsus-a"));
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(0);
  expect(readlinkSync(link("imsus-a"))).toBe("../../skills/meta/imsus-a");
  expect(r.stdout).toContain("1 relinked");
});

test("a link of ours whose skill was deleted is pruned; foreign entries stay", async () => {
  tree = buildTree({ ...category("web", ["imsus-a"]), [`${LINKS}/mine/SKILL.md`]: "x\n" });
  symlinkSync("../../skills/web/imsus-gone", link("imsus-gone"));
  symlinkSync("/somewhere/else/other", link("other"));
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(0);
  expect(lstatSync(link("imsus-gone"), { throwIfNoEntry: false })).toBeUndefined();
  expect(readlinkSync(link("other"))).toBe("/somewhere/else/other");
  expect(existsSync(join(link("mine"), "SKILL.md"))).toBe(true);
  expect(r.stdout).toContain("1 pruned");
});

test("--user links every skill into $HOME/.claude/skills with absolute links", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  home = buildTree();
  const r = await runCli(["link", "--user"], tree.root, { HOME: home.root });
  expect(r.code).toBe(0);
  const target = readlinkSync(join(home.root, LINKS, "imsus-a"));
  expect(isAbsolute(target)).toBe(true);
  expect(realpathSync(target)).toBe(realpathSync(join(tree.root, "skills/web/imsus-a")));
  expect(existsSync(join(tree.root, LINKS))).toBe(false);
});

test("--remove deletes only links of ours and leaves foreign entries", async () => {
  tree = buildTree({ ...category("web", ["imsus-a", "imsus-b"]), [`${LINKS}/mine/SKILL.md`]: "x\n" });
  symlinkSync("/somewhere/else/other", link("other"));
  await runCli(["link"], tree.root);
  const r = await runCli(["link", "--remove"], tree.root);
  expect(r.code).toBe(0);
  expect(lstatSync(link("imsus-a"), { throwIfNoEntry: false })).toBeUndefined();
  expect(lstatSync(link("imsus-b"), { throwIfNoEntry: false })).toBeUndefined();
  expect(readlinkSync(link("other"))).toBe("/somewhere/else/other");
  expect(existsSync(join(link("mine"), "SKILL.md"))).toBe(true);
  expect(existsSync(join(tree.root, "skills/web/imsus-a/SKILL.md"))).toBe(true);
  expect(r.stdout).toContain("2 removed");
});

test("--remove --user deletes the user links; a missing folder is not an error", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  home = buildTree();
  expect((await runCli(["link", "--remove", "--user"], tree.root, { HOME: home.root })).code).toBe(0);
  await runCli(["link", "--user"], tree.root, { HOME: home.root });
  const r = await runCli(["link", "--user", "--remove"], tree.root, { HOME: home.root });
  expect(r.code).toBe(0);
  expect(lstatSync(join(home.root, LINKS, "imsus-a"), { throwIfNoEntry: false })).toBeUndefined();
});

test("an unknown argument is rejected with usage and links nothing", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  const r = await runCli(["link", "--usr"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("--usr");
  expect(r.stderr).toContain("Usage");
  expect(existsSync(join(tree.root, LINKS))).toBe(false);
});

test("a skill added since the last run gets linked on re-run", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  await runCli(["link"], tree.root);
  mkdirSync(join(tree.root, "skills/web/imsus-new"));
  writeFileSync(join(tree.root, "skills/web/imsus-new/SKILL.md"), "x\n");
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(0);
  expect(readlinkSync(link("imsus-new"))).toBe("../../skills/web/imsus-new");
  expect(r.stdout).toContain("1 linked");
});

test("a link to the right skill spelled through a symlinked path is ours: left alone, removed by --remove", async () => {
  tree = buildTree(category("web", ["imsus-a"]));
  home = buildTree();
  const alias = join(home.root, "alias");
  symlinkSync(tree.root, alias);
  mkdirSync(join(tree.root, LINKS), { recursive: true });
  symlinkSync(join(alias, "skills/web/imsus-a"), link("imsus-a"));
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(0);
  expect(r.stdout).toContain("1 unchanged");
  expect((await runCli(["link", "--remove"], tree.root)).code).toBe(0);
  expect(lstatSync(link("imsus-a"), { throwIfNoEntry: false })).toBeUndefined();
});

test("two skills with the same name are a conflict, not a link that flips every run", async () => {
  tree = buildTree({ ...category("web", ["imsus-dup", "imsus-a"]), ...category("meta", ["imsus-dup"]) });
  const r = await runCli(["link"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("imsus-dup");
  expect(lstatSync(link("imsus-dup"), { throwIfNoEntry: false })).toBeUndefined();
  expect(readlinkSync(link("imsus-a"))).toBe("../../skills/web/imsus-a");
});
