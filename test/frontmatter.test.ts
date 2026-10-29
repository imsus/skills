import { expect, test } from "bun:test";
import { parseFrontmatter } from "../src/frontmatter";

test("parses simple key: value frontmatter", () => {
  const r = parseFrontmatter("---\nname: a\ndescription: Does: things\n---\nbody");
  expect(r).toEqual({ name: "a", description: "Does: things" });
});

test("returns null when there is no frontmatter", () => {
  expect(parseFrontmatter("# just a heading")).toBeNull();
});

test("strips a leading BOM", () => {
  expect(parseFrontmatter("﻿---\nname: a\n---\n")).toEqual({ name: "a" });
});

test("folded block scalar joins indented lines with spaces", () => {
  const r = parseFrontmatter("---\nname: a\ndescription: >\n  First line\n  second line\nnext: x\n---\n");
  expect(r).toEqual({ name: "a", description: "First line second line", next: "x" });
});

test("literal block scalar joins indented lines with newlines", () => {
  const r = parseFrontmatter("---\ndescription: |\n  one\n  two\n---\n");
  expect(r).toEqual({ description: "one\ntwo" });
});

test("block scalars accept the strip indicator", () => {
  expect(parseFrontmatter("---\nd: >-\n  a\n  b\n---\n")).toEqual({ d: "a b" });
  expect(parseFrontmatter("---\nd: |-\n  a\n  b\n---\n")).toEqual({ d: "a\nb" });
});

test("removes only a matched pair of surrounding quotes", () => {
  const r = parseFrontmatter(`---\na: "x"\nb: 'y'\nc: "z'\nd: "p" and "q"\ne: "\n---\n`);
  expect(r).toEqual({ a: "x", b: "y", c: `"z'`, d: `"p" and "q"`, e: `"` });
});

test("empty frontmatter block parses to an empty object", () => {
  expect(parseFrontmatter("---\n---\nbody")).toEqual({});
});
