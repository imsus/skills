import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Context, Effect, Layer, Option } from "effect";
import { RepoFsError } from "./errors";

/** What sits at a path, read without following a symlink. */
export type Entry = { _tag: "Absent" } | { _tag: "Link"; target: string } | { _tag: "Other" };

/**
 * Access to the repo's files. Paths are relative to the repo root (absolute
 * paths pass through). Production reads the disk; tests point it at a throwaway tree.
 */
export class RepoFs extends Context.Service<
  RepoFs,
  {
    /** Names of the entries directly inside `dir`, sorted. Empty when `dir` is absent. */
    list(dir: string): Effect.Effect<string[], RepoFsError>;
    /** Names of the non-hidden sub-directories of `dir`, sorted. Empty when `dir` is absent. */
    listDirs(dir: string): Effect.Effect<string[], RepoFsError>;
    /** File contents, or none when the file is absent. */
    readText(file: string): Effect.Effect<Option.Option<string>, RepoFsError>;
    /** Write a file, creating missing parent directories. */
    writeText(file: string, text: string): Effect.Effect<void, RepoFsError>;
    /**
     * The absolute path with every symlink resolved, so two spellings of one place compare equal.
     * Only the longest existing prefix is resolved; the rest (a dangling link's target, a folder
     * not created yet) is appended as written.
     */
    realPath(path: string): Effect.Effect<string, RepoFsError>;
    /** What sits at `path`; a symlink is reported with its raw target, not followed. */
    entry(path: string): Effect.Effect<Entry, RepoFsError>;
    /** Create a symlink at `path` holding `target`, creating missing parent directories. */
    symlink(target: string, path: string): Effect.Effect<void, RepoFsError>;
    /** Delete the symlink at `path` (never what it points to). */
    removeLink(path: string): Effect.Effect<void, RepoFsError>;
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
    list: (dir: string) => attempt(dir, () => (existsSync(at(dir)) ? readdirSync(at(dir)).sort() : [])),
    listDirs: (dir: string) =>
      attempt(dir, () =>
        existsSync(at(dir))
          ? readdirSync(at(dir))
              .filter((n) => !n.startsWith(".") && statSync(resolve(at(dir), n)).isDirectory())
              .sort()
          : [],
      ),
    readText: (file: string) =>
      attempt(file, () => (existsSync(at(file)) ? Option.some(readFileSync(at(file), "utf8")) : Option.none())),
    writeText: (file: string, text: string) =>
      attempt(file, () => {
        mkdirSync(dirname(at(file)), { recursive: true });
        writeFileSync(at(file), text);
      }),
    realPath: (path: string) =>
      attempt(path, () => {
        let head = at(path);
        const tail: string[] = [];
        while (!existsSync(head) && dirname(head) !== head) {
          tail.unshift(basename(head));
          head = dirname(head);
        }
        return join(realpathSync(head), ...tail);
      }),
    entry: (path: string) =>
      attempt(path, (): Entry => {
        const stat = lstatSync(at(path), { throwIfNoEntry: false });
        if (!stat) return { _tag: "Absent" };
        return stat.isSymbolicLink() ? { _tag: "Link", target: readlinkSync(at(path)) } : { _tag: "Other" };
      }),
    symlink: (target: string, path: string) =>
      attempt(path, () => {
        mkdirSync(dirname(at(path)), { recursive: true });
        symlinkSync(target, at(path));
      }),
    removeLink: (path: string) => attempt(path, () => unlinkSync(at(path))),
  };
}
