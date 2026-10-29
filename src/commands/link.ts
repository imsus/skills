import { join, relative, resolve, sep } from "node:path";
import { Config, Effect } from "effect";
import type { Command } from "../command";
import type { RepoFsError } from "../errors";
import { reportFsError } from "../report";
import { allSkills, readRepo, SKILLS_DIR, type Skill } from "../repo";
import { RepoFs } from "../repo-fs";
import { Stdio } from "../stdio";

/** Where Local links live: under the repo root by default, under HOME with `--user`. */
const LINKS_DIR = ".claude/skills";
const FLAGS = ["--user", "--remove"];
const USAGE = "Usage: bun run src/cli.ts link [--user] [--remove]";

/**
 * Where the links go: the repo's own `.claude/skills` (relative links), or
 * with `--user` the user's `~/.claude/skills` (absolute links).
 */
interface Target {
  dir: string;
  absoluteLinks: boolean;
}

const projectTarget: Target = { dir: LINKS_DIR, absoluteLinks: false };

const userTarget = Effect.map(Config.NonEmptyString("HOME"), (home): Target => ({
  dir: join(home, LINKS_DIR),
  absoluteLinks: true,
}));

/** What sits in a skill's slot in the links folder, judged by where it really leads. */
type Slot =
  | { _tag: "Free" }
  | { _tag: "Same" }
  /** A Local link to some other place in this repo's skills/: ours to rewrite or remove. */
  | { _tag: "Ours" }
  | { _tag: "Foreign"; found: string };

/** Classify `dir/name` against the real path of the skill it should lead to (none when no skill has the name). */
const slotOf = Effect.fnUntraced(function* (dir: string, name: string, skillPath?: string) {
  const fs = yield* RepoFs;
  const entry = yield* fs.entry(`${dir}/${name}`);
  if (entry._tag === "Absent") return { _tag: "Free" } satisfies Slot;
  if (entry._tag === "Other") return { _tag: "Foreign", found: "something that is not a link" } satisfies Slot;
  const leadsTo = yield* fs.realPath(resolve(yield* fs.realPath(dir), entry.target));
  if (skillPath !== undefined && leadsTo === skillPath) return { _tag: "Same" } satisfies Slot;
  if (leadsTo.startsWith((yield* fs.realPath(SKILLS_DIR)) + sep)) return { _tag: "Ours" } satisfies Slot;
  return { _tag: "Foreign", found: `a link to ${entry.target}` } satisfies Slot;
});

/** Names of the Local links in `dir`. Empty when `dir` is absent. */
const ownLinks = Effect.fnUntraced(function* (dir: string) {
  const fs = yield* RepoFs;
  const names: string[] = [];
  for (const name of yield* fs.list(dir)) if ((yield* slotOf(dir, name))._tag === "Ours") names.push(name);
  return names;
});

/** Skills grouped by name; ADR-0001 makes names unique, so a group of two is a conflict. */
const byName = (skills: readonly Skill[]) => {
  const groups = new Map<string, readonly [Skill, ...Skill[]]>();
  for (const skill of skills) {
    const group = groups.get(skill.name);
    groups.set(skill.name, group ? [...group, skill] : [skill]);
  }
  return groups;
};

/** Converge `dir` on one Local link per skill. Exit 1 when an entry we do not own, or a duplicate name, blocks a skill. */
const link = Effect.fnUntraced(function* ({ dir, absoluteLinks }: Target) {
  const fs = yield* RepoFs;
  const io = yield* Stdio;
  const groups = byName(allSkills(yield* readRepo));
  const tally = { linked: 0, relinked: 0, pruned: 0, unchanged: 0, conflicts: 0 };
  const conflict = (message: string) => {
    tally.conflicts++;
    return io.err(message);
  };
  const place = (name: string, linkTarget: string, verb: "linked" | "relinked"): Effect.Effect<void, RepoFsError> =>
    Effect.gen(function* () {
      if (verb === "relinked") yield* fs.removeLink(`${dir}/${name}`);
      yield* fs.symlink(linkTarget, `${dir}/${name}`);
      yield* io.out(`${verb} ${name}`);
      tally[verb]++;
    });
  for (const [name, [skill, ...dupes]] of groups) {
    if (dupes.length > 0) {
      yield* conflict(`${name}: one name, several skills (${[skill, ...dupes].map((s) => s.path).join(", ")}); skipped`);
      continue;
    }
    const skillPath = yield* fs.realPath(skill.path);
    const linkTarget = absoluteLinks ? skillPath : relative(yield* fs.realPath(dir), skillPath);
    const slot = yield* slotOf(dir, name, skillPath);
    if (slot._tag === "Free") yield* place(name, linkTarget, "linked");
    else if (slot._tag === "Same") tally.unchanged++;
    else if (slot._tag === "Ours") yield* place(name, linkTarget, "relinked");
    else yield* conflict(`${dir}/${name}: ${slot.found} is already there; skipped ${name}`);
  }
  for (const name of yield* ownLinks(dir)) {
    if (groups.has(name)) continue;
    yield* fs.removeLink(`${dir}/${name}`);
    yield* io.out(`pruned ${name}`);
    tally.pruned++;
  }
  const { linked, relinked, pruned, unchanged, conflicts } = tally;
  yield* io.out(
    `link: ${linked} linked, ${relinked} relinked, ${pruned} pruned, ${unchanged} unchanged, ${conflicts} conflicts`,
  );
  return conflicts > 0 ? 1 : 0;
});

/** Delete every Local link in `dir`, leaving everything else. */
const unlinkAll = Effect.fnUntraced(function* ({ dir }: Target) {
  const fs = yield* RepoFs;
  const io = yield* Stdio;
  const names = yield* ownLinks(dir);
  for (const name of names) {
    yield* fs.removeLink(`${dir}/${name}`);
    yield* io.out(`removed ${name}`);
  }
  yield* io.out(`link --remove: ${names.length} removed`);
  return 0;
});

export const command: Command = {
  name: "link",
  summary: "Local link every skill into .claude/skills (--user: ~/.claude/skills; --remove: undo)",
  run: (args) =>
    Effect.gen(function* () {
      const unknown = args.filter((a) => !FLAGS.includes(a));
      if (unknown.length > 0) {
        const io = yield* Stdio;
        yield* io.err(`link: unknown argument ${unknown.join(", ")}`);
        yield* io.err(USAGE);
        return 1;
      }
      const target = args.includes("--user") ? yield* userTarget : projectTarget;
      return yield* (args.includes("--remove") ? unlinkAll(target) : link(target));
    }).pipe(
      Effect.catchTag("RepoFsError", reportFsError),
      Effect.catchTag("ConfigError", (e) =>
        Effect.gen(function* () {
          const io = yield* Stdio;
          yield* io.err(`--user needs HOME: ${e.message}`);
          return 1;
        }),
      ),
    ),
};
