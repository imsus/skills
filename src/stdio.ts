import { Context, Effect, Layer } from "effect";

/** Where command output goes. Production writes to the process; tests capture lines. */
export class Stdio extends Context.Service<
  Stdio,
  {
    /** Write a line to stdout. */
    out(line: string): Effect.Effect<void>;
    /** Write a line to stderr. */
    err(line: string): Effect.Effect<void>;
  }
>()("imsus-skills/Stdio") {
  static readonly layer = Layer.succeed(
    Stdio,
    Stdio.of({
      out: (line) => Effect.sync(() => console.log(line)),
      err: (line) => Effect.sync(() => console.error(line)),
    }),
  );
}
