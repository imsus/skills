import { Effect, Schema, SchemaTransformation } from "effect";
import { DriftReportError } from "../errors";

// ---- Domain ---------------------------------------------------------------

/** What drift found for one fork. */
export const DriftOutcome = Schema.Union([
  Schema.TaggedStruct("UpToDate", { latestSha: Schema.String }),
  Schema.TaggedStruct("Drifted", { latestSha: Schema.String, compareUrl: Schema.String }),
  Schema.TaggedStruct("Unreachable", { error: Schema.String }),
]);
export type DriftOutcome = typeof DriftOutcome.Type;

/** One fork's drift result: which fork, where it came from, and the outcome. */
export const DriftEntry = Schema.Struct({
  skill: Schema.String,
  category: Schema.String,
  path: Schema.String,
  /** What `UPSTREAM.md` recorded: the already-validated `Upstream`. */
  upstream: Schema.Struct({ repo: Schema.String, path: Schema.String, sha: Schema.String }),
  outcome: DriftOutcome,
});
export type DriftEntry = typeof DriftEntry.Type;

// ---- Wire: the `drift --json` shape that `drift.yml` consumes -------------

const wireBase = {
  skill: Schema.String,
  category: Schema.String,
  path: Schema.String,
  upstreamRepo: Schema.String,
  upstreamPath: Schema.String,
};
const wireTail = { recordedSha: Schema.String };

/** One entry of `drift --json`. Each outcome fixes which of the nullable fields are set. */
const DriftEntryWire = Schema.Union([
  Schema.Struct({
    ...wireBase,
    outcome: Schema.Literal("up-to-date"),
    ...wireTail,
    latestSha: Schema.String,
    compareUrl: Schema.Null,
    error: Schema.Null,
  }),
  Schema.Struct({
    ...wireBase,
    outcome: Schema.Literal("drifted"),
    ...wireTail,
    latestSha: Schema.String,
    compareUrl: Schema.String,
    error: Schema.Null,
  }),
  Schema.Struct({
    ...wireBase,
    outcome: Schema.Literal("unreachable"),
    ...wireTail,
    latestSha: Schema.Null,
    compareUrl: Schema.Null,
    error: Schema.String,
  }),
]);
type Wire = typeof DriftEntryWire.Type;

function fromWire(w: Wire): DriftEntry {
  const upstream = { repo: w.upstreamRepo, path: w.upstreamPath, sha: w.recordedSha };
  const entry = { skill: w.skill, category: w.category, path: w.path, upstream };
  switch (w.outcome) {
    case "up-to-date":
      return { ...entry, outcome: { _tag: "UpToDate", latestSha: w.latestSha } };
    case "drifted":
      return { ...entry, outcome: { _tag: "Drifted", latestSha: w.latestSha, compareUrl: w.compareUrl } };
    case "unreachable":
      return { ...entry, outcome: { _tag: "Unreachable", error: w.error } };
  }
}

function toWire(e: DriftEntry): Wire {
  const base = {
    skill: e.skill,
    category: e.category,
    path: e.path,
    upstreamRepo: e.upstream.repo,
    upstreamPath: e.upstream.path,
  };
  const o = e.outcome;
  switch (o._tag) {
    case "UpToDate":
      return { ...base, outcome: "up-to-date", recordedSha: e.upstream.sha, latestSha: o.latestSha, compareUrl: null, error: null };
    case "Drifted":
      return { ...base, outcome: "drifted", recordedSha: e.upstream.sha, latestSha: o.latestSha, compareUrl: o.compareUrl, error: null };
    case "Unreachable":
      return { ...base, outcome: "unreachable", recordedSha: e.upstream.sha, latestSha: null, compareUrl: null, error: o.error };
  }
}

/** One entry on the wire <-> one domain entry. */
const DriftEntryJson = DriftEntryWire.pipe(
  Schema.decodeTo(DriftEntry, SchemaTransformation.transform({ decode: fromWire, encode: toWire })),
);

/** `drift.json` text <-> domain entries. */
export const DriftReport = Schema.fromJsonString(Schema.Array(DriftEntryJson));

/** `drift --json` output text: the report, pretty-printed. A failure here is a bug in the entries, so it dies. */
export const encodeReport = (entries: readonly DriftEntry[]) =>
  Schema.encodeEffect(Schema.Array(DriftEntryJson))(entries).pipe(
    Effect.map((wire) => JSON.stringify(wire, null, 2)),
    Effect.orDie,
  );

/** The `drift.json` input of `scripts/drift-issues.ts`, decoded. */
export const decodeReport = (path: string, text: string) =>
  Schema.decodeUnknownEffect(DriftReport)(text).pipe(
    Effect.mapError((e) => new DriftReportError({ path, message: e.message })),
  );
