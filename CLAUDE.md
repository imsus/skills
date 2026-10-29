## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on imsus/skills (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Code style

TypeScript in `src/` and `scripts/` follows the Design Thinking method on Effect: read `docs/design-thinking.md` before designing a change, and `docs/adr/0002-effect-and-design-thinking.md` for this codebase's shapes, errors and call graphs. Review enforces `CODING_STANDARDS.md`. Show call graphs in the indented `→` format from `docs/design-thinking.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Workflow

How work is done here, set up by `/imsus-setup`. Ask `/imsus-ask` what to do next.

- **Workflows**: feature, bug, explore. See `docs/agents/workflow.md`.
- **Git flow**: branch + PR on `main`. See `docs/agents/git.md`.
- **Harness**: Claude Code, also none. See `docs/agents/harness.md`.
- **Stack**: skills collection with a private Bun CLI, TypeScript on Bun with Effect, bun; verify with `bun run verify`. See `docs/agents/stack.md`.
- **CI**: GitHub Actions. See `docs/agents/ci.md`.
- **Release**: semver per category, hand-written changelog, no tags. See `docs/agents/release.md`.
- **Guardrails**: project hook blocks force-push, push to main and destructive resets; pre-commit runs verify. See `docs/agents/guardrails.md`.
