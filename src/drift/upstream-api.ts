import { Context, Effect, Layer, Schema } from "effect";
import { UpstreamUnreachable } from "../errors";

/** How `head` relates to `base`, as GitHub's compare API reports it. */
export const CompareStatus = Schema.Literals(["ahead", "behind", "identical", "diverged"]);
export type CompareStatus = typeof CompareStatus.Type;

// ---- GitHub API JSON (the edge) -----------------------------------------

/** `GET /repos/{repo}/commits?path=..&per_page=1`. An empty list means no commit touches the path. */
const CommitList = Schema.Array(Schema.Struct({ sha: Schema.optionalKey(Schema.String) }));
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
    /** Latest commit SHA touching `path` in `repo` (`owner/name`). */
    latestCommit(repo: string, path: string): Effect.Effect<string, UpstreamUnreachable>;
    /** Status of `head` relative to `base` in `repo`. */
    compare(repo: string, base: string, head: string): Effect.Effect<CompareStatus, UpstreamUnreachable>;
  }
>()("imsus-skills/UpstreamApi") {
  /** The GitHub REST API; honors GITHUB_TOKEN. */
  static readonly layerGithub = Layer.succeed(UpstreamApi, UpstreamApi.of(githubApi()));
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

function githubApi() {
  const get = (repo: string, apiPath: string) =>
    Effect.tryPromise({
      try: async (): Promise<unknown> => {
        const headers: Record<string, string> = {
          Accept: "application/vnd.github+json",
          "User-Agent": "imsus-skills-drift",
        };
        if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        const res = await fetch(`https://api.github.com/repos/${repo}/${apiPath}`, { headers });
        if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${repo}`);
        return await res.json();
      },
      catch: (e) => new UpstreamUnreachable({ repo, message: messageOf(e) }),
    });

  const latestCommit = (repo: string, path: string) =>
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

  const compare = (repo: string, base: string, head: string) =>
    Effect.gen(function* () {
      const body = yield* get(repo, `compare/${base}...${head}`);
      const decoded = yield* decodeCompare(body).pipe(
        Effect.mapError(() => {
          const status = typeof body === "object" && body !== null && "status" in body ? body.status : undefined;
          return new UpstreamUnreachable({ repo, message: `unexpected compare status "${status}" for ${repo}` });
        }),
      );
      return decoded.status;
    });

  return { latestCommit, compare };
}
