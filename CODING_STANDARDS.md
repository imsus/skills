# Coding standards

Judgement calls for review. `test/conventions.test.ts` enforces the mechanical rules (type casts, `process.env`, raw `fetch`/`Bun.spawn`, `JSON.parse`), so they don't appear here. The method behind every rule is [`docs/design-thinking.md`](docs/design-thinking.md); the shapes, errors and call graphs it produced are in [ADR-0002](docs/adr/0002-effect-and-design-thinking.md).

## Effect

- **Gen is A, pipe is E.** An `Effect.gen` body is the happy path: every `yield*` is a step of the call graph. Error handling lives in the `.pipe()` after it, as a complete list of the E the body can produce. Inline handling is allowed only for a **divergent strategy** (two yields in one body with different failure semantics), and carries a one-line comment naming it as divergent.
- **E is scoped per layer.** A service maps the errors of what it calls into its own tagged errors. A command's `.pipe()` handles the errors its services declare, never errors from three layers down.
- **Retry, escape or die.** A transient failure retries, a recoverable one becomes a value (as `UpstreamUnreachable` becomes one fork's `Unreachable` outcome), and a broken assumption dies as a defect. Domain errors stay in E.
- **Schema at the edges, once.** Untrusted data (files, CLI JSON, HTTP responses, `drift.json`) is decoded where it enters, into branded IDs and tagged shapes. Inside that edge, code trusts the types: no re-validation, no second parse of the same input.
- **R is honest.** Anything a node needs from the outside world is a service in R, provided by a layer. Tests swap the layer; they never patch globals or pass hand-built fakes past the service.

## Call graphs

- **The code is the graph.** A change to a command's steps, services or failure modes updates its Production / Tests call graph in ADR-0002 in the same change. A graph that no longer matches the code is a review finding.

## Domain language

- Names in code, CLI output and docs use `GLOSSARY.md` terms (Skill, Own skill, Fork, Upstream, Drift, Category). A term the glossary avoids is a finding.
