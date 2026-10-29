import { Schema } from "effect";

/** A skill folder name, e.g. `imsus-foo`. Not checked for the `imsus-` prefix: the `skill-prefix` rule reports that. */
export const SkillName = Schema.String.check(Schema.isNonEmpty()).pipe(Schema.brand("SkillName"));
export type SkillName = typeof SkillName.Type;

/** A category folder name under `skills/`. */
export const CategoryName = Schema.String.check(Schema.isNonEmpty()).pipe(Schema.brand("CategoryName"));
export type CategoryName = typeof CategoryName.Type;

/** An upstream GitHub repository, `owner/name`. */
export const UpstreamRepo = Schema.String.check(
  Schema.isPattern(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, { message: "repo must be owner/name" }),
).pipe(Schema.brand("UpstreamRepo"));
export type UpstreamRepo = typeof UpstreamRepo.Type;

/** A full commit SHA: 40 lowercase hex characters. */
export const CommitSha = Schema.String.check(
  Schema.isPattern(/^[0-9a-f]{40}$/, { message: "sha must be 40 lowercase hex characters" }),
).pipe(Schema.brand("CommitSha"));
export type CommitSha = typeof CommitSha.Type;
