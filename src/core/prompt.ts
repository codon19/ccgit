import type { StylePreference } from './style';

export type PromptInput = {
  diff: string;
  stat: string;
  binaryFiles: string[];
  recentSubjects: string[];
  style: StylePreference;
  customSystemPrompt: string;
};

export type Prompt = {
  system: string;
  user: string;
};

const FORMAT_RULES: Record<StylePreference['format'], string> = {
  conventional:
    'Use Conventional Commits format: <type>(<optional scope>): <subject>. Allowed types: feat, fix, refactor, docs, style, test, chore, perf, build, ci, revert.',
  plain: 'Use plain subject (no type prefix).',
  gitmoji: 'Prefix subject with a gitmoji emoji that matches the change type.',
};

const LANGUAGE_RULES: Record<StylePreference['language'], string> = {
  en: 'Write the entire message in English.',
  zh: 'Write the entire message in Simplified Chinese. Keep code identifiers, file paths, and English technical terms (API, SDK, etc.) in English.',
  'zh-tw': 'Write the entire message in Traditional Chinese. Keep code identifiers, file paths, and English technical terms in English.',
  ja: 'Write the entire message in Japanese. Keep code identifiers, file paths, and English technical terms in English.',
  ko: 'Write the entire message in Korean. Keep code identifiers, file paths, and English technical terms in English.',
};

function buildSystem(style: StylePreference, custom: string): string {
  let system = `You are a commit message generator. Output ONLY the commit message body — no explanations, no markdown code fences, no preamble like "Here's the commit:".

Rules:
- Subject line: ≤ 72 characters, imperative mood, no trailing period.
- ${FORMAT_RULES[style.format]}
- ${LANGUAGE_RULES[style.language]}
- If multiple distinct changes: subject summarizes the dominant one, then a blank line, then a body listing each as "- <change>" bullets.
- If a single small change: subject only, no body.
- Do not invent file names, function names, or behaviors not present in the diff. If unsure, describe at a higher level.
- Do not reference issue numbers unless they appear in the diff or recent log.

If the diff was truncated (you'll see "[truncated]" markers), rely on the diffstat for breadth and the visible hunks for depth.`;

  if (custom.trim()) {
    system += '\n\n' + custom.trim();
  }

  return system;
}

function buildUser(input: PromptInput): string {
  let user = 'Here is the change to summarize.\n\n';

  if (input.recentSubjects.length > 0) {
    user += '<recent-commits-for-style-reference>\n';
    user += input.recentSubjects.slice(0, 5).join('\n') + '\n';
    user += '</recent-commits-for-style-reference>\n\n';
  }

  if (input.stat) {
    user += '<diffstat>\n' + input.stat + '\n</diffstat>\n\n';
  }

  if (input.binaryFiles.length > 0) {
    user += '<binary-changes>\n' + input.binaryFiles.join('\n') + '\n</binary-changes>\n\n';
  }

  user += '<diff>\n' + input.diff + '\n</diff>\n\n';
  user += 'Generate the commit message now.';

  return user;
}

export function buildPrompt(input: PromptInput): Prompt {
  return {
    system: buildSystem(input.style, input.customSystemPrompt),
    user: buildUser(input),
  };
}
