#!/usr/bin/env bun
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import type { Command } from "./command";
import { UpstreamApi } from "./drift/upstream-api";
import { RepoFs } from "./repo-fs";
import { Stdio } from "./stdio";

const COMMANDS_DIR = join(import.meta.dir, "commands");

/** Load every `commands/*.ts` module's `command` export, sorted by name. */
async function loadCommands(): Promise<Command[]> {
  const files = readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".ts"));
  const commands: Command[] = [];
  for (const f of files) {
    const mod: { command?: Command } = await import(join(COMMANDS_DIR, f));
    if (mod.command) commands.push(mod.command);
  }
  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

const commands = await loadCommands();
const [name, ...args] = process.argv.slice(2);
const command = commands.find((c) => c.name === name);

if (!command) {
  const lines = ["Usage: bun run src/cli.ts <command> [args]", "", "Commands:"];
  for (const c of commands) lines.push(`  ${c.name.padEnd(10)} ${c.summary}`);
  console.error(lines.join("\n"));
  process.exit(1);
}

const live = Layer.mergeAll(RepoFs.layer(process.cwd()), Stdio.layer, UpstreamApi.layerGithub);

process.exit(await Effect.runPromise(command.run(args).pipe(Effect.provide(live))));
