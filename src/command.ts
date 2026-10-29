export interface CommandContext {
  /** Repo root (the process's cwd). */
  root: string;
  /** Arguments after the subcommand name. */
  args: string[];
  /** Write a line to stdout. */
  out(line: string): void;
  /** Write a line to stderr. */
  err(line: string): void;
}

/**
 * A CLI subcommand. Returns the process exit code.
 *
 * To add a subcommand, create `src/commands/<name>.ts` exporting
 * `command: Command`. Command files are discovered automatically.
 * (`check` lives in `src/check/` and is registered in `src/commands/check.ts`.)
 */
export interface Command {
  name: string;
  /** One line shown in the usage text. */
  summary: string;
  run(ctx: CommandContext): Promise<number> | number;
}
