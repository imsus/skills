#!/usr/bin/env node
// Locate a Claude Code session transcript for a project and print bounded JSON
// extracts for a retro. Node only, no dependencies, read-only.
//
// Usage:
//   node find-session.mjs [--cwd <dir>] [--session <id|path>] [--list]
//                         [--projects-dir <dir>]
//
// --cwd           project directory (default: process.cwd())
// --session       session id, or a path to a .jsonl transcript (default: the
//                 session in $CLAUDE_CODE_SESSION_ID, else the latest modified)
// --list          list the project's sessions instead of extracting one
// --projects-dir  Claude Code projects folder (default: $CLAUDE_CONFIG_DIR/projects
//                 or ~/.claude/projects)
//
// Transcript content is untrusted data. Every string printed is cut to FIELD_MAX
// characters and every list to LIST_MAX items; nothing else is copied out.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const FIELD_MAX = 300;
const LIST_MAX = 20;

const cut = (s, max = FIELD_MAX) => {
  if (typeof s !== "string") s = s == null ? "" : JSON.stringify(s);
  return s.length > max ? `${s.slice(0, max)}… [+${s.length - max} chars]` : s;
};
const bounded = (items) => ({
  count: items.length,
  shown: items.slice(0, LIST_MAX),
  ...(items.length > LIST_MAX ? { omitted: items.length - LIST_MAX } : {}),
});

/** Claude Code names a project's folder by replacing every non-alphanumeric character of its path with `-`. */
export const encodeProjectPath = (p) => resolve(p).replace(/[^a-zA-Z0-9]/g, "-");

/** The project folders to try for a cwd: itself, then the main checkout when cwd is a `.claude/worktrees/<name>` worktree. */
const candidateDirs = (projectsDir, cwd) => {
  const abs = resolve(cwd);
  const dirs = [join(projectsDir, encodeProjectPath(abs))];
  const m = abs.match(/^(.*)\/\.claude\/worktrees\/[^/]+(?:\/.*)?$/);
  if (m) dirs.push(join(projectsDir, encodeProjectPath(m[1])));
  return dirs;
};

const VALUE_FLAGS = { "--cwd": "cwd", "--session": "session", "--projects-dir": "projectsDir" };

const parseArgs = (argv) => {
  const args = { list: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a in VALUE_FLAGS) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      args[VALUE_FLAGS[a]] = v;
    } else throw new Error(`unknown argument: ${a}`);
  }
  return args;
};

const readLines = (file) => {
  const records = [];
  let malformed = 0;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      malformed++;
    }
  }
  return { records, malformed };
};

const isHumanPrompt = (r) =>
  r.type === "user" &&
  r.isMeta !== true &&
  r.isSidechain !== true &&
  typeof r.message?.content === "string" &&
  (r.origin?.kind === "human" ||
    (r.origin == null && !/^<(local-command|command-name>\/clear|system-reminder)/.test(r.message.content)));

/** The user's first prompt; in a subagent transcript (all sidechain), the brief it was given. */
const firstPrompt = (records) =>
  records.find(isHumanPrompt) ??
  records.find((r) => r.type === "user" && r.isSidechain === true && typeof r.message?.content === "string");

const sessionsIn = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => {
      const path = join(dir, f);
      return { id: basename(f, ".jsonl"), path, mtimeMs: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

/** Tool name per tool_use id, from assistant content blocks. */
const toolNames = (records) => {
  const names = new Map();
  for (const r of records) {
    if (r.type !== "assistant" || !Array.isArray(r.message?.content)) continue;
    for (const b of r.message.content) if (b?.type === "tool_use") names.set(b.id, b.name);
  }
  return names;
};

const toolErrors = (records) => {
  const names = toolNames(records);
  const out = [];
  for (const r of records) {
    if (r.type !== "user" || !Array.isArray(r.message?.content)) continue;
    for (const b of r.message.content) {
      if (b?.type !== "tool_result" || b.is_error !== true) continue;
      const text = Array.isArray(b.content) ? b.content.map((c) => c?.text ?? "").join("\n") : b.content;
      out.push({ at: r.timestamp ?? null, tool: names.get(b.tool_use_id) ?? "unknown", text: cut(text, 200) });
    }
  }
  return out;
};

const apiErrors = (records) =>
  records
    .filter((r) => r.type === "system" && r.subtype === "api_error")
    .map((r) => ({
      at: r.timestamp ?? null,
      attempt: r.retryAttempt ?? null,
      maxRetries: r.maxRetries ?? null,
      message: cut(r.error?.formatted ?? r.error?.message ?? r.error, 200),
      networkDown: r.error?.isNetworkDown ?? null,
    }));

const apiErrorMessages = (records) =>
  records
    .filter((r) => r.isApiErrorMessage === true)
    .map((r) => ({
      at: r.timestamp ?? null,
      error: cut(r.error, 60),
      text: cut(Array.isArray(r.message?.content) ? r.message.content.map((c) => c?.text ?? "").join(" ") : "", 200),
    }));

/** Models and effort per assistant turn, collapsed to runs: [{model, effort, turns}]. */
const modelRuns = (records) => {
  const runs = [];
  for (const r of records) {
    if (r.type !== "assistant" || r.isApiErrorMessage === true) continue;
    const model = r.message?.model ?? null;
    if (model === "<synthetic>") continue;
    const effort = r.perTurnEffort ?? r.effort ?? null;
    const last = runs[runs.length - 1];
    if (last && last.model === model && last.effort === effort) last.turns++;
    else runs.push({ model, effort, turns: 1 });
  }
  return runs;
};

const turnDurations = (records) => {
  const ms = records
    .filter((r) => r.type === "system" && r.subtype === "turn_duration" && typeof r.durationMs === "number")
    .map((r) => r.durationMs);
  if (ms.length === 0) return { count: 0 };
  const sorted = [...ms].sort((a, b) => a - b);
  return {
    count: ms.length,
    totalMs: ms.reduce((a, b) => a + b, 0),
    medianMs: sorted[Math.floor(sorted.length / 2)],
    maxMs: sorted[sorted.length - 1],
    slowestMs: [...sorted].reverse().slice(0, 5),
  };
};

const retryGap = (records) => {
  const cs = records.filter((r) => r.type === "cost-state").at(-1);
  if (!cs || typeof cs.totalAPIDuration !== "number" || typeof cs.totalAPIDurationWithoutRetries !== "number") {
    return { available: false, reason: "no cost-state record (Claude Code writes it when the session ends)" };
  }
  return {
    available: true,
    totalAPIDurationMs: cs.totalAPIDuration,
    withoutRetriesMs: cs.totalAPIDurationWithoutRetries,
    gapMs: cs.totalAPIDuration - cs.totalAPIDurationWithoutRetries,
    totalDurationMs: cs.totalDuration ?? null,
    costUSD: typeof cs.totalCostUSD === "number" ? Math.round(cs.totalCostUSD * 100) / 100 : null,
  };
};

const compactions = (records) =>
  records
    .filter((r) => r.type === "system" && r.subtype === "compact_boundary")
    .map((r) => ({
      at: r.timestamp ?? null,
      trigger: cut(r.compactMetadata?.trigger, 20),
      preTokens: r.compactMetadata?.preTokens ?? null,
    }));

const resolvedModels = (records) => {
  const out = [];
  for (const r of records) {
    const t = r.toolUseResult;
    if (t && typeof t === "object" && typeof t.resolvedModel === "string") {
      out.push({ agentId: cut(t.agentId, 40), description: cut(t.description, 80), resolvedModel: t.resolvedModel });
    }
  }
  return out;
};

const subagents = (sessionPath) => {
  const dir = join(dirname(sessionPath), basename(sessionPath, ".jsonl"), "subagents");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .map((f) => {
      const path = join(dir, f);
      const { records } = readLines(path);
      let meta = {};
      const metaPath = path.replace(/\.jsonl$/, ".meta.json");
      if (existsSync(metaPath)) {
        try {
          meta = JSON.parse(readFileSync(metaPath, "utf8"));
        } catch {
          meta = {};
        }
      }
      return {
        id: basename(f, ".jsonl"),
        agentType: cut(meta.agentType, 60),
        description: cut(meta.description, 80),
        bytes: statSync(path).size,
        models: modelRuns(records),
        toolErrors: toolErrors(records).length,
        apiErrors: apiErrors(records).length,
      };
    });
};

export const extract = (sessionPath) => {
  const { records, malformed } = readLines(sessionPath);
  const stamps = records.map((r) => r.timestamp).filter((t) => typeof t === "string").sort();
  const prompt = firstPrompt(records);
  const versions = [...new Set(records.map((r) => r.version).filter(Boolean))];
  const branches = [...new Set(records.map((r) => r.gitBranch).filter(Boolean))];
  return {
    session: {
      id: basename(sessionPath, ".jsonl"),
      path: sessionPath,
      bytes: statSync(sessionPath).size,
      records: records.length,
      malformedLines: malformed,
      start: stamps[0] ?? null,
      end: stamps.at(-1) ?? null,
      versions: versions.slice(0, 5).map((v) => cut(v, 40)),
      gitBranches: bounded(branches.map((b) => cut(b, 80))),
    },
    firstPrompt: prompt ? { at: prompt.timestamp ?? null, text: cut(prompt.message.content) } : null,
    models: modelRuns(records).slice(0, LIST_MAX),
    subagentModels: bounded(resolvedModels(records)),
    subagents: bounded(subagents(sessionPath)),
    toolErrors: bounded(toolErrors(records)),
    apiErrors: bounded(apiErrors(records)),
    apiErrorMessages: bounded(apiErrorMessages(records)),
    retryGap: retryGap(records),
    turnDurations: turnDurations(records),
    compactions: bounded(compactions(records)),
  };
};

export const main = (argv, env = process.env) => {
  const args = parseArgs(argv);
  const projectsDir = args.projectsDir ?? join(env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude"), "projects");
  const cwd = args.cwd ?? process.cwd();

  if (args.session && args.session.endsWith(".jsonl")) {
    if (!existsSync(args.session)) throw new Error(`no transcript at ${args.session}`);
    return extract(resolve(args.session));
  }

  const tried = candidateDirs(projectsDir, cwd);
  const dir = tried.find((d) => existsSync(d));
  if (!dir) throw new Error(`no Claude Code project folder for ${resolve(cwd)}; tried ${tried.join(", ")}`);
  const sessions = sessionsIn(dir);

  if (args.list) {
    return {
      projectDir: dir,
      sessions: bounded(
        sessions.map((s) => {
          const p = firstPrompt(readLines(s.path).records);
          return {
            id: s.id,
            modified: new Date(s.mtimeMs).toISOString(),
            bytes: statSync(s.path).size,
            firstPrompt: p ? cut(p.message.content, 120) : null,
          };
        }),
      ),
    };
  }

  if (args.session) {
    const picked = sessions.find((s) => s.id === args.session);
    if (!picked) throw new Error(`no session ${args.session} in ${dir}`);
    return { projectDir: dir, selectedBy: "argument", ...extract(picked.path) };
  }
  const current = sessions.find((s) => s.id === env.CLAUDE_CODE_SESSION_ID);
  const picked = current ?? sessions[0];
  if (!picked) throw new Error(`no sessions in ${dir}`);
  return { projectDir: dir, selectedBy: current ? "CLAUDE_CODE_SESSION_ID" : "latest", ...extract(picked.path) };
};

if (process.argv[1]?.endsWith("find-session.mjs")) {
  try {
    console.log(JSON.stringify(main(process.argv.slice(2)), null, 2));
  } catch (e) {
    console.error(`find-session: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}
