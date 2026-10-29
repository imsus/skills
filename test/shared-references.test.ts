import { afterEach, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { metaCategory } from "./helpers/catalog";
import { buildTree, runCli, type Files, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

const read = (rel: string) => readFileSync(join(tree.root, rel), "utf8");
const SOURCE = "skills/meta/imsus-setup/references";
const COPY = "skills/meta/imsus-ask/references";

/** The meta category with all three shared references written in imsus-setup. */
const withReferences = (): Files => ({
  ...metaCategory(),
  [`${SOURCE}/workflows.md`]: "# Workflows\n\nfeature, small change, bug, explore\n",
  [`${SOURCE}/harness.md`]: "# Harness\n",
  [`${SOURCE}/curated-skills.md`]: "# Curated skills\n",
});

test("manifest copies imsus-setup's shared references into imsus-ask", async () => {
  tree = buildTree(withReferences());
  expect((await runCli(["manifest"], tree.root)).code).toBe(0);
  expect(read(`${COPY}/workflows.md`)).toBe("# Workflows\n\nfeature, small change, bug, explore\n");
  expect(read(`${COPY}/harness.md`)).toBe("# Harness\n");
  expect(read(`${COPY}/curated-skills.md`)).toBe("# Curated skills\n");
});

test("check passes right after manifest", async () => {
  tree = buildTree(withReferences());
  await runCli(["manifest"], tree.root);
  expect((await runCli(["manifest", "--check"], tree.root)).code).toBe(0);
});

test("check fails when imsus-ask's copy was edited by hand", async () => {
  tree = buildTree(withReferences());
  await runCli(["manifest"], tree.root);
  writeFileSync(join(tree.root, `${COPY}/harness.md`), "# Harness\n\nHand edit.\n");
  const r = await runCli(["manifest", "--check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain(`${COPY}/harness.md is stale`);
  expect(r.stderr).not.toContain(`${COPY}/workflows.md is stale`);
});

test("check fails when imsus-setup's reference changed after the last manifest", async () => {
  tree = buildTree(withReferences());
  await runCli(["manifest"], tree.root);
  writeFileSync(join(tree.root, `${SOURCE}/workflows.md`), "# Workflows\n\nNow ending in retro.\n");
  const r = await runCli(["manifest", "--check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain(`${COPY}/workflows.md is stale`);
});

test("check fails when imsus-ask's copy is missing", async () => {
  tree = buildTree(withReferences());
  await runCli(["manifest"], tree.root);
  rmSync(join(tree.root, `${COPY}/curated-skills.md`));
  const r = await runCli(["manifest", "--check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain(`${COPY}/curated-skills.md is stale`);
});

test("a reference imsus-setup lacks is not copied", async () => {
  tree = buildTree({ ...metaCategory(), [`${SOURCE}/workflows.md`]: "# Workflows\n" });
  expect((await runCli(["manifest"], tree.root)).code).toBe(0);
  expect(read(`${COPY}/workflows.md`)).toBe("# Workflows\n");
  expect(existsSync(join(tree.root, `${COPY}/harness.md`))).toBe(false);
});
