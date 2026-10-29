import { Array, Effect, Match, Option } from "effect";
import { allSkills, isFork, readRepo, type ForkSkill } from "../repo";
import { reportFsError } from "../report";
import { Stdio } from "../stdio";
import { UPSTREAM_FILE, type Upstream } from "../upstream";
import { encodeReport, type DriftEntry, type DriftOutcome } from "./shapes";
import { UpstreamApi } from "./upstream-api";

/**
 * Ask GitHub whether the upstream moved past the recorded SHA. The recorded
 * SHA is usually the upstream HEAD at copy time, not the last commit touching
 * the path, so drift means a path commit exists after it.
 */
const outcomeOf = ({ repo, path, sha }: Upstream) =>
  Effect.gen(function* () {
    const api = yield* UpstreamApi;
    const latest = yield* api.latestCommit(repo, path);
    const status = latest === sha ? "identical" : yield* api.compare(repo, sha, latest);
    const drifted = status === "ahead" || status === "diverged";
    return drifted
      ? ({ _tag: "Drifted", latestSha: latest, compareUrl: `https://github.com/${repo}/compare/${sha}...${latest}` } as const)
      : ({ _tag: "UpToDate", latestSha: latest } as const);
  }).pipe(
    // Escape hatch: an unreachable upstream is this fork's outcome, never the run's failure.
    Effect.catchTag("UpstreamUnreachable", (e) => Effect.succeed({ _tag: "Unreachable", error: e.message } as const)),
  );

/** One fork's drift entry, or none when its `UPSTREAM.md` is invalid (warned on stderr, skipped). */
const driftOf = (fork: ForkSkill) =>
  Effect.gen(function* () {
    const upstream = yield* Effect.fromResult(fork.upstream);
    const outcome: DriftOutcome = yield* outcomeOf(upstream);
    return Option.some<DriftEntry>({ skill: fork.name, category: fork.category, path: fork.path, upstream, outcome });
  }).pipe(
    Effect.catchTag("InvalidUpstream", (e) =>
      Effect.gen(function* () {
        const io = yield* Stdio;
        yield* io.err(`${e.path}: skipped, invalid ${UPSTREAM_FILE} (run \`check\` for details)`);
        return Option.none<DriftEntry>();
      }),
    ),
  );

const describe = (e: DriftEntry): string => {
  const label = `${e.category}/${e.skill}`;
  return Match.valueTags(e.outcome, {
    UpToDate: () => `${label}: up to date`,
    Drifted: (o) => `${label}: drifted ${o.compareUrl}`,
    Unreachable: (o) => `${label}: unreachable (${o.error})`,
  });
};

/** Report drift for every fork. Exits 0 whenever the report completes. */
export const runDrift = ({ json }: { json: boolean }) =>
  Effect.gen(function* () {
    const io = yield* Stdio;
    const repo = yield* readRepo;
    // Sequential on purpose: stays under unauthenticated GitHub rate limits.
    const results = yield* Effect.forEach(allSkills(repo).filter(isFork), driftOf, { concurrency: 1 });
    const entries = Array.getSomes(results);
    if (json) yield* io.out(yield* encodeReport(entries));
    else for (const e of entries) yield* io.out(describe(e));
    return 0;
  }).pipe(Effect.catchTag("RepoFsError", reportFsError));
