import { describe, it, expect } from 'vitest';
import { redactToken } from '../../core/errors';

describe('redactToken', () => {
  it('redacts a known token', () => {
    const token = 'sk-jVd4abBQ29SOA8pHaOEMdyv8cG48QrE3oa49RpxVPznHhQ8U';
    const text = `connecting with ${token} to server`;
    expect(redactToken(text, token)).toBe('connecting with sk-*** to server');
  });

  it('redacts generic sk- patterns', () => {
    const text = 'key=sk-abcdefghijklmnopqrstuvwxyz done';
    expect(redactToken(text)).toContain('sk-***');
    expect(redactToken(text)).not.toContain('abcdefghij');
  });

  it('redacts Bearer tokens', () => {
    const text = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9rest';
    expect(redactToken(text)).toBe('Bearer ***');
  });

  it('redacts Authorization header lines', () => {
    const text = 'authorization: sk-secret123456789012345678';
    expect(redactToken(text)).toBe('authorization: ***');
  });

  it('returns empty string for empty input', () => {
    expect(redactToken('')).toBe('');
  });

  it('leaves normal text untouched', () => {
    const text = 'normal log message without secrets';
    expect(redactToken(text)).toBe(text);
  });
});
