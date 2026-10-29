import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allSkills, readRepo } from "../repo";
import { parseUpstream, UPSTREAM_FILE, type Upstream } from "../upstream";

/** How `head` relates to `base`, as GitHub's compare API reports it. */
export type CompareStatus = "ahead" | "behind" | "identical" | "diverged";

/** The upstream questions drift asks. Injected so tests can fake GitHub. Both reject when GitHub can't answer. */
export interface UpstreamApi {
  /** Latest commit SHA touching `path` in `repo` (`owner/name`). */
  latestCommit(repo: string, path: string): Promise<string>;
  /** Status of `head` relative to `base` in `repo`. */
  compare(repo: string, base: string, head: string): Promise<CompareStatus>;
}

export type Outcome = "up-to-date" | "drifted" | "unreachable";

/** One fork's drift result. This is the shape `drift --json` emits (an array of these). */
export interface DriftEntry {
  skill: string;
  category: string;
  path: string;
  upstreamRepo: string | null;
  upstreamPath: string | null;
  outcome: Outcome;
  recordedSha: string | null;
  latestSha: string | null;
  compareUrl: string | null;
  error: string | null;
}

export interface RunDriftOptions {
  root: string;
  upstream: UpstreamApi;
  json?: boolean;
  out(line: string): void;
  err(line: string): void;
}

async function github<T>(repo: string, apiPath: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "imsus-skills-drift" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/${apiPath}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${repo}`);
  return (await res.json()) as T;
}

/** The GitHub-backed upstream; honors GITHUB_TOKEN. */
export const githubUpstream: UpstreamApi = {
  async latestCommit(repo, path) {
    const body = await github<{ sha?: string }[]>(repo, `commits?path=${encodeURIComponent(path)}&per_page=1`);
    const sha = body[0]?.sha;
    if (!sha) throw new Error(`no commits found for ${path} in ${repo}`);
    return sha;
  },
  async compare(repo, base, head) {
    const body = await github<{ status?: string }>(repo, `compare/${base}...${head}`);
    const status = body.status;
    if (status !== "ahead" && status !== "behind" && status !== "identical" && status !== "diverged") {
      throw new Error(`unexpected compare status "${status}" for ${repo}`);
    }
    return status;
  },
};

async function inspect(
  fork: { name: string; category: string; path: string },
  upstreamRef: Upstream,
  api: UpstreamApi,
): Promise<DriftEntry> {
  const base = { skill: fork.name, category: fork.category, path: fork.path };
  const { repo, path, sha } = upstreamRef;
  const upstream = { upstreamRepo: repo, upstreamPath: path, recordedSha: sha };
  try {
    const latest = await api.latestCommit(repo, path);
    // The recorded SHA is usually the upstream HEAD at copy time, not the last
    // commit touching the path. Drift means a path commit exists after it.
    const status = latest === sha ? "identical" : await api.compare(repo, sha, latest);
    const drifted = status === "ahead" || status === "diverged";
    return {
      ...base,
      ...upstream,
      outcome: drifted ? "drifted" : "up-to-date",
      latestSha: latest,
      compareUrl: drifted ? `https://github.com/${repo}/compare/${sha}...${latest}` : null,
      error: null,
    };
  } catch (e) {
    return { ...base, ...upstream, outcome: "unreachable", latestSha: null, compareUrl: null, error: (e as Error).message };
  }
}

function describe(e: DriftEntry): string {
  const label = `${e.category}/${e.skill}`;
  if (e.outcome === "up-to-date") return `${label}: up to date`;
  if (e.outcome === "drifted") return `${label}: drifted ${e.compareUrl}`;
  return `${label}: unreachable (${e.error})`;
}

/** Report drift for every fork. Exits 0 whenever the report completes. */
export async function runDrift({ root, upstream, json, out, err }: RunDriftOptions): Promise<number> {
  const entries: DriftEntry[] = [];
  // Sequential on purpose: stays under unauthenticated GitHub rate limits.
  for (const fork of allSkills(readRepo(root)).filter((s) => s.isFork)) {
    const parsed = parseUpstream(readFileSync(join(fork.dir, UPSTREAM_FILE), "utf8"));
    if (!parsed.ok) {
      err(`${fork.path}: skipped, invalid ${UPSTREAM_FILE} (run \`check\` for details)`);
      continue;
    }
    entries.push(await inspect(fork, parsed.upstream, upstream));
  }
  if (json) out(JSON.stringify(entries, null, 2));
  else for (const e of entries) out(describe(e));
  return 0;
}
