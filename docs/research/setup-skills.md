# Setup skills in public agent-skill collections

Research date: 2026-10-29. Every row below was checked against the `SKILL.md` in the repository at the commit listed for that repository. Links are pinned to that commit. Star counts come from `gh api repos/<owner>/<repo>` on the same date.

## Scope

A **setup skill** is a skill whose main job is to set up, configure, install or bootstrap something in a repository or in the agent harness. Examples are a hook, a config file, a tool, a rules file, or another skill. The search covered:

1. Skills whose folder name contains `setup`, `init`, `install`, `configur`, `bootstrap`, `scaffold` or `onboard`.
2. Skills whose frontmatter `description` says that the skill sets up, configures, installs, scaffolds or wires something.

A skill that only teaches how to do setup, without changing files itself, is marked **guidance**. A skill that sets something up only as a side step of another job is marked **borderline**.

## Sources and commits

| Repository | Stars | Commit read | Commit date | SKILL.md files |
| --- | --- | --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills) | 306,081 | `59db609` | 2026-10-27 | 38 |
| [cursor/plugins](https://github.com/cursor/plugins) (`pstack/`, author Lauren Tan) | 14,525 | `1ba91fc` | 2026-10-29 | 173 (whole repo) |
| [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) (pstack port) | 3,595 | `190fc9a` | 2026-10-28 | 67 |
| [poteto/verification-skill-example](https://github.com/poteto/verification-skill-example) | 177 | `d5abe70` | 2026-07-30 | 1 |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 111,564 | `eb07f19` | 2026-10-29 | 25 |
| [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | 3,006 | `afa8da9` | 2026-08-24 | 6 |
| [anthropics/skills](https://github.com/anthropics/skills) | 184,621 | `ca45fc4` | 2026-10-28 | 20 |
| [obra/superpowers](https://github.com/obra/superpowers) | 307,812 | `2ce8aa1` | 2026-10-21 | 15 |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 33,186 | `1a2c79d` | 2026-10-27 | 9 |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | 40,541 | `b6483db` | (HEAD on 2026-10-29) | 466 |
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 28,941 | `0496583` | (HEAD on 2026-10-29) | 468 |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) (the `npx skills` CLI) | 37,084 | `92a9a34` | (HEAD on 2026-10-29) | 3 |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 93,873 | `5e745ac` | (HEAD on 2026-10-29) | 1 skill, copied per harness |
| [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills) | 12,124 | `143243c` | (HEAD on 2026-10-29) | 67 |
| [cloudflare/skills](https://github.com/cloudflare/skills) | 3,202 | `49a31e0` | (HEAD on 2026-10-29) | 19 |

Where pstack lives: `github.com/poteto` has no public pstack repository. The plugin manifest at [`cursor/plugins/pstack/.cursor-plugin/plugin.json`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/.cursor-plugin/plugin.json) names `"author": {"name": "Lauren Tan"}`, so `cursor/plugins/pstack/` is treated as the upstream. `cursor/plugins` also ships a generated Claude Code build at [`harness/pstack/claude-code/`](https://github.com/cursor/plugins/tree/1ba91fc25c0977741dd0e267849e6234b037ed0a/harness/pstack). The pstack installed on this machine comes from the third-party port `michael-denyer/pstack-claude`. Its README says that it is a port of Lauren Tan's pstack for Claude Code, Codex and other harnesses.

## Matt Pocock: mattpocock/skills @ `59db609`

Base URL: `https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/`

| Skill | Path | What it sets up (frontmatter) | What it touches | Harness |
| --- | --- | --- | --- | --- |
| [`setup-matt-pocock-skills`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/setup-matt-pocock-skills/SKILL.md) | `skills/engineering/` | "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills." | Adds an `## Agent skills` block to `CLAUDE.md` or `AGENTS.md`, editing whichever exists. Writes `docs/agents/issue-tracker.md`, `domain.md` and `triage-labels.md` from seed templates for GitHub, GitLab or local `.scratch/`. Can run `git init` and `git remote add`, and runs `gh label create` or `glab label create`. Offers to `git mv` the legacy `CONTEXT.md` to `GLOSSARY.md`. | Generic (`CLAUDE.md` or `AGENTS.md`). `disable-model-invocation: true` |
| [`setup-pre-commit`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/setup-pre-commit/SKILL.md) | `skills/misc/` | "Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo." | Installs `husky`, `lint-staged` and `prettier` as devDependencies. Runs `npx husky init`. Writes `.husky/pre-commit`, `.lintstagedrc`, and `.prettierrc` when no Prettier config exists. Commits the result, which also tests the new hook. | Repo git hooks, any agent |
| [`git-guardrails-claude-code`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/git-guardrails-claude-code/SKILL.md) | `skills/misc/` | "Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute." | Copies the bundled [`scripts/block-dangerous-git.sh`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/git-guardrails-claude-code/scripts/block-dangerous-git.sh) to `.claude/hooks/` or `~/.claude/hooks/`. Merges a `PreToolUse` hook with a `Bash` matcher into `.claude/settings.json` or `~/.claude/settings.json`. | Claude Code |
| [`setup-ts-deep-modules`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/in-progress/setup-ts-deep-modules/SKILL.md) (in progress) | `skills/in-progress/` | "Wire dependency-cruiser into a TypeScript repo so each package is a deep module, with implementation hidden in subfolders and reachable only through its entry-point files." | Installs `dependency-cruiser`. Writes `.dependency-cruiser.cjs` from a bundled config, and merges into an existing config instead of overwriting it. Adds a `lint:boundaries` script to the umbrella check. Scaffolds `<packages-root>/example/` and a packages `README.md`, and adds a one-line pointer to `CLAUDE.md` or `AGENTS.md`. | Generic. `disable-model-invocation: true` |
| [`scaffold-exercises`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/scaffold-exercises/SKILL.md) | `skills/misc/` | "Create exercise directory structures with sections, problems, solutions, and explainers that pass linting." | Creates `exercises/XX-section/XX.YY-name/{problem,solution,explainer}/readme.md`. Checks the result with `pnpm ai-hero-cli internal lint`, then commits. Specific to his course repositories. | Generic |
| [`migrate-to-shoehorn`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/migrate-to-shoehorn/SKILL.md) (borderline) | `skills/misc/` | "Migrate test files from `as` type assertions to @total-typescript/shoehorn." | A migration rather than a setup. Its checklist includes `npm i @total-typescript/shoehorn`. | Generic |

Notes:

- [`skills/misc/README.md`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/README.md) calls the `misc/` skills "Tools I keep around but rarely use, not promoted in the plugin." Of the setup skills, only `setup-matt-pocock-skills` is in the promoted `engineering/` set.
- Each skill folder has an `agents/openai.yaml` with a display name for Codex, for example in [`setup-pre-commit`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/misc/setup-pre-commit/agents/openai.yaml). The skills target several harnesses.
- This repository (`imsus/skills`) already contains the output of `setup-matt-pocock-skills`: the `## Agent skills` block in `CLAUDE.md` and the files under `docs/agents/`.

## poteto (Lauren Tan): pstack

### Upstream: cursor/plugins/pstack @ `1ba91fc`

| Skill | Path | What it sets up (frontmatter) | What it touches | Harness |
| --- | --- | --- | --- | --- |
| [`setup-pstack`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/skills/setup-pstack/SKILL.md) | `pstack/skills/` | "Configure which models pstack uses per role and at what reasoning budget. Detects your available models and writes an always-applied rule that overrides the skill defaults." | Writes `~/.cursor/rules/pstack-models.mdc` with `alwaysApply: true`, a `# budget` line and one line per role. Overwrites the whole file "so re-runs stay idempotent". At the end it offers, once each, `/create-verification-skill` and `/create-formal-verification-skill`. | Cursor. The generated [Claude Code build](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/harness/pstack/claude-code/skills/setup-pstack/SKILL.md) keeps the Cursor `.mdc` path and adds a pointer to a Claude Code adapter doc. |
| [`create-verification-skill`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/skills/create-verification-skill/SKILL.md) | `pstack/skills/` | "Generate a project-local verification skill that drives your app the way a user does — any language, framework, or platform." | Writes `.cursor/skills/verify-<app>/SKILL.md` with Launch, Doctor, Drive, Evidence, Cleanup and Helpers sections. Seeds `features/README.md` plus 3 to 5 feature files. Must run the generated skill end to end once before handing it over. A worked example is [poteto/verification-skill-example](https://github.com/poteto/verification-skill-example/blob/d5abe70d0d8c671672b6cef4069363f26c488feb/.cursor/skills/verify-atlas/SKILL.md). | Cursor (`.cursor/skills/`). `disable-model-invocation: true` |
| [`create-formal-verification-skill`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/skills/create-formal-verification-skill/SKILL.md) | `pstack/skills/` | "Generate a project-local skill that formally verifies the code where a bug costs the most and tests reach the least, in any language, with whichever verification tool fits." | Writes a project-local verify skill around a model checker or prover (TLA+ by default for ordering bugs). Records a coverage list and a sync commit. Must show the check catching a deliberately broken variant. | Cursor. `disable-model-invocation: true` |
| [`setup-benny`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/automations/benny/skills/setup-benny/SKILL.md) | `pstack/automations/benny/skills/` | "Configure Benny and prepare its triage and repro automations. Use when installing Benny or changing its Slack, tracker, repository, routing, control, model, or budget settings." | Merges the pack into `<repo>/.cursor/automations/benny/` and keeps files that exist only in the destination. Merges `plugins.pstack.enabled` into `.cursor/settings.json`, keeping JSONC comments. Creates user-owned config outside the pack. Checks from a fresh agent that the shared pstack skills load at project scope. Never creates an automation unless the user asks explicitly. | Cursor automations. Not a slash skill: `FOR_AGENTS.md` loads it. |

Borderline, not counted: [`poteto-help`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/skills/poteto-help/SKILL.md) ("Guides users through pstack setup…") is a help guide. `maintain-verification-skill` maintains a skill that already exists.

### Port: michael-denyer/pstack-claude @ `190fc9a` (the version installed here)

| Skill | What changes from upstream | Link |
| --- | --- | --- |
| `setup-pstack` | Frontmatter: "Configure which models pstack uses per role. Detects available models and writes the current runtime's override sheet. Use for … turning the SessionStart hook on or off." Writes `<config>/pstack-models.md`, where `<config>` is `$CLAUDE_CONFIG_DIR` or `~/.claude`, and adds an `@<config>/pstack-models.md` line to `CLAUDE.md` when that line is missing. Adds `default effort` and `session hook: on/off` lines. A table maps the sheet path and how it loads for Codex, Pi, Copilot, Muse, opencode and Gemini CLI, and marks each row "verified live", "hook contract tested" or "from published docs, no live session". | [SKILL.md](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/skills/setup-pstack/SKILL.md) |
| `create-verification-skill` | Writes `.claude/skills/verify/` (named `verify`) so it replaces Claude Code's bundled `/verify`, which only the user can run. In a monorepo it writes into the package directory. | [SKILL.md](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/skills/create-verification-skill/SKILL.md) |
| `create-formal-verification-skill` | Same job as upstream, adapted to Claude Code. | [SKILL.md](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/skills/create-formal-verification-skill/SKILL.md) |

## Addy Osmani: addyosmani/agent-skills @ `eb07f19`

There is no skill named `setup-*` or `init-*`. Three skills set things up. Two of them only give guidance and templates.

| Skill | What it sets up (frontmatter) | What it touches | Kind | Harness |
| --- | --- | --- | --- | --- |
| [`constraint-driven-development`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/constraint-driven-development/SKILL.md) | "Establishes a project's quality bar as a written contract … records everything in CONSTRAINTS.md … Use when … the user says 'set up constraints' or 'define our standards'…" | Step 1, "Detect before you ask", reads CI and the harness (`.claude/`, `.codex/`, `AGENTS.md`). Asks four questions, each with a default. Writes `CONSTRAINTS.md` and adds one line to both `AGENTS.md` and `CLAUDE.md`. Installs the standard tool for each chosen dimension, for example `@vitest/coverage-v8`. Adds `check:fast`, `check:task` and `check:full` scripts and maps them to `/build`, `/test`, `/review` and `/ship`. | Does the setup | Generic. Exposed as the [`/constraints`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/.claude/commands/constraints.md) command. |
| [`ci-cd-and-automation`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/ci-cd-and-automation/SKILL.md) | "Automates CI/CD pipeline setup. Use when setting up or modifying build and deployment pipelines." | Templates for `.github/workflows/ci.yml` (base, database and E2E variants), `.github/dependabot.yml`, preview deploys and rollback workflows. | Guidance | Generic |
| [`context-engineering`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/context-engineering/SKILL.md) | "Optimizes agent context setup. Use when starting a new session … or when you need to configure rules files and context for a project." | A template for `CLAUDE.md`, with pointers to `.cursorrules`, `.cursor/rules/*.md` and `AGENTS.md`. | Guidance | Generic |

[addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills) @ `afa8da9` has six audit skills and no setup skill.

## Other popular collections

### anthropics/skills @ `ca45fc4`

No strict setup skill. Borderline:

| Skill | Why it is borderline |
| --- | --- |
| [`web-artifacts-builder`](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/web-artifacts-builder/SKILL.md) | Step 1 runs `scripts/init-artifact.sh <project-name>` to scaffold a React, Tailwind and shadcn/ui project, but the job is building a claude.ai artifact. |
| [`skill-creator`](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/skill-creator/SKILL.md) | "Create new skills, modify and improve existing skills…" Like pstack's `create-*-skill`, it writes a skill, but a general-purpose one rather than a project-specific one. |

### obra/superpowers @ `2ce8aa1`

No strict setup skill. Borderline: [`using-git-worktrees`](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/skills/using-git-worktrees/SKILL.md) ("ensures an isolated workspace exists"). "Step 0: Detect Existing Isolation" checks whether you are already in a worktree. Before it creates one in the project, it checks that the worktree directory is gitignored, and if not, adds it to `.gitignore` and commits. "Step 2: Project Setup" then detects the stack and runs `npm install`, `cargo build`, `pip install` or `poetry install`. Most of superpowers' own bootstrap is in the plugin's SessionStart hook, not in a skill. That hook was not read for this note.

### vercel-labs/agent-skills @ `1a2c79d`

| Skill | Summary | Touches | Kind |
| --- | --- | --- | --- |
| [`vercel-cli-with-tokens`](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/vercel-cli-with-tokens/SKILL.md) | "Deploy and manage projects on Vercel using token-based authentication … e.g. … 'set up vercel', 'add environment variables to vercel'." | Finds `VERCEL_TOKEN` in the environment or `.env` and exports it rather than passing `--token`. Reads `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` so it can skip `vercel link`. | Partly setup |
| [`deploy-to-vercel`](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/deploy-to-vercel/SKILL.md) (borderline) | "Deploy applications and websites to Vercel." | Detects linking from `.vercel/project.json` or `.vercel/repo.json`. Warns not to run `vercel link` or `vercel ls` to probe an unlinked directory, because they prompt or link as a side effect. | Deploy |

[vercel-labs/skills](https://github.com/vercel-labs/skills/tree/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/skills) (the `npx skills` CLI) has one public skill, `find-skills`, which is not a setup skill.

### github/awesome-copilot @ `b6483db`

I scanned all 466 skills by folder name and by description keywords. The skills that set up the agent harness or a repository for agents:

| Skill | Summary (frontmatter) | Touches | Read depth |
| --- | --- | --- | --- |
| [`lsp-setup`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/lsp-setup/SKILL.md) | "…installing and configuring an LSP server for Copilot CLI. Detects the OS, installs the right server, and generates the JSON configuration (user-level or repo-level)." | `~/.copilot/lsp-config.json` or `.github/lsp.json`. "If the config file already exists, read it first and merge — do not clobber." Checks the binary with `which`. | Full |
| [`ai-ready`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/ai-ready/SKILL.md) | "Make any repo AI-ready — … generates AGENTS.md, copilot-instructions.md, CI workflows, issue templates…" | A thin wrapper that installs the full skill from `johnpapa/ai-ready` after the user reviews it. That upstream skill was not read. | Full (the wrapper only) |
| [`create-agentsmd`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/create-agentsmd/SKILL.md) | "Prompt for generating an AGENTS.md file for a repository" | Root `AGENTS.md`, following agents.md | Skimmed |
| [`acreadiness-generate-instructions`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/acreadiness-generate-instructions/SKILL.md) | "Generate tailored AI agent instruction files via AgentRC … `.github/copilot-instructions.md` … plus optional per-area `.instructions.md`…" | Runs a `--dry-run` first and writes for real only after confirmation, using `--force` when the files already exist. Reads `agentrc.config.json`. | Skimmed |
| [`copilot-instructions-blueprint-generator`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/copilot-instructions-blueprint-generator/SKILL.md) | "…generator for creating comprehensive copilot-instructions.md files…" | `.github/copilot-instructions.md` | Frontmatter only |
| [`setup-my-iq`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/setup-my-iq/SKILL.md) | "Create, set up, or update the personal context portfolio…" | Personal context markdown files. Marks each file present or missing, then interviews the user with pre-filled answers to confirm. | Skimmed |
| [`roundup-setup`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/roundup-setup/SKILL.md) | "Interactive onboarding that learns your communication style … to configure personalized status briefings." | Config for the companion `roundup` skill | Frontmatter only |

Setup skills for a specific stack (frontmatter only): [`aws-cdk-python-setup`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/aws-cdk-python-setup/SKILL.md), [`power-apps-code-app-scaffold`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/power-apps-code-app-scaffold/SKILL.md), [`create-quarkus-project`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/create-quarkus-project/SKILL.md), [`markstream-install`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/markstream-install/SKILL.md), [`qdrant-monitoring/setup`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/qdrant-monitoring/setup/SKILL.md), [`sandbox-npm-install`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/sandbox-npm-install/SKILL.md), [`scaffolding-oracle-to-postgres-migration-test-project`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/scaffolding-oracle-to-postgres-migration-test-project/SKILL.md). Guides for configuring a GitHub feature: [`dependabot`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/dependabot/SKILL.md) and [`secret-scanning`](https://github.com/github/awesome-copilot/blob/b6483db44fb602654bca6a097185fcaddb305f97/skills/secret-scanning/SKILL.md).

### alirezarezvani/claude-skills @ `0496583`

Matched by folder name only. I did not scan the 468 descriptions.

| Skill | Summary (frontmatter) | Read depth |
| --- | --- | --- |
| [`pw-init`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/engineering-team/playwright-pro/skills/pw-init/SKILL.md) | "Set up Playwright in a project." Detects the framework and writes the config, folders, an example test, and `playwright.yml` when `.github/workflows/` exists (or a stage in `.gitlab-ci.yml`). | Skimmed |
| [`autoresearch-agent/skills/setup`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/engineering/autoresearch-agent/skills/setup/SKILL.md) | "Set up a new autoresearch experiment interactively. Collects domain, target file, eval command, metric, direction, and evaluator." | Frontmatter only |
| [`hub-init`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/engineering/agenthub/skills/hub-init/SKILL.md) | "Create a new AgentHub collaboration session with task, agent count, and evaluation criteria." | Frontmatter only |
| [`cs-onboard`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/c-level-advisor/skills/cs-onboard/SKILL.md) and [`onboard`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/c-level-agents/skills/onboard/SKILL.md) | A founder interview that writes `~/.claude/company-context.md`, which the other skills read. | Frontmatter only |
| [`inbox-setup`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/productivity/email/skills/inbox-setup/SKILL.md) | "One-time setup skill that builds a personalized inbox triage knowledge base via interactive interview … using grill-me discipline…" | Frontmatter only |
| [`saas-scaffolder`](https://github.com/alirezarezvani/claude-skills/blob/0496583603e56cdd5022dd61c823bd784a80a752/product-team/skills/saas-scaffolder/SKILL.md) | Generates a Next.js, Drizzle and Stripe SaaS boilerplate. | Frontmatter only |

Not read: `.gemini/skills/wiki-init/SKILL.md` is a symlink to `../../../commands/wiki-init.md`, and the raw fetch returned the link target as text.

### cursor/plugins, plugins other than pstack (frontmatter only)

- [`create-plugin-scaffold`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/create-plugin/skills/create-plugin-scaffold/SKILL.md): "Create a new Cursor plugin scaffold with a valid manifest, component directories, and marketplace wiring."
- [`tailscale-setup`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/third_party/tailscale/skills/tailscale-setup/SKILL.md): connects Grok Bot to a tailnet.
- [`debug-voice`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/grok-voice/skills/debug-voice/SKILL.md): "Proposes a plan, then installs a dev-only log pipeline … in the app's own language and conventions."

### Checked, no setup skills

pbakaus/impeccable (one `impeccable` skill, copied into a folder for each of about 20 harnesses), Jeffallan/claude-skills (67 role skills such as `react-expert`), and cloudflare/skills (product-reference skills).

## Counts

| Source | Setup skills (strict) | Borderline or guidance |
| --- | --- | --- |
| Matt Pocock (mattpocock/skills) | 5: `setup-matt-pocock-skills`, `setup-pre-commit`, `git-guardrails-claude-code`, `setup-ts-deep-modules`, `scaffold-exercises` | 1: `migrate-to-shoehorn` |
| poteto pstack (cursor/plugins upstream) | 4: `setup-pstack`, `create-verification-skill`, `create-formal-verification-skill`, `setup-benny` | 1: `poteto-help` |
| pstack port (michael-denyer/pstack-claude) | 3, the ported versions of the first three above | — |
| Addy Osmani (agent-skills + web-quality-skills) | 1: `constraint-driven-development` | 2 guidance: `ci-cd-and-automation`, `context-engineering` |
| anthropics/skills | 0 | 2: `web-artifacts-builder`, `skill-creator` |
| obra/superpowers | 0 | 1: `using-git-worktrees` |
| vercel-labs/agent-skills | 1 (partial): `vercel-cli-with-tokens` | 1: `deploy-to-vercel` |
| github/awesome-copilot | 7 for the harness or repo + 7 for a specific stack | 2 guidance: `dependabot`, `secret-scanning` |
| alirezarezvani/claude-skills | 7 (matched by name) | — |
| cursor/plugins (plugins other than pstack) | 3 | — |

## Patterns across the collections

### Detecting existing setup

- **Read the repo before asking the user.** pstack `create-verification-skill` says "Interview the repo, not the user". Addy's `constraint-driven-development` step is "Detect before you ask: Never ask what you can read." `setup-matt-pocock-skills` explores `git remote`, `CLAUDE.md`/`AGENTS.md`, `docs/agents/`, `.scratch/`, monorepo markers, and whether the `triage` skill is installed.
- **Detect the package manager from lockfiles.** Both `setup-pre-commit` and `setup-ts-deep-modules` map `pnpm-lock.yaml`, `yarn.lock` and `bun.lockb` to a package manager and fall back to npm.
- **Detect a skill another skill depends on.** `setup-matt-pocock-skills` skips its triage-labels section when `triage` is not installed. `setup-pstack` offers `/create-verification-skill` only when no `verify-*` skill or harness exists.
- **Detect without side effects.** `deploy-to-vercel` names the commands that would change state while you probe, and limits itself to `vercel whoami` and reading `.vercel/*.json`.

### Idempotency and re-runs

- **Overwrite the whole file you own.** `setup-pstack` (both versions): "Overwrite the whole file so re-runs stay idempotent." This is safe because the skill owns the sheet.
- **Update a section in place in a shared file.** `setup-matt-pocock-skills`: "If an `## Agent skills` block already exists … update its contents in-place rather than appending a duplicate."
- **Merge into config shared with other tools.** `git-guardrails-claude-code` merges into `hooks.PreToolUse`. `setup-benny` changes only `plugins.pstack.enabled` and keeps JSONC comments. `lsp-setup` says "read it first and merge — do not clobber". `setup-ts-deep-modules` merges rules into an existing `.dependency-cruiser.*`.
- **Create only when missing.** `setup-pre-commit` writes `.prettierrc` only if no Prettier config exists.
- **Keep the config the user owns apart from the files the pack owns.** `setup-benny` keeps user config outside the copied pack, so a refresh can update the pack without touching it.
- **Re-runs migrate old state.** `setup-pstack` drops lines for retired roles and rewrites old `claude-*` model IDs to family names. `setup-matt-pocock-skills` offers to `git mv CONTEXT.md GLOSSARY.md`.

### Asking versus going ahead

- **One question at a time, with the recommended answer first**: `setup-matt-pocock-skills` ("Lead each section with the recommended answer so the user can accept it in a word") and `constraint-driven-development` (four questions, each with a stated default and a guess).
- **Ask only when the choice branches.** `setup-matt-pocock-skills` writes the single-context layout without asking and offers multi-context only when it finds monorepo signals.
- **Show a draft before writing.** `setup-matt-pocock-skills` and `acreadiness-generate-instructions` (`--dry-run`, then confirm).
- **Ask always for the scope of a change to harness config**: `git-guardrails-claude-code` (project or global), `lsp-setup` (user or repo), `setup-pstack` port (user or project `CLAUDE.md`).
- **Never pick the rules file for the user.** If neither `CLAUDE.md` nor `AGENTS.md` exists, `setup-matt-pocock-skills` asks which to create. In contrast, `setup-ts-deep-modules` creates `AGENTS.md` without asking.
- **Make the user invoke it.** Most of the setup skills by Matt and poteto set `disable-model-invocation: true`, so the agent never starts a setup on its own.
- **Gate anything irreversible.** `setup-benny`: "Do not create or update an automation until the user explicitly asks." It also says not to commit unless asked.

### Hooks versus docs

- **Hooks and scripts**: `git-guardrails-claude-code` (Claude Code `PreToolUse`), `setup-pre-commit` (git pre-commit), and `setup-ts-deep-modules` (a lint script in the umbrella check). These are enforced, not advisory.
- **Docs that skills read**: `setup-matt-pocock-skills` writes `docs/agents/*.md` and a pointer block. `constraint-driven-development` writes `CONSTRAINTS.md` plus a one-line pointer. `setup-ts-deep-modules` adds a one-line pointer to the packages README. The common shape is a short pointer in `CLAUDE.md`/`AGENTS.md` and the detail in a separate file.
- **Config loaded through the harness**: `setup-pstack` writes a Cursor `alwaysApply` rule, or a sheet that `@` includes in `CLAUDE.md` and a plugin SessionStart hook reads.
- **Generated project skills**: `create-verification-skill` and `create-formal-verification-skill` write a new project-local skill instead of a config file.

### Proving the setup works

- `setup-ts-deep-modules` makes the check pass, adds a deep import so it fails, then reverts so it passes again.
- `create-verification-skill` runs the generated skill end to end and confirms that cleanup does not delete the evidence. `create-formal-verification-skill` shows the check failing on a deliberately broken variant.
- `git-guardrails-claude-code` pipes a fake `git push` payload into the hook and expects exit code 2.
- `setup-pre-commit` makes its final commit through the new hook as a smoke test.
- `setup-benny` checks from a fresh agent that the project-scope plugin resolves.
- `setup-pstack` (port) labels each runtime row by how it was verified.

## Gaps and ideas for imsus/skills

These are my suggestions, not findings from the sources.

1. **No collection has a setup skill for installing a skill collection itself.** Matt's skill configures the repo for his skills. pstack's configures models. None checks which of the collection's skills are installed, at which version, or how far a local copy has drifted. A setup or doctor skill for this repo could read the `UPSTREAM.md` files, report drift, and install categories with `npx skills add`. The vocabulary already exists in `GLOSSARY.md` (fork, upstream, drift).
2. **`git-guardrails-claude-code` has no idempotency check.** It merges into `PreToolUse` but never checks whether the same hook is already registered, so running it twice can add the hook twice. Its pattern list is matched with `grep -qE` against the whole command string, so `echo "git push"` is blocked too. A fork could add a duplicate check and match on parsed tokens.
3. **`setup-pre-commit` assumes npm, Husky and Prettier.** This repo uses Bun and already has a tracked pre-commit hook that runs `verify` (commit `e363618`). A fork could detect an existing hook manager first (`.husky/`, `lefthook.yml`, `.pre-commit-config.yaml`, `core.hooksPath`) and wire the repo's own `verify` script instead of installing a new stack.
4. **Treat "detect, propose, confirm, merge, prove" as a shared shape.** Each skill above uses some of these steps and none uses all of them. A short shared reference, or a checklist in `writing-for-agents`, could require each setup skill in this repo to state:
   - its detection step;
   - the files it owns and the files it merges into;
   - its re-run behaviour;
   - its proof step.
   A `check` rule could then lint for those sections.
5. **Generate project skills, as pstack does.** The `create-*-skill` pattern, which writes a project-local skill grounded in the repo and runs it once before handing over, is the strongest pattern found. Candidates for this repo: a generator for a project `verify` skill for Bun and Effect projects, or for this repo's `check` and `manifest` workflow.
6. **Cover more than one harness.** Only the pstack port maps one setup across Claude Code, Codex, Pi, Copilot, Muse, opencode and Gemini CLI. This repo installs through both `npx skills` and Claude Code plugins, so any setup skill should say which harness paths it writes (for example `.claude/settings.json` versus `AGENTS.md`), as the port's table does.
7. **Make setup skills user-only.** Most setup skills by Matt and poteto set `disable-model-invocation: true`. Adopting that for setup skills here stops the model from reconfiguring a repo on its own.

## Not verified or not accessed

- No `github.com/poteto` repository holds pstack. The upstream used here is `cursor/plugins/pstack`, identified through the plugin manifest's author field.
- I did not search the skills.sh registry web index. I checked only its CLI repository, vercel-labs/skills.
- For alirezarezvani/claude-skills I scanned folder names only, not all 468 descriptions. Its `wiki-init` is a symlink that I did not resolve.
- For the awesome-copilot and alirezarezvani rows marked "Frontmatter only", only the frontmatter was read. The bodies were not checked.
- I did not read the upstream `johnpapa/ai-ready` skill, which the awesome-copilot `ai-ready` wrapper installs.
- I did not read obra/superpowers' SessionStart hook, which handles its bootstrap outside any skill.
- I did not read Addy's [`hooks/`](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/hooks) directory (`SDD-CACHE.md`, `SIMPLIFY-IGNORE.md`).
