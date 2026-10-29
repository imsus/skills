# imsus/skills

A curated collection of agent skills: my own skills, plus forks of other authors' skills. Install it with `npx skills add imsus/skills`, or as Claude Code plugins.

Terms (skill, own skill, fork, upstream, drift, category) are defined in [GLOSSARY.md](GLOSSARY.md). The reasons for the `imsus-` prefix and for mapping categories to plugins are in [ADR-0001](docs/adr/0001-prefix-every-skill-and-categories-as-plugins.md).

## Layout

```
skills/<category>/imsus-<name>/SKILL.md
```

- Every skill folder name starts with `imsus-` and equals the `name` in its `SKILL.md` frontmatter.
- A skill that contains `UPSTREAM.md` is a fork. It also holds its upstream's `LICENSE`.
- Each category folder holds a `category.json` (see below).

### Category metadata

`skills/<category>/category.json`:

```json
{
  "description": "What this category's plugin contains.",
  "version": "1.0.0"
}
```

`description` is the plugin description. `version` is the category's semver and becomes the plugin version.

## Tooling

Requires [Bun](https://bun.sh).

```
bun install
bun run src/cli.ts check   # validate the repo (also: bun run check)
bun test
```

CI runs `check` and `bun test` on every push and pull request.

### Extending the CLI

- New subcommand: add `src/commands/<name>.ts` exporting `command` (see `src/command.ts`). It is discovered automatically.
- New check rule: add `src/check/rules/<name>.ts` exporting `rule` (see `src/check/rule.ts`). It is discovered automatically.
- Repo reader: `src/repo.ts` (`readRepo`). Test trees: `test/helpers/tree.ts` (`buildTree`, `runCli`).

## License

MIT for my own skills (see [LICENSE](LICENSE)). Forks keep their upstream's license.

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
