import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readRepo } from "../repo";
import { parseUpstream, UPSTREAM_FILE } from "../upstream";

/** Latest commit SHA touching `path` in `repo` (`owner/name`). Rejects when it can't be looked up. */
export type Lookup = (repo: string, path: string) => Promise<string>;

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
  lookup: Lookup;
  json?: boolean;
  out(line: string): void;
}

/** Look up the latest commit for the GitHub API; honors GITHUB_TOKEN. */
export const githubLookup: Lookup = async (repo, path) => {
  const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "imsus-skills-drift" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${repo}`);
  const body = (await res.json()) as { sha?: string }[];
  const sha = body[0]?.sha;
  if (!sha) throw new Error(`no commits found for ${path} in ${repo}`);
  return sha;
};

async function inspect(
  fork: { name: string; category: string; path: string; dir: string },
  lookup: Lookup,
): Promise<DriftEntry> {
  const base = { skill: fork.name, category: fork.category, path: fork.path };
  const parsed = parseUpstream(readFileSync(join(fork.dir, UPSTREAM_FILE), "utf8"));
  if (!parsed.ok) {
    return {
      ...base,
      upstreamRepo: null,
      upstreamPath: null,
      outcome: "unreachable",
      recordedSha: null,
      latestSha: null,
      compareUrl: null,
      error: `invalid ${UPSTREAM_FILE}: ${parsed.problems.join("; ")}`,
    };
  }
  const { repo, path, sha } = parsed.upstream;
  const upstream = { upstreamRepo: repo, upstreamPath: path, recordedSha: sha };
  try {
    const latest = await lookup(repo, path);
    const drifted = latest !== sha;
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
export async function runDrift({ root, lookup, json, out }: RunDriftOptions): Promise<number> {
  const forks = readRepo(root).categories.flatMap((c) => c.skills.filter((s) => s.isFork));
  const entries = await Promise.all(forks.map((f) => inspect(f, lookup)));
  if (json) out(JSON.stringify(entries, null, 2));
  else for (const e of entries) out(describe(e));
  return 0;
}
