---
date: 2026-10-29
session: 83bfbe64-9e71-4700-8cab-d0a639627897
fixes:
  - id: ask-reads-only
    finding: imsus-ask switched and pulled the checkout (git switch -q main && git pull) while it was meant to only advise
    route: skill edit
    destination: skills/meta/imsus-ask/SKILL.md
    check: unproven
    score: addressed
  - id: ask-start-checks-existing
    finding: '"Start something" routed a drift check for imsus-retro that already existed (drift covers every UPSTREAM.md, drift.yml runs weekly)'
    route: skill edit
    destination: skills/meta/imsus-ask/SKILL.md
    check: unproven
    score:
  - id: ask-names-missing-profile
    finding: No workflow profile in this repo, and none of four imsus-ask runs recommended /imsus-setup
    route: skill edit
    destination: skills/meta/imsus-ask/SKILL.md
    check: unproven
    score:
  - id: repo-profile
    finding: This repo has no docs/agents/workflow.md or ## Workflow block
    route: workflow profile
    destination: https://github.com/imsus/skills/issues/18
    check: issue
    score: addressed
  - id: no-timeout-on-macos
    finding: '`timeout` is not installed on macOS; a `timeout … | grep` run printed nothing and read as success'
    route: CLAUDE.md pointer (user-global)
    destination: ~/.claude/CLAUDE.md
    check: unproven
    score: addressed
---

## Coverage

- Harness and session errors: nothing found (no API errors, retries or compactions)
- Failed tool calls: finding: `timeout` not found on macOS (transcript line 153); `git log -E --grep "#$n\b"` matched nothing for #12–#14 (agent deviated from the skill's `--grep '#<n>'`; skipped)
- Model and effort: nothing found (claude-opus-5-5 at medium for all 34 turns, no subagents)
- Environment: not captured (no retries or timeouts; retry gap unavailable before session end)
- Workflow vs profile: finding: no workflow profile, and imsus-ask never recommended /imsus-setup
- Unfamiliar tech and docs: nothing found
- Wrong assumptions: finding: the agent proposed "add a drift check for imsus-retro" as a test prompt without checking it already existed
- Guardrail and review gaps: finding: imsus-ask changed the checkout (transcript line 145); #12 closed on merge with the "Start something" done-when unproven, a choice the user made knowingly
- Context handed over: nothing found

## Earlier fixes

None: this is the first retro record.
