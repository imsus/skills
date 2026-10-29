---
name: imsus-setup
description: Sets up or audits this project's workflow profile. Detects stack, harness and installed imsus skills, suggests workflows, git flow and missing tooling, writes docs/agents/ and the Workflow block, then proves every change with a before/after table.
disable-model-invocation: true
---

# imsus-setup

Write the project's **workflow profile**: the `docs/agents/` files and `## Workflow` block that `/imsus-ask` and the workflow skills read. Run in a consumer project, never on autopilot: the user confirms every write.

Reference, read when a step points at it:

- [references/detect.md](references/detect.md): read-only signals per topic, install detection for both routes, and who owns which profile file.
- [references/profile-templates.md](references/profile-templates.md): seeds for every owned file and the `## Workflow` block.
- [references/workflows.md](references/workflows.md): the four workflows and their steps.
- [references/harness.md](references/harness.md): harness detection, question tool, built-ins per harness.
- [references/curated-skills.md](references/curated-skills.md): outside skills and the step each fills.
- [references/catalog.md](references/catalog.md): imsus skills and their install lines.

## Ownership

- **Owned** (written in full, re-written on re-runs): `docs/agents/{workflow,git,harness,stack,ci,release,guardrails}.md` and the `## Workflow` block, replaced in place.
- **Matt's** (never written here): `docs/agents/issue-tracker.md`, `domain.md`, `triage-labels.md` and the `## Agent skills` block. When missing, Step 4 runs `/setup-matt-pocock-skills`.
- **Shared** (merged, never clobbered): `package.json`, `.claude/settings.json`, CI files, hook config, the rest of the rules file. Read the file, change only the keys you add, keep everything else byte for byte.

## Asking

Detect before you ask: a question the repo already answers is a wasted turn. Ask only to confirm a reading or fill a gap, **one question per call**, with the harness's question tool (harness.md, Tools; numbered fallback). The recommended option goes first, labelled "(Recommended)", and states what detection saw ("CI runs `bun test`, so ..."). A topic whose signals agree is shown as a finding, not asked, except working style (detect.md says why).

## Steps

### 1. Find out

Detect every topic in detect.md: project kind, working style, tooling, release, git flow, guardrails, harness (current and others the project uses), installed imsus skills on both routes, installed curated skills, and the profile files present. Run nothing that writes: no installs, no `npx skills check`.

Mode: **audit** when detect.md's Workflow profile section finds a prior run (Step 7 governs which questions are asked). Otherwise **first run**; Matt's block may still exist, and his files are then already done.

Show the findings as one table (topic, what was detected, evidence), with double installs, available updates and Matt-file gaps called out below it. Then ask the gap questions.

Done when every topic in detect.md has a value or an explicit "none", each with its evidence.

### 2. Suggest

Propose, per topic, the recommended choice and one alternative:

- **Workflows**: one or more of the four (workflows.md). Recommend from project kind and working style: a team spec-first repo gets feature + bug; a solo prototype gets small change + bug; explore when the tracker holds issues nobody wrote as tickets.
- **Git flow**: branch + PR, trunk, stacked PRs with gh-stack, or GitButler. Recommend what history already shows; suggest a change only with a reason (a team on trunk with no protection).
- **Tracker and domain docs**: delegated to `/setup-matt-pocock-skills`; suggest it only when his files are missing.
- **Missing tooling**: test runner, lint/format, typecheck, pre-commit, CI, each matched to the stack and package manager already in use. A starting stack only in an empty repo.
- **Verify command**: one script that runs everything CI runs on a pull request (detect.md, Tooling). When it drifts from CI, propose the edit to whichever side is missing a check.
- **Release / versioning**: none is a fine answer for an unpublished app; a library gets a scheme and a changelog.
- **Guardrails**: the git-guardrails hook for Claude Code, a pre-commit hook running verify, branch protection for a team.

Done when the user has accepted, changed or skipped each suggestion.

### 3. Fill gaps

For each workflow step and each tooling gap the choices left open, take the first source that covers it:

1. **Harness built-in** (harness.md, Built-ins), for the primary harness. If an imsus or curated skill does more, say so once, then move on.
2. **imsus skill** (catalog.md).
3. **Curated outside skill** (curated-skills.md).

Record each pick for `workflow.md`'s Skill per step and Outside skills tables. A step none of the three covers is listed as "no skill: done by hand".

Done when every step of every chosen workflow names its skill or says "by hand".

### 4. Apply

Ask the **scope** once per run, before anything installs or touches harness config: project (Recommended) or global. Profile files are always project files; scope decides `npx skills add` without or with `-g`, the plugin scope, and `.claude/settings.json` vs `~/.claude/settings.json`.

Show the full plan (every file to create or edit with a diff, every command to run, every line for the user), confirm it once, then apply in this order:

1. **Matt's files**, if missing: install `/setup-matt-pocock-skills` with its curated-skills.md line if absent, then read its SKILL.md from the skill folder and follow it as this step (it is user-only, so it cannot be invoked from here). Its own confirmations still apply.
2. **Installs**: run each `npx skills add imsus/skills --skill <name> [-g] -y`, each picked curated skill that is missing (its curated-skills.md line, same scope flag), and each tooling install (with the detected package manager). For the plugin route, print the lines for the user to send, since `/plugin` is theirs to run:
   ```
   /plugin marketplace add imsus/skills
   /plugin install <category>@imsus
   ```
   For a double install, propose removing one route: keep the plugin for Claude-Code-only projects, `npx skills` when other harnesses read the skills.
3. **Shared config**: merge per Ownership (scripts, hooks, CI steps).
4. **Owned files**: write each from profile-templates.md. On a re-run, start from the existing file: keep the user's edits unless a fact they state is now false.
5. **`## Workflow` block**: into `CLAUDE.md` if it exists, else `AGENTS.md`; if neither exists, ask which to create (AGENTS.md recommended when the project uses more than one harness). Replace an existing block in place; place a new one after `## Agent skills`.

Done when every confirmed item ran or is listed as a line for the user to run.

### 5. Prove

Re-run Step 1's detection from scratch, then show one table:

| Topic | Before | Planned | After | Status |
| --- | --- | --- | --- | --- |

Status is `ok` when After equals Planned, `user` for a printed line the user still has to send, and `FAILED` otherwise. Also run the verify command once when Apply added or changed it, and for a new guardrail hook pipe it one blocked command and check it refuses.

Any `FAILED` row goes at the top of the answer, in bold, with the command output that shows it: a claimed change that did not happen is the one result this skill must never hide. Do not call the setup done while one stands.

Done when every planned row has a status backed by a re-detected value or a command's output.

### 6. Hand over

Two to four sentences: what the profile now says, what the user still has to run (`user` rows), and that `/imsus-ask` reads it from here. Leave committing to the user unless they ask.

### 7. Re-run audit

In audit mode, Steps 1 to 6 still run, but Step 1 compares the repo against what the profile records rather than starting blank. For each owned file, list the facts that drifted (a new test runner, CI checks verify no longer runs, a harness folder that appeared, an imsus category or update now available, Matt's files gone) and ask only about those. Unchanged topics show as `ok` in the Step 1 table and are not asked again, and the Step 5 table carries only the rows that changed. An audit with no drift ends at Step 1 with "profile matches the repo".
