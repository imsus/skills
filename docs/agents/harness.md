<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# Harness

- **Primary**: Claude Code. **Also used**: none.
- **Rules file**: `CLAUDE.md`.
- **Skills installed via**: imsus skills are source here, linked into `.claude/skills/` (gitignored) by `bun run link`. Curated skills: `npx skills`, global.
- **Session moves**: phase-boundary ladder from imsus-setup's workflows reference, in this harness's commands: compact `/compact [instructions]`, clear `/clear`, rewind `/rewind`, worktree `claude --worktree <name>` or the `EnterWorktree` tool, subagent worktree `isolation: worktree`, handoff `/handoff`.
