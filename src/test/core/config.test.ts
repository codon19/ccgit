import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readClaudeConfig } from '../../core/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('readClaudeConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccgit-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeJson(relativePath: string, data: unknown) {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(data));
  }

  it('reads user-level settings.json', () => {
    writeJson('.claude/settings.json', {
      env: {
        ANTHROPIC_BASE_URL: 'http://relay:3000',
        ANTHROPIC_AUTH_TOKEN: 'sk-test123456789012345678',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4-6',
      },
    });
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.baseUrl).toBe('http://relay:3000');
    expect(result.config.authToken).toBe('sk-test123456789012345678');
    expect(result.config.model).toBe('claude-sonnet-4-6');
    expect(result.config.source).toBe('user');
  });

  it('merges workspace-level over user-level', () => {
    writeJson('.claude/settings.json', {
      env: {
        ANTHROPIC_BASE_URL: 'http://relay:3000',
        ANTHROPIC_AUTH_TOKEN: 'sk-user-token-12345678901234',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4-6',
      },
    });
    const workDir = path.join(tmpDir, 'project');
    fs.mkdirSync(path.join(workDir, '.claude'), { recursive: true });
    fs.writeFileSync(
      path.join(workDir, '.claude/settings.json'),
      JSON.stringify({ env: { ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-haiku-4-5' } })
    );
    const result = readClaudeConfig({ home: tmpDir, workspaceRoot: workDir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.model).toBe('claude-haiku-4-5');
    expect(result.config.authToken).toBe('sk-user-token-12345678901234');
  });

  it('workspace.local.json wins over workspace settings', () => {
    writeJson('.claude/settings.json', {
      env: { ANTHROPIC_AUTH_TOKEN: 'sk-user-token-12345678901234' },
    });
    const workDir = path.join(tmpDir, 'project');
    fs.mkdirSync(path.join(workDir, '.claude'), { recursive: true });
    fs.writeFileSync(
      path.join(workDir, '.claude/settings.json'),
      JSON.stringify({ env: { ANTHROPIC_BASE_URL: 'http://ws:3000' } })
    );
    fs.writeFileSync(
      path.join(workDir, '.claude/settings.local.json'),
      JSON.stringify({ env: { ANTHROPIC_BASE_URL: 'http://local:3000' } })
    );
    const result = readClaudeConfig({ home: tmpDir, workspaceRoot: workDir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.baseUrl).toBe('http://local:3000');
  });

  it('returns config-missing when no settings.json exists', () => {
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('config-missing');
  });

  it('returns token-missing when no token field', () => {
    writeJson('.claude/settings.json', {
      env: { ANTHROPIC_BASE_URL: 'http://relay:3000' },
    });
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('config-token-missing');
  });

  it('falls back to ANTHROPIC_API_KEY when AUTH_TOKEN missing', () => {
    writeJson('.claude/settings.json', {
      env: {
        ANTHROPIC_API_KEY: 'sk-fallback-key-1234567890123456',
        ANTHROPIC_BASE_URL: 'http://relay:3000',
      },
    });
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.authToken).toBe('sk-fallback-key-1234567890123456');
  });

  it('returns parse-failed for corrupt JSON', () => {
    const configPath = path.join(tmpDir, '.claude/settings.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, '{bad json!!!');
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('config-parse-failed');
  });

  it('returns baseurl-invalid for non-URL base', () => {
    writeJson('.claude/settings.json', {
      env: {
        ANTHROPIC_AUTH_TOKEN: 'sk-valid-token-123456789012345',
        ANTHROPIC_BASE_URL: 'not a url at all',
      },
    });
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('config-baseurl-invalid');
  });

  it('model resolution: ANTHROPIC_DEFAULT_SONNET_MODEL > ANTHROPIC_MODEL', () => {
    writeJson('.claude/settings.json', {
      env: {
        ANTHROPIC_AUTH_TOKEN: 'sk-valid-token-123456789012345',
        ANTHROPIC_MODEL: 'claude-opus-4-7',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4-6',
      },
    });
    const result = readClaudeConfig({ home: tmpDir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.model).toBe('claude-sonnet-4-6');
  });

  it('respects configDir override', () => {
    const customDir = path.join(tmpDir, 'custom-claude');
    fs.mkdirSync(customDir, { recursive: true });
    fs.writeFileSync(
      path.join(customDir, 'settings.json'),
      JSON.stringify({
        env: { ANTHROPIC_AUTH_TOKEN: 'sk-custom-dir-token-1234567890' },
      })
    );
    const result = readClaudeConfig({ configDir: customDir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.authToken).toBe('sk-custom-dir-token-1234567890');
  });
});
