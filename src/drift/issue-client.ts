import { Context, Effect, Layer, Schema } from "effect";
import { IssueClientError } from "../errors";

export const DRIFT_LABEL = "drift";

export interface NewIssue {
  title: string;
  body: string;
  labels: string[];
}

/** The slice of an issue tracker the sync needs. Production shells out to `gh`; tests keep issues in memory. */
export class IssueClient extends Context.Service<
  IssueClient,
  {
    /** The open issue with exactly this title, if any. */
    findOpen(title: string): Effect.Effect<{ number: number } | null, IssueClientError>;
    create(issue: NewIssue): Effect.Effect<void, IssueClientError>;
    update(number: number, body: string): Effect.Effect<void, IssueClientError>;
  }
>()("imsus-skills/IssueClient") {
  /** The `gh` CLI, using the ambient GitHub auth. */
  static readonly layerGh = Layer.succeed(IssueClient, IssueClient.of(ghClient()));
}

/** `gh issue list --json number,title` output (the edge). */
const IssueList = Schema.fromJsonString(Schema.Array(Schema.Struct({ number: Schema.Int, title: Schema.String })));
const decodeIssueList = Schema.decodeUnknownEffect(IssueList);

function ghClient() {
  const gh = (args: string[]) =>
    Effect.tryPromise({
      try: async () => {
        const p = Bun.spawn(["gh", ...args], { stdout: "pipe", stderr: "inherit" });
        const out = await new Response(p.stdout).text();
        if ((await p.exited) !== 0) throw new Error(`gh ${args.join(" ")} failed`);
        return out;
      },
      catch: (e) => new IssueClientError({ message: e instanceof Error ? e.message : String(e) }),
    });

  const findOpen = (title: string) =>
    Effect.gen(function* () {
      const out = yield* gh(["issue", "list", "--label", DRIFT_LABEL, "--state", "open", "--limit", "1000", "--json", "number,title"]);
      const issues = yield* decodeIssueList(out);
      return issues.find((i) => i.title === title) ?? null;
    }).pipe(Effect.catchTag("SchemaError", (e) => Effect.fail(new IssueClientError({ message: `unexpected gh output: ${e.message}` }))));

  const create = ({ title, body, labels }: NewIssue) =>
    gh(["issue", "create", "--title", title, "--body", body, ...labels.flatMap((l) => ["--label", l])]).pipe(Effect.asVoid);

  const update = (number: number, body: string) => gh(["issue", "edit", String(number), "--body", body]).pipe(Effect.asVoid);

  return { findOpen, create, update };
}
