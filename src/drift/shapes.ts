import { Effect, Match, Schema, SchemaTransformation } from "effect";
import { DriftReportError } from "../errors";
import { CategoryName, CommitSha, SkillName, UpstreamRepo } from "../ids";
import { Upstream } from "../upstream";

// ---- Domain ---------------------------------------------------------------

/** What drift found for one fork. */
export const DriftOutcome = Schema.Union([
  Schema.TaggedStruct("UpToDate", { latestSha: CommitSha }),
  Schema.TaggedStruct("Drifted", { latestSha: CommitSha, compareUrl: Schema.String }),
  Schema.TaggedStruct("Unreachable", { error: Schema.String }),
]);
export type DriftOutcome = typeof DriftOutcome.Type;

/** One fork's drift result: which fork, where it came from, and the outcome. */
export const DriftEntry = Schema.Struct({
  skill: SkillName,
  category: CategoryName,
  path: Schema.String,
  /** What `UPSTREAM.md` recorded: the already-validated `Upstream`. */
  upstream: Schema.toType(Upstream),
  outcome: DriftOutcome,
});
export type DriftEntry = typeof DriftEntry.Type;

// ---- Wire: the `drift --json` shape that `drift.yml` consumes -------------

const wireBase = {
  skill: SkillName,
  category: CategoryName,
  path: Schema.String,
  upstreamRepo: UpstreamRepo,
  upstreamPath: Schema.String,
  recordedSha: CommitSha,
};

/** One entry of `drift --json`. Each outcome fixes which of the nullable fields are set. */
const DriftEntryWire = Schema.Union([
  Schema.Struct({
    ...wireBase,
    outcome: Schema.Literal("up-to-date"),
    latestSha: CommitSha,
    compareUrl: Schema.Null,
    error: Schema.Null,
  }),
  Schema.Struct({
    ...wireBase,
    outcome: Schema.Literal("drifted"),
    latestSha: CommitSha,
    compareUrl: Schema.String,
    error: Schema.Null,
  }),
  Schema.Struct({
    ...wireBase,
    outcome: Schema.Literal("unreachable"),
    latestSha: Schema.Null,
    compareUrl: Schema.Null,
    error: Schema.String,
  }),
]);
type Wire = typeof DriftEntryWire.Type;

const fromWire = (w: Wire): DriftEntry => {
  const entry = {
    skill: w.skill,
    category: w.category,
    path: w.path,
    upstream: { repo: w.upstreamRepo, path: w.upstreamPath, sha: w.recordedSha },
  };
  return Match.value(w).pipe(
    Match.discriminatorsExhaustive("outcome")({
      "up-to-date": (x): DriftEntry => ({ ...entry, outcome: { _tag: "UpToDate", latestSha: x.latestSha } }),
      drifted: (x): DriftEntry => ({ ...entry, outcome: { _tag: "Drifted", latestSha: x.latestSha, compareUrl: x.compareUrl } }),
      unreachable: (x): DriftEntry => ({ ...entry, outcome: { _tag: "Unreachable", error: x.error } }),
    }),
  );
};

const toWire = (e: DriftEntry): Wire => {
  const base = {
    skill: e.skill,
    category: e.category,
    path: e.path,
    upstreamRepo: e.upstream.repo,
    upstreamPath: e.upstream.path,
    recordedSha: e.upstream.sha,
  };
  return Match.valueTags(e.outcome, {
    UpToDate: (o): Wire => ({ ...base, outcome: "up-to-date", latestSha: o.latestSha, compareUrl: null, error: null }),
    Drifted: (o): Wire => ({ ...base, outcome: "drifted", latestSha: o.latestSha, compareUrl: o.compareUrl, error: null }),
    Unreachable: (o): Wire => ({ ...base, outcome: "unreachable", latestSha: null, compareUrl: null, error: o.error }),
  });
};

/** One entry on the wire <-> one domain entry. */
const DriftEntryJson = DriftEntryWire.pipe(
  Schema.decodeTo(Schema.toType(DriftEntry),SchemaTransformation.transform({ decode: fromWire, encode: toWire })),
);

/** The report: wire entries <-> domain entries. */
export const DriftReport = Schema.Array(DriftEntryJson);

const DriftReportText = Schema.fromJsonString(DriftReport);

/** `drift --json` output text: the report, pretty-printed. A failure here is a bug in the entries, so it dies. */
export const encodeReport = (entries: readonly DriftEntry[]) =>
  Schema.encodeEffect(DriftReport)(entries).pipe(
    Effect.map((wire) => JSON.stringify(wire, null, 2)),
    Effect.orDie,
  );

/** The `drift.json` input of `scripts/drift-issues.ts`, decoded. */
export const decodeReport = (path: string, text: string) =>
  Schema.decodeUnknownEffect(DriftReportText)(text).pipe(
    Effect.mapError((e) => new DriftReportError({ path, message: e.message })),
  );
