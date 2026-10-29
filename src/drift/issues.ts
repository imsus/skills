import type { DriftEntry } from "./run";

export const DRIFT_LABEL = "drift";

export interface NewIssue {
  title: string;
  body: string;
  labels: string[];
}

/** The slice of an issue tracker the sync needs. Injected so tests can fake it. */
export interface IssueClient {
  /** The open issue with exactly this title, if any. */
  findOpen(title: string): Promise<{ number: number } | null>;
  create(issue: NewIssue): Promise<void>;
  update(number: number, body: string): Promise<void>;
}

export const issueTitle = (e: DriftEntry) => `Drift: ${e.category}/${e.skill}`;

function issueBody(e: DriftEntry): string {
  const where = `\`${e.path}\``;
  if (e.outcome === "unreachable") {
    return [
      `Upstream of ${where} could not be checked.`,
      "",
      `- Upstream: ${e.upstreamRepo ?? "unknown"} (${e.upstreamPath ?? "unknown"})`,
      `- Recorded SHA: ${e.recordedSha ?? "unknown"}`,
      `- Error: ${e.error ?? "unknown"}`,
    ].join("\n");
  }
  return [
    `Upstream of ${where} has new commits since the recorded SHA.`,
    "",
    `- Upstream: ${e.upstreamRepo} (${e.upstreamPath})`,
    `- Recorded SHA: ${e.recordedSha}`,
    `- Latest SHA: ${e.latestSha}`,
    `- Compare: ${e.compareUrl}`,
  ].join("\n");
}

/** Open or update one issue per drifted or unreachable fork. Never closes anything. */
export async function syncDriftIssues(entries: DriftEntry[], client: IssueClient): Promise<void> {
  for (const e of entries) {
    if (e.outcome === "up-to-date") continue;
    const title = issueTitle(e);
    const body = issueBody(e);
    const existing = await client.findOpen(title);
    if (existing) await client.update(existing.number, body);
    else await client.create({ title, body, labels: [DRIFT_LABEL] });
  }
}
