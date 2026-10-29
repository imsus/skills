---
name: imsus-ask
description: Tells you what to do next in this project's workflow (where to start a task, whether finished work is really done, what's left) and ends with the exact Next prompt to send.
disable-model-invocation: true
---

# imsus-ask

Advise, then stop. The answer is a recommendation and a **Next prompt** the user sends themselves; running the work here spends tokens they did not ask to spend.

Shared reference, read when a step points at it:

- [references/workflows.md](references/workflows.md): the four workflows, their steps with done-when, and the phase boundary ladder.
- [references/harness.md](references/harness.md): harness detection, each harness's harness actions, question tool, built-ins and skill invoke syntax.
- [references/curated-skills.md](references/curated-skills.md): outside skills, their source and the step each fills.
- [references/catalog.md](references/catalog.md): every imsus skill with its install lines.

## What you may recommend

Only these, and nothing else:

- **imsus skills.** `/imsus-setup` writes or audits the project's workflow profile, tooling and installed imsus skills; recommend it when the profile is missing, stale, or lacks the workflow the user needs. `/imsus-retro` reviews a finished session and turns what went wrong into proven fixes (see Close calls). A skill listed in catalog.md but absent from this list: route by its catalog description.
- **The current harness's built-ins**, from harness.md for the detected harness.
- **Outside skills the workflow profile records** (`docs/agents/workflow.md`, or, before imsus-setup has run, Matt's skills when `/setup-matt-pocock-skills` has written the `## Agent skills` block). A curated skill the profile does not record is a reason to recommend `/imsus-setup`, not the skill.

Before describing what a skill does, read its SKILL.md; the tables here and in references/ are orientation, and the file wins when they disagree. A skill is installed when it is in your skill list or has a folder in the harness's project or user skill directory (harness.md, Skills); user-only skills never appear in your list, so check the folders. If a recommended skill is not installed, print its install line (catalog.md for imsus skills, curated-skills.md for outside ones) above the Next prompt.

## Steps

### 1. Read the situation

- **Harness**: detect it from the environment per harness.md. Write every command in that harness's syntax (`/name` vs `$name`, `/compact` vs `/compress`).
- **Profile**: read `CLAUDE.md` or `AGENTS.md`, its `## Workflow` and `## Agent skills` blocks, and the `docs/agents/` files they link (workflow, git flow, issue tracker). Note what is missing; it shapes the answer.
- **Intent**: one of the three below. With no arguments, or an intent you cannot place, ask one multiple-choice question with the harness's question tool (harness.md; numbered fallback): **Start something**, **I finished something**, **What's left?**, **Set up this project** (→ `/imsus-setup`).

Done when harness, profile state and intent are each known.

### 2a. "I want to do X": start

Place X in a workflow with workflows.md's **Pick one** table, restricted to the workflows the profile records (all four when it records none). Name the workflow, the step X enters at, and the skill for that step. If X already has a ticket or spec on the tracker, read it: a published spec enters feature at step 3 or 4, not step 1.

### 2b. "I finished this": done-check first

Prove "finished" before moving on. Check, in order, and stop at the first gap:

1. `git status --short`: uncommitted changes.
2. Unpushed commits: `git log @{u}..` (no upstream counts as unpushed).
3. The branch's PR (`gh pr view`, or the tracker's equivalent): exists if the profile's git flow uses PRs, checks green, merged or not.
4. The ticket or spec, read with the operation in `docs/agents/issue-tracker.md`: open or closed, and every done-when in workflows.md for the step just finished.

When the work landed on an integration branch (a spec built by the whole-graph implementation skill), "finished" means merged there: push, PR and closing the issue belong to the integration branch once the spec is done, so they are not gaps for one ticket.

A gap makes the Next prompt the one that closes it (commit, push, `/pr`, fix a failing check, finish the ticket). With no gap, the recommendation is the workflow's next step; after a merge, put cleanup (workflows.md, last paragraph) first as a harness action.

### 2c. "What's left?": frontier and git state

1. Run the frontier query from `docs/agents/issue-tracker.md`, scoped to the spec or map the user names (its sub-issues or task list), else to all open issues: open, no open blocker, unassigned.
2. Cross-check with git: an open issue whose commits already landed (`git log --grep '#<n>'` on the main or integration branch) is done and waiting to close. Count it as done, and its dependents as unblocked by it.
3. Read git state: current branch, `git worktree list`, open PRs (`gh pr list` or equivalent), and branches with unmerged work.
4. Answer with the frontier (number, title, one line each), work in flight from git, and which item comes first: in-flight work before new work, then frontier order. The Next prompt is exactly one block, for that first item: the rest of the frontier is already listed above it, so it is not repeated as branches.

A frontier with several independent tickets can run in parallel: one worktree per ticket (harness.md, Worktrees), or the whole graph via the profile's implement-the-spec skill.

### 3. Harness action

Decide whether the Next prompt needs a session move first: walk the phase boundary ladder in workflows.md (first yes wins), plus worktree for parallel work and cleanup after a merge. Use the detected harness's command from harness.md. When one is needed, it is its own numbered step before the Next prompt.

### 4. Answer

Lead with the answer in two to five sentences: where the user is, what comes next, why. Then, in this order:

1. The harness action, if any, as a numbered step.
2. Install lines for any recommended skill not installed.
3. **Next prompt**: one fenced block per branch, the recommended branch first (for "What's left?", exactly one block: step 2c), each under a one-line label saying when to take it. Each block starts with the slash command (or the harness's skill syntax) and is filled with this conversation's specifics: issue numbers, spec, branch, file paths. A placeholder in the block means a detail is still missing; find it or ask.

~~~markdown
**Next prompt**

Recommended: #41 is merged, so ticket #42 is unblocked and nothing is in flight.

```
/implement #42
```

If you'd rather build the whole spec in one run:

```
/implement-spec #40
```
~~~

## Close calls

- **feature vs small change**: does it need a decision settled, or span more than one session? Yes → feature. A one-session job with a clear shape is a small change, even when large.
- **Bug, cause known vs unknown**: a known cause with an obvious fix is a small change; a bug that resists a first look goes to diagnose.
- **Triage or not**: only issues the user didn't write. Tickets from the tickets step are already agent-ready.
- **Per-ticket vs whole-graph implementation**: the user wants to drive each ticket → per ticket, clearing between them; they'd rather orchestrate → the whole graph in one run.
- **Grill vs map**: an idea one session can hold gets grilled; one it can't gets a wayfinding map, which hands over to the spec step when it clears.
- **Retro**: `/imsus-retro` is the last step of every workflow (workflows.md), run in the session it reviews before clearing; after a `/clear`, point it at that session's id. When the user says they finished and this session did the work, offer it as a branch.
