# The workflow profile extends Matt Pocock's `docs/agents/` instead of replacing it

`imsus-setup` writes a project's workflow profile into `docs/agents/`, the convention `setup-matt-pocock-skills` already uses, because the collection's workflows are built on Matt's skills, and those skills find their tracker and domain operations through that convention. The tracker file (`issue-tracker.md`) and domain file (`domain.md`) stay Matt's: when they are missing, `imsus-setup` follows `/setup-matt-pocock-skills` as one step (reading its SKILL.md, since a user-only skill can't be invoked from another skill) instead of writing them itself. `imsus-setup` owns only the topics Matt doesn't cover (workflow, git, harness, stack, CI, release, guardrails) and links them from its own `## Workflow` block in `CLAUDE.md` or `AGENTS.md`, separate from Matt's `## Agent skills` block, which his re-runs rewrite.

## Considered Options

- **Fork Matt's templates into imsus:** rejected because a fork drifts every time he edits a template, and one interview wasn't worth the drift tracking.
- **An imsus-native format:** rejected because Matt's skills would no longer find the operations they rely on (frontier query, claim, publish).
- **Add subsections inside `## Agent skills`:** rejected because a re-run of Matt's setup rewrites that block in place and could drop them.

## Consequences

A project's profile depends on an outside skill for its tracker and domain files, so `/setup-matt-pocock-skills` sits on the curated list of outside skills, and a breaking change to his file format is a breaking change for this collection.
