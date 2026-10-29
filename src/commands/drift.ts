import type { Command } from "../command";
import { githubUpstream, runDrift } from "../drift/run";

export const command: Command = {
  name: "drift",
  summary: "Report upstream drift per fork (--json for machine-readable output)",
  run: ({ root, args, out, err }) => runDrift({ root, upstream: githubUpstream, json: args.includes("--json"), out, err }),
};
