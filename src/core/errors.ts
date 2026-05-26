export type CcgitError =
  | { kind: 'config-missing' }
  | { kind: 'unknown'; cause: unknown };
