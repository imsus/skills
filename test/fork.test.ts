import { afterEach, expect, test } from "bun:test";
import { buildTree, category, fork, runCli, upstreamMd, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

test("fork with valid UPSTREAM.md and LICENSE passes", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-fork") });
  expect((await runCli(["check"], tree.root)).code).toBe(0);
});

test("fork without LICENSE fails naming folder and rule", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-fork", { license: null }) });
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("skills/web/imsus-fork");
  expect(r.stderr).toContain("[fork-license]");
});

for (const field of ["repo", "path", "sha"]) {
  test(`fork missing ${field} fails naming it`, async () => {
    tree = buildTree({ ...category("web"), ...fork("web", "imsus-fork", { upstream: upstreamMd({ [field]: "" }) }) });
    const r = await runCli(["check"], tree.root);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("[fork-upstream]");
    expect(r.stderr).toContain(`missing field: ${field}`);
  });
}

test("non-40-hex sha fails", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-fork", { upstream: upstreamMd({ sha: "abc123" }) }) });
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("[fork-upstream]");
});

test("an UPSTREAM.md that is a directory is a fork-upstream violation, not a crash", async () => {
  const files = { ...category("web"), ...fork("web", "imsus-fork") };
  delete files["skills/web/imsus-fork/UPSTREAM.md"];
  tree = buildTree({ ...files, "skills/web/imsus-fork/UPSTREAM.md/x": "" });
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("skills/web/imsus-fork: [fork-upstream]");
});

test("an empty UPSTREAM.md is a fork-upstream violation", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-fork", { upstream: "" }) });
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(1);
  expect(r.stderr).toContain("[fork-upstream]");
  expect(r.stderr).toContain("no frontmatter block");
});

test("own skill needs no LICENSE", async () => {
  tree = buildTree(category("web", ["imsus-own"]));
  expect((await runCli(["check"], tree.root)).code).toBe(0);
});
