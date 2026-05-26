export type CcgitError =
  | { kind: 'config-missing' }
  | { kind: 'config-parse-failed'; path: string; reason: string }
  | { kind: 'config-token-missing' }
  | { kind: 'config-baseurl-invalid'; value: string }
  | { kind: 'no-repo' }
  | { kind: 'no-changes' }
  | { kind: 'git-extension-unavailable' }
  | { kind: 'auth-failed'; status: number }
  | { kind: 'rate-limited'; retryAfter?: number }
  | { kind: 'network-error'; reason: string }
  | { kind: 'timeout' }
  | { kind: 'model-refused'; reason: string }
  | { kind: 'unknown'; cause: unknown };

export function redactToken(text: string, token?: string): string {
  if (!text) return text;
  let out = text;
  if (token && token.length > 8) {
    out = out.split(token).join('sk-***');
  }
  out = out.replace(/sk-[A-Za-z0-9_\-]{20,}/g, 'sk-***');
  out = out.replace(/Bearer\s+[A-Za-z0-9_\-\.]{20,}/gi, 'Bearer ***');
  out = out.replace(/(authorization:\s*).+/gi, '$1***');
  return out;
}
