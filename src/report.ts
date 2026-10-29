import { Effect } from "effect";
import type { RepoFsError } from "./errors";
import { Stdio } from "./stdio";

/** Last-resort handler for an unreadable or unwritable repo: say so on stderr, exit 1. */
export const reportFsError = (e: RepoFsError) =>
  Effect.gen(function* () {
    const io = yield* Stdio;
    yield* io.err(`${e.path}: ${e.message}`);
    return 1;
  });
