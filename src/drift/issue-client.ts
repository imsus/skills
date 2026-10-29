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
    /** Every open drift issue, as `{ number, title }`. */
    listOpen(): Effect.Effect<ReadonlyArray<OpenIssue>, IssueClientError>;
    create(issue: NewIssue): Effect.Effect<void, IssueClientError>;
    update(number: number, body: string): Effect.Effect<void, IssueClientError>;
  }
>()("imsus-skills/IssueClient") {
  /** The `gh` CLI, using the ambient GitHub auth. */
  static readonly layerGh = Layer.succeed(IssueClient, IssueClient.of(ghClient()));
}

/** `gh issue list --json number,title` output (the edge). */
const OpenIssue = Schema.Struct({ number: Schema.Int, title: Schema.String });
type OpenIssue = typeof OpenIssue.Type;
const IssueList = Schema.fromJsonString(Schema.Array(OpenIssue));
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

  const listOpen = () =>
    gh(["issue", "list", "--label", DRIFT_LABEL, "--state", "open", "--limit", "1000", "--json", "number,title"]).pipe(
      Effect.flatMap(decodeIssueList),
      Effect.catchTag("SchemaError", (e) => Effect.fail(new IssueClientError({ message: `unexpected gh output: ${e.message}` }))),
    );

  const create = ({ title, body, labels }: NewIssue) =>
    gh(["issue", "create", "--title", title, "--body", body, ...labels.flatMap((l) => ["--label", l])]).pipe(Effect.asVoid);

  const update = (number: number, body: string) => gh(["issue", "edit", String(number), "--body", body]).pipe(Effect.asVoid);

  return { listOpen, create, update };
}
