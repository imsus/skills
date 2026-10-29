# Changelog

## Unreleased

- imsus-ask: reads only and leaves the checkout where it was; "Start something" first checks X isn't already built; a missing workflow profile is named in the answer with `/imsus-setup` as a branch.

## 0.1.0

- Initial release: imsus-ask, imsus-setup and imsus-retro, with the generated skill catalog (in imsus-ask and imsus-setup) and the shared references (workflows, harness capabilities, curated outside skills) that imsus-ask copies from imsus-setup.
- imsus-ask: the router. It answers three intents (start something, "I finished this" with a git and tracker done-check first, "what's left" from the tracker's frontier query plus git state), recommends only imsus skills, the current harness's built-ins and outside skills the workflow profile records, places any harness action as a numbered step, and ends with a Next prompt per branch ("what's left" ends with exactly one).
- imsus-setup: writes and audits the workflow profile. It detects project kind, working style, tooling, git flow, harness and installed imsus skills on both install routes (plugin and `npx skills`, flagging double installs and updates), suggests workflows, git flow, tooling, verify command, release and guardrails, fills each step from a harness built-in, an imsus skill or the curated list, writes its own `docs/agents/` files and `## Workflow` block (delegating tracker and domain docs to `/setup-matt-pocock-skills`), and proves every change with a before/after table. Re-runs audit and ask only about drift. References: `detect.md` and `profile-templates.md`.
- imsus-retro: a fork of Matt Pocock's `retro` (mattpocock/skills `a496f55`). Targets the current or one named session; reads Claude Code transcripts through `scripts/find-session.mjs` (bounded extracts: size, first prompt, models and effort per turn and subagent, tool and API errors, retry gap, turn durations, compactions); inspects nine areas with a coverage line each; routes findings down a fix ladder; asks one question per finding; proves structural fixes against the real mistake; writes a retro record in `docs/retro/` that the next retro scores addressed / partial / open; ends with a Next prompt. imsus-ask routes to it.
