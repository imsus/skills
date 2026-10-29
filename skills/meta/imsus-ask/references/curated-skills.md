# Curated outside skills

Skills from other authors that the workflows in [workflows.md](workflows.md) use. Recommend one only when the project's workflow profile records it. All come from [mattpocock/skills](https://github.com/mattpocock/skills), reviewed at commit `a496f55`; install with `npx skills add mattpocock/skills --skill <name>`.

| Skill | Path in mattpocock/skills | Step it fills |
| --- | --- | --- |
| setup-matt-pocock-skills | `skills/engineering/setup-matt-pocock-skills` | Precondition: writes `docs/agents/issue-tracker.md`, `domain.md` and the `## Agent skills` block |
| grill-with-docs | `skills/engineering/grill-with-docs` | feature 1: grill, updating glossary and ADRs |
| to-spec | `skills/engineering/to-spec` | feature 2: publish the spec to the tracker |
| to-tickets | `skills/engineering/to-tickets` | feature 3: tracer-bullet tickets with blocking edges |
| implement | `skills/engineering/implement` | feature 4, small change 1: one ticket or spec, then review and commit |
| implement-spec | `skills/engineering/implement-spec` | feature 4: whole ticket graph, parallel worktree subagents on one integration branch |
| tdd | `skills/engineering/tdd` | feature 5, bug 2: red-green slices at agreed seams |
| diagnosing-bugs | `skills/engineering/diagnosing-bugs` | bug 1: tight loop, root cause, regression test |
| code-review | `skills/engineering/code-review` | feature 6, small change 2: Standards and Spec review since a fixed point |
| pr | `skills/engineering/pr` | feature 7, small change 3: PR body |
| wayfinder | `skills/engineering/wayfinder` | explore 1a: map of decision tickets for a foggy effort |
| triage | `skills/engineering/triage` | explore 1b: label incoming issues agent-ready or not |
| handoff | `skills/productivity/handoff` | Phase boundary: summary file for a new harness, directory, colleague or side task |
| git-guardrails-claude-code | `skills/misc/git-guardrails-claude-code` | Guardrails: Claude Code hooks blocking push, `reset --hard`, `clean` |

`issue-tracker.md` and `domain.md` stay owned by setup-matt-pocock-skills: when they are missing, run `/setup-matt-pocock-skills` rather than writing them.
