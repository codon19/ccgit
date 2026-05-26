import { describe, it, expect } from 'vitest';
import { cleanOutput, classifyError } from '../../core/llm';

describe('cleanOutput', () => {
  it('strips markdown code fences', () => {
    expect(cleanOutput('```\nfeat: add login\n```')).toBe('feat: add login');
  });

  it('strips preamble "Here is the commit message:"', () => {
    expect(cleanOutput("Here's the commit message:\nfeat: add login")).toBe('feat: add login');
  });

  it('trims whitespace', () => {
    expect(cleanOutput('  feat: add login  \n  ')).toBe('feat: add login');
  });

  it('leaves clean output untouched', () => {
    expect(cleanOutput('feat: add login')).toBe('feat: add login');
  });

  it('handles multiline body correctly', () => {
    const input = 'feat: add auth\n\n- Add JWT validation\n- Add refresh token';
    expect(cleanOutput(input)).toBe(input);
  });
});

describe('classifyError', () => {
  it('classifies 401 as auth-failed', () => {
    const err = { status: 401, message: 'unauthorized' };
    const result = classifyError(err);
    expect(result.kind).toBe('auth-failed');
  });

  it('classifies 429 as rate-limited', () => {
    const err = { status: 429, message: 'rate limit', headers: { 'retry-after': '30' } };
    const result = classifyError(err);
    expect(result.kind).toBe('rate-limited');
    if (result.kind === 'rate-limited') {
      expect(result.retryAfter).toBe(30);
    }
  });

  it('classifies ECONNREFUSED as network-error', () => {
    const err = { cause: { code: 'ECONNREFUSED' }, message: 'fetch failed' };
    const result = classifyError(err);
    expect(result.kind).toBe('network-error');
  });

  it('classifies timeout errors', () => {
    const err = { message: 'Request timed out' };
    const result = classifyError(err);
    expect(result.kind).toBe('timeout');
  });

  it('classifies unknown errors', () => {
    const err = { message: 'something weird' };
    const result = classifyError(err);
    expect(result.kind).toBe('unknown');
  });
});
