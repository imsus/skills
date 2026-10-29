const BLOCK = /^[>|][+-]?$/;

function unquote(value: string): string {
  return /^"[^"]*"$|^'[^']*'$/.test(value) ? value.slice(1, -1) : value;
}

/**
 * Parse the leading `---` frontmatter block of a Markdown file as flat
 * `key: value` lines. Returns null when there is no frontmatter block.
 * Values are trimmed strings. A matched pair of surrounding quotes is removed.
 * Block scalars (`key: >` folded, `key: |` literal) are joined from their
 * indented continuation lines.
 */
export function parseFrontmatter(text: string): Record<string, string> | null {
  const match = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/.exec(text.replace(/^﻿/, ""));
  if (!match) return null;
  const out: Record<string, string> = {};
  const lines = (match[1] ?? "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[i]!);
    if (!m) continue;
    const value = m[2]!.trim();
    if (!BLOCK.test(value)) {
      out[m[1]!] = unquote(value);
      continue;
    }
    const body: string[] = [];
    while (i + 1 < lines.length && /^(\s+\S.*|\s*)$/.test(lines[i + 1]!)) body.push(lines[++i]!.trim());
    out[m[1]!] = body.filter(Boolean).join(value.startsWith(">") ? " " : "\n");
  }
  return out;
}
