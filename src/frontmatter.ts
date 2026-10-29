/**
 * Parse the leading `---` frontmatter block of a Markdown file as flat
 * `key: value` lines. Returns null when there is no frontmatter block.
 * Values are trimmed strings; surrounding quotes are removed.
 */
export function parseFrontmatter(text: string): Record<string, string> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text) ?? /^---\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return null;
  const out: Record<string, string> = {};
  for (const line of (match[1] ?? "").split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]!] = m[2]!.trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return out;
}
