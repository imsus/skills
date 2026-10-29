import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Context, Effect, Layer } from "effect";
import { RepoFsError } from "./errors";

/**
 * Access to the repo's files. Paths are relative to the repo root (absolute
 * paths pass through). Production reads the disk; tests point it at a throwaway tree.
 */
export class RepoFs extends Context.Service<
  RepoFs,
  {
    /** Names of the entries directly inside `dir`, sorted. */
    list(dir: string): Effect.Effect<string[], RepoFsError>;
    /** Names of the non-hidden sub-directories of `dir`, sorted. Empty when `dir` is absent. */
    listDirs(dir: string): Effect.Effect<string[], RepoFsError>;
    /** File contents, or null when the file is absent. */
    readText(file: string): Effect.Effect<string | null, RepoFsError>;
    /** Write a file, creating missing parent directories. */
    writeText(file: string, text: string): Effect.Effect<void, RepoFsError>;
  }
>()("imsus-skills/RepoFs") {
  /** The real filesystem, rooted at `root`. */
  static readonly layer = (root: string) => Layer.succeed(RepoFs, RepoFs.of(diskFs(root)));
}

function diskFs(root: string) {
  const at = (rel: string) => resolve(root, rel);
  const attempt = <A>(path: string, run: () => A) =>
    Effect.try({
      try: run,
      catch: (e) => new RepoFsError({ path, message: e instanceof Error ? e.message : String(e) }),
    });
  return {
    list: (dir: string) => attempt(dir, () => readdirSync(at(dir)).sort()),
    listDirs: (dir: string) =>
      attempt(dir, () =>
        existsSync(at(dir))
          ? readdirSync(at(dir))
              .filter((n) => !n.startsWith(".") && statSync(resolve(at(dir), n)).isDirectory())
              .sort()
          : [],
      ),
    readText: (file: string) => attempt(file, () => (existsSync(at(file)) ? readFileSync(at(file), "utf8") : null)),
    writeText: (file: string, text: string) =>
      attempt(file, () => {
        mkdirSync(dirname(at(file)), { recursive: true });
        writeFileSync(at(file), text);
      }),
  };
}
