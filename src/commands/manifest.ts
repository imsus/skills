import { Effect, Option } from "effect";
import type { Command } from "../command";
import { reportFsError } from "../report";
import { CATALOG_DESTINATIONS, CATALOG_FILE, generateCatalog } from "../catalog";
import { allSkills, readRepo, type Repo } from "../repo";
import type { RepoFsError } from "../errors";
import { RepoFs } from "../repo-fs";
import { sharedReferenceCopies } from "../shared-references";
import { Stdio } from "../stdio";

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
    if (cat.meta._tag !== "Loaded") continue;
    const { description, version } = cat.meta;
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

/** A file `manifest` owns: its repo-relative path and the exact text it must hold. */
export interface GeneratedFile {
  path: string;
  text: string;
}

/**
 * Every file generated from the folder tree: the marketplace manifest, one
 * catalog copy in each catalog destination skill present in the repo, and
 * imsus-ask's copies of imsus-setup's shared references.
 * `manifest` writes them all; `--check` fails on any that differs.
 */
export const generatedFiles = (repo: Repo): Effect.Effect<GeneratedFile[], RepoFsError, RepoFs> =>
  Effect.gen(function* () {
    const catalog = generateCatalog(repo);
    const catalogs = allSkills(repo)
      .filter((s) => CATALOG_DESTINATIONS.includes(s.name))
      .map((s) => ({ path: `${s.path}/${CATALOG_FILE}`, text: catalog }));
    const references = yield* sharedReferenceCopies(repo);
    return [{ path: MANIFEST_PATH, text: generateManifest(repo) }, ...catalogs, ...references];
  });

export const command: Command = {
  name: "manifest",
  summary: "Generate .claude-plugin/marketplace.json, the skill catalogs and the shared reference copies (--check: fail if stale)",
  run: (args) =>
    Effect.gen(function* () {
      const fs = yield* RepoFs;
      const io = yield* Stdio;
      const files = yield* generatedFiles(yield* readRepo);
      if (!args.includes("--check")) {
        yield* Effect.forEach(files, (f) => Effect.andThen(fs.writeText(f.path, f.text), io.out(`Wrote ${f.path}`)));
        return 0;
      }
      const stale = yield* Effect.filter(files, (f) =>
        Effect.map(fs.readText(f.path), (actual) => !Option.exists(actual, (text) => text === f.text)),
      );
      if (stale.length === 0) {
        yield* io.out("Generated files are up to date.");
        return 0;
      }
      yield* Effect.forEach(stale, (f) => io.err(`${f.path} is stale. Run: bun run src/cli.ts manifest`));
      return 1;
    }).pipe(Effect.catchTag("RepoFsError", reportFsError)),
};
