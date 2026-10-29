import { expect, test } from "bun:test";
import { parseUpstream } from "../src/upstream";
import { SHA, upstreamMd } from "./helpers/tree";

test("parses repo, path and sha", () => {
  expect(parseUpstream(upstreamMd())).toEqual({
    ok: true,
    upstream: { repo: "someone/skills", path: "skills/foo", sha: SHA },
  });
});

test("names each missing field", () => {
  const r = parseUpstream(upstreamMd({ repo: "", path: "", sha: "" }));
  expect(r).toEqual({ ok: false, problems: ["missing field: repo", "missing field: path", "missing field: sha"] });
});

test("rejects a short or non-hex sha", () => {
  for (const sha of ["abc123", SHA.slice(1) + "g", SHA.toUpperCase().slice(0, 39)]) {
    const r = parseUpstream(upstreamMd({ sha }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problems[0]).toContain("sha");
  }
});

test("accepts an uppercase sha and normalizes it to lowercase", () => {
  const r = parseUpstream(upstreamMd({ sha: SHA.toUpperCase() }));
  expect(r.ok && r.upstream.sha).toBe(SHA);
});

test("rejects a repo that is not owner/name", () => {
  expect(parseUpstream(upstreamMd({ repo: "just-a-name" })).ok).toBe(false);
});

test("reports missing fields before format problems, in field order", () => {
  const r = parseUpstream(upstreamMd({ path: "", repo: "nope", sha: "zz" }));
  expect(r).toEqual({
    ok: false,
    problems: ["missing field: path", 'repo must be owner/name, got "nope"', 'sha must be 40 hex characters, got "zz"'],
  });
});

test("no frontmatter is a problem", () => {
  expect(parseUpstream("Just prose.\n")).toEqual({ ok: false, problems: ["no frontmatter block"] });
});
