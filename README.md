# imsus/skills

A curated collection of agent skills: my own skills, plus forks of other authors' skills. Install it with `npx skills add imsus/skills`, or as Claude Code plugins.

Terms (skill, own skill, fork, upstream, drift, category) are defined in [GLOSSARY.md](GLOSSARY.md). The reasons for the `imsus-` prefix and for mapping categories to plugins are in [ADR-0001](docs/adr/0001-prefix-every-skill-and-categories-as-plugins.md).

## Layout

```
skills/<category>/imsus-<name>/SKILL.md
```

- Every skill folder name starts with `imsus-` and equals the `name` in its `SKILL.md` frontmatter.
- A skill that contains `UPSTREAM.md` is a fork. It also holds its upstream's `LICENSE`.
- Each category folder holds a `category.json` (see below) and a `CHANGELOG.md`.

### Category metadata and changelog

`skills/<category>/category.json`:

```json
{
  "description": "What this category's plugin contains.",
  "version": "1.0.0"
}
```

`description` is the plugin description. `version` is the category's semver and becomes the plugin version.

`skills/<category>/CHANGELOG.md` records the category's changes per version. `check` fails a category that has no `CHANGELOG.md`.

## Tooling

Requires [Bun](https://bun.sh).

```
bun install
bun run verify             # typecheck, tests, check and manifest --check
bun run src/cli.ts check   # validate the repo only (also: bun run check)
bun test
```

`bun run verify` is the one local command that matches CI. CI runs it (typecheck, `bun test`, `check` and `manifest --check`) on every push and pull request.

### Extending the CLI

- The CLI has three subcommands: `check`, `manifest` and `drift`. To add one, add `src/commands/<name>.ts` exporting `command` (see `src/command.ts`). It is discovered automatically.
- Standalone tooling that is not a subcommand (such as the drift issue sync) lives in `scripts/`.
- New check rule: add `src/check/rules/<name>.ts` exporting `rule` (see `src/check/rule.ts`). It is discovered automatically.
- Repo reader: `src/repo.ts` (`readRepo`, `allSkills`), an Effect that needs the `RepoFs` service. Test trees: `test/helpers/tree.ts` (`buildTree`, `runCli`); test layers: `test/helpers/layers.ts`. The code follows `docs/adr/0002-effect-and-design-thinking.md`.

## Own skills and forks

An **own skill** is written from scratch. A **fork** is copied from another author's repository and then changed. A skill folder that contains `UPSTREAM.md` is a fork; one without it is an own skill.

`UPSTREAM.md` starts with frontmatter, followed by free-form prose about what was changed:

```markdown
---
repo: owner/name
path: skills/some-skill
sha: 0123456789abcdef0123456789abcdef01234567
---

What I changed and why.
```

| Field  | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `repo` | Upstream repository, `owner/name`                          |
| `path` | Path of the skill folder within that repository            |
| `sha`  | Full 40-character hex commit SHA copied from (either case; stored lowercase) |

`check` fails a fork whose `UPSTREAM.md` is missing any field or has a malformed `repo` or `sha`, and a fork that lacks a `LICENSE` file in its folder.

### Licensing split

Own skills are covered by the root MIT [LICENSE](LICENSE) and carry no license file of their own. A fork must carry its upstream's `LICENSE` in its own folder, and that license governs it.

## Drift

`bun run src/cli.ts drift` reports, for each fork, whether its upstream has a commit touching the forked path after the recorded SHA: `up to date`, `drifted` (with a GitHub compare URL), or `unreachable`. The recorded SHA is usually the upstream HEAD at copy time, not the last commit touching the path, so drift asks GitHub's compare API: the fork is drifted when the path's latest commit is `ahead` of (or `diverged` from) the recorded SHA, and up to date when it is `identical` or `behind`. A fork whose `UPSTREAM.md` is invalid is skipped with a warning on stderr; run `check` for details. It exits 0 whenever the report completes. Set `GITHUB_TOKEN` to avoid API rate limits. `drift --json` prints an array with `skill`, `category`, `path`, `upstreamRepo`, `upstreamPath`, `outcome` (`up-to-date` | `drifted` | `unreachable`), `recordedSha`, `latestSha`, `compareUrl` and `error` per fork.

### Drift workflow

`.github/workflows/drift.yml` runs weekly and on manual dispatch (`workflow_dispatch`). It runs `drift --json`, then `scripts/drift-issues.ts` (`bun run scripts/drift-issues.ts <drift.json>`, not a CLI subcommand) opens one issue per drifted or unreachable fork, titled `Drift: <category>/<skill>` and labelled `drift`. If an open issue with that title exists, it updates the body (latest compare URL) instead of opening a duplicate. It never changes files, merges, or closes issues, and has only `contents: read` and `issues: write`.

## Install

Two routes, one tree.

### With `npx skills`

```
npx skills add imsus/skills
```

### As Claude Code plugins

```
/plugin marketplace add imsus/skills
/plugin install <category>@imsus
```

Each category is one plugin, listed in `.claude-plugin/marketplace.json`.

### The marketplace manifest

`.claude-plugin/marketplace.json` is generated from the folder tree. Do not edit it by hand.

```
bun run manifest                        # regenerate
bun run src/cli.ts manifest --check     # exit non-zero if stale (CI runs this)
```

A category whose `category.json` is missing or unreadable gets no plugin until `check` is clean.

## Versioning

Each category is versioned independently with semver, in its `category.json`. That version is the plugin version.

- Major: renaming or removing a skill (see [ADR-0001](docs/adr/0001-prefix-every-skill-and-categories-as-plugins.md)).
- Minor: adding a skill, or a backwards-compatible change to one.
- Patch: fixes and wording changes.

Regenerate the manifest after any bump.

## License

MIT for my own skills (see [LICENSE](LICENSE)). Forks keep their upstream's license.
