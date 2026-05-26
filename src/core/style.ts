export type StyleSettings = {
  language: 'auto' | 'english' | 'simplified-chinese' | 'traditional-chinese' | 'japanese' | 'korean';
  format: 'auto' | 'conventional' | 'plain' | 'gitmoji';
};

export type StylePreference = {
  language: 'en' | 'zh' | 'zh-tw' | 'ja' | 'ko';
  format: 'conventional' | 'plain' | 'gitmoji';
};

const CJK_REGEX = /[一-鿿㐀-䶿豈-﫿]/g;
const CONVENTIONAL_REGEX = /^(feat|fix|chore|refactor|docs|test|style|perf|build|ci|revert)(\(.+\))?: /;
const GITMOJI_REGEX = /^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}]/u;

function detectLanguage(logs: string[]): StylePreference['language'] {
  if (logs.length === 0) return 'en';
  const allText = logs.join(' ');
  const cjkMatches = allText.match(CJK_REGEX);
  const ratio = (cjkMatches?.length ?? 0) / Math.max(allText.length, 1);
  return ratio > 0.15 ? 'zh' : 'en';
}

function detectFormat(logs: string[]): StylePreference['format'] {
  if (logs.length === 0) return 'conventional';

  let conventionalCount = 0;
  let gitmojiCount = 0;

  for (const log of logs) {
    if (CONVENTIONAL_REGEX.test(log)) conventionalCount++;
    if (GITMOJI_REGEX.test(log)) gitmojiCount++;
  }

  const threshold = logs.length * 0.4;
  if (gitmojiCount >= threshold) return 'gitmoji';
  if (conventionalCount >= threshold) return 'conventional';
  return 'plain';
}

const LANGUAGE_MAP: Record<string, StylePreference['language']> = {
  english: 'en',
  'simplified-chinese': 'zh',
  'traditional-chinese': 'zh-tw',
  japanese: 'ja',
  korean: 'ko',
};

export function detectStyle(logs: string[], settings: StyleSettings): StylePreference {
  const language: StylePreference['language'] =
    settings.language !== 'auto' ? (LANGUAGE_MAP[settings.language] ?? 'en') : detectLanguage(logs);

  const format: StylePreference['format'] =
    settings.format !== 'auto' ? settings.format : detectFormat(logs);

  return { language, format };
}
