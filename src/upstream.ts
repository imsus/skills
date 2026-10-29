import { Effect, Option, Schema, SchemaIssue, SchemaTransformation } from "effect";
import { InvalidUpstream } from "./errors";
import { parseFrontmatter } from "./frontmatter";
import { CommitSha, UpstreamRepo } from "./ids";

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
  repo: required("repo").pipe(Schema.decodeTo(UpstreamRepo)).annotateKey({ messageMissingKey: MISSING + "repo" }),
  /** Path of the skill folder within that repository. */
  path: required("path"),
  /** Full 40-character commit SHA the fork was copied from. */
  sha: required("sha")
    .check(Schema.isPattern(/^[0-9a-fA-F]{40}$/, { message: "sha must be 40 hex characters" }))
    .pipe(Schema.decodeTo(CommitSha, SchemaTransformation.toLowerCase()))
    .annotateKey({ messageMissingKey: MISSING + "sha" }),
});
export type Upstream = typeof Upstream.Type;

const FIELD_ORDER = ["repo", "path", "sha"];
const decodeFields = Schema.decodeUnknownEffect(Upstream,{ errors: "all" });
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

const NO_FRONTMATTER = ["no frontmatter block"];

/** Decode the frontmatter of the `UPSTREAM.md` at `path` (the skill folder), reporting every problem found. */
export const parseUpstream = (path: string, text: string): Effect.Effect<Upstream, InvalidUpstream> =>
  Option.match(Option.fromNullishOr(parseFrontmatter(text)), {
    onNone: () => Effect.fail(new InvalidUpstream({ path, problems: NO_FRONTMATTER })),
    onSome: (fm) =>
      decodeFields(fm).pipe(
        Effect.mapError((e) => new InvalidUpstream({ path, problems: problemsOf(e.issue, fm) })),
      ),
  });
