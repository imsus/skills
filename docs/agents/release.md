<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# Release

- **Scheme**: semver per category, in `skills/<category>/category.json` `version`; `bun run manifest` writes it into `.claude-plugin/marketplace.json`. **Current**: meta `0.1.0`. No git tags.
- **Changelog**: `skills/<category>/CHANGELOG.md`, hand-written; changes go under `## Unreleased`.
- **How**: merge to `main`; steps: bump `version` in `category.json`, rename `## Unreleased` to the version, run `bun run manifest`, merge the PR.
- **Publishes to**: the `imsus` Claude Code plugin marketplace and `npx skills add imsus/skills`, both read from `main`.
