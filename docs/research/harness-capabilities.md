# Agent harness capability matrix

Read on: 2026-10-29. Sources are official docs and source repos only. Each cell cites a source key (table at the bottom). `[unverified]` marks a cell I could not confirm from a primary source; "none" means the primary source I read lists no such feature (absence in a docs page, not proof of absence in the product).

Harnesses: **CC** Claude Code, **CX** OpenAI Codex CLI, **CU** Cursor (CLI + IDE), **OC** opencode, **GM** Gemini CLI, **CP** GitHub Copilot CLI.

## 1. Session management

| Capability | CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|---|
| Compact | `/compact [instructions]` [C1] | `/compact` [X1] | `/summarize` (alias `/compress`) in CLI [U1]; IDE [unverified] | `/compact` (alias `/summarize`) [O1] | `/compress` [G1] | `/compact [FOCUS]` [P1] |
| Clear / new session | `/clear [name]` [C1] | `/new`; `/clear` (clears terminal and starts new chat) [X1] | `/clear` (aliases `/new`, `/new-chat`, `/newchat`) [U1] | `/new` (alias `/clear`) [O1] | `/clear` [G1] | `/clear`, `/new`, `/reset` [P1] |
| Resume past session | `/resume`; `claude --continue`, `--resume`, `--from-pr` [C1][C2] | `/resume`; `codex resume` [X1][X2] | `/resume`; `--resume [chatId]`, `--continue` [U1][U2] | `/sessions` (aliases `/resume`, `/continue`) [O1] | `/resume` (alias `/chat`); `--resume <id>` [G1][G2] | `/resume`, `/continue`; `--resume`, `--continue` [P1] |
| Rewind / checkpoint | `/rewind` (aliases `/checkpoint`, `/undo`) [C1] | none in slash list [X1] (Esc-Esc backtrack [unverified]) | `/rewind` (CLI) [U1]; IDE checkpoints (restore files, local, separate from git) [U3] | `/undo`, `/redo` [O1] | `/rewind`, `/restore`, auto checkpoints (shadow git repo in `~/.gemini/history/<hash>`) [G1][G3] | `/undo`, `/rewind`; `/session checkpoints` [P1] |
| Fork / branch conversation | `/branch`, `/fork` [C1] | `/fork`; `codex fork` [X1][X2] | `/fork` [U1] | none documented [unverified] | `/resume` checkpoint subcommands [G1] | `/fork`, `/branch` (`/fork worktree`) [P1] |
| Handoff to a fresh session | **none built in** (0 matches for "handoff" on the commands page). Closest: `/clear` + `/resume`, `/desktop`, `/teleport`. Handoff exists only as community skills. [C1] | **none built in.** Closest: `/app` (continue in Desktop app), `/import` (pull setup and chats from Claude Code) [X1] | none [U1] | none [O1] | none [G1] | none built in. Closest: `/delegate` (hands changes to a remote PR), `/new` [P1] |
| Export transcript | `/export [filename]` (plain text) [C1] | `/export` (markdown) [X1] | none in CLI list [U1]; `CURSOR_TRANSCRIPT_PATH` exposed to hooks [U4] | `/export` [O1] | `export-session` command defined in source (JSON); not in the docs command list [G4] | `/share [link\|file\|html\|gist]`, `/export` [P1] |

## 2. Git worktree support

| | CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|---|
| Flag | `claude --worktree [name]` / `-w`; also `--worktree "#1234"` for a PR [C3] | `--worktree` (interactive and `exec`; rejected for some subcommands) [X3] | `-w, --worktree [name]`, `--worktree-base`, `--skip-worktree-setup` [U2] | none documented [O2] | `--worktree` / `-w`, only with `experimental.worktrees: true` [G5] | `-w, --worktree[=NAME]` [P1] |
| In-session | `EnterWorktree` / `ExitWorktree` tools [C4] | `/worktree` [X1] | `/worktree <task>`, `/best-of-n`, `/apply-worktree` (IDE skills) [U5] | none [O2] | none [G5] | `/worktree`, `/new worktree`, `/fork worktree`, `/move` [P1] |
| Subagent isolation | `isolation: worktree` in agent frontmatter [C3] | not documented [unverified] | not documented [unverified] | none [O2] | none [G5] | not documented [unverified] |
| Cleanup | Auto-remove if clean on exit; prompt if changes; periodic sweep for subagent/background worktrees (`cleanupPeriodDays`); manual `git worktree remove` [C3] | [unverified] | `/delete-worktree`; auto cleanup via `cursor.worktreeMaxCount` (default 25) and `cursor.worktreeCleanupIntervalHours` [U5] | none [O2] | None automatic; manual `git worktree remove ... --force` and `git branch -D` [G5] | [unverified] |
| Notes | Default path `.claude/worktrees/<name>`; `.worktreeinclude` copies gitignored files; `WorktreeCreate`/`WorktreeRemove` hooks [C3] | | Setup file `.cursor/worktrees.json`; CLI path `~/.cursor/worktrees/<repo>/<name>` [U2][U5] | Source has a `worktree` module in `packages/core/src/worktree.ts`, no user docs [O2] | Path `.gemini/worktrees/<name>` [G5] | Default `<repo>.worktrees/`; settings `worktreePathTemplate`, `worktreeBaseRef` [P1] |

## 3. Structured questions and plan mode

| | CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|---|
| Ask-user tool | `AskUserQuestion` (multiple choice) [C4] | `request_user_input` [X4] | "Ask questions" tool (name not given in docs) [U6] | `question` (needs `permission.question`) [O3] | `ask_user` (choice, text, yes/no) [G6] | `ask_user` (disable with `--no-ask-user`) [P1] |
| Plan mode | `/plan`, `EnterPlanMode`/`ExitPlanMode`, Shift+Tab, `--permission-mode plan` [C1][C4][C2] | `/plan` [X1] | `/plan`, `--plan`, `--mode=plan`; also `/ask` read-only mode [U1][U2][U7] | built-in `plan` agent (read-only, edits only plan markdown) [O4] | `/plan`; planning tools doc [G1][G7] | `/plan [PROMPT]`; `/session plan` [P1] |

## 4. Task / todo tracking tool

| CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|
| `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate`; `TodoWrite` is off by default (re-enable with `CLAUDE_CODE_ENABLE_TASKS=0`); `/tasks` is for background work, not the checklist [C4][C1] | `update_plan` [X5] | none named in tools doc [U6] [unverified] | `todowrite` [O3] | `write_todos`; experimental `tracker_*` [G8] | none named in the tool list [P1] [unverified] |

## 5. Built-in commands and skills overlapping common workflow skills

| Workflow | CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|---|
| Code review | `/code-review` (skill), alias `/review`; `/ultrareview` [C1] | `/review`; `codex review` [X1][X2] | none in CLI list [U1]; IDE review [unverified] | none (custom commands) [O1] | none in list [G1] | `/review` [P1] |
| Security review | `/security-review` [C1] | none [X1] | none [U1] | none [O1] | none in list [G1] | `/security-review` [P1] |
| Init (instructions file) | `/init` (CLAUDE.md) [C1] | `/init` (AGENTS.md) [X1] | none in CLI list [U1] | `/init` [O1] | `/init` (GEMINI.md) [G1] | `/init` [P1] |
| Simplify | `/simplify` (skill) [C1] | none [X1] | none [U1] | none [O1] | none [G1] | none [P1] |
| PR creation | no `/pr`; `/autofix-pr` (cloud, fixes an open PR); `/pr-comments` removed v2.1.91; PRs by prompt via `gh` [C1][C5] | none [X1] | none in CLI list [U1] [unverified] | none [O1] | `/setup-github` (Actions only) [G1] | `/pr [view\|create\|fix\|auto\|automerge]`; `/delegate` [P1] |
| Commit | none (prompt only) [C1] | none [X1] | none [U1] | none [O1] | none [G1] | none listed [P1] |
| Test | none [C1] | none [X1] | none [U1] | none [O1] | none [G1] | none [P1] |
| Debugging | `/debug` (session debug log, not bug diagnosis) [C1] | none [X1] | `/debug` (Debug mode) [U1] | none [O1] | none [G1] | `/diagnose` (session log) [P1] |
| Memory | `/memory` (CLAUDE.md, auto memory) [C1] | `/memories` [unverified: enum `Memories` exists, no description read] [X1] | rules, not memory [unverified] | none [O1] | `/memory` (GEMINI.md), `save_memory` tool doc [G1][G9] | `/instructions` [P1]; auto memory [unverified] |
| Other bundled | `/batch`, `/loop`, `/schedule`, `/goal`, `/claude-api`, `/recap`, `/btw` [C1] | `/goal`, `/recap`, `/side`, `/skills` [X1] | `/migrate-to-skills`, `/create-skill`, `/best-of-n`, `/goal`, `/loop` [U8][U5] | none | `/skills` | `/research`, `/rubber-duck`, `/chronicle`, `/fleet` [P1] |

## 6. Subagents, background agents, scheduled runs

| | CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|---|
| Subagents | `Agent` tool; `.claude/agents/`, `~/.claude/agents/`; `/agents` [C4][C1] | Built-ins `default`, `worker`, `explorer`; custom TOML in `.codex/agents/`, `~/.codex/agents/`; `/agents`, `/subagents` [X6][X1] | `.cursor/agents/`, `.claude/agents/`, `.codex/agents/` (all read); built-in Explore and Browser; Task tool [U9] | `general`, `explore` (invoke with `@general`); `plan`/`build` primary agents [O4] | Subagents exposed as tools (e.g. `codebase_investigator`); `@name` syntax; `/agents` [G10][G1] | `task` tool; `list_agents`, `read_agent`, `write_agent`; `/subagents`, `/agents`, `/fleet` [P1] |
| Background | `/background`, `claude agents`, `/tasks`, `Monitor` tool [C1][C4] | `/ps`, `/stop` (background terminals); `/daemon` [X1] | `is_background: true` subagents; cloud agents [U9][U3] | none documented [O4] | `/shells` [G1] | `/tasks`; `--remote` [P1] |
| Scheduled | `/loop`, `CronCreate` (session), `/schedule` (cloud routines), desktop scheduled tasks, GitHub Actions [C1][C4][C6] | none verified [unverified] | `/loop` [U3] | none [O1] | none [G1] | `/after` (once), `/every` (recurring), session-scoped [P1] |

## 7. Hooks and skills

| | CC | CX | CU | OC | GM | CP |
|---|---|---|---|---|---|---|
| Hook mechanism | `settings.json` hooks; 30+ events incl. `SessionStart`, `PreToolUse`, `PreCompact`, `WorktreeCreate` [C7] | `hooks.json` or `[hooks]` in `config.toml` (`~/.codex/`, `<repo>/.codex/`): `SessionStart`, `PreToolUse`, `PreCompact`, `Stop`, etc. [X7] | `hooks.json` (`.cursor/`, `~/.cursor/`): `sessionStart`, `preToolUse`, `preCompact`; also loads Claude hooks [U4] | JS/TS plugins (`.opencode/plugins/`, `~/.config/opencode/plugins/`); `tool.execute.before`, `session.created`, no `SessionStart` event by that name [O5] | `settings.json` hooks: `SessionStart`, `BeforeTool`, `PreCompress`, etc. [G11] | `.github/hooks/*.json`, `~/.copilot/hooks/`: `sessionStart`, `preToolUse`; accepts PascalCase names [P2] |
| Native SKILL.md | Yes [C8] | Yes [X8] | Yes [U8] | Yes, via `skill` tool [O6] | Yes [G12] | Yes [P1] |
| Skill dirs | `~/.claude/skills`, `.claude/skills`, nested, plugin, `--add-dir` [C8] | `.agents/skills` (cwd up to repo root), `~/.agents/skills`, `/etc/codex/skills`, system [X8] | `.agents/skills`, `.cursor/skills`, `~/.agents/skills`, `~/.cursor/skills`, plus `.claude/skills`, `.codex/skills` (and `~/`) [U8] | `.opencode/skills`, `~/.config/opencode/skills`, `.claude/skills`, `~/.claude/skills`, `.agents/skills`, `~/.agents/skills` [O6] | `.gemini/skills`, `.agents/skills`, `~/.gemini/skills`, `~/.agents/skills` (`.agents` wins) [G12] | `.github/skills`, `.agents/skills`, `.claude/skills`, `~/.copilot/skills`, `~/.agents/skills`; `COPILOT_SKILLS_DIRS` [P1] |
| Invocation | `/name` or `Skill` tool [C4] | `$name` or `/skills` [X8] | `/name` in chat [U8] | `skill` tool [O3] | `activate_skill` tool; `/skills` [G13] | `skill` tool; `/skills` [P1] |

Practical result: a skill placed at `.agents/skills/<name>/SKILL.md` is read by CX, CU, OC, GM and CP. CC reads only `.claude/skills` (not `.agents/skills`) [C8]; CU, OC and CP also read `.claude/skills`.

## 8. How a skill detects the harness

| Harness | Signal | Confidence |
|---|---|---|
| CC | `CLAUDECODE=1` in subprocesses (Bash tool, hooks, status line, stdio MCP); IDE extension terminals also set it. `CLAUDE_CODE_CHILD_SESSION=1` is set only by Claude Code itself for Bash/PowerShell/Monitor tools and hooks. Hooks also get `CLAUDE_PROJECT_DIR`; `CLAUDE_CODE_REMOTE=true` in web environments [C9][C7]. `CLAUDE_CODE_ENTRYPOINT` [unverified] | Documented |
| CX | `CODEX_THREAD_ID` is injected into the shell environment when a thread id is provided; `CODEX_CI=1` is set for unified-exec processes; `CODEX_SANDBOX` is set by sandboxed spawns, `CODEX_SANDBOX_NETWORK_DISABLED=1` when network is off. These come from source, not user docs [X9] | Source-only; `CODEX_THREAD_ID` is also in the TypeScript SDK README |
| CU | `CURSOR_AGENT` (documented as the way to detect Cursor in shell config) [U10]. In hooks: `CURSOR_PROJECT_DIR`, `CURSOR_VERSION`, `CURSOR_CODE_REMOTE`, plus `CLAUDE_PROJECT_DIR` alias [U4]. The CLI parameters page does not list `CURSOR_AGENT` [U2] | Documented for terminal; not confirmed for every surface |
| OC | No documented "I am opencode" variable. Source sets `OPENCODE_TERMINAL=1` only inside its PTY terminals [O7]. Other signal: `OPENCODE_CONFIG_DIR` is a user override, not a marker. | [unverified] for the bash tool |
| GM | `GEMINI_CLI=1` set in shell-tool subprocesses (source constant `GEMINI_CLI_IDENTIFICATION_ENV_VAR`) [G14]. Hooks get `GEMINI_SESSION_ID`, `GEMINI_PROJECT_DIR`, `GEMINI_CWD`, `GEMINI_PLANS_DIR`, and `CLAUDE_PROJECT_DIR` alias [G11] | `GEMINI_CLI` from source; hook vars documented |
| CP | No documented marker variable in the CLI reference. `COPILOT_HOME`, `COPILOT_SKILLS_DIRS` are config inputs, not markers. Cloud agent jobs set `COPILOT_AGENT_PROMPT`, `GITHUB_COPILOT_API_TOKEN` [P2]. Practical fallback: check for a `copilot` parent process | [unverified] for local CLI |

Detection caveats: `CLAUDE_PROJECT_DIR` is also set by CU and GM for compatibility, so do not use it alone. Test order that avoids false positives: `CLAUDE_CODE_CHILD_SESSION` or `CLAUDECODE`, then `CURSOR_AGENT`, then `GEMINI_CLI`, then `CODEX_THREAD_ID`/`CODEX_CI`; because CU runs may also carry `CLAUDE_*` aliases, check CU before falling back to `CLAUDE_PROJECT_DIR`.

## Notes

- OpenAI Codex docs at developers.openai.com now return 308 redirects to `learn.chatgpt.com/docs/...` (redirect target was server-supplied; I fetched it and cross-checked the slash command list against `codex-rs/tui/src/slash_command.rs` in the repo). The slash command table for CX comes from the repo source, which is more reliable than the rendered docs.
- Copilot CLI reference was read from the `github/docs` repo markdown (`content/copilot/reference/copilot-cli-reference/cli-command-reference.md`), not the rendered site.
- OC docs were read from `packages/web/src/content/docs/*.mdx` in the sst/opencode repo (the repo is also reachable as anomalyco/opencode).
- Only CC, CP and CU document worktree cleanup. GM leaves cleanup to the user. CX and OC: nothing found.
- Only CC and CP have `/security-review`; only CC has `/simplify`. No harness has a built-in commit or test command.
- A skill relying on a "handoff" must ship its own: no harness has one built in.

## Sources

- C1 https://code.claude.com/docs/en/commands
- C2 https://code.claude.com/docs/en/common-workflows
- C3 https://code.claude.com/docs/en/worktrees
- C4 https://code.claude.com/docs/en/tools-reference
- C5 https://code.claude.com/docs/en/commands (`/autofix-pr`, `/pr-comments` rows)
- C6 https://code.claude.com/docs/en/common-workflows#run-claude-on-a-schedule
- C7 https://code.claude.com/docs/en/hooks
- C8 https://code.claude.com/docs/en/skills
- C9 https://code.claude.com/docs/en/env-vars
- X1 https://raw.githubusercontent.com/openai/codex/main/codex-rs/tui/src/slash_command.rs
- X2 https://learn.chatgpt.com/docs/developer-commands?surface=cli (redirect from developers.openai.com/codex/cli/slash-commands)
- X3 https://github.com/openai/codex/blob/main/codex-rs/cli/src/main.rs
- X4 https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/request_user_input_spec.rs
- X5 https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/plan_spec.rs
- X6 https://learn.chatgpt.com/docs/agent-configuration/subagents
- X7 https://learn.chatgpt.com/docs/hooks
- X8 https://learn.chatgpt.com/docs/build-skills
- X9 https://github.com/openai/codex/blob/main/codex-rs/core/src/spawn.rs ; https://github.com/openai/codex/blob/main/codex-rs/protocol/src/shell_environment.rs ; https://github.com/openai/codex/blob/main/codex-rs/core/src/unified_exec/process_manager.rs
- U1 https://cursor.com/docs/cli/reference/slash-commands
- U2 https://cursor.com/docs/cli/reference/parameters
- U3 https://cursor.com/docs/agent/overview
- U4 https://cursor.com/docs/hooks
- U5 https://cursor.com/docs/configuration/worktrees
- U6 https://cursor.com/docs/agent/tools
- U7 https://cursor.com/docs/agent/planning
- U8 https://cursor.com/docs/skills
- U9 https://cursor.com/docs/subagents
- U10 https://cursor.com/docs/agent/tools/terminal
- O1 https://github.com/sst/opencode/blob/dev/packages/web/src/content/docs/tui.mdx
- O2 https://github.com/sst/opencode/tree/dev/packages/core/src/worktree (source only; no docs page mentions a worktree command)
- O3 https://github.com/sst/opencode/blob/dev/packages/web/src/content/docs/tools.mdx
- O4 https://github.com/sst/opencode/blob/dev/packages/web/src/content/docs/agents.mdx
- O5 https://github.com/sst/opencode/blob/dev/packages/web/src/content/docs/plugins.mdx
- O6 https://github.com/sst/opencode/blob/dev/packages/web/src/content/docs/skills.mdx
- O7 https://github.com/sst/opencode/blob/dev/packages/core/src/pty.ts
- G1 https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/commands.md
- G2 https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/session-management.md
- G3 https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/checkpointing.md
- G4 https://github.com/google-gemini/gemini-cli/blob/main/packages/cli/src/ui/commands/exportSessionCommand.ts
- G5 https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/git-worktrees.md
- G6 https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/ask-user.md
- G7 https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/planning.md
- G8 https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/todos.md ; .../tracker.md
- G9 https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/memory.md
- G10 https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md
- G11 https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md ; .../docs/hooks/index.md
- G12 https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md
- G13 https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/activate-skill.md
- G14 https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/services/shellExecutionService.ts
- P1 https://github.com/github/docs/blob/main/content/copilot/reference/copilot-cli-reference/cli-command-reference.md (renders at https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- P2 https://github.com/github/docs/blob/main/content/copilot/reference/hooks-reference.md
