import { describe, it, expect } from 'vitest';
import { detectStyle, type StyleSettings } from '../../core/style';

describe('detectStyle', () => {
  const defaultSettings: StyleSettings = { language: 'auto', format: 'auto' };

  it('detects Chinese language when CJK ratio > 15%', () => {
    const logs = ['修复登录页面的bug', '添加用户注册功能', '更新依赖版本'];
    const result = detectStyle(logs, defaultSettings);
    expect(result.language).toBe('zh');
  });

  it('detects English language', () => {
    const logs = ['fix login page bug', 'add user registration', 'update dependencies'];
    const result = detectStyle(logs, defaultSettings);
    expect(result.language).toBe('en');
  });

  it('detects Conventional Commits format', () => {
    const logs = [
      'feat: add login page',
      'fix: resolve crash on startup',
      'chore: update deps',
      'refactor(auth): simplify token flow',
      'normal commit without prefix',
    ];
    const result = detectStyle(logs, defaultSettings);
    expect(result.format).toBe('conventional');
  });

  it('detects plain format when no pattern dominates', () => {
    const logs = ['Add login page', 'Fix crash', 'Update readme', 'Refactor code'];
    const result = detectStyle(logs, defaultSettings);
    expect(result.format).toBe('plain');
  });

  it('detects gitmoji format', () => {
    const logs = ['\u{1F41B} fix crash', '\u{2728} add feature', '\u{1F527} update config', '\u{1F4DD} update docs'];
    const result = detectStyle(logs, defaultSettings);
    expect(result.format).toBe('gitmoji');
  });

  it('settings override language detection', () => {
    const logs = ['fix login bug', 'add feature'];
    const result = detectStyle(logs, { language: 'simplified-chinese', format: 'auto' });
    expect(result.language).toBe('zh');
  });

  it('settings override format detection', () => {
    const logs = ['fix login bug', 'add feature'];
    const result = detectStyle(logs, { language: 'auto', format: 'conventional' });
    expect(result.format).toBe('conventional');
  });

  it('handles empty logs gracefully', () => {
    const result = detectStyle([], defaultSettings);
    expect(result.language).toBe('en');
    expect(result.format).toBe('conventional');
  });
});
