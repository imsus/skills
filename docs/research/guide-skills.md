# Guide, help and router skills in public agent-skill collections

Research date: 2026-10-29. Every row below was checked against the `SKILL.md` (and, where named, the hook or script) in the repository at the commit listed for that repository. Links are pinned to that commit. Star counts come from `gh api repos/<owner>/<repo>` on the same date.

## Scope

A **guide skill** orients the user or the agent mid-workflow. It does at least one of these:

1. Answers "what should I do next?" or "which skill fits this?".
2. Explains the collection as a whole.
3. Routes a request to another skill in the same collection.

Close variants are in scope: `using-X` meta skills, `help`, `guide`, `onboard`, `next`, `find-skills`, `catalog`, and similar. A skill that discovers skills *outside* the collection (a registry search) is marked **discovery**. A skill that routes to learning content rather than to skills is marked **adjacent**.

Search method per repository: list every `SKILL.md` (and, for command-based collections, every `commands/*.md`) in the Git tree, filter names by `help|guide|router|using-|onboard|next|which|catalog|find-skill|meta|map|progress|ask`, then read the frontmatter of the hits. In the main sources (Matt Pocock, pstack, Addy Osmani, superpowers, anthropics, vercel-labs) every skill name was scanned by eye as well. In the larger aggregators only the name filter was used, so a router with an unusual name could be missed there.

## Sources and commits

| Repository | Stars | Commit read | Commit date | Guide skills found |
| --- | --- | --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills) | 306,083 | `59db609` | 2026-10-27 | 1 |
| [cursor/plugins](https://github.com/cursor/plugins) (`pstack/`, by Lauren Tan / poteto) | 14,526 | `1ba91fc` | 2026-10-29 | 2 in pstack (+1 other plugin) |
| [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) (pstack port for Claude Code and others) | 3,595 | `190fc9a` | 2026-10-28 | 2 (ports) + 1 SessionStart hook |
| [poteto/plugins](https://github.com/poteto/plugins) | 129 | `74dd229` | 2026-10-27 | 0 (older pstack snapshot with no `poteto-help`) |
| [poteto/noodle](https://github.com/poteto/noodle) | 564 | `82d2921` | 2026-03-19 | 0 own (holds a copy of `find-skills`) |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 111,565 | `eb07f19` | 2026-10-29 | 1 |
| [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | 3,006 | `afa8da9` | 2026-08-24 | 0 |
| [obra/superpowers](https://github.com/obra/superpowers) | 307,815 | `2ce8aa1` | 2026-10-21 | 1 (+1 borderline) |
| [anthropics/skills](https://github.com/anthropics/skills) | 184,621 | `ca45fc4` | 2026-10-28 | 0 routers, 1 adjacent |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) (`npx skills` CLI, feeds skills.sh) | 37,084 | `92a9a34` | 2026-10-29 | 1 discovery |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 33,186 | `1a2c79d` | 2026-10-27 | 0 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | 138,116 | `81a8272` | 2026-10-29 | 1 |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 54,721 | `61e01f8` | 2026-10-18 | 1 |
| [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) | 64,188 | `bdcaab2` | 2026-05-31 | 2 (slash commands, not skills) |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) (formerly everything-claude-code) | 292,109 | `25278e7` | 2026-10-26 | 1 (+ command shim) |
| [openai/skills](https://github.com/openai/skills) | 28,383 | `49f948f` | 2026-06-24 | 1 discovery |

Name-filter only, nothing in scope found: wshobson/agents (`onboard` command is team onboarding), alirezarezvani/claude-skills (`onboard` is C-level onboarding), K-Dense-AI/scientific-agent-skills, trailofbits/skills, huggingface/skills, github/awesome-copilot, Jeffallan/claude-skills, coreyhaines31/marketingskills, nextlevelbuilder/ui-ux-pro-max-skill, ComposioHQ/awesome-claude-skills. sickn33/agentic-awesome-skills mirrors other authors' skills (it contains a copy of `ask-matt`) and was not treated as a primary source.

## Matt Pocock: mattpocock/skills

Commit [`59db609`](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c).

| Field | `ask-matt` |
| --- | --- |
| Path | [`skills/engineering/ask-matt/SKILL.md`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/ask-matt/SKILL.md), plus [`PHASE-BOUNDARIES.md`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/ask-matt/PHASE-BOUNDARIES.md) and [`agents/openai.yaml`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/ask-matt/agents/openai.yaml) |
| Description | "Ask which skill or flow fits your situation. A router over the skills in this repo." |
| Trigger | User only: `disable-model-invocation: true` in the frontmatter, and `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for Codex. Typed as `/ask-matt`. |
| Catalogue | Hand-written prose map in the SKILL.md, organised as **flows**, not a table: a main flow (idea → ship, with two branches), on-ramps (`/triage`, `/diagnosing-bugs`, `/wayfinder`), codebase health, a "vocabulary underneath" layer, standalones, and a precondition (`/setup-matt-pocock-skills`). A separate file holds a decision tree for **phase boundaries** (continue, `/clear`, `/handoff`, subagent, `/compact`). It tells the agent to read a skill's own SKILL.md before stating what it does: "the summaries here are for orientation only". |
| Output | A recommendation: the skill or sequence of skills that fits, and where the human decisions sit. The docs page says "It recommends and stops… what you get back is the next thing to type, and you type it" ([`docs/engineering/ask-matt.md`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/docs/engineering/ask-matt.md)). Upstream does **not** prescribe a "Next prompt" code block; that format comes from this user's own global CLAUDE.md. |
| Keeping it in sync | A maintainer rule in the repo's [`CLAUDE.md`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/CLAUDE.md): "whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-matt`'s `SKILL.md` and update it… a new skill it never mentions, or a stale one it still routes to, is a router that lies." No automated check was found. The read-the-skill-first rule landed as a patch changeset ([`.changeset/ask-matt-read-skill-first.md`](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/.changeset/ask-matt-read-skill-first.md), issue #614). |

Coverage at this commit (checked by script): every skill in the promoted buckets `engineering/` and `productivity/` is named in `ask-matt`, except `ask-matt` itself. The only names it routes to that are not skills are `/clear` and `/compact`, which are harness built-ins. Skills in `in-progress/` (for example `chief-of-staff`) are left out on purpose.

Not counted: `wayfinder` (description: "Plan a huge chunk of work… as a shared map of decision tickets") plans one large effort. It does not route between skills.

## poteto (Lauren Tan): pstack

pstack's canonical home is `pstack/` in [cursor/plugins](https://github.com/cursor/plugins/tree/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack). The `poteto/plugins` repo is an older snapshot without `poteto-help`. The Claude Code build installed on this machine is Michael Denyer's port, [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude/tree/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a) (marketplace `pstack-claude`, plugin version 0.9.81 locally).

| Field | `poteto-help` (Cursor original) | `poteto-mode` (router mode) |
| --- | --- | --- |
| Path | [`pstack/skills/poteto-help/SKILL.md`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/skills/poteto-help/SKILL.md), with `references/prompting.md` and `references/recipes.md` | [`pstack/skills/poteto-mode/SKILL.md`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack/skills/poteto-mode/SKILL.md), with `playbooks/*.md` |
| Description | "Guides users through pstack setup, /poteto-mode, and picking the skill, playbook, or principle for a task. Type /poteto-help with a question." | "poteto's agent style for concise, detailed responses, deliberate subagents, unslopped prose, simple code, and verified work. Use for poteto, /poteto-mode, or requests to work in this style." |
| Trigger | User only (`disable-model-invocation: true`), typed as `/poteto-help <question>`. | User only in Cursor (`disable-model-invocation: true`). Can be pinned as a Cursor Custom Mode so it stays in context every turn. |
| Catalogue | Hard-coded "The user wants to → Skill" table with relative links to each sibling SKILL.md, plus "Close calls" (for example `/how` vs `/why` vs `/teach`, `/arena` vs `/swarm`), a "Not in pstack" list, a symptom → fix table, and pointers to the guide pages `docs/guide/01…10`. Fallback at runtime: "If a skill directory next to this one is missing from the table, read its frontmatter and route by its description." It also says: read the target file before quoting it, and trust that file over this map. | A "Non-negotiables" list of situation → skill triggers (for example "Code crossing a function boundary → the **architect** skill"), a Principles index, and a Playbooks list. Each playbook is a file whose steps are copied into the todo list "verbatim". It runs other skills itself instead of recommending them. |
| Output | Leads with the answer, then "at most one example prompt in a code block, adapted from `references/recipes.md`", then a link to the source file (rewritten to the public GitHub URL). It does not start the work: "The user asked how, and a pstack run spends real tokens, so let them send the prompt." If the need is unclear it asks one multiple-choice question with five options (Get set up, Start a task, Pick a skill, Fix a run, Make pstack my own). It checks local state that changes the answer: whether the model rule exists, and whether a `verify-*` skill exists. | Does the work: matches a playbook, opens a todo list, and invokes skills per step. |
| Keeping it in sync | Runtime fallback to frontmatter, plus "trust the file over the map". No test was found that compares the table with the skill directories (searched code for `poteto-help` in both repos; not exhaustive, **unverified**). | n/a |

Coverage at `1ba91fc` (checked by script): all 34 non-principle skill directories in `pstack/skills/` appear in the table. `poteto-help` itself is listed without a link.

### The Claude Code port (michael-denyer/pstack-claude)

| Item | What differs |
| --- | --- |
| [`plugins/pstack/skills/poteto-help/SKILL.md`](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/skills/poteto-help/SKILL.md) | Same description, but **no** `disable-model-invocation`, so the model can load it from its description. Setup steps point to per-runtime install docs and to `setup-pstack`'s "Other runtimes" table. Public links point to the port's repo. Custom Mode guidance is replaced by "check that routing is enabled for this installation before promising it." |
| [`plugins/pstack/skills/poteto-mode/SKILL.md`](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/skills/poteto-mode/SKILL.md) | No `disable-model-invocation`, so the hook below can route into it. |
| [`plugins/pstack/hooks/hooks.json`](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/hooks/hooks.json) + [`session-start-context.md`](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/hooks/session-start-context.md) | A SessionStart hook (matcher `startup|resume|clear|compact`) injects a short mandate: invoke `pstack:poteto-mode` when a task touches more than one file, involves a design choice, or is a bug with an unknown cause or a perf issue; otherwise work directly; enter `pstack:tdd`, `architect`, `how`, `why`, `arena` or `interrogate` directly when the intent is already specific. It defers to user instructions and coexists with superpowers. [`session-start.sh`](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/hooks/session-start.sh) reads the per-runtime `pstack-models.md` sheet, and `session hook: off` there turns injection off. |
| [`.codex-plugin/prompts/poteto-help.md`](https://github.com/michael-denyer/pstack-claude/blob/190fc9a009491cbcfc04e25ef5b3c2d1fcf5ca8a/plugins/pstack/.codex-plugin/prompts/poteto-help.md) | A Codex prompt shim: "Invoke the `poteto-help` skill and follow it", plus a tool-name mapping file. |

### Other help skill in cursor/plugins (not poteto)

| Skill | Path | Description | Trigger | Catalogue | Output |
| --- | --- | --- | --- | --- | --- |
| `ralph-loop-help` | [`ralph-loop/skills/ralph-loop-help/SKILL.md`](https://github.com/cursor/plugins/blob/1ba91fc25c0977741dd0e267849e6234b037ed0a/ralph-loop/skills/ralph-loop-help/SKILL.md) | "Explain the Ralph Loop plugin, how it works, and available skills. Use when the user asks for help with ralph loop…" | Model-invoked (no flag) | Hard-coded explanation of the technique and the plugin's two other skills | An explanation, with usage examples |

## Addy Osmani: addyosmani/agent-skills

Commit [`eb07f19`](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2669f2364897aaa293e2aaddd7b1c).

| Field | `using-agent-skills` |
| --- | --- |
| Path | [`skills/using-agent-skills/SKILL.md`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/using-agent-skills/SKILL.md) |
| Description | "Discovers and invokes agent skills. Use when starting a session, or when you need to decide which skill or workflow applies to the piece of work at hand. This is the meta-skill that governs how all other skills are discovered and invoked." |
| Trigger | Model-invoked from the description. A SessionStart hook script exists ([`hooks/session-start.sh`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/hooks/session-start.sh)) that injects the whole SKILL.md. It is deliberately **not wired** by the plugin: "hosts that already route skills from their descriptions (Claude Code, Codex CLI) would run a second router on top of the native one". Wire it only on hosts without native skill routing. |
| Catalogue | Hard-coded, three times over: an ASCII decision tree ("Task arrives → … → skill"), a 16-step "Lifecycle Sequence", and a "Quick Reference" table (Phase, Skill, One-Line Summary). It also carries six always-on "Core Operating Behaviors" (surface assumptions, push back, and so on). |
| Output | No user-facing output format. It steers the agent to apply the matching skill, or a chain of skills. |
| Keeping it in sync | The linter exempts it from the usual sections as a "routing document" ([`scripts/lib/skill-lint.js`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/scripts/lib/skill-lint.js), line 88). [`validate-reference-links.js`](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/scripts/validate-reference-links.js) was added after this router's link to the Definition of Done pointed to a missing file. No check that the tree and table cover every skill was found. |

Coverage at `eb07f19` (checked by script): `constraint-driven-development` appears in the decision tree but is **missing from the Quick Reference table and the Lifecycle Sequence**. This is a live example of drift between three hand-kept copies of one catalogue.

## obra/superpowers

Commit [`2ce8aa1`](https://github.com/obra/superpowers/tree/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b).

| Field | `using-superpowers` | `diagnosing-superpowers` (borderline) |
| --- | --- | --- |
| Path | [`skills/using-superpowers/SKILL.md`](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/skills/using-superpowers/SKILL.md), with `references/<harness>-tools.md` for 7 harnesses | [`skills/diagnosing-superpowers/SKILL.md`](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/skills/diagnosing-superpowers/SKILL.md) |
| Description | "Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions" | "Use when a superpowers session went wrong and your human partner wants to know why… a skill that didn't fire…" |
| Trigger | A SessionStart hook ([`hooks/hooks.json`](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/hooks/hooks.json), matcher `startup|clear|compact`; [`hooks/session-start`](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/hooks/session-start)) reads the SKILL.md and injects it in full, wrapped in `<EXTREMELY_IMPORTANT>You have superpowers.`. A `<SUBAGENT-STOP>` block tells dispatched subagents to ignore it. | Model-invoked |
| Catalogue | **None.** It names only two skills as examples (`brainstorming`, `systematic-debugging`) and relies on the harness's own skill list ("For all other skills, use the 'Skill' tool"). It is a policy, not a map: "If you think there is even a 1% chance a skill might apply… you ABSOLUTELY MUST invoke the skill", a skill-priority rule (process skills first), and a "Red Flags" table of rationalisations. | Reads transcripts on disk |
| Output | No user-facing output. It makes the agent announce "Using [skill] to [purpose]" and follow the skill. | A cited report of what went wrong, or a bug-report bundle |
| Keeping it in sync | Nothing to sync: no list to go stale. | n/a |

## anthropics/skills

Commit [`ca45fc4`](https://github.com/anthropics/skills/tree/ca45fc496a3436251f191354091d557da31c15b5). No skill routes between this repo's own skills. One adjacent skill:

| Skill | Path | Description (abridged) | Trigger | Catalogue | Output |
| --- | --- | --- | --- | --- | --- |
| `academy-guide` (adjacent) | [`skills/academy-guide/SKILL.md`](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/academy-guide/SKILL.md) | "Stop and check this skill before finishing any reply to a question about how to use Claude or a Claude product — it recommends matching courses, tutorials, and use cases from Claude Academy… Only recommend on a strong match; never invent Academy content." | Model-invoked, with a long trigger list in the description | **Remote index**: "This skill deliberately embeds no list… any baked-in list would go stale." It fetches `academy.claude.com/assets/data/catalog.json` once per conversation, trusts it only before its `staleAfter` time (or about 30 days after `generatedAt`), and treats the file as data, not instructions. With no usable catalogue it names no item and falls back to a product hub. | Answer first, then at most 2 items with URLs copied verbatim |

## Vercel: vercel-labs/skills (skills.sh) and vercel-labs/agent-skills

`vercel-labs/agent-skills` (commit [`1a2c79d`](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62)) has 9 domain skills and no router.

| Skill | Path | Description | Trigger | Catalogue | Output |
| --- | --- | --- | --- | --- | --- |
| `find-skills` (discovery) | [`skills/find-skills/SKILL.md`](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/skills/find-skills/SKILL.md) | "Helps users discover and install agent skills when they ask questions like 'how do I do X', 'find a skill for X', 'is there a skill that can...', or express interest in extending capabilities…" | Model-invoked | The live registry: check the skills.sh leaderboard, then run `npx skills find [query]`. Quality gates: prefer 1K+ installs, a reputable source, and a repo with 100+ stars. | Candidate skills with install count, source, the `npx skills add` command and a skills.sh link, then an offer to install (`-g -y`) |

poteto/noodle carries its own copy of `find-skills` at [`.agents/skills/find-skills/SKILL.md`](https://github.com/poteto/noodle/blob/82d2921/.agents/skills/find-skills/SKILL.md) (not compared line by line with Vercel's).

## Other popular collections

| Repo | Skill | Path | Description (abridged) | Trigger | Catalogue | Output |
| --- | --- | --- | --- | --- | --- | --- |
| garrytan/gstack | `gstack` | [`SKILL.md.tmpl`](https://github.com/garrytan/gstack/blob/81a82727b38590c90b34f4c326af021f31d9774f/SKILL.md.tmpl) → generated [`SKILL.md`](https://github.com/garrytan/gstack/blob/81a82727b38590c90b34f4c326af021f31d9774f/SKILL.md) | "Router for the gstack skill suite. Sends any gstack request to the right skill… Use when you invoke gstack without a specific skill, or ask 'which gstack skill fits this?'" | Model-invoked, with a `triggers:` list (`gstack`, `which gstack skill`, `route this with gstack`). It also offers to append a `## Skill routing` section to the user's CLAUDE.md (read from `bin/gstack-skill-start` by [`test/helpers/shipped-skill-routing.ts`](https://github.com/garrytan/gstack/blob/81a82727b38590c90b34f4c326af021f31d9774f/test/helpers/shipped-skill-routing.ts)). | Hard-coded "User asks X → invoke `/skill`" rules in a **template**. [`scripts/gen-skill-docs.ts`](https://github.com/garrytan/gstack/blob/81a82727b38590c90b34f4c326af021f31d9774f/scripts/gen-skill-docs.ts) renders it per install and drops rules for skills the user disabled (`omitDisabledSkills`). At runtime: "Route only to skills in your available-skills list." A `PROACTIVE` setting (`off`, `core`, `all`) controls whether it invokes the skill or only names it. | Invokes the skill, names it for the user to type, or answers directly. It logs `browse`, `routed` or `direct` to telemetry. Routing has e2e evals ([`test/skill-routing-e2e.test.ts`](https://github.com/garrytan/gstack/blob/81a82727b38590c90b34f4c326af021f31d9774f/test/skill-routing-e2e.test.ts), runs only with `EVALS=1`). |
| bmad-code-org/BMAD-METHOD | `bmad` | [`skills/bmad/SKILL.md`](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f82644c4bb533750cfa0d6d61ab61d2cc9b/skills/bmad/SKILL.md), [`references/help.md`](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f82644c4bb533750cfa0d6d61ab61d2cc9b/skills/bmad/references/help.md) | "Answers BMad questions and recommends the next skill from what is installed. Use when the user asks bmad for help, what to do next or where to start; to set up, update, repair… or to see or change the active initiative." | Model-invoked. Speaks as a persona ("You are BMad"). | **Distributed and runtime-collected.** Each module ships a record folder with `bmod.toml` and `help/help.md` (for example [`skills/bmod-method/help/help.md`](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f82644c4bb533750cfa0d6d61ab61d2cc9b/skills/bmod-method/help/help.md)) plus topic files. [`scripts/knowledge.py`](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f82644c4bb533750cfa0d6d61ab61d2cc9b/skills/bmad/scripts/knowledge.py) gathers the help of every *installed* module. "Every help answer comes from the installed modules' own help, never from memory." It also reads project state (the active initiative and epic files) to work out "what next". | Answer first. Recommends only installed skills. Suggests running the next skill "in a fresh context" and offers to run it here. Runs sequences on request, checking with the user between skills. |
| gsd-build/get-shit-done | `/gsd:help` (command) | [`commands/gsd/help.md`](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/commands/gsd/help.md) → [`workflows/help.md`](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/workflows/help.md) | "Show available GSD commands and usage guide" | Slash command with `--brief`, `--full` or `<topic>` | Hard-coded reference split into lazy-loaded mode files (`help/modes/*.md`) | Reference text only: "Do NOT add… Next-step suggestions" |
| gsd-build/get-shit-done | `/gsd:progress` (command) | [`commands/gsd/progress.md`](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/commands/gsd/progress.md) → [`workflows/do.md`](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/workflows/do.md) | "Check progress, advance workflow, or dispatch freeform intent — the unified GSD situational command" | Slash command. `--next` auto-advances, `--do "…"` dispatches free text | **Project state** (`STATE.md`, `ROADMAP.md`, phase folders) for "next". `--do` uses a hard-coded first-match table ("If the text describes… → Route to → Why"). | Progress report plus a route; or confirm-then-hand-off to a command ("never does the work itself") |
| affaan-m/ECC | `ecc-guide` (+ `/ecc-guide` command) | [`skills/ecc-guide/SKILL.md`](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/ecc-guide/SKILL.md), [`commands/ecc-guide.md`](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/commands/ecc-guide.md) | "Answer questions about ECC by reading the live repo surface — agents, skills, commands, hooks, rules, install profiles, and docs — instead of memory. Use when the user asks… which skill or command fits a task…" | Model-invoked skill, plus a slash-command entry point with sub-modes (`setup`, `skills`, `find: <query>`) | **Reads the filesystem at runtime**: `node scripts/ci/catalog.js --json`, `find skills -maxdepth 2 -name SKILL.md`, install-plan listings. "hard-coded catalog counts, feature lists, and install instructions go stale." | "what to use, why it fits, exact file or command to inspect, one next command or question". Avoids dumping the full catalogue. |
| openai/skills | `skill-installer` (discovery) | [`skills/.system/skill-installer/SKILL.md`](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.system/skill-installer/SKILL.md) | "Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills…" | Model-invoked | `scripts/list-skills.py` lists `skills/.curated` (or `.experimental`) from GitHub at runtime | A numbered list marking installed skills, then "Which ones would you like installed?" |

## Cross-cutting analysis

### Design patterns

Two axes separate these skills: **who starts them** and **what they do with the answer**.

| Pattern | Examples | Trigger | Acts or advises |
| --- | --- | --- | --- |
| Ask-the-curator router | `ask-matt`, `poteto-help`, `/gsd:help` | User-typed slash command; model invocation disabled | Advises. It hands back the next thing to type and stops. |
| Always-on mandate | `using-superpowers`, pstack-claude's SessionStart text, `using-agent-skills` (hook optional) | SessionStart hook injects the text, or a broad "use when starting a session" description | Steers the agent to invoke skills itself |
| Mode / orchestrator | `poteto-mode`, `gstack` (under `PROACTIVE=all`), `bmad` when asked to run a sequence | User command, then it stays in context | Acts. It invokes skills step by step. |
| State-aware "next" | `bmad`, `/gsd:progress --next` | Command or description | Reads project artifacts (initiative files, `STATE.md`) to decide the next step |
| Registry discovery | `find-skills`, `skill-installer` | Model-invoked on "is there a skill for X" | Finds skills outside the install and offers to install them |
| Content guide (adjacent) | `academy-guide` | Model-invoked | Appends learning resources from a remote index |

Recurring moves inside the skills:

- **Read before you recommend.** `ask-matt` ("the summaries here are for orientation only"), `poteto-help` ("Read the file you route to before you quote it, and trust it when it disagrees with this map"), `bmad` ("never from memory") and `ecc-guide` ("Answer from current files, not memory") all treat their own map as a hint and the target SKILL.md as the authority.
- **Don't start the work.** `ask-matt` and `poteto-help` both stop at a recommendation. pstack gives the reason: a run "spends real tokens, so let them send the prompt." `/gsd:help` forbids next-step suggestions entirely. `bmad` and `gstack` will run the skill, but only on request or under a setting.
- **Explain the close calls.** Both `ask-matt` (`grill-me` vs `grill-with-docs`, which turns on whether there is a working directory) and `poteto-help` (`/how` vs `/why` vs `/teach`) spend much of their text on pairs of skills that look alike. A keyword match cannot draw that line.
- **Flows over lists.** `ask-matt` places the user on a path (main flow, on-ramps, phase boundaries). `using-agent-skills` uses a lifecycle sequence. `poteto-mode` uses playbooks. A flat table answers "which skill", but a flow also answers "what comes after".
- **Ask one question when the need is unclear.** `poteto-help` asks one multiple-choice question with five fixed options. `/gsd:progress --do` asks for a description when called with no arguments.
- **Check local state that changes the answer.** `poteto-help` checks for a model rule and a `verify-*` skill. `bmad` reads the active initiative. `gstack` drops disabled skills.
- **Stay quiet in subagents.** `using-superpowers` has `<SUBAGENT-STOP>`. Addy's hook is left unwired so it doesn't stack on top of native routing.

### How they keep the catalogue in sync

| Strategy | Who | Strength | Weakness |
| --- | --- | --- | --- |
| No catalogue; rely on the harness skill list | `using-superpowers` | Cannot go stale | Gives no flow or close-call guidance; it only pushes the agent to look |
| Hand-written map plus a maintainer rule | `ask-matt` (CLAUDE.md rule) | Rich, opinionated flows | Kept only by discipline. In sync at `59db609`. |
| Hand-written map plus a runtime fallback to sibling frontmatter | `poteto-help` | Degrades gracefully when a skill is added | The fallback gives no flow context. In sync at `1ba91fc`. |
| Hand-written, several copies | `using-agent-skills` (tree, sequence, table) | Readable from several angles | Already drifted: `constraint-driven-development` is missing from 2 of 3 copies |
| Template plus generator plus per-install filtering, plus routing evals | `gstack` | Matches what is installed; behaviour is tested | Heavy machinery; the rules are still hand-written |
| Per-module help files gathered by a script | `bmad` | Each module owns its own docs; the router has no list to maintain | Needs `uv` and Python at runtime, and a help file per module |
| Live filesystem or registry query | `ecc-guide`, `find-skills`, `skill-installer`, `academy-guide` | Always current | Costs tool calls; only as good as the descriptions it reads; remote data has to be treated as untrusted (`academy-guide` and `bmad` say so explicitly) |

### Strengths and weaknesses

- User-only routers (`disable-model-invocation`) never fire by accident and cost no context until called. But the user must remember the router exists. pstack-claude removed the flag and added a SessionStart hook, which shows the cost of that choice on harnesses without Cursor's Custom Modes.
- SessionStart injection is the most reliable trigger, but it spends context every session and stacks with other plugins. pstack-claude's text explicitly defers to superpowers, and Addy chose not to wire his hook at all because Claude Code and Codex already route from descriptions.
- A router that also does the work (`poteto-mode`, `gstack` under `all`) removes a round trip but takes the choice away from the user. The advise-only routers keep that choice and cost fewer tokens.
- Routers name skills that may not be installed. `ask-matt`'s docs admit this ("it only knows the promoted skills in this repo"). `gstack` and `bmad` solve it by filtering to what is installed.

## Ideas for imsus/skills

Context: [README.md](../../README.md) and [GLOSSARY.md](../../GLOSSARY.md). Skills live at `skills/<category>/imsus-<name>/SKILL.md`, each category is a plugin, a skill may be a **fork** (with `UPSTREAM.md`), and the `check`, `manifest` and `drift` subcommands already walk the tree.

1. **One advise-only router, user-invoked.** For example `imsus-ask` (or `imsus-help`) with `disable-model-invocation: true`. Copy `ask-matt`'s and `poteto-help`'s contract: lead with the answer, give one prompt in a fenced block, link the source SKILL.md, and don't start the work. The user's global CLAUDE.md already asks for a "Next prompt" block from `/ask-matt`, so build that format into the router itself rather than relying on an override.
2. **Generate the inventory part; hand-write the flow part.** The tree is already machine-readable (folder name = `name`, category from the path). Add a `catalog` output (or extend `manifest`) that writes a generated table of every skill's `name`, category and `description` into the router's `references/catalog.md`. Keep the flows and close calls hand-written in SKILL.md, as `ask-matt` does. This splits the drift-prone half (the list) from the high-value half (judgement).
3. **Enforce coverage with a `check` rule.** Add `src/check/rules/router.ts`: every skill folder must be named in the router's hand-written map (or sit on an explicit allow-list), and every `/imsus-*` name the router mentions must exist. This turns Matt's CLAUDE.md rule into a failing check, and would have caught Addy's `constraint-driven-development` gap.
4. **Runtime fallback, as in pstack.** Tell the router: if a sibling skill is missing from the map, read its frontmatter and route by its description. Tell it to read the target SKILL.md before describing it.
5. **Route across categories that may not be installed.** Since each category installs as a separate plugin, the router should say which plugin a recommended skill lives in and give the `/plugin install <category>@imsus` command when it isn't installed. This copies `gstack`'s and `bmad`'s "only installed skills" idea without needing a generator per install.
6. **Mark forks in routing.** The router can show that a skill is a fork and link its upstream, using the `repo` field in `UPSTREAM.md`. Avoid forking someone else's router (for example `ask-matt`) into this repo: it routes to the other author's skills and would drift on every upstream change. Write an own router over this collection's skills instead.
7. **Skip SessionStart injection at first.** Claude Code already routes from descriptions, and the user already runs pstack's hook (and possibly superpowers'). A third always-on mandate would compete with them. If one is added later, give it an off switch, as pstack does with `session hook: off`.
8. **Lean on close calls.** The most useful text in both leading routers distinguishes pairs of similar skills. Once the collection holds forks of overlapping skills (for example several `tdd` or `grill` variants), the router's main job is to state the one concrete test that separates them.

## Unverified or not checked

- Whether pstack or pstack-claude has a test that compares `poteto-help`'s table with the skill directories. A code search for `poteto-help` found none, but GitHub code search is not exhaustive.
- The contents of gstack's routing evals beyond their headers, and whether they run in CI (the file skips unless `EVALS=1`).
- The behaviour of `/gsd:progress` "Routes A through F" beyond the command header. GSD's last commit was 2026-05-31, so it may be less active than the other sources.
- Whether `poteto/noodle`'s `find-skills` copy differs from Vercel's.
- Aggregator repos were checked by name filter only, so a router with an unusual name could be missed there.
- No sources were inaccessible. `poteto/pstack` does not exist as a repository. pstack lives in `cursor/plugins`, with an older copy in `poteto/plugins`.
