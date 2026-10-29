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
| `sha`  | Full 40-character lowercase hex commit SHA copied from     |

`check` fails a fork whose `UPSTREAM.md` is missing any field or has a malformed `repo` or `sha`, and a fork that lacks a `LICENSE` file in its folder.

### Licensing split

Own skills are covered by the root MIT [LICENSE](LICENSE) and carry no license file of their own. A fork must carry its upstream's `LICENSE` in its own folder, and that license governs it.

## License

MIT for my own skills (see [LICENSE](LICENSE)). Forks keep their upstream's license.
