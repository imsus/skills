import { afterEach, expect, test } from "bun:test";
import { buildTree, category, runCli, skillMd, type Files, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

async function check(files: Files) {
  tree = buildTree(files);
  return runCli(["check"], tree.root);
}

function userOnlyMd(name: string, flag = "true"): string {
  return `---\nname: ${name}\ndescription: Does a thing.\ndisable-model-invocation: ${flag}\n---\n\n# ${name}\n`;
}

test("user-only skills with disable-model-invocation: true pass", async () => {
  const r = await check({
    ...category("meta", ["imsus-a"]),
    "skills/meta/imsus-retro/SKILL.md": userOnlyMd("imsus-retro"),
    "skills/meta/imsus-setup/SKILL.md": userOnlyMd("imsus-setup"),
    "skills/meta/imsus-setup-harness/SKILL.md": userOnlyMd("imsus-setup-harness"),
  });
  expect(r.stderr).toBe("");
  expect(r.code).toBe(0);
});

test("user-only skills without disable-model-invocation: true fail, naming each", async () => {
  const r = await check({
    ...category("meta"),
    "skills/meta/imsus-retro/SKILL.md": skillMd("imsus-retro"),
    "skills/meta/imsus-setup-harness/SKILL.md": userOnlyMd("imsus-setup-harness", "false"),
    "skills/meta/imsus-ask/SKILL.md": `---\nname: imsus-ask\ndescription: Routes.\n---\n\n/imsus-retro /imsus-setup-harness\n`,
  });
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("skills/meta/imsus-retro: [user-only]");
  expect(r.stderr).toContain("skills/meta/imsus-setup-harness: [user-only]");
  expect(r.stderr).toContain("skills/meta/imsus-ask: [user-only]");
  expect(r.stderr).toContain("disable-model-invocation");
});
