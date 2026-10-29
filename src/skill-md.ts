import { Schema } from "effect";
import { markdownBody, parseFrontmatter } from "./frontmatter";

/** Name of the file at the centre of every skill folder. */
export const SKILL_FILE = "SKILL.md";

/**
 * A skill's `SKILL.md`, decoded once when the repo is read. `name` and
 * `description` stay optional and unjudged here: the `skill` rule reports a
 * missing or mismatched one. `disableModelInvocation` is true only for the
 * frontmatter line `disable-model-invocation: true`.
 */
export const SkillMd = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  description: Schema.optionalKey(Schema.String),
  disableModelInvocation: Schema.Boolean,
  /** The Markdown after the frontmatter block, or the whole text when there is none. */
  body: Schema.String,
});
export type SkillMd = typeof SkillMd.Type;

/** Decode `SKILL.md` text. A file without frontmatter decodes with no name or description. */
export function parseSkillMd(text: string): SkillMd {
  const { name, description, "disable-model-invocation": flag } = parseFrontmatter(text) ?? {};
  return {
    ...(name === undefined ? {} : { name }),
    ...(description === undefined ? {} : { description }),
    disableModelInvocation: flag === "true",
    body: markdownBody(text),
  };
}
