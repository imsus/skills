import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

/** Files of a throwaway repo, keyed by repo-relative path. */
export type Files = Record<string, string>;

export interface Tree {
  root: string;
  cleanup(): void;
}

/** Build a throwaway repo tree. Call `cleanup()` (e.g. in afterEach) when done. */
export function buildTree(files: Files = {}): Tree {
  const root = mkdtempSync(join(tmpdir(), "skills-tree-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

const CLI = resolve(import.meta.dir, "../../src/cli.ts");

/** Run the real CLI as a subprocess with `root` as the repo root (its cwd). */
export async function runCli(args: string[], root: string): Promise<CliResult> {
  const proc = Bun.spawn(["bun", "run", CLI, ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stdout, stderr };
}

// Fixture builders. Each returns a `Files` map; merge with spread. Add new
// builders rather than changing these defaults, so other tests keep passing.

export function skillMd(name: string, description = "Does a thing."): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`;
}

export function categoryJson(description = "A category.", version = "1.0.0"): string {
  return JSON.stringify({ description, version }, null, 2) + "\n";
}

/** A category with its metadata file and the given skills (all valid own skills). */
export function category(name: string, skills: string[] = []): Files {
  const files: Files = { [`skills/${name}/category.json`]: categoryJson() };
  for (const skill of skills) files[`skills/${name}/${skill}/SKILL.md`] = skillMd(skill);
  return files;
}

/** A category with explicit metadata, for tests that need distinct versions. */
export function categoryWith(
  name: string,
  skills: string[],
  description: string,
  version: string,
): Files {
  return {
    ...category(name, skills),
    [`skills/${name}/category.json`]: categoryJson(description, version),
  };
}
