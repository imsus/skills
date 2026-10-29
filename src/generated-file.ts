/** A file `manifest` owns: its repo-relative path and the exact text it must hold. */
export interface GeneratedFile {
  path: string;
  text: string;
}
