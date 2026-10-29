# Workflows

The four workflows a project can choose. A project records the ones it uses in its workflow profile (`docs/agents/workflow.md`). Every workflow ends with `/imsus-retro`, run in the session it reviews, before `/clear`.

Outside skills named here are on the curated list ([curated-skills.md](curated-skills.md)). Harness actions (`/compact`, `/clear`, worktrees) differ per harness: see [harness.md](harness.md).

## Pick one

| The user wants to | Workflow | Starts with |
| --- | --- | --- |
| Build something that needs decisions, or spans sessions | feature | `/grill-with-docs` |
| Make a change small and clear enough to do now | small change | `/implement` |
| Fix something broken, failing or slow | bug | `/diagnosing-bugs` |
| Work through an effort too big or foggy to spec, or a pile of incoming issues | explore | `/wayfinder` or `/triage` |

## feature

| # | Step | Skill | Done when |
| --- | --- | --- | --- |
| 1 | Grill | `/grill-with-docs` | Every open question is settled; glossary and ADRs updated |
| 2 | Spec | `/to-spec` | Spec published to the tracker |
| 3 | Tickets | `/to-tickets` | Tracer-bullet tickets published with blocking edges |
| 4 | Implement | `/implement` per ticket, or `/implement-spec` for the whole graph | Each ticket's code committed |
| 5 | Test-first | `/tdd` (driven by step 4) | Each slice went red, then green |
| 6 | Review | `/code-review` (run by step 4) | Standards and Spec findings resolved |
| 7 | PR | `/pr` | PR open with its body written |
| 8 | Retro | `/imsus-retro` | Accepted fixes applied, retro record written |

Keep steps 1 to 3 in one session. After step 3, each `/implement` starts fresh from its ticket (`/clear` between tickets). If one session is enough, skip steps 2 and 3 and run `/implement` in the same context.

## small change

| # | Step | Skill | Done when |
| --- | --- | --- | --- |
| 1 | Implement | `/implement` | Change committed, verify passes |
| 2 | Review | `/code-review` (run by step 1) | Findings resolved |
| 3 | Ship | `/pr`, or a direct commit when the profile's git flow is trunk | PR open, or commit on the main branch |
| 4 | Retro | `/imsus-retro` | Accepted fixes applied, retro record written |

## bug

| # | Step | Skill | Done when |
| --- | --- | --- | --- |
| 1 | Diagnose | `/diagnosing-bugs` | A tight loop goes red on the bug; root cause named |
| 2 | Regression test | `/tdd` | A test fails on the bug |
| 3 | Fix | (same session) | The regression test passes, verify passes |
| 4 | Retro | `/imsus-retro` | Accepted fixes applied, retro record written |

If no seam exists to lock the bug down with a test, the retro's fix is architectural; that work enters the feature workflow at step 1.

## explore

On-ramps that feed the other workflows.

| # | Step | Skill | Done when |
| --- | --- | --- | --- |
| 1a | Map a foggy effort | `/wayfinder` | The map's frontier is empty |
| 1b | Triage issues you didn't write | `/triage` | Each issue is labelled agent-ready, human, needs-info or wontfix |
| 2 | Hand over | feature step 2 (`/to-spec`) after a map; `/implement` for an agent-ready issue | The next workflow has started |
| 3 | Retro | `/imsus-retro` | Accepted fixes applied, retro record written |

Tickets from `/to-tickets` are already agent-ready; they skip `/triage`.

## Phase boundaries

Decide session moves only at a phase boundary (grill to spec, ticket to ticket, implement to review). First yes wins:

1. **Continue** if the next phase needs this session as a primary source, or the context is under ~150k tokens.
2. **`/clear`** if nothing in this session bears on the next phase.
3. **`/handoff`** for a new harness, a new directory or repo, a colleague, or a side task forked mid-phase.
4. **Subagent** if the next phase runs unattended and is tightly scoped (for example a review).
5. **`/compact`** with an instruction naming the next phase, otherwise.

Parallel tickets each get their own worktree on their own branch. After a PR merges, clean up: delete the branch, remove the worktree, pull the main branch.
