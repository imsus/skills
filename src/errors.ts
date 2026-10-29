import { Schema } from "effect";

/** The repo filesystem could not be read or written. The path is repo-relative. */
export class RepoFsError extends Schema.TaggedError<RepoFsError>()("RepoFsError", {
  path: Schema.String,
  message: Schema.String,
}) {}

/** `category.json` is not parseable JSON, or not a JSON object. Recovered into `CategoryMeta.Unreadable`. */
export class CategoryJsonUnreadable extends Schema.TaggedError<CategoryJsonUnreadable>()("CategoryJsonUnreadable", {
  message: Schema.String,
}) {}

/** A fork's `UPSTREAM.md` failed validation. Recovered per fork: `drift` skips it, `check` reports it. */
export class InvalidUpstream extends Schema.TaggedError<InvalidUpstream>()("InvalidUpstream", {
  path: Schema.String,
  problems: Schema.Array(Schema.String),
}) {}

/** GitHub could not answer a question about one fork's upstream. Recovered per fork into `Unreachable`. */
export class UpstreamUnreachable extends Schema.TaggedError<UpstreamUnreachable>()("UpstreamUnreachable", {
  repo: Schema.String,
  message: Schema.String,
}) {}

/** The issue tracker rejected or failed a call. Fatal for the sync. */
export class IssueClientError extends Schema.TaggedError<IssueClientError>()("IssueClientError", {
  message: Schema.String,
}) {}

/** The `drift.json` input is missing, not JSON, or not a drift report. */
export class DriftReportError extends Schema.TaggedError<DriftReportError>()("DriftReportError", {
  path: Schema.String,
  message: Schema.String,
}) {}
