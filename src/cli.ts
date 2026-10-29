#!/usr/bin/env bun
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "./command";

const COMMANDS_DIR = join(import.meta.dir, "commands");

/** Load every `commands/*.ts` module's `command` export, sorted by name. */
async function loadCommands(): Promise<Command[]> {
  const files = readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".ts"));
  const commands: Command[] = [];
  for (const f of files) {
    const mod = (await import(join(COMMANDS_DIR, f))) as { command?: Command };
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

process.exit(
  await command.run({
    root: process.cwd(),
    args,
    out: (l) => console.log(l),
    err: (l) => console.error(l),
  }),
);
