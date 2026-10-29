# Prefix every skill with `imsus-` and ship each category as a plugin

Every skill in this collection, whether it's an own skill or a fork, is named `imsus-<name>`, and the folder name always equals the frontmatter `name`. Skills live under `skills/<category>/<skill>/`, and each category installs as one Claude Code plugin with its own semver version. The same tree also works with `npx skills add imsus/skills`. The prefix is deliberate even though plugins already namespace skills (`<category>:imsus-<name>`). `npx skills` installs have no namespace, so without the prefix a fork such as `tdd` would collide with the upstream skill of the same name. With it, both can be installed side by side.

## Considered Options

- **Keep upstream names and replace the upstream install:** this was rejected because users couldn't run the fork and the original together.
- **Rename only the forks:** this was rejected because own skills and forks would follow two different naming rules.

## Consequences

Renaming or removing a skill is a breaking change and needs a major version bump of its category.
