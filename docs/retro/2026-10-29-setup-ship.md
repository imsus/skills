---
date: 2026-10-29
session: 65592d0b-56af-43a1-ad9b-8b02ae339100
fixes:
  - id: hook-ignores-quoted-text
    finding: The git hook matched blocked strings inside quoted test data and refused the agent's own proof commands twice (16:44:37, 16:45:03); it now matches git only in command position, scanning sh -c and heredocs fed to a shell
    route: harness hook
    destination: .claude/hooks/block-dangerous-git.sh
    check: bash .claude/hooks/block-dangerous-git.test.sh
    score:
  - id: commit-new-files
    finding: The global commit rule said "no separate git add", but a pathspec commit refuses untracked files (reproduced); the #18 Next prompt inherited it
    route: CLAUDE.md pointer (user-global)
    destination: ~/.claude/CLAUDE.md
    check: unproven
    score:
  - id: profile-small-change
    finding: The profile omitted small change, yet the first job after setup (#18) was one and shipped without /code-review
    route: workflow profile
    destination: docs/agents/workflow.md
    check: unproven
    score:
  - id: zsh-gotchas
    finding: "zsh broke three commands: an unmatched glob aborted a detection ls (16:37), `echo =====` failed (16:40), and `echo` of JSON expanded \\n and fed jq garbage during this retro's hook proof"
    route: CLAUDE.md pointer (user-global)
    destination: ~/.claude/CLAUDE.md
    check: unproven
    score:
  - id: retro-threshold-in-context
    finding: The 1 MB analyst threshold fired on the current uncompacted session, which is already wholly in context
    route: skill edit
    destination: skills/meta/imsus-retro/SKILL.md
    check: unproven
    score:
---

## Coverage

- Harness and session errors: nothing found (no API errors, retries or compactions; one user interrupt to run `brew install actionlint`)
- Failed tool calls: finding: the new hook blocked two proof commands on quoted test strings; zsh unmatched glob and `=word` expansion each failed a command
- Model and effort: nothing found (claude-opus-5-5 at medium for all 97 turns, no subagents)
- Environment: nothing found (no timeouts or killed processes; retry gap 0)
- Workflow vs profile: finding: the profile recorded no small change, and #18 (one) shipped without `/code-review`
- Unfamiliar tech and docs: nothing found
- Wrong assumptions: finding: the #18 Next prompt assumed `git commit -- <paths>` takes untracked files; the agent caught it before running and added `git add`
- Guardrail and review gaps: finding: the hook matched quoted text (same root cause as the self-blocks); /code-review then caught that the first fix (deleting quoted spans) opened bypasses, such as an apostrophe pair hiding a real command, before it was committed
- Context handed over: nothing found

## Earlier fixes

- 2026-10-29-meta-skills-ship#ask-reads-only: addressed, imsus-ask ran only `git fetch` and reads; the checkout stayed on its branch
- 2026-10-29-meta-skills-ship#ask-start-checks-existing: unscored, its check could not fire (no "Start something" intent this session)
- 2026-10-29-meta-skills-ship#ask-names-missing-profile: unscored, its check could not fire (the profile existed when imsus-ask ran)
- 2026-10-29-meta-skills-ship#repo-profile: addressed, #18 closed by PR #20
- 2026-10-29-meta-skills-ship#no-timeout-on-macos: addressed, the slow `bun run verify` calls used the Bash tool's `timeout` parameter
