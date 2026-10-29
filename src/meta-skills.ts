import { SkillName } from "./ids";

const ASK = SkillName.make("imsus-ask");
const SETUP = SkillName.make("imsus-setup");
const RETRO = SkillName.make("imsus-retro");

/**
 * The roles the `meta` category's skills play for the tooling. Every rule
 * and generator that singles out a meta skill reads its name from here.
 */
export const META_SKILLS = {
  /** The skill whose SKILL.md body must route to every other skill. */
  router: ASK,
  /** Skills that carry a generated copy of the catalog. */
  catalogDestinations: [ASK, SETUP],
  /** The skill whose `references/` holds the hand-written shared references. */
  sharedReferencesSource: SETUP,
  /** The skill that carries a generated copy of each shared reference. */
  sharedReferencesCopy: ASK,
  /** User-only skills by exact name. */
  userOnly: [ASK, RETRO],
  /** User-only skills by name prefix: imsus-setup and every imsus-setup-*. */
  userOnlyPrefix: SETUP,
} as const;

/** A user-only skill runs only when the user types it, so it must set `disable-model-invocation: true`. */
export const isUserOnly = (name: SkillName): boolean =>
  META_SKILLS.userOnly.some((n) => n === name) || name.startsWith(META_SKILLS.userOnlyPrefix);
