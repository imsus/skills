# Harness capabilities

The built-in harness actions and tools of each harness, for turning a workflow step into the right command. Only Claude Code is tested end to end; every column marked "from docs" comes from that harness's docs or source (read 2026-10-29) and is unproven. "none" means the docs list no such feature. `?` means the docs did not confirm it.

Columns: **Claude Code**; **Codex** = OpenAI Codex CLI; **Cursor** = Cursor CLI; **opencode**; **Gemini** = Gemini CLI; **Copilot** = GitHub Copilot CLI.

## Detect the harness

Test in this order; the first match wins. If none matches, ask the user once.

| Order | Signal (environment variable) | Harness |
| --- | --- | --- |
| 1 | `CLAUDE_CODE_CHILD_SESSION` or `CLAUDECODE` set | Claude Code |
| 2 | `CURSOR_AGENT` set | Cursor |
| 3 | `GEMINI_CLI` set | Gemini |
| 4 | `CODEX_THREAD_ID` or `CODEX_CI` set | Codex |
| - | no marker | opencode or Copilot: ask |

`CLAUDE_PROJECT_DIR` alone proves nothing: Cursor and Gemini set it too.

## Session actions

| Action | Claude Code | Codex (from docs) | Cursor (from docs) | opencode (from docs) | Gemini (from docs) | Copilot (from docs) |
| --- | --- | --- | --- | --- | --- | --- |
| Compact | `/compact [instructions]` | `/compact` | `/summarize` (alias `/compress`) | `/compact` | `/compress` | `/compact [focus]` |
| Clear / new session | `/clear` | `/new` or `/clear` | `/clear` (alias `/new`) | `/new` (alias `/clear`) | `/clear` | `/clear`, `/new` |
| Rewind | `/rewind` (aliases `/checkpoint`, `/undo`) | none | `/rewind` | `/undo`, `/redo` | `/rewind`, `/restore` | `/undo`, `/rewind` |
| Export transcript | `/export [file]` | `/export` | none | `/export` | none in docs | `/share`, `/export` |
| Handoff | none built in: use `/handoff` | none: use `/handoff` | none: use `/handoff` | none: use `/handoff` | none: use `/handoff` | none: use `/handoff` |

## Worktrees

| Action | Claude Code | Codex (from docs) | Cursor (from docs) | opencode (from docs) | Gemini (from docs) | Copilot (from docs) |
| --- | --- | --- | --- | --- | --- | --- |
| Start in a worktree | `claude --worktree <name>` | `--worktree` | `--worktree <name>` | none | `--worktree` (needs `experimental.worktrees: true`) | `--worktree=<name>` |
| In session | `EnterWorktree` / `ExitWorktree` tools | `/worktree` | `/worktree <task>` | none | none | `/worktree`, `/new worktree` |
| Subagent in a worktree | `isolation: worktree` | ? | ? | none | none | ? |
| Cleanup | Auto-removed on exit if clean; else `git worktree remove` | ? | `/delete-worktree`; auto cleanup | manual `git worktree remove` | manual `git worktree remove --force`, `git branch -D` | ? |

After a merge, cleanup is the same git commands everywhere: `git worktree remove <path>`, `git branch -d <branch>`, then pull the main branch.

## Tools

| Tool | Claude Code | Codex (from docs) | Cursor (from docs) | opencode (from docs) | Gemini (from docs) | Copilot (from docs) |
| --- | --- | --- | --- | --- | --- | --- |
| Question (multiple choice) | `AskUserQuestion` | `request_user_input` | "Ask questions" tool | `question` (needs `permission.question`) | `ask_user` | `ask_user` |
| Todo list | `TaskCreate` / `TaskUpdate` / `TaskList` | `update_plan` | ? | `todowrite` | `write_todos` | ? |
| Plan mode | `/plan`, Shift+Tab | `/plan` | `/plan` | `plan` agent | `/plan` | `/plan` |

With no question tool, ask numbered questions one at a time, recommended answer first.

## Built-ins that overlap workflow skills

Prefer the built-in when it covers the step; note the curated or imsus skill once if it does more.

| Step | Claude Code | Codex (from docs) | Cursor (from docs) | opencode (from docs) | Gemini (from docs) | Copilot (from docs) |
| --- | --- | --- | --- | --- | --- | --- |
| Code review | `/code-review` (alias `/review`) | `/review` | none | none | none | `/review` |
| Security review | `/security-review` | none | none | none | none | `/security-review` |
| Simplify | `/simplify` | none | none | none | none | none |
| Init instructions file | `/init` (CLAUDE.md) | `/init` (AGENTS.md) | none | `/init` | `/init` (GEMINI.md) | `/init` |
| PR | none: use `/pr` | none | none | none | none | `/pr [create\|fix\|...]` |
| Commit, test | none | none | none | none | none | none |

## Skills

| | Claude Code | Codex (from docs) | Cursor (from docs) | opencode (from docs) | Gemini (from docs) | Copilot (from docs) |
| --- | --- | --- | --- | --- | --- | --- |
| Invoke | `/name` | `$name` | `/name` | `skill` tool | `activate_skill` tool | `skill` tool |
| Project skill dir | `.claude/skills` | `.agents/skills` | `.agents/skills`, `.claude/skills` | `.agents/skills`, `.claude/skills` | `.agents/skills` | `.agents/skills`, `.claude/skills` |
