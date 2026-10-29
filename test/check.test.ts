import { afterEach, expect, test } from "bun:test";
import { buildTree, category, runCli, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

test("check on an empty repo exits 0", async () => {
  tree = buildTree();
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(0);
});

test("unknown subcommand prints usage and exits non-zero", async () => {
  tree = buildTree();
  const r = await runCli(["frobnicate"], tree.root);
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("Usage");
  expect(r.stderr).toContain("check");
});

test("no subcommand prints usage and exits non-zero", async () => {
  tree = buildTree();
  const r = await runCli([], tree.root);
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain("Usage");
});

test("check on a repo with one category and one skill exits 0", async () => {
  tree = buildTree(category("laravel", ["imsus-fp"]));
  const r = await runCli(["check"], tree.root);
  expect(r.code).toBe(0);
});
