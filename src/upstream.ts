import { Schema, SchemaIssue, SchemaTransformation } from "effect";
import { parseFrontmatter } from "./frontmatter";

/** Name of the attribution file whose presence makes a skill folder a fork. */
export const UPSTREAM_FILE = "UPSTREAM.md";

const MISSING = "missing field: ";

/** A required string field. Absent and empty both read "missing field: <name>". */
const required = (name: string) =>
  Schema.String.check(Schema.isNonEmpty({ message: MISSING + name })).annotateKey({
    messageMissingKey: MISSING + name,
  });

/**
 * Where a fork was copied from: the `UPSTREAM.md` frontmatter fields.
 * Decoding normalizes `sha` to lowercase.
 */
export const Upstream = Schema.Struct({
  /** Upstream repository, `owner/name`. */
  repo: required("repo").check(Schema.isPattern(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, { message: "repo must be owner/name" })),
  /** Path of the skill folder within that repository. */
  path: required("path"),
  /** Full 40-character commit SHA the fork was copied from. */
  sha: required("sha")
    .check(Schema.isPattern(/^[0-9a-fA-F]{40}$/, { message: "sha must be 40 hex characters" }))
    .pipe(Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()))
    .annotateKey({ messageMissingKey: MISSING + "sha" }),
});
export type Upstream = typeof Upstream.Type;

export type UpstreamParse = { ok: true; upstream: Upstream } | { ok: false; problems: string[] };

const FIELD_ORDER = ["repo", "path", "sha"];
const decodeFields = Schema.decodeUnknownResult(Upstream, { errors: "all" });
const flatten = SchemaIssue.makeFormatterStandardSchemaV1();

/** Turn schema issues into one problem per field, missing fields first, then format errors in field order. */
function problemsOf(issue: SchemaIssue.Issue, fields: Record<string, string>): string[] {
  const firstPerField = new Map<string, string>();
  for (const { path, message } of flatten(issue).issues) {
    const field = String(path?.[0]);
    if (!firstPerField.has(field)) firstPerField.set(field, message);
  }
  const ordered = [...firstPerField].sort((a, b) => FIELD_ORDER.indexOf(a[0]) - FIELD_ORDER.indexOf(b[0]));
  const missing = ordered.filter(([, m]) => m.startsWith(MISSING)).map(([, m]) => m);
  const invalid = ordered.filter(([, m]) => !m.startsWith(MISSING)).map(([f, m]) => `${m}, got "${fields[f]}"`);
  return [...missing, ...invalid];
}

/** Parse the frontmatter of an `UPSTREAM.md`. Never throws; returns every problem found. */
export function parseUpstream(text: string): UpstreamParse {
  const fm = parseFrontmatter(text);
  if (!fm) return { ok: false, problems: ["no frontmatter block"] };
  const result = decodeFields(fm);
  if (result._tag === "Success") return { ok: true, upstream: result.success };
  return { ok: false, problems: problemsOf(result.failure.issue, fm) };
}
