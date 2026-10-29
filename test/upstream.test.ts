import { expect, test } from "bun:test";
import { Effect } from "effect";
import { parseUpstream } from "../src/upstream";
import { SHA, upstreamMd } from "./helpers/tree";

const PATH = "skills/web/imsus-foo";

/** The decoded upstream, or the problems it was rejected with. */
const parse = (text: string) =>
  Effect.runPromise(
    parseUpstream(PATH, text).pipe(
      Effect.map((upstream) => ({ ok: true as const, upstream: upstream as { repo: string; path: string; sha: string } })),
      Effect.catchTag("InvalidUpstream", (e) => Effect.succeed({ ok: false as const, path: e.path, problems: e.problems })),
    ),
  );

test("parses repo, path and sha", async () => {
  expect(await parse(upstreamMd())).toEqual({
    ok: true,
    upstream: { repo: "someone/skills", path: "skills/foo", sha: SHA },
  });
});

test("names each missing field", async () => {
  const r = await parse(upstreamMd({ repo: "", path: "", sha: "" }));
  expect(r).toEqual({
    ok: false,
    path: PATH,
    problems: ["missing field: repo", "missing field: path", "missing field: sha"],
  });
});

test("rejects a short or non-hex sha", async () => {
  for (const sha of ["abc123", SHA.slice(1) + "g", SHA.toUpperCase().slice(0, 39)]) {
    const r = await parse(upstreamMd({ sha }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problems[0]).toContain("sha");
  }
});

test("accepts an uppercase sha and normalizes it to lowercase", async () => {
  const r = await parse(upstreamMd({ sha: SHA.toUpperCase() }));
  expect(r.ok && r.upstream.sha).toBe(SHA);
});

test("rejects a repo that is not owner/name", async () => {
  expect((await parse(upstreamMd({ repo: "just-a-name" }))).ok).toBe(false);
});

test("reports missing fields before format problems, in field order", async () => {
  const r = await parse(upstreamMd({ path: "", repo: "nope", sha: "zz" }));
  expect(r).toEqual({
    ok: false,
    path: PATH,
    problems: ["missing field: path", 'repo must be owner/name, got "nope"', 'sha must be 40 hex characters, got "zz"'],
  });
});

test("no frontmatter is a problem", async () => {
  expect(await parse("Just prose.\n")).toEqual({ ok: false, path: PATH, problems: ["no frontmatter block"] });
});
