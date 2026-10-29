<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# Guardrails

What stops an agent before it does damage here.

| Guard | Where | Blocks |
| --- | --- | --- |
| git-guardrails hook, customized | `.claude/settings.json` → `.claude/hooks/block-dangerous-git.sh` | force-push, push to `main`/`master`, bare push from `main`, `reset --hard` outside `.claude/worktrees/`, `clean -f`, `branch -D`, `checkout .`, `restore .` |
| commit-staging guard | `~/.claude/settings.json` → `guard-git-commit.sh` (global) | a `git commit` that sweeps in staged paths it does not name |
| `npx skills` guard | `~/.claude/settings.json` → `guard-npx-skills.sh` (global) | `npx skills` subcommands that write installed skills, `check` included |
| pre-commit | `.githooks/pre-commit` (set by `bun install`) | commits that fail `bun run verify` |
| branch protection | none | - |

Ask before: pushing to `main`, bumping a category version, deleting branches, changing CI secrets or workflow permissions.
