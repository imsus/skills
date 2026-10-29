<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# CI

- **Provider**: GitHub Actions. **Workflows**: `.github/workflows/ci.yml`, `.github/workflows/drift.yml`.
- **Runs on**: `ci.yml` on every push and pull request; `drift.yml` weekly (Monday 06:00 UTC) and on dispatch.
- **Checks**: `bun install --frozen-lockfile`, `bun run verify`, actionlint 1.7.12. Local equivalent: `bun run verify` (needs `actionlint` on the PATH, else it skips the workflow lint).
- **Drift**: opens one `drift` issue per fork whose upstream moved (`scripts/drift-issues.ts`); handled through the explore workflow's `/triage`.
- **Gaps**: none.
