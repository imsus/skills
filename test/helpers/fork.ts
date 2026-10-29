import { skillMd, type Files } from "./tree";

export const SHA = "0123456789abcdef0123456789abcdef01234567";

/** UPSTREAM.md text. An empty-string field value omits that field. */
export function upstreamMd(fields: Record<string, string> = {}, prose = "Changed things.\n"): string {
  const f = { repo: "someone/skills", path: "skills/foo", sha: SHA, ...fields };
  const lines = Object.entries(f)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join("\n")}\n---\n\n${prose}`;
}

/** A fork skill folder: valid SKILL.md, UPSTREAM.md and (unless `license` is null) LICENSE. */
export function fork(
  categoryName: string,
  name: string,
  opts: { upstream?: string; license?: string | null } = {},
): Files {
  const base = `skills/${categoryName}/${name}`;
  const files: Files = {
    [`${base}/SKILL.md`]: skillMd(name),
    [`${base}/UPSTREAM.md`]: opts.upstream ?? upstreamMd(),
  };
  if (opts.license !== null) files[`${base}/LICENSE`] = opts.license ?? "Upstream license\n";
  return files;
}
