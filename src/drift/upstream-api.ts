import { Config, Context, Effect, Layer, Option, Schema } from "effect";
import { UpstreamUnreachable } from "../errors";
import { CommitSha, type UpstreamRepo } from "../ids";

/** How `head` relates to `base`, as GitHub's compare API reports it. */
export const CompareStatus = Schema.Literals(["ahead", "behind", "identical", "diverged"]);
export type CompareStatus = typeof CompareStatus.Type;

// ---- GitHub API JSON (the edge) -----------------------------------------

/** `GET /repos/{repo}/commits?path=..&per_page=1`. An empty list means no commit touches the path. */
const CommitList = Schema.Array(Schema.Struct({ sha: Schema.optionalKey(CommitSha) }));
/** `GET /repos/{repo}/compare/{base}...{head}` */
const CompareResponse = Schema.Struct({ status: CompareStatus });

const decodeCommits = Schema.decodeUnknownEffect(CommitList);
const decodeCompare = Schema.decodeUnknownEffect(CompareResponse);

/**
 * The upstream questions drift asks. Every failure to get an answer is an
 * `UpstreamUnreachable`, which the caller recovers per fork.
 */
export class UpstreamApi extends Context.Service<
  UpstreamApi,
  {
    /** Latest commit SHA touching `path` in `repo`. */
    latestCommit(repo: UpstreamRepo, path: string): Effect.Effect<CommitSha, UpstreamUnreachable>;
    /** Status of `head` relative to `base` in `repo`. */
    compare(repo: UpstreamRepo, base: CommitSha, head: CommitSha): Effect.Effect<CompareStatus, UpstreamUnreachable>;
  }
>()("imsus-skills/UpstreamApi") {
  /** The GitHub REST API. Reads the optional `GITHUB_TOKEN` through `Config` when the layer is built. */
  static readonly layerGithub = Layer.effect(
    UpstreamApi,
    Effect.gen(function* () {
      const token = yield* Config.option(Config.NonEmptyString("GITHUB_TOKEN"));
      return UpstreamApi.of(githubApi(token));
    }).pipe(Effect.orDie),
  );
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** The compare response, narrowed to its status. */
const decodeStatus = (repo: UpstreamRepo, body: unknown) =>
  decodeCompare(body).pipe(
    Effect.map((compared) => compared.status),
    Effect.mapError(() => {
      const status = typeof body === "object" && body !== null && "status" in body ? body.status : undefined;
      return new UpstreamUnreachable({ repo, message: `unexpected compare status "${status}" for ${repo}` });
    }),
  );

function githubApi(token: Option.Option<string>) {
  const get = (repo: UpstreamRepo, apiPath: string) =>
    Effect.tryPromise({
      try: async (): Promise<unknown> => {
        const headers: Record<string, string> = {
          Accept: "application/vnd.github+json",
          "User-Agent": "imsus-skills-drift",
        };
        if (Option.isSome(token)) headers.Authorization = `Bearer ${token.value}`;
        const res = await fetch(`https://api.github.com/repos/${repo}/${apiPath}`, { headers });
        if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${repo}`);
        return await res.json();
      },
      catch: (e) => new UpstreamUnreachable({ repo, message: messageOf(e) }),
    });

  const latestCommit = (repo: UpstreamRepo, path: string) =>
    Effect.gen(function* () {
      const body = yield* get(repo, `commits?path=${encodeURIComponent(path)}&per_page=1`);
      const commits = yield* decodeCommits(body);
      const sha = commits[0]?.sha;
      if (!sha) return yield* new UpstreamUnreachable({ repo, message: `no commits found for ${path} in ${repo}` });
      return sha;
    }).pipe(
      Effect.catchTag("SchemaError", () =>
        Effect.fail(new UpstreamUnreachable({ repo, message: `unexpected commit list for ${path} in ${repo}` })),
      ),
    );

  const compare = (repo: UpstreamRepo, base: CommitSha, head: CommitSha) =>
    Effect.gen(function* () {
      const body = yield* get(repo, `compare/${base}...${head}`);
      return yield* decodeStatus(repo, body);
    });

  return { latestCommit, compare };
}
