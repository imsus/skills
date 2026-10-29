import type { Command } from "../command";
import { runDrift } from "../drift/run";

export const command: Command = {
  name: "drift",
  summary: "Report upstream drift per fork (--json for machine-readable output)",
  run: (args) => runDrift({ json: args.includes("--json") }),
};
