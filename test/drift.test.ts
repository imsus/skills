import { afterEach, expect, test } from "bun:test";
import { runDrift, type Lookup } from "../src/drift/run";
import { buildTree, category, fork, runCli, SHA, upstreamMd, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

const NEW_SHA = "fedcba9876543210fedcba9876543210fedcba98";

async function drift(lookup: Lookup, json = false) {
  const lines: string[] = [];
  const code = await runDrift({ root: tree.root, lookup, json, out: (l) => lines.push(l) });
  return { code, text: lines.join("\n") };
}

test("a fork whose latest commit equals the recorded SHA is up to date", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  const r = await drift(async () => SHA);
  expect(r.code).toBe(0);
  expect(r.text).toContain("imsus-foo");
  expect(r.text).toContain("up to date");
});

test("a fork with a newer commit is drifted, with a compare URL containing both SHAs", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  const r = await drift(async () => NEW_SHA);
  expect(r.code).toBe(0);
  expect(r.text).toContain("drifted");
  expect(r.text).toContain(`https://github.com/someone/skills/compare/${SHA}...${NEW_SHA}`);
});

test("the lookup receives the upstream repo and path", async () => {
  tree = buildTree({
    ...category("web"),
    ...fork("web", "imsus-foo", { upstream: upstreamMd({ repo: "a/b", path: "x/y" }) }),
  });
  const seen: string[] = [];
  await drift(async (repo, path) => (seen.push(`${repo}:${path}`), SHA));
  expect(seen).toEqual(["a/b:x/y"]);
});

test("one unreachable fork does not stop the others", async () => {
  tree = buildTree({
    ...category("web"),
    ...fork("web", "imsus-a", { upstream: upstreamMd({ repo: "gone/repo" }) }),
    ...fork("web", "imsus-b"),
  });
  const r = await drift(async (repo) => {
    if (repo === "gone/repo") throw new Error("404 Not Found");
    return SHA;
  });
  expect(r.code).toBe(0);
  expect(r.text).toMatch(/imsus-a.*unreachable/);
  expect(r.text).toContain("404 Not Found");
  expect(r.text).toMatch(/imsus-b.*up to date/);
});

test("a fork with an invalid UPSTREAM.md is reported unreachable without crashing", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo", { upstream: "garbage" }) });
  const r = await drift(async () => SHA, true);
  const [entry] = JSON.parse(r.text);
  expect(r.code).toBe(0);
  expect(entry.outcome).toBe("unreachable");
  expect(entry.error).toContain("UPSTREAM.md");
});

test("own skills are ignored; a repo with no forks reports nothing", async () => {
  tree = buildTree(category("web", ["imsus-own"]));
  const r = await drift(async () => SHA);
  expect(r.code).toBe(0);
  expect(r.text).toBe("");
  expect(JSON.parse((await drift(async () => SHA, true)).text)).toEqual([]);
});

test("--json lists every fork with the fields the workflow consumes", async () => {
  tree = buildTree({
    ...category("web"),
    ...fork("web", "imsus-a"),
    ...fork("web", "imsus-b"),
  });
  const r = await drift(async () => NEW_SHA, true);
  const entries = JSON.parse(r.text);
  expect(entries).toHaveLength(2);
  expect(entries[0]).toEqual({
    skill: "imsus-a",
    category: "web",
    path: "skills/web/imsus-a",
    upstreamRepo: "someone/skills",
    upstreamPath: "skills/foo",
    outcome: "drifted",
    recordedSha: SHA,
    latestSha: NEW_SHA,
    compareUrl: `https://github.com/someone/skills/compare/${SHA}...${NEW_SHA}`,
    error: null,
  });
});

test("the drift CLI command exits 0 on a repo with no forks", async () => {
  tree = buildTree(category("web", ["imsus-own"]));
  const r = await runCli(["drift"], tree.root);
  expect(r.code).toBe(0);
  expect(r.stdout).toBe("");
});
