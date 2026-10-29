# Build the tooling on Effect, following the design-thinking method

The Bun/TypeScript tooling (`check`, `manifest`, `drift` and the `drift-issues` script) is written on `effect` 4.1.0, and all new code follows the method in [Design Thinking](https://gist.github.com/r17x/90eb2f7be93932b5693753aedb09c01a) (copied to `docs/design-thinking.md`): name the shapes, draw the happy path as a call graph, then add E, R and the Schema boundaries, so the code is the graph. Each command is an `Effect.gen` whose body is the happy path and whose `.pipe()` is the complete list of errors it handles. The things the tooling depends on are services (`RepoFs`, `Stdio`, `UpstreamApi`, `IssueClient`), so tests swap layers instead of passing fakes. Untrusted data is decoded with `Schema` where it enters: `category.json`, the `SKILL.md` and `UPSTREAM.md` frontmatter fields, GitHub API JSON, `gh` CLI JSON and the `drift.json` input of `scripts/drift-issues.ts`. Only the core `effect` package is used (it carries `Schema`, `Context.Service` and `Layer` in v4), so there is no `@effect/cli` or `@effect/platform`, and the auto-discovered `src/commands/` dispatch is unchanged.

## Shapes

- **Category** has a `CategoryMeta` of `Missing`, `Unreadable` or `Loaded`. Malformed content is data, never an error, because the check rules report it.
- **IDs** are Schema brands: `SkillName`, `CategoryName`, `UpstreamRepo` (`owner/name`) and `CommitSha` (40 lowercase hex).
- **Skill** is `Own` or `Fork`. A `Fork` carries its decoded `Upstream` or the `InvalidUpstream` problems, decoded once when the repo is read, so rules and `drift` stay pure. An `UPSTREAM.md` that is empty, a directory or unreadable is an `InvalidUpstream` problem on that fork, never a fatal error.
- **SkillMd** is `{ name?, description?, disableModelInvocation, body }`, decoded from `SKILL.md` once when the repo is read and carried on every skill as an `Option`. A missing name or description is data the `skill` rule reports.
- **Upstream** is `{ repo, path, sha }`, decoded from the `UPSTREAM.md` frontmatter with `sha` lowercased.
- **Violation** is `{ path, rule, message }`.
- **DriftOutcome** is `UpToDate`, `Drifted` or `Unreachable`. `drift --json` keeps its flat wire shape (`outcome` as `up-to-date`, `drifted` or `unreachable`, plus nullable fields), and a Schema transformation maps it to and from the tagged union. A wire entry that contradicts its outcome, such as `drifted` without a compare URL, fails to decode.
- **Errors** are tagged: `RepoFsError`, `CategoryJsonUnreadable`, `InvalidUpstream`, `UpstreamUnreachable`, `IssueClientError` and `DriftReportError`.

## Errors

- `UpstreamUnreachable` is an escape hatch for one fork. `drift` turns it into that fork's `Unreachable` outcome and goes on with the others.
- `InvalidUpstream` is also per fork: `drift` warns on stderr and skips it, and `check` reports it as violations. The `layout` rule reports a file where a category or skill folder is expected.
- `RepoFsError` and `IssueClientError` are fatal for the command. Each command catches them in its `.pipe()` and exits 1.
- A bug is a defect. It is never put in the E channel: a rule module that cannot be imported, or a report that fails to encode, dies.

## Considered Options

- **Keep the plain TypeScript with injected function arguments:** this was rejected because errors travel as thrown exceptions, the dependencies are threaded by hand, and each boundary does its own ad hoc parsing.
- **Add `@effect/cli` and `@effect/platform`:** this was rejected because the v4 core already covers services, layers and Schema, and the existing auto-discovered subcommand dispatch and usage output must not change.

## Consequences

The CLI's observable behaviour is unchanged: subcommands, flags, stdout and stderr text, exit codes, the byte-exact manifest and the `drift --json` shape. Two edge cases are stricter because Schema now guards them: a `drift.json` entry with null upstream fields is rejected by `scripts/drift-issues.ts`, and a GitHub commit list that is not an array is reported as an unreachable upstream. Docs and PRs show call graphs in the indented `→` format below. New code that adds a dependency or a failure mode updates its graph here.

## Call graphs

### check

Production:

```ts
bun run src/cli.ts check
  → command check
    → collectViolations
      → readRepo
        → RepoFs.layer(cwd)                    // node:fs: readdir, stat, readFile
        → parseSkillMd (per skill)
        → parseUpstream (per fork; InvalidUpstream kept on the Fork as data)
      → loadRules                              // readdirSync + import of check/rules, found from the module's own path
      → rules (category, fork, layout, router, skill, user-only)
    → reportFsError (RepoFsError → stderr, exit 1)
    → Stdio.layer                              // console
```

Tests:

```ts
runCli(["check"])
  → command check
    → collectViolations
      → readRepo
        → RepoFs.layer(throwaway tree)
        → parseSkillMd (per skill)
        → parseUpstream (per fork)
      → loadRules
      → rules (category, fork, layout, router, skill, user-only)
    → Stdio.layer
```

### manifest

Production:

```ts
bun run src/cli.ts manifest [--check]
  → command manifest
    → readRepo
      → RepoFs.layer(cwd)                      // node:fs
      → parseSkillMd (per skill)
    → generatedFiles
      → generateManifest
      → generateCatalog (one copy per catalog destination: imsus-ask, imsus-setup)
      → sharedReferenceCopies
        → RepoFs.layer(cwd)                    // readText of imsus-setup/references/{workflows,harness,curated-skills}.md
    → RepoFs.layer(cwd)                        // readText / writeText of each generated file
    → reportFsError (RepoFsError → stderr, exit 1)
    → Stdio.layer                              // console
```

Tests:

```ts
runCli(["manifest"])
  → command manifest
    → readRepo
      → RepoFs.layer(throwaway tree)
      → parseSkillMd (per skill)
    → generatedFiles
      → generateManifest
      → generateCatalog
      → sharedReferenceCopies
        → RepoFs.layer(throwaway tree)
    → RepoFs.layer(throwaway tree)
    → Stdio.layer
```

### drift

Production:

```ts
bun run src/cli.ts drift [--json]
  → command drift
    → runDrift
      → readRepo
        → RepoFs.layer(cwd)                    // node:fs
        → parseSkillMd (per skill)
        → parseUpstream (per fork)
      → driftOf (per fork, sequential)
        → fork.upstream
          → InvalidUpstream → Stdio.err warning, fork skipped
        → outcomeOf
          → UpstreamApi.layerGithub            // Config GITHUB_TOKEN (optional), fetch api.github.com
            → UpstreamUnreachable → Unreachable outcome
      → encodeReport (DriftReport schema) | describe
      → reportFsError (RepoFsError → stderr, exit 1)
      → Stdio.layer                            // console
```

Tests:

```ts
runDrift({ json })
  → readRepo
    → RepoFs.layer(throwaway tree)
    → parseSkillMd (per skill)
    → parseUpstream (per fork)
  → driftOf (per fork, sequential)
    → fork.upstream
      → InvalidUpstream → captured stderr warning, fork skipped
    → outcomeOf
      → fake UpstreamApi layer
  → encodeReport (DriftReport schema) | describe
  → captureStdio
```

### drift-issues script

Production:

```ts
bun run scripts/drift-issues.ts <drift.json>
  → syncDriftIssuesFromFile
    → RepoFs.layer(cwd)                        // node:fs: read drift.json
    → decodeReport (DriftReport schema)
    → syncDriftIssues
      → IssueClient.layerGh                    // Bun.spawn gh: issue list (once), create, edit
```

Tests:

```ts
syncDriftIssues(entries)
  → memoryIssues layer                         // listOpen once, create, update
```
