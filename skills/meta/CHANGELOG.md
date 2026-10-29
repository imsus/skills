# Changelog

## Unreleased

- imsus-setup: the setup steps are written. It detects project kind, working style, tooling, git flow, harness and installed imsus skills on both install routes (plugin and `npx skills`, flagging double installs and updates), suggests workflows, git flow, tooling, verify command, release and guardrails, fills each step from a harness built-in, an imsus skill or the curated list, writes its own `docs/agents/` files and `## Workflow` block (delegating tracker and domain docs to `/setup-matt-pocock-skills`), and proves every change with a before/after table. Re-runs audit and ask only about drift. New references: `detect.md` and `profile-templates.md`.
- imsus-ask: the router is written. It answers three intents (start something, "I finished this" with a git and tracker done-check first, "what's left" from the tracker's frontier query plus git state), recommends only imsus skills, the current harness's built-ins and outside skills the workflow profile records, places any harness action as a numbered step, and ends with a Next prompt per branch.

## 0.1.0

- Initial release: imsus-ask and imsus-setup (placeholders), with the generated skill catalog and the shared references (workflows, harness capabilities, curated outside skills).
