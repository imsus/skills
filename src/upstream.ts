import { parseFrontmatter } from "./frontmatter";

/** Name of the attribution file whose presence makes a skill folder a fork. */
export const UPSTREAM_FILE = "UPSTREAM.md";

/** Where a fork was copied from. */
export interface Upstream {
  /** Upstream repository, `owner/name`. */
  repo: string;
  /** Path of the skill folder within that repository. */
  path: string;
  /** Full 40-character lowercase commit SHA the fork was copied from. */
  sha: string;
}

export type UpstreamParse = { ok: true; upstream: Upstream } | { ok: false; problems: string[] };

const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA_RE = /^[0-9a-f]{40}$/;

/** Parse the frontmatter of an `UPSTREAM.md`. Never throws; returns every problem found. */
export function parseUpstream(text: string): UpstreamParse {
  const fm = parseFrontmatter(text);
  if (!fm) return { ok: false, problems: ["no frontmatter block"] };

  const problems: string[] = [];
  for (const field of ["repo", "path", "sha"] as const) {
    if (!fm[field]) problems.push(`missing field: ${field}`);
  }
  if (fm.repo && !REPO_RE.test(fm.repo)) problems.push(`repo must be owner/name, got "${fm.repo}"`);
  if (fm.sha && !SHA_RE.test(fm.sha)) problems.push(`sha must be 40 lowercase hex characters, got "${fm.sha}"`);
  if (problems.length > 0) return { ok: false, problems };

  return { ok: true, upstream: { repo: fm.repo!, path: fm.path!, sha: fm.sha! } };
}
