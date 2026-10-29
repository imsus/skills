# Skills Collection

A public, curated collection of agent skills that the curator writes or adapts and also installs for their own use.

## Language

**Skill**:
A self-contained folder of instructions, centred on a `SKILL.md`, that an agent loads to do one kind of task.
_Avoid_: Prompt, command, plugin

**Own skill**:
A skill the curator wrote from scratch.
_Avoid_: Original, custom skill

**Fork**:
A skill copied from another author's repository and then changed by the curator.
_Avoid_: Vendored skill, borrowed skill

**Upstream**:
The other author's repository, and the exact version of it, that a fork was copied from.
_Avoid_: Origin, source repo

**Drift**:
The changes made upstream since a fork was last reviewed against it.
_Avoid_: Divergence, lag

**Category**:
A named group of related skills that installs as one unit.
_Avoid_: Pack, bundle, plugin (when meaning the group itself)

**Local link**:
A skill exposed to a harness straight from this collection's working tree, so edits take effect without reinstalling.
_Avoid_: Build, dev install

**Harness**:
The agent program a skill runs inside, such as Claude Code, Codex or Cursor, with its own built-in commands and tools.
_Avoid_: Agent, client, IDE

**Workflow profile**:
The set of documents in a project that records how work is done there: its issue tracker, git flow, stack, harness and chosen skills.
_Avoid_: Config, setup, agent docs

**Next prompt**:
The exact text, starting with a slash command, that the user should send next to continue their work.
_Avoid_: Suggestion, next step, command

**Project kind**:
What a project is and how it is worked on: app, library, CLI, monorepo or prototype, its language and framework, and whether one person or a team changes it.
_Avoid_: Project type, project style

**Working style**:
How the user prefers to work in a project, such as test-first or not, spec-first or code-first, and small or large changes.
_Avoid_: Preferences, style

**Harness action**:
A built-in harness command that manages the session or workspace rather than doing the work, such as compacting, clearing, handing off, opening a worktree or cleaning up after a merge.
_Avoid_: Built-in skill, session command

**Phase boundary**:
The point where one stage of work ends and the next can start in a fresh session, because everything needed to continue is already recorded outside the conversation.
_Avoid_: Checkpoint, milestone

**Workflow**:
A named sequence of skills and harness actions that a project uses for one kind of work, such as a feature, a small change, a bug or an exploration.
_Avoid_: Process, pipeline, flow

**Retro**:
A review of a finished or failed session that turns what went wrong into fixes to the project, its workflow profile or its skills, rather than to the code being worked on.
_Avoid_: Post-mortem, reflection, lessons learned

**Retro record**:
The note a retro leaves in the project listing each fix the user accepted, so a later retro can tell whether those fixes worked.
_Avoid_: Retro log, learnings file
