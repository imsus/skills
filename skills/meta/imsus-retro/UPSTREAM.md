---
repo: mattpocock/skills
path: skills/engineering/retro
sha: a496f5513d4a4cf889bc48e189e579f4b0bdf6aa
---

Forked from Matt Pocock's `retro`. Kept: the user-only trigger, the `writing-for-agents` first step, the focus on the agent's environment rather than the code, propose-then-pick, his reading of the repo's own check command before proposing a check, the guardrail finding, the mechanical vs judgement split for standards, and his Reference section (implementation vs review, which file is for what).

Changed:

- Renamed to `imsus-retro`; `agents/openai.yaml` display name follows.
- **Target**: the current session, or one named past session by id or path. Claude Code transcripts are read through `scripts/find-session.mjs` (Node, no dependencies), which prints bounded extracts instead of the agent searching session logs itself. The transcript is treated as untrusted data.
- **Inspection**: his seven categories (which named where a fix goes) are replaced by nine inspection areas (which name where to look), each ending in a coverage line (`nothing found` / `finding` / `not captured`). Model and effort choice and the machine's environment are new areas. Causes are named freely, but an uncited finding is dropped, which his docs suggest but the skill did not enforce.
- **Routing**: a fix ladder, strongest first (architecture, types, verify/CI check, harness hook, test, coding-standards rule, skill edit, profile/ADR, `CLAUDE.md` pointer). Outside-skill fixes become issues on their repo. Model fixes go in the file that set the model.
- **Asking**: one question per finding through the harness's question tool, routes as options with the recommended one first, plus Skip.
- **Proof**: a structural fix must fail on the session's real mistake, then the verify command must pass; prose fixes are marked unproven. His docs note the skill had no proof step.
- **Follow-through**: a retro record in `docs/retro/`, and the next retro scores each earlier fix addressed / partial / open and suggests pruning checks that never fire. His docs name the missing audit of last month's checks as the weak spot.
- **Subagents** past a size threshold, one analyst per area group.
- Ends with a Next prompt.
