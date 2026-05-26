import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../core/prompt';

describe('buildPrompt', () => {
  const base = {
    diff: '+import foo',
    stat: ' src/main.ts | 1 +',
    binaryFiles: [] as string[],
    recentSubjects: ['feat: add login', 'fix: resolve crash'],
    customSystemPrompt: '',
  };

  it('conventional + english system prompt', () => {
    const result = buildPrompt({ ...base, style: { language: 'en', format: 'conventional' } });
    expect(result.system).toContain('Conventional Commits');
    expect(result.system).toContain('English');
  });

  it('plain + chinese system prompt', () => {
    const result = buildPrompt({ ...base, style: { language: 'zh', format: 'plain' } });
    expect(result.system).toContain('plain');
    expect(result.system).toContain('Simplified Chinese');
  });

  it('gitmoji format rule', () => {
    const result = buildPrompt({ ...base, style: { language: 'en', format: 'gitmoji' } });
    expect(result.system).toContain('gitmoji');
  });

  it('customSystemPrompt is appended', () => {
    const result = buildPrompt({
      ...base,
      style: { language: 'en', format: 'conventional' },
      customSystemPrompt: 'Always mention ticket number.',
    });
    expect(result.system).toContain('Always mention ticket number.');
    expect(result.system).toContain('Conventional Commits');
  });

  it('user prompt includes diff, stat, and recent commits', () => {
    const result = buildPrompt({ ...base, style: { language: 'en', format: 'conventional' } });
    expect(result.user).toContain('<diff>');
    expect(result.user).toContain('+import foo');
    expect(result.user).toContain('<diffstat>');
    expect(result.user).toContain('src/main.ts');
    expect(result.user).toContain('<recent-commits-for-style-reference>');
    expect(result.user).toContain('feat: add login');
  });

  it('user prompt includes binary file list when present', () => {
    const result = buildPrompt({
      ...base,
      binaryFiles: ['logo.png', 'font.woff'],
      style: { language: 'en', format: 'conventional' },
    });
    expect(result.user).toContain('<binary-changes>');
    expect(result.user).toContain('logo.png');
  });

  it('user prompt omits binary section when empty', () => {
    const result = buildPrompt({ ...base, style: { language: 'en', format: 'conventional' } });
    expect(result.user).not.toContain('<binary-changes>');
  });
});
