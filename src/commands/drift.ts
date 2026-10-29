import type { Command } from "../command";
import { githubLookup, runDrift } from "../drift/run";

export const command: Command = {
  name: "drift",
  summary: "Report upstream drift per fork (--json for machine-readable output)",
  run: ({ root, args, out }) => runDrift({ root, lookup: githubLookup, json: args.includes("--json"), out }),
};
