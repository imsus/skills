# Detection signals

What to read, per profile topic, before asking anything. Every command here is read-only. A signal is evidence, not a verdict: two signals that disagree become a question.

## Project kind

| Signal | Reads as |
| --- | --- |
| No commits and no manifest (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, ...) | empty repo: the only case where a starting stack is suggested |
| `workspaces` in `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, populated `packages/*` or `apps/*` | monorepo |
| `bin` in `package.json`, `[[bin]]` in `Cargo.toml`, `cmd/` in Go | CLI |
| `exports`/`main` with no app framework, a `publishConfig`, `"private"` absent | library |
| App framework dependency (next, vite, remix, astro, expo, react-native, sveltekit, nuxt, rails, django) | app |
| Under ~20 commits, no CI, no tests | prototype |
| `git shortlog -sn --since=6.months HEAD` lists more than one author, or `CODEOWNERS` exists | team; else solo |

Language and framework come from the manifest's dependencies. Package manager from the lockfile: `bun.lock`/`bun.lockb` bun, `pnpm-lock.yaml` pnpm, `yarn.lock` yarn, `package-lock.json` npm; `packageManager` in `package.json` wins over all. No lockfile: read the scripts (`bun test`, `pnpm`) and types (`@types/bun`), and confirm.

## Working style

| Signal | Reads as |
| --- | --- |
| Test files change in the same commits as source (`git log --stat -30`), a `tdd` skill installed | test-first likely |
| `docs/adr/`, `GLOSSARY.md`, specs in the tracker (`gh issue list --search "Spec" --state all --limit 10`) | spec-first |
| `git log --shortstat -30`: median lines changed per commit | small (under ~150) or large changes |

Working style is the least readable topic: confirm it with one question even when the signals agree.

## Tooling

| Topic | Signals |
| --- | --- |
| Test runner | `test` script, `vitest.config.*`, `jest.config.*`, `bunfig.toml` `[test]`, `pytest.ini`/`[tool.pytest]`, `*_test.go` |
| Lint / format | `biome.json(c)`, `eslint.config.*`/`.eslintrc*`, `.oxlintrc.json`, `.prettierrc*`, `ruff` in `pyproject.toml`, `rustfmt.toml` |
| Typecheck | `tsconfig.json` plus a `tsc`/`typecheck` script; `mypy`/`pyright` config |
| Pre-commit | `.husky/`, `lefthook.yml`, `.pre-commit-config.yaml`, `git config core.hooksPath` |
| Verify command | `verify`, `check` or `ci` script; else the commands CI runs, in order |
| CI | `.github/workflows/*.yml` (read the `run:` lines), `.gitlab-ci.yml`, `.circleci/config.yml` |

The verify command matches CI when every check CI runs on a pull request is also run by the verify command, in any order. Compare the `run:` lines against the script's expansion.

## Release

Changelogs anywhere (`git ls-files '*CHANGELOG*'`: a monorepo or collection may keep one per package), `.changeset/`, `release-please-config.json`, `.releaserc*`, `goreleaser.yml`, `cargo-release` config, a release workflow in CI, `git tag --sort=-creatordate | head -5` (semver `v1.2.3`, calver `2026.10`, or none), and the manifest's `version`. Unpublished app with no tags: release is "none", and that is a fine answer.

## Git flow

| Signal | Reads as |
| --- | --- |
| `git remote -v` | host (GitHub, GitLab, none) and repo slug |
| `git symbolic-ref refs/remotes/origin/HEAD`, else `main`/`master` | main branch |
| `gh pr list --state merged --limit 20` returns PRs; `git log --first-parent --oneline -30 <main>` is mostly PR merges | branch + PR |
| No PRs, history of direct commits on main | trunk |
| No PRs, but local merges of feature or integration branches on main | trunk with local branches: a mixed reading, so ask |
| Merged PRs whose base is another PR's branch | stacked PRs |
| `.git/gitbutler/` exists | GitButler |
| `gh api repos/<slug>/branches/<main>/protection` (404 means none) | protection |

Machine tools are availability, not usage: `gh extension list` showing `gh-stack`, `but --version` succeeding or a `gh-stack`/`gitbutler` skill installed make that flow cheap to offer, not the project's flow.

## Guardrails

`.claude/settings.json` and `.claude/settings.local.json` `hooks.PreToolUse`, the global `~/.claude/settings.json` hooks (read only; it is shared config), a `git-guardrails-claude-code` script under `.claude/hooks/`, `permissions.deny` entries, branch protection, a pre-commit hook, `.gitignore` covering `.env*`.

## Harness

Current harness: the detection table in [harness.md](harness.md). Harnesses the project also uses, from their config: `.claude/` or `CLAUDE.md` (Claude Code), `.codex/` or `AGENTS.md` alone (Codex), `.cursor/` (Cursor), `opencode.json`/`.opencode/` (opencode), `.gemini/` or `GEMINI.md` (Gemini), `.github/copilot-instructions.md` (Copilot). The rules file is `CLAUDE.md` if it exists, else `AGENTS.md`.

## Installed imsus skills

Available categories: the remote marketplace,

```
gh api repos/imsus/skills/contents/.claude-plugin/marketplace.json -H "Accept: application/vnd.github.raw+json"
```

read as `.plugins[] | {name, version, skills}`. When the remote lists fewer categories than [catalog.md](catalog.md), use catalog.md and note "not yet published to the marketplace" for the missing ones: their plugin line will not resolve yet, their `npx skills` line will once the skill is on the default branch.

In the imsus/skills repo itself (remote slug `imsus/skills`) the skills are source, not installs: record "source checkout" and skip this topic.

Two install routes; check both and flag a skill installed through both (**double install**: the harness loads two copies and a later update reaches only one).

| Route | Installed when | Version / update check |
| --- | --- | --- |
| Claude Code plugin | `~/.claude/plugins/installed_plugins.json` has key `<category>@imsus` with an entry of `scope` `user`, or of `scope` `project`/`local` whose `projectPath` is this repo's root | entry `version` vs the marketplace's `version` |
| `npx skills`, project | `skills-lock.json` at the repo root, or `npx skills ls --json`, lists the skill with `source` `imsus/skills` | lock `skillFolderHash` vs the remote folder's tree SHA (below) |
| `npx skills`, global | `~/.agents/.skill-lock.json` `.skills.<name>.source == "imsus/skills"`, or `npx skills ls -g --json` | same |

The lock's `skillFolderHash` is the git tree SHA of the skill folder, so an update exists when it differs from

```
gh api repos/imsus/skills/contents/<parent of skillPath> --jq '.[] | select(.name == "<skill>") | .sha'
```

`npx skills check` and `npx skills update` are writes, not reads: skills 1.7.4 answers `check` by updating every out-of-date global skill. Use them only in Apply, after the user confirms.

## Installed outside skills

For each skill in [curated-skills.md](curated-skills.md): installed when it is in your skill list, has a folder in the harness's project or user skill directory (harness.md, Skills), or appears in either lock file with `source` `mattpocock/skills`. User-only skills never appear in your skill list, so check the folders and locks.

## Workflow profile

| File | Owner |
| --- | --- |
| `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/agents/triage-labels.md`, `## Agent skills` block | setup-matt-pocock-skills |
| `docs/agents/{workflow,git,harness,stack,ci,release,guardrails}.md`, `## Workflow` block | imsus-setup |

A `## Workflow` block in the rules file, or any owned file starting with the marker line from [profile-templates.md](profile-templates.md), means this is a re-run (an interrupted first run leaves files without the block).
