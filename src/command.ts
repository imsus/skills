import { Effect } from "effect";
import type { UpstreamApi } from "./drift/upstream-api";
import type { RepoFsError } from "./errors";
import type { RepoFs } from "./repo-fs";
import { Stdio } from "./stdio";

/** Everything a command may need. The CLI provides all of it; each command uses a subset. */
export type AppServices = RepoFs | Stdio | UpstreamApi;

/**
 * A CLI subcommand. Its effect succeeds with the process exit code and has
 * no error left: each command handles its own E in its `.pipe()`.
 *
 * To add a subcommand, create `src/commands/<name>.ts` exporting
 * `command: Command`. Command files are discovered automatically.
 * (`check` lives in `src/check/` and is registered in `src/commands/check.ts`.)
 */
export interface Command {
  name: string;
  /** One line shown in the usage text. */
  summary: string;
  /** `args` are the arguments after the subcommand name. */
  run(args: readonly string[]): Effect.Effect<number, never, AppServices>;
}

/** Last-resort handler for an unreadable or unwritable repo: say so on stderr, exit 1. */
export const reportFsError = (e: RepoFsError) =>
  Effect.gen(function* () {
    const io = yield* Stdio;
    yield* io.err(`${e.path}: ${e.message}`);
    return 1;
  });
