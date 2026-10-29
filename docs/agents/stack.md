<!-- Written by /imsus-setup. Edit freely; re-run /imsus-setup to audit it against the repo. -->
# Stack

- **Kind**: skills collection (one plugin per category under `skills/<category>/`) with a private Bun CLI (`src/cli.ts`) for checks and generation; solo.
- **Language / runtime**: TypeScript on Bun. **Framework**: Effect 4.1.0 (ADR-0002).
- **Package manager**: bun.
- **Test**: `bun test`. **Lint / format**: none for TypeScript (`tsc`, `bun run check` and the conventions test enforce `CODING_STANDARDS.md`); actionlint for workflows (`bun run lint:workflows`). **Typecheck**: `bun run typecheck`.
- **Verify**: `bun run verify`: run before every commit (the pre-commit hook runs it); it runs everything CI runs.
- **Run the app**: `bun run src/cli.ts <check|manifest|drift|link>`; `bun run link` links every skill into `.claude/skills/`.
