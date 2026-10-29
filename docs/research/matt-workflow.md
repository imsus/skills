# Matt Pocock's workflow skills: setup files, consumers, ask-matt flow

Research date: 2026-10-29. Source: [mattpocock/skills](https://github.com/mattpocock/skills) at commit `a496f5513d4a4cf889bc48e189e579f4b0bdf6aa` (pinned; every link below uses it). The earlier notes in `setup-skills.md` and `guide-skills.md` read `59db609`. HEAD moved by 3 commits since then (see "Delta since 59db609"). Read via `gh api repos/mattpocock/skills/contents/<path>?ref=<sha>`.

Link base: `https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/`. Abbreviated `[B]/` below.

## 1. `setup-matt-pocock-skills`

Source: [B]/skills/engineering/setup-matt-pocock-skills/SKILL.md (user-invoked, `disable-model-invocation: true`). Prompt-driven, not a script: "Explore, present what you found, confirm with the user, then write."

### Files it writes

| Path in target repo | Written when | Seed template |
| --- | --- | --- |
| `docs/agents/issue-tracker.md` | always | `issue-tracker-github.md`, `-gitlab.md`, `-local.md`; for "Other" (Jira, Linear...) written from scratch from the user's one-paragraph description |
| `docs/agents/triage-labels.md` | only if the `triage` skill is installed (Section B) | `triage-labels.md` |
| `docs/agents/domain.md` | always (single-context default, no question asked) | `domain.md` |
| `## Agent skills` block in `CLAUDE.md` or `AGENTS.md` | always | inline in SKILL.md step 4 |
| tracker labels (`gh label create` / `glab label create`) | Section B ran on GitHub/GitLab: creates each configured label the tracker lacks | n/a |
| `git remote add origin` / `git init` | GitHub/GitLab chosen and no matching remote: gets URL from user, wires it; done when `gh repo view` / `glab repo view` works | n/a |

It does NOT write `GLOSSARY.md`, `GLOSSARY-MAP.md` or `docs/adr/`. `domain.md` says those are created lazily by `/domain-modeling` ([B]/skills/engineering/setup-matt-pocock-skills/domain.md). Legacy `CONTEXT.md` / `CONTEXT-MAP.md`: it offers to `git mv` to the `GLOSSARY` names and rewrite names in `domain.md`.

### Process (SKILL.md)

1. Explore: `git remote -v`, `.git/config`; `AGENTS.md`/`CLAUDE.md` and any existing `## Agent skills` section; `GLOSSARY.md`/`GLOSSARY-MAP.md` (+ legacy CONTEXT*); `docs/adr/` and `src/*/docs/adr/`; `docs/agents/` (prior output); `.scratch/` (sign of local-markdown tracker); is `triage` installed; monorepo signals (`pnpm-workspace.yaml`, `workspaces`, populated `packages/*`).
2. Present findings, then ask sections in order, one at a time, recommended answer first; skip a section when exploration settled it.
   - A. Issue tracker. Propose GitHub if remote is GitHub, GitLab if remote is GitLab. Options: GitHub (`gh`), GitLab (`glab`), Local markdown (`.scratch/<feature>/`), Other (freeform prose). The GitHub/GitLab templates carry a "PRs as a request surface" flag, default off; the skill leaves it off and "doesn't raise it".
   - B. Triage labels (skipped if `triage` not installed). One question: "Do you want to keep the default triage labels? (recommended: yes)". Defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On "no", collect overrides (e.g. `bug:triage`).
   - C. Domain docs. Default single-context, written without asking. Multi-context (`GLOSSARY-MAP.md`) offered only when monorepo signals are found.
3. Confirm and edit: show drafts of the block and the three docs files; user can edit before writing.
4. Write.
5. Done: tells the user which skills read the files; says re-running is only needed to switch trackers or restart.

### Re-runs and file selection

- File to edit: `CLAUDE.md` if it exists; else `AGENTS.md`; if neither, ask which to create (never picks). Never creates `AGENTS.md` when `CLAUDE.md` exists, or vice versa.
- If an `## Agent skills` block already exists: "update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections."
- Step 1 reads existing `docs/agents/` ("does this skill's prior output already exist?") but SKILL.md states no explicit merge or diff rule for the docs files. Re-run is described as "only necessary if they want to switch issue trackers or restart from scratch." A "verify mode" was rejected: [B]/.out-of-scope/setup-skill-verify-mode.md.

### Pointer block written into CLAUDE.md / AGENTS.md

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout: "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

The `### Triage labels` sub-block (and its file) is omitted when `triage` is not installed. (Matt's own AGENTS.md uses only `### Triage labels` under that heading: [B]/AGENTS.md.)

### Per-tracker templates (exact text is in the linked files)

Supported: GitHub, GitLab, local markdown, other (freeform). No Jira/Linear templates; "Other" is prose written by the skill. Rationale: [B]/.out-of-scope/mainstream-issue-trackers-only.md.

Every template has the same three hook sections that other skills' prose points at: **Conventions** (CRUD ops), **"When a skill says 'publish to the issue tracker'"**, **"When a skill says 'fetch the relevant ticket'"**, plus **Wayfinding operations** (used by `/wayfinder`).

- GitHub, [issue-tracker-github.md](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md). Header: "Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations." Conventions:
  - create `gh issue create --title "..." --body "..."` (heredoc for multiline)
  - read `gh issue view <number> --json number,title,body,labels,comments`
  - list `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with `--label`/`--state`
  - sub-issue: `gh issue create --parent <parent> ...` or `gh issue edit <parent> --add-sub-issue <child>` (gh 2.94+); older `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`; fallback `Part of #<parent>` line
  - blocking: native issue dependencies: `gh issue create --blocked-by <n>,<n>` / `gh issue edit <child> --add-blocked-by <blocker>`; older `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`; fallback `Blocked by: #<n>, #<n>` line. Unblocked = every blocker closed
  - count open blockers: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by`
  - comment `gh issue comment`, labels `gh issue edit --add-label/--remove-label`, close = comment then `gh issue close`
  - guard: never file into `mattpocock/skills`; in a fork check `gh repo view --json nameWithOwner` first
  - "PRs as a request surface: no." flag, with `gh pr`/`gh api pulls` equivalents when `yes`
  - Wayfinding ops: Map = issue labelled `wayfinder:map`; Child = sub-issue (or task list + `Part of #<map>`), label `wayfinder:<research|prototype|grilling|task>`; Frontier query = open children minus open-blocker minus assigned, first in map order; Claim = `gh issue edit <n> --add-assignee @me` ("the session's first write"); Resolve = comment answer, close, append context pointer (gist + link) to the map's Decisions-so-far.
- GitLab, [issue-tracker-gitlab.md](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md). `glab issue create --title --description`, `glab issue view <n> --comments`, `glab issue list -O json`, `glab issue note <n> --message`, `glab issue update --label/--unlabel`, `glab issue close` (post note first; close takes no comment). "MRs as a request surface: no." Blocking via `/blocked_by #<n>` quick action posted as a note (Premium/Ultimate), fallback `Blocked by:` line. Frontier via `glab api projects/:id/issues/<map>/links`. Claim `glab issue update <n> --assignee @me`.
- Local markdown, [issue-tracker-local.md](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md). Full seed text is short:
  - one feature per dir `.scratch/<feature-slug>/`; spec at `.scratch/<feature-slug>/spec.md`; tickets one file each at `.scratch/<feature-slug>/issues/<NN>-<slug>.md` numbered from `01`, "never a single combined tickets file"
  - triage state = `Status:` line near top of each issue file (strings from `triage-labels.md`)
  - comments append under `## Comments`
  - publish = create new file under `.scratch/<feature-slug>/`; fetch = read file at path
  - wayfinding: map `.scratch/<effort>/map.md`; children `.scratch/<effort>/issues/NN-<slug>.md` with `Type:` and `Status: claimed|resolved`; blocking `Blocked by: NN, NN`; Frontier = scan for open, unblocked, unclaimed, lowest number; Claim = set `Status: claimed` and save; Resolve = append `## Answer`, `Status: resolved`, append pointer to `map.md` Decisions-so-far.
- `triage-labels.md` ([link](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/setup-matt-pocock-skills/triage-labels.md)): intro "five canonical triage roles... maps those roles to the actual label strings"; table `Label in mattpocock/skills | Label in our tracker | Meaning`:
  `needs-triage` (Maintainer needs to evaluate this issue), `needs-info` (Waiting on reporter for more information), `ready-for-agent` (Fully specified, ready for an AFK agent), `ready-for-human` (Requires human implementation), `wontfix` (Will not be actioned). Closing line: "When a skill mentions a role (e.g. 'apply the AFK-ready triage label'), use the corresponding label string from this table. Edit the 'Label in our tracker' column..."
- `domain.md` ([link](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/setup-matt-pocock-skills/domain.md)) sections: "Before exploring, read these" (GLOSSARY.md, or GLOSSARY-MAP.md then each relevant GLOSSARY.md, plus `docs/adr/` and `src/<context>/docs/adr/`; "If any of these files don't exist, proceed silently"); "File structure" (single vs multi-context trees); "Use the glossary's vocabulary"; "Flag ADR conflicts" (`_Contradicts ADR-0007 (event-sourced orders), but worth reopening because..._`).

## 2. File to consuming skills to operations

Design rule: [ADR 0001](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/.agents/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md). Hard-dependency skills carry an explicit "should have been provided to you; run `/setup-matt-pocock-skills` if not" line. Soft-dependency skills mention "the project's domain glossary"/ADRs in vague prose and degrade gracefully. Note no skill reads `docs/agents/*` by path; they rely on the CLAUDE.md/AGENTS.md block being in context ("provided to you").

| File | Consuming skills | Operations relied on |
| --- | --- | --- |
| `docs/agents/issue-tracker.md` | [to-spec](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/to-spec/SKILL.md) (hard) | "publish to the project issue tracker" (then apply `ready-for-agent`) |
| | [to-tickets](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/to-tickets/SKILL.md) (hard) | publish one issue/file per ticket, blockers first; native blocking edges; sub-issue of source issue; "the tracker doc's operation" |
| | [triage](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/triage/SKILL.md) (hard) | query tracker for unlabeled / needs-triage / needs-info buckets, read issue, comment, label, close; reads the "PRs as a request surface" flag |
| | [wayfinder](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/wayfinder/SKILL.md) | "Wayfinding operations" section: Map, Child ticket, Blocking, Frontier query, Claim, Resolve; "If no tracker has been provided, default to the local-markdown tracker" |
| | [implement-spec](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/implement-spec/SKILL.md) | read spec+tickets as task graph / frontier; "resolve each ticket the way the issue tracker closes work"; draft PR if tracker closes via PRs |
| | [implement](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/implement/SKILL.md) | "fetch it from the issue tracker and state its title" |
| | [code-review](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/code-review/SKILL.md) | fetch issues referenced in commit messages (`#123`, `Closes #45`, `!67`) "via the workflow in the tracker doc" to find the Spec source |
| `docs/agents/triage-labels.md` | triage (hard) | map canonical roles to label strings; one category + one state role per issue |
| | to-spec, to-tickets | apply `ready-for-agent` |
| | wayfinder | explicitly does NOT use triage labels: map and tickets carry only `wayfinder:*` labels |
| `docs/agents/domain.md` -> `GLOSSARY.md` / `GLOSSARY-MAP.md` / `docs/adr/` | [tdd](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/tdd/SKILL.md), [diagnosing-bugs](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/diagnosing-bugs/SKILL.md) (soft) | read GLOSSARY.md "if it exists" for vocabulary; respect ADRs |
| | [improve-codebase-architecture](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/improve-codebase-architecture/SKILL.md) (soft) | read glossary + ADRs first; add terms lazily; do not re-litigate ADRs |
| | to-spec, triage | use glossary vocabulary in spec / when exploring; triage grill updates GLOSSARY/ADRs inline |
| | [grill-with-docs](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/grill-with-docs/SKILL.md) -> [domain-modeling](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/domain-modeling/SKILL.md) | WRITERS: create GLOSSARY.md / docs/adr lazily, update inline ([GLOSSARY-FORMAT](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/domain-modeling/GLOSSARY-FORMAT.md), [ADR-FORMAT](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/domain-modeling/ADR-FORMAT.md): `docs/adr/0001-slug.md`, scan for highest number) |
| | [pr](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/pr/SKILL.md), [wait-what](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/productivity/wait-what/SKILL.md) | glossary vocabulary in prose (wait-what follows `GLOSSARY-MAP.md`) |
| `CLAUDE.md` / `AGENTS.md` | [retro](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/retro/SKILL.md), [writing-for-agents](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/productivity/writing-for-agents/SKILL.md) | review/shrink them: "used incredibly sparingly, usually only for navigation pointers" |

Related non-setup files the skills own: `.out-of-scope/*.md` (triage reads for prior rejections; writes on rejected enhancements; [OUT-OF-SCOPE.md](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/triage/OUT-OF-SCOPE.md)), `.scratch/` (local tracker), `prototype/<name>` and `research/<name>` branches.

Triage disclaimer: every comment or issue posted during triage "must start with `> *This was generated by AI during triage.*`".

## 3. `ask-matt` flow map

Source: [B]/skills/engineering/ask-matt/SKILL.md and [B]/skills/engineering/ask-matt/PHASE-BOUNDARIES.md. User-invoked router. First rule: "Before stating what a skill does or recommending a step be skipped, read that skill's SKILL.md."

### Main flow (idea to ship)

```
/grill-with-docs
  -> [can every question be settled in conversation?]
       no  -> /handoff out -> fresh session: /prototype -> /handoff back (reference from original thread)
       yes -> continue
  -> [multi-session build?]
       yes -> /to-spec -> /to-tickets (tracer-bullet tickets, blocking edges)
                -> /implement per ticket, /clear between tickets
                   (local: .scratch/<feature>/issues/ blockers-first by hand; real tracker: native blocking links)
                OR /implement-spec (task graph, parallel implementer subagents over frontier, one integration branch)
       no  -> /implement in same context
  -> (build drives /tdd one red-green slice at a time; closes with /code-review: Standards + Spec)
     /implement runs both per ticket; /implement-spec runs one /code-review over integration branch
  -> /pr (model-invoked; shapes the PR body)
  -> /retro (closes loop; changes the environment, not the code)
```

"Grill-with-docs" is used whenever there is a working directory; `/grill-me` (stateless) when there is none.

### On-ramps (merge onto main flow)

- Bugs/requests piling up -> `/triage` -> agent-ready issues -> `/implement`. Only for issues you did not create; `/to-tickets` output is already agent-ready, "don't triage them".
- Something broken -> `/diagnosing-bugs` (tight feedback loop first, regression test) -> `/retro` same session -> if no seam to lock it down -> `/improve-codebase-architecture`.
- Huge foggy effort -> `/wayfinder` (map of decision tickets on tracker) -> when map clears, hand off at `/to-spec` -> `/to-tickets` -> `/implement`. Skipping `/to-spec` loses linked detail; go straight to `/implement` only if effort turned out small.

### Other branches

- Codebase health: `/improve-codebase-architecture` -> picked idea enters main flow at `/grill-with-docs`; `/codebase-design` is the bench to design on.
- Vocabulary layer (model-invoked): `/domain-modeling` (glossary + ADRs), `/codebase-design` (deep-module vocabulary used by `/tdd` and improve-codebase-architecture).
- Standalone: `/grill-me`, `/grilling` (primitive; used internally by triage, wayfinder, improve-codebase-architecture), `/prototype` (kept as primary source on `prototype/<name>` branch out of main, pointed at from the implementation issue), `/research` (background agent -> cited markdown; feeds `/grill-with-docs`), `/to-questionnaire` (inverse of grill-me; output feeds `/grill-with-docs` or `/to-spec`), `/wizard` (human-only steps as interactive bash), `/wait-what` (re-pitch in plain English), `/teach`, `/writing-for-agents`.
- Precondition: `/setup-matt-pocock-skills` before the first engineering flow.

### Context hygiene

- Keep steps 1-3 (grill, spec, tickets) in one unbroken window; do not compact or clear until after `/to-tickets`. Each `/implement` then starts fresh from the ticket.
- Run `/retro` in the session it reviews, before clearing; after clearing, point it at that session's log.
- Smart zone: ~150k tokens. If approaching it before `/to-tickets`, `/compact` at the nearest phase boundary.

### Phase boundaries ([PHASE-BOUNDARIES.md](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/ask-matt/PHASE-BOUNDARIES.md))

Phase = chunk of work (grilling, implementation, QA); boundary = gap between phases, the only place to decide. Mid-phase: continue or split the rest into subagents; compacting mid-phase "makes the agent lose the thread". Five options: Continue, `/clear`, `/handoff`, Subagent, `/compact`. Ordered tree, first yes wins:

1. Continue? Yes if the next phase needs this one as a primary source, or enough smart zone (~150k) remains. Grilling to implementation is the standard yes.
2. Context irrelevant to next? -> `/clear` (one-way risk: clearing relevant context loses the "why"; old session stays resumable).
3. Need to hand off? `/handoff` only for: new harness (Claude to Codex), new directory/repo, a colleague, or forking a side task mid-phase. It buys portability.
4. Can it be done AFK, tightly scoped? -> subagent (e.g. automated review).
5. Otherwise `/compact` (default, not first reach), with an instruction e.g. `/compact we're going to QA this area`.

Primary vs secondary sources: every move except Continue turns the session into a lossy summary.

### `handoff` skill exists

[B]/skills/productivity/handoff/SKILL.md, user-invoked, `argument-hint: "What will the next session be used for?"`. Writes a summary doc "so a fresh agent can continue the work", saved to the OS temp dir (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows), NOT the workspace. Must include a "suggested skills" section; must not duplicate content in specs/plans/ADRs/issues/commits/diffs (reference by path/URL); redact secrets and PII; arguments tailor the doc. Beta sibling: [claude-handoff](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/in-progress/claude-handoff/SKILL.md) writes the same summary then launches `claude --bg --name "<name>" -- "$(cat <file>)"`.

### Close calls, worktrees, cleanup

- ask-matt has no section named "close calls" or any close-call/disambiguation list at this SHA. The closest content: the "Standalone" `/grill-me` vs `/grill-with-docs` rule (use `grill-with-docs` whenever a working dir exists), "don't triage `/to-tickets` output", and wayfinder vs grill-with-docs (wayfinder only for ideas too big for one session, never a well-scoped feature).
- ask-matt says nothing about worktrees or cleanup (grep for `worktree` and `clean up` returns nothing in it).
- Worktrees appear only in [implement-spec](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/implement-spec/SKILL.md): step 4 "a fresh implementer subagent for each ticket, each in its own worktree on its own branch" (confirms worktree is based on the integration branch, resets onto it if not; calls `tdd`; merges integration tip before reporting done); step 5 merger subagent merges into the integration branch; step 9 "Clean up all implementer subagent worktrees". `/implement` just "Commit your work to the current branch."
- Other cleanup: diagnosing-bugs Phase 6 (tagged debug logs removed by one grep); prototype UI.md step 6 "Capture the answer and clean up".

## 4. Other session / phase / git / project-setup skills (one line each)

- [handoff](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/productivity/handoff/SKILL.md): portable summary file for a new session/harness/dir/colleague.
- [claude-handoff](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/in-progress/claude-handoff/SKILL.md) (in-progress): handoff plus `claude --bg` launch.
- [wayfinder](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/wayfinder/SKILL.md): map of decision tickets on the tracker; two modes (chart the map / work through the map); one ticket resolved per session (except research); map body sections Destination, Notes, Decisions so far, Not yet specified, Out of scope; ticket types research/prototype/grilling/task; research tickets fan out to subagents on throwaway `research/<name>` branches (push, no PR).
- [implement-spec](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/implement-spec/SKILL.md): task-graph build with parallel worktree subagents on one integration branch.
- [implement](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/implement/SKILL.md): single ticket/spec; `tdd` at agreed seams, typecheck regularly, full suite once, `code-review`, commit to current branch.
- [retro](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/retro/SKILL.md): suggest environment improvements after a session.
- [pr](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/pr/SKILL.md): PR body shape (smallest visual, before/after evidence, one-way/two-way door).
- [code-review](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/code-review/SKILL.md): diff vs fixed point, Standards + Spec axes in parallel fresh subagents.
- [git-guardrails-claude-code](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/misc/git-guardrails-claude-code/SKILL.md) (misc): Claude Code hooks blocking push, reset --hard, clean, etc.
- [setup-pre-commit](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/misc/setup-pre-commit/SKILL.md) (misc): Husky + lint-staged + Prettier + typecheck + tests.
- [setup-ts-deep-modules](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/in-progress/setup-ts-deep-modules/SKILL.md) (in-progress): dependency-cruiser so each package is a deep module.
- [scaffold-exercises](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/misc/scaffold-exercises/SKILL.md), [migrate-to-shoehorn](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/misc/migrate-to-shoehorn/SKILL.md) (misc): course scaffolding; test `as` migration.
- [wizard](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/wizard/SKILL.md): interactive bash for human-only steps.
- [research](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/research/SKILL.md), [prototype](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/prototype/SKILL.md), [grilling](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/productivity/grilling/SKILL.md): as in ask-matt above.

## Delta since 59db609

`gh api repos/mattpocock/skills/compare/59db609...a496f55`: 3 commits. Changed files touching these topics: `.changeset/ask-matt-read-skill-first.md` (the "read that skill's SKILL.md first" rule in ask-matt), `.changeset/handoff-temp-dir.md` (handoff saves to OS temp dir), `.changeset/to-tickets-sub-issues.md`, `.changeset/wayfinder-labels-refs-research-prs.md`, and `skills/engineering/wayfinder/SKILL.md`. The setup skill and its templates were not among the changed files matching the filter.

## Caveats

- Everything above was read from the pinned SHA only. I did not diff full file contents against 59db609, only the compare file list.
- Skill-to-file coupling is by prose convention ("should have been provided to you"), not by path; consumers depend on the `## Agent skills` block being loaded into context.
