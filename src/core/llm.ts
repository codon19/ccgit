import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeConfig } from './config';
import type { Prompt } from './prompt';
import type { CcgitError } from './errors';

export function cleanOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:\w+)?\n?/, '').replace(/\n?```$/, '');
  s = s.replace(/^(here(?:'s| is)[^\n]*|the commit message[^\n]*?)[:\n]\s*/i, '');
  return s.trim();
}

export function classifyError(err: unknown): CcgitError {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;

    if (typeof e.status === 'number') {
      if (e.status === 401 || e.status === 403) {
        return { kind: 'auth-failed', status: e.status };
      }
      if (e.status === 429) {
        const headers = e.headers as Record<string, string> | undefined;
        const retryAfter = headers?.['retry-after'] ? parseInt(headers['retry-after'], 10) : undefined;
        return { kind: 'rate-limited', retryAfter };
      }
    }

    const message = String(e.message ?? '');
    if (message.toLowerCase().includes('timed out') || message.toLowerCase().includes('timeout')) {
      return { kind: 'timeout' };
    }

    const cause = e.cause as Record<string, unknown> | undefined;
    if (cause?.code === 'ECONNREFUSED' || cause?.code === 'ENOTFOUND' || message.includes('fetch failed')) {
      return { kind: 'network-error', reason: message };
    }
  }

  return { kind: 'unknown', cause: err };
}

export async function generateMessage(cfg: ClaudeConfig, prompt: Prompt): Promise<string> {
  const client = new Anthropic({
    apiKey: cfg.authToken,
    baseURL: cfg.baseUrl,
  });

  const resp = await client.messages.create({
    model: cfg.model ?? 'claude-sonnet-4-6',
    max_tokens: 512,
    temperature: 0.3,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  }, { timeout: 30_000 });

  const text = resp.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  if (!text.trim()) {
    throw { kind: 'model-refused', reason: 'Model returned empty content' } satisfies CcgitError;
  }

  return cleanOutput(text);
}
