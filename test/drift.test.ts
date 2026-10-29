import { afterEach, expect, test } from "bun:test";
import { Effect, Layer } from "effect";
import { runDrift } from "../src/drift/run";
import { UpstreamApi, type CompareStatus } from "../src/drift/upstream-api";
import { CommitSha } from "../src/ids";
import { UpstreamUnreachable } from "../src/errors";
import { RepoFs } from "../src/repo-fs";
import { captureStdio } from "./helpers/layers";
import { fork, SHA, upstreamMd } from "./helpers/fork";
import { buildTree, category, runCli, type Tree } from "./helpers/tree";

let tree: Tree;
afterEach(() => tree?.cleanup());

const NEW_SHA = "fedcba9876543210fedcba9876543210fedcba98";

/**
 * Test layer for GitHub: `latest` answers the path lookup (a throw means
 * unreachable), `status` answers every compare.
 */
function api(latest: string | ((repo: string, path: string) => string), status: CompareStatus = "ahead") {
  const calls: string[] = [];
  const upstream = Layer.succeed(
    UpstreamApi,
    UpstreamApi.of({
      latestCommit: (repo, path) =>
        Effect.try({
          try: () => {
            calls.push(`latest ${repo}:${path}`);
            return CommitSha.make(typeof latest === "function" ? latest(repo, path) : latest);
          },
          catch: (e) => new UpstreamUnreachable({ repo, message: (e as Error).message }),
        }),
      compare: (repo, base, head) =>
        Effect.sync(() => {
          calls.push(`compare ${repo} ${base}...${head}`);
          return status;
        }),
    }),
  );
  return { upstream, calls };
}

async function drift(upstream: Layer.Layer<UpstreamApi>, json = false) {
  const lines: string[] = [];
  const errs: string[] = [];
  const code = await Effect.runPromise(
    runDrift({ json }).pipe(Effect.provide(Layer.mergeAll(RepoFs.layer(tree.root), captureStdio(lines, errs), upstream))),
  );
  return { code, text: lines.join("\n"), errs };
}

test("a fork whose latest commit equals the recorded SHA is up to date", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  const r = await drift(api(SHA).upstream);
  expect(r.code).toBe(0);
  expect(r.text).toContain("imsus-foo");
  expect(r.text).toContain("up to date");
});

test("a fork with a newer commit is drifted, with a compare URL containing both SHAs", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  const r = await drift(api(NEW_SHA).upstream);
  expect(r.code).toBe(0);
  expect(r.text).toContain("drifted");
  expect(r.text).toContain(`https://github.com/someone/skills/compare/${SHA}...${NEW_SHA}`);
});

test("the lookup receives the upstream repo and path", async () => {
  tree = buildTree({
    ...category("web"),
    ...fork("web", "imsus-foo", { upstream: upstreamMd({ repo: "a/b", path: "x/y" }) }),
  });
  const { upstream, calls } = api(SHA);
  await drift(upstream);
  expect(calls).toEqual(["latest a/b:x/y"]);
});

test("one unreachable fork does not stop the others", async () => {
  tree = buildTree({
    ...category("web"),
    ...fork("web", "imsus-a", { upstream: upstreamMd({ repo: "gone/repo" }) }),
    ...fork("web", "imsus-b"),
  });
  const r = await drift(
    api((repo) => {
      if (repo === "gone/repo") throw new Error("404 Not Found");
      return SHA;
    }).upstream,
  );
  expect(r.code).toBe(0);
  expect(r.text).toMatch(/imsus-a.*unreachable/);
  expect(r.text).toContain("404 Not Found");
  expect(r.text).toMatch(/imsus-b.*up to date/);
});

test("a fork with an invalid UPSTREAM.md is skipped with a stderr warning pointing at check", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo", { upstream: "garbage" }), ...fork("web", "imsus-ok") });
  const { upstream, calls } = api(SHA);
  const r = await drift(upstream, true);
  expect(r.code).toBe(0);
  expect(JSON.parse(r.text).map((e: { skill: string }) => e.skill)).toEqual(["imsus-ok"]);
  expect(calls).toEqual(["latest someone/skills:skills/foo"]);
  expect(r.errs).toHaveLength(1);
  expect(r.errs[0]).toContain("skills/web/imsus-foo");
  expect(r.errs[0]).toContain("check");
});

test("a fork whose UPSTREAM.md is a directory is skipped with the same warning, not a crash", async () => {
  const files = { ...category("web"), ...fork("web", "imsus-foo") };
  delete files["skills/web/imsus-foo/UPSTREAM.md"];
  tree = buildTree({ ...files, "skills/web/imsus-foo/UPSTREAM.md/x": "" });
  const { upstream, calls } = api(SHA);
  const r = await drift(upstream);
  expect(r.code).toBe(0);
  expect(calls).toEqual([]);
  expect(r.errs).toHaveLength(1);
  expect(r.errs[0]).toContain("skills/web/imsus-foo");
});

test("a recorded SHA newer than the path's last change is up to date", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  for (const status of ["identical", "behind"] as const) {
    const r = await drift(api(NEW_SHA, status).upstream);
    expect(r.text).toContain("up to date");
  }
});

test("when the path's last change is the recorded SHA, no compare is needed", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  const { upstream, calls } = api(SHA);
  await drift(upstream);
  expect(calls.some((c) => c.startsWith("compare"))).toBe(false);
});

test("ahead and diverged are drifted, comparing recorded...latest", async () => {
  tree = buildTree({ ...category("web"), ...fork("web", "imsus-foo") });
  for (const status of ["ahead", "diverged"] as const) {
    const { upstream, calls } = api(NEW_SHA, status);
    const r = await drift(upstream);
    expect(r.text).toContain(`drifted https://github.com/someone/skills/compare/${SHA}...${NEW_SHA}`);
    expect(calls).toContain(`compare someone/skills ${SHA}...${NEW_SHA}`);
  }
});

test("own skills are ignored; a repo with no forks reports nothing", async () => {
  tree = buildTree(category("web", ["imsus-own"]));
  const r = await drift(api(SHA).upstream);
  expect(r.code).toBe(0);
  expect(r.text).toBe("");
  expect(JSON.parse((await drift(api(SHA).upstream, true)).text)).toEqual([]);
});

test("--json lists every fork with the fields the workflow consumes", async () => {
  tree = buildTree({
    ...category("web"),
    ...fork("web", "imsus-a"),
    ...fork("web", "imsus-b"),
  });
  const r = await drift(api(NEW_SHA).upstream, true);
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
