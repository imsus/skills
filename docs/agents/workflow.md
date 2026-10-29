<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# Workflow

Workflows this project uses, from imsus-setup's workflows reference. Working style: test-first, spec-first, small changes.

## Workflows

| Workflow | Starts with | Use for |
| --- | --- | --- |
| feature | `/grill-with-docs` | A new skill, category or tooling change that needs decisions or spans sessions |
| bug | `/diagnosing-bugs` | A broken `check`, `manifest`, `drift` or `link` command, a red CI run, or a skill that misbehaves |
| explore | `/triage` or `/wayfinder` | `drift` issues the weekly job opens (`/triage`); a foggy effort before it becomes a spec (`/wayfinder`) |

## Skill per step

Only steps that differ from the default, or that a harness built-in fills. Every other step uses the workflows reference's skill.

| Workflow step | Skill | Source |
| --- | --- | --- |
| feature 6: review | `/code-review` | mattpocock/skills, installed under the Claude Code built-in's name; adds the Standards (`CODING_STANDARDS.md`) and Spec axes |
| bug 3: fix | no skill: done by hand in the same session | - |
| phase boundary | `/compact`, `/clear` | harness built-in |
| phase boundary: new harness, repo or side task | `/handoff` | mattpocock/skills |

## Outside skills

Recorded here so `/imsus-ask` may recommend them. All are installed globally.

| Skill | Source | Install |
| --- | --- | --- |
| setup-matt-pocock-skills | mattpocock/skills | `npx skills add mattpocock/skills --skill setup-matt-pocock-skills -g -y` |
| grill-with-docs | mattpocock/skills | `npx skills add mattpocock/skills --skill grill-with-docs -g -y` |
| to-spec | mattpocock/skills | `npx skills add mattpocock/skills --skill to-spec -g -y` |
| to-tickets | mattpocock/skills | `npx skills add mattpocock/skills --skill to-tickets -g -y` |
| implement | mattpocock/skills | `npx skills add mattpocock/skills --skill implement -g -y` |
| implement-spec | mattpocock/skills | `npx skills add mattpocock/skills --skill implement-spec -g -y` |
| tdd | mattpocock/skills | `npx skills add mattpocock/skills --skill tdd -g -y` |
| diagnosing-bugs | mattpocock/skills | `npx skills add mattpocock/skills --skill diagnosing-bugs -g -y` |
| code-review | mattpocock/skills | `npx skills add mattpocock/skills --skill code-review -g -y` |
| pr | mattpocock/skills | `npx skills add mattpocock/skills --skill pr -g -y` |
| wayfinder | mattpocock/skills | `npx skills add mattpocock/skills --skill wayfinder -g -y` |
| triage | mattpocock/skills | `npx skills add mattpocock/skills --skill triage -g -y` |
| handoff | mattpocock/skills | `npx skills add mattpocock/skills --skill handoff -g -y` |
| git-guardrails-claude-code | mattpocock/skills | `npx skills add mattpocock/skills --skill git-guardrails-claude-code -g -y` |
