import { buildTree, runCli, type CliResult, type Files } from "./tree";

/** Run `check` on a throwaway tree built from `files`, cleaning the tree up afterwards. */
export async function check(files: Files): Promise<CliResult> {
  const tree = buildTree(files);
  try {
    return await runCli(["check"], tree.root);
  } finally {
    tree.cleanup();
  }
}
