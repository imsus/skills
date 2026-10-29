import { Effect, Option } from "effect";
import type { RepoFsError } from "./errors";
import { allSkills, type Repo } from "./repo";
import { RepoFs } from "./repo-fs";

/** The skill whose `references/` holds the hand-written shared references. */
export const SHARED_REFERENCES_SOURCE = "imsus-setup";
/** The skill that carries a copy of each shared reference. */
export const SHARED_REFERENCES_COPY = "imsus-ask";
/** The shared references, by path inside the skill folder. */
export const SHARED_REFERENCES = [
  "references/workflows.md",
  "references/harness.md",
  "references/curated-skills.md",
];

/**
 * One copy in imsus-ask per shared reference that exists in imsus-setup,
 * holding imsus-setup's exact text. None when either skill is absent.
 */
export const sharedReferenceCopies = (repo: Repo): Effect.Effect<{ path: string; text: string }[], RepoFsError, RepoFs> =>
  Effect.gen(function* () {
    const fs = yield* RepoFs;
    const skills = allSkills(repo);
    const source = skills.find((s) => s.name === SHARED_REFERENCES_SOURCE);
    const copy = skills.find((s) => s.name === SHARED_REFERENCES_COPY);
    if (!source || !copy) return [];
    const texts = yield* Effect.forEach(SHARED_REFERENCES, (ref) =>
      Effect.map(fs.readText(`${source.path}/${ref}`), Option.map((text) => ({ path: `${copy.path}/${ref}`, text }))),
    );
    return texts.flatMap(Option.toArray);
  });
