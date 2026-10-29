<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# Git flow

- **Flow**: branch + PR. A PR may stack on another PR's branch when it depends on it (#16 on #17's branch).
- **Main branch**: `main`. Unprotected: CI runs on every PR but does not gate the merge.
- **Branches**: `feat/<topic>`, `fix/<issue>`, `retro/<date>-<topic>`.
- **Commits**: imperative summary, no prefix convention; `#<issue>` when a ticket exists.
- **Merging**: merge commit, by the author.
- **Parallel work**: one worktree per ticket under `.claude/worktrees/`, each on its own branch.
- **After a merge**: delete the branch (GitHub does not auto-delete it), remove the worktree, pull `main`.
- **Pushing**: the project hook allows pushes to feature branches only; force-pushes and pushes to `main` are yours to run.
