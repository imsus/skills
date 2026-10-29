import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import ts from "typescript";

/**
 * Filesystem linter for the Code style rules in CLAUDE.md and ADR-0002. It
 * walks the TypeScript AST of every file in `src/` and `scripts/`, so comments
 * and strings never match. Each finding names the fix.
 */

const ROOT = resolve(import.meta.dir, "..");

/** The only production layer modules that may do raw I/O. */
const RAW_IO_ALLOWED = new Set(["src/drift/upstream-api.ts", "src/drift/issue-client.ts"]);

const files = [...new Bun.Glob("{src,scripts}/**/*.ts").scanSync({ cwd: ROOT })].sort();

const FIX_CAST = "validate with a Schema at the edge, or restructure so the type is inferred (`as const` is allowed)";
const FIX_ENV = "read it with Effect `Config` inside a layer";
const FIX_IO = "go through a service layer (UpstreamApi / IssueClient)";
const FIX_JSON = "decode with `Schema.fromJsonString(<schema>)` (see node_modules/effect Schema.d.ts)";

const isConstAssertion = (type: ts.TypeNode) =>
  ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName) && type.typeName.text === "const";

const dotted = (e: ts.Expression): string =>
  ts.isIdentifier(e)
    ? e.text
    : ts.isPropertyAccessExpression(e)
      ? `${dotted(e.expression)}.${e.name.text}`
      : "";

function lint(file: string): string[] {
  const text = readFileSync(resolve(ROOT, file), "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const report = (node: ts.Node, what: string, fix: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    out.push(`${file}:${line + 1}: ${what}. Fix: ${fix}.`);
  };
  const visit = (node: ts.Node): void => {
    if ((ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) && !isConstAssertion(node.type)) {
      report(node, "type cast", FIX_CAST);
    }
    if (ts.isPropertyAccessExpression(node) && dotted(node) === "process.env") {
      report(node, "`process.env`", FIX_ENV);
    }
    if (ts.isCallExpression(node)) {
      const callee = dotted(node.expression);
      if (callee === "JSON.parse") report(node, "`JSON.parse`", FIX_JSON);
      if (
        !RAW_IO_ALLOWED.has(file) &&
        (callee === "fetch" || callee === "globalThis.fetch" || callee.startsWith("Bun.spawn"))
      ) {
        report(node, `raw I/O (\`${callee}\`)`, FIX_IO);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

test("src/ and scripts/ follow the code-style conventions", () => {
  expect(files.length).toBeGreaterThan(0);
  const findings = files.flatMap(lint);
  expect(findings.join("\n")).toBe("");
});

test("raw I/O allow-list names files that exist", () => {
  for (const f of RAW_IO_ALLOWED) expect(files).toContain(relative(ROOT, resolve(ROOT, f)));
});
