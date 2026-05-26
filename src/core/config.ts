import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { CcgitError } from './errors';

export type ClaudeConfig = {
  baseUrl: string;
  authToken: string;
  model?: string;
  source: 'user' | 'workspace' | 'workspace-local';
};

type ConfigError = Extract<
  CcgitError,
  { kind: 'config-missing' | 'config-parse-failed' | 'config-token-missing' | 'config-baseurl-invalid' }
>;

export type ConfigResult =
  | { ok: true; config: ClaudeConfig }
  | { ok: false; error: ConfigError };

export type ReadOpts = {
  home?: string;
  configDir?: string;
  workspaceRoot?: string;
};

function tryReadJson(filePath: string): { ok: true; data: Record<string, unknown> } | { ok: false; error: ConfigError } {
  if (!fs.existsSync(filePath)) return { ok: false, error: { kind: 'config-missing' } };
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e: unknown) {
    const reason = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { kind: 'config-parse-failed', path: filePath, reason } };
  }
}

function getEnv(data: Record<string, unknown>): Record<string, string> {
  const env = data?.env;
  if (env && typeof env === 'object' && !Array.isArray(env)) {
    return env as Record<string, string>;
  }
  return {};
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export function readClaudeConfig(opts: ReadOpts = {}): ConfigResult {
  const configDir = opts.configDir ?? path.join(opts.home ?? os.homedir(), '.claude');
  const userPath = path.join(configDir, 'settings.json');

  const userResult = tryReadJson(userPath);
  if (!userResult.ok) return userResult;

  let mergedEnv = getEnv(userResult.data);
  let source: ClaudeConfig['source'] = 'user';

  if (opts.workspaceRoot) {
    const wsPath = path.join(opts.workspaceRoot, '.claude', 'settings.json');
    const wsResult = tryReadJson(wsPath);
    if (wsResult.ok) {
      mergedEnv = { ...mergedEnv, ...getEnv(wsResult.data) };
      source = 'workspace';
    } else if (wsResult.error.kind === 'config-parse-failed') {
      return wsResult;
    }

    const localPath = path.join(opts.workspaceRoot, '.claude', 'settings.local.json');
    const localResult = tryReadJson(localPath);
    if (localResult.ok) {
      mergedEnv = { ...mergedEnv, ...getEnv(localResult.data) };
      source = 'workspace-local';
    } else if (localResult.error.kind === 'config-parse-failed') {
      return localResult;
    }
  }

  const authToken = mergedEnv['ANTHROPIC_AUTH_TOKEN'] || mergedEnv['ANTHROPIC_API_KEY'] || '';
  if (!authToken) {
    return { ok: false, error: { kind: 'config-token-missing' } };
  }

  const baseUrl = mergedEnv['ANTHROPIC_BASE_URL'] || '';
  if (baseUrl && !isValidUrl(baseUrl)) {
    return { ok: false, error: { kind: 'config-baseurl-invalid', value: baseUrl } };
  }

  const model = mergedEnv['ANTHROPIC_DEFAULT_SONNET_MODEL'] || mergedEnv['ANTHROPIC_MODEL'] || undefined;

  return {
    ok: true,
    config: { baseUrl: baseUrl || 'https://api.anthropic.com', authToken, model, source },
  };
}
