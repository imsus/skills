import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Command } from "../command";
import { readRepo, type Repo } from "../repo";

export const MANIFEST_PATH = ".claude-plugin/marketplace.json";

interface Plugin {
  name: string;
  source: string;
  description?: string;
  version?: string;
  skills: string[];
}

/**
 * Build the marketplace manifest text from the folder tree. One plugin per
 * category, sorted by name. Categories whose metadata did not load get no
 * plugin; the category rules report them. The version and description are
 * passed through as-is (validation belongs to those rules).
 */
export function generateManifest(repo: Repo): string {
  const plugins: Plugin[] = [];
  for (const cat of repo.categories) {
    if (cat.meta.status !== "loaded") continue;
    const { description, version } = cat.meta.data;
    const plugin: Plugin = { name: cat.name, source: "./", skills: [] };
    if (typeof description === "string") plugin.description = description;
    if (typeof version === "string") plugin.version = version;
    plugin.skills = cat.skills.map((s) => `./${s.path}`).sort();
    plugins.push(plugin);
  }
  // Keys are written in alphabetical order; JSON.stringify keeps insertion order.
  const manifest = {
    description: "Imam Susanto's curated agent skills, one plugin per category.",
    name: "imsus",
    owner: { name: "Imam Susanto", url: "https://github.com/imsus" },
    plugins: plugins.map((p) => ({
      description: p.description,
      name: p.name,
      skills: p.skills,
      source: p.source,
      version: p.version,
    })),
  };
  return JSON.stringify(manifest, null, 2) + "\n";
}

export const command: Command = {
  name: "manifest",
  summary: "Generate .claude-plugin/marketplace.json (--check: fail if stale)",
  run({ root, args, out, err }) {
    const expected = generateManifest(readRepo(root));
    const file = join(root, MANIFEST_PATH);
    if (args.includes("--check")) {
      const actual = existsSync(file) ? readFileSync(file, "utf8") : null;
      if (actual === expected) {
        out(`${MANIFEST_PATH} is up to date.`);
        return 0;
      }
      err(`${MANIFEST_PATH} is stale. Run: bun run src/cli.ts manifest`);
      return 1;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, expected);
    out(`Wrote ${MANIFEST_PATH}`);
    return 0;
  },
};
