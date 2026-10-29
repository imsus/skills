import { expect, test } from "bun:test";
import { parseFrontmatter } from "../src/frontmatter";

test("parses simple key: value frontmatter", () => {
  const r = parseFrontmatter("---\nname: a\ndescription: Does: things\n---\nbody");
  expect(r).toEqual({ name: "a", description: "Does: things" });
});

test("returns null when there is no frontmatter", () => {
  expect(parseFrontmatter("# just a heading")).toBeNull();
});
