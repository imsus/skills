import { category, type Files } from "./tree";

/** Where `manifest` writes the catalog copies. */
export const CATALOG_COPIES = [
  "skills/meta/imsus-ask/references/catalog.md",
  "skills/meta/imsus-setup/references/catalog.md",
];

/** The `meta` category with the two catalog destinations (imsus-ask, imsus-setup), plus any extra skills. */
export function metaCategory(extra: string[] = []): Files {
  return category("meta", ["imsus-ask", "imsus-setup", ...extra]);
}
