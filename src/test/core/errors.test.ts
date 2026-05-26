import { describe, it, expect } from 'vitest';
import type { CcgitError } from '../../core/errors';

describe('CcgitError type', () => {
  it('can construct config-missing error', () => {
    const err: CcgitError = { kind: 'config-missing' };
    expect(err.kind).toBe('config-missing');
  });
});
