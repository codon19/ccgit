export type DiffResult = {
  diff: string;
  stat: string;
  binaryFiles: string[];
  truncated: boolean;
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function extractBinaries(raw: string): { cleaned: string; binaryFiles: string[] } {
  const binaryFiles: string[] = [];
  const lines = raw.split('\n');
  const out: string[] = [];
  let skipUntilNext = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('Binary files ') && line.includes(' differ')) {
      const match = line.match(/Binary files .+ and [ab]\/(.+) differ/) ??
                    line.match(/Binary files \/dev\/null and [ab]\/(.+) differ/);
      if (match) binaryFiles.push(match[1]);
      skipUntilNext = true;
      continue;
    }
    if (line.startsWith('diff --git ')) {
      skipUntilNext = false;
    }
    if (!skipUntilNext) {
      out.push(line);
    }
  }

  return { cleaned: out.join('\n'), binaryFiles };
}

function buildStat(raw: string): string {
  const files: Map<string, { adds: number; dels: number }> = new Map();
  let currentFile = '';

  for (const line of raw.split('\n')) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/diff --git a\/.+ b\/(.+)/);
      if (match) currentFile = match[1];
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      const entry = files.get(currentFile) ?? { adds: 0, dels: 0 };
      entry.adds++;
      files.set(currentFile, entry);
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      const entry = files.get(currentFile) ?? { adds: 0, dels: 0 };
      entry.dels++;
      files.set(currentFile, entry);
    }
  }

  if (files.size === 0) return '';

  const lines: string[] = [];
  let totalAdds = 0, totalDels = 0;
  for (const [file, { adds, dels }] of files) {
    lines.push(` ${file} | ${adds + dels} ${'+'.repeat(Math.min(adds, 20))}${'-'.repeat(Math.min(dels, 20))}`);
    totalAdds += adds;
    totalDels += dels;
  }
  lines.push(` ${files.size} file(s) changed, ${totalAdds} insertions(+), ${totalDels} deletions(-)`);
  return lines.join('\n');
}

function truncateDiff(diff: string, maxTokens: number): { result: string; truncated: boolean } {
  if (estimateTokens(diff) <= maxTokens) {
    return { result: diff, truncated: false };
  }

  const maxChars = maxTokens * 4;
  const fileSections = diff.split(/(?=^diff --git )/m);
  const kept: string[] = [];
  let usedChars = 0;

  const sections = fileSections
    .map(s => ({ content: s, changes: (s.match(/^[+-][^+-]/gm) || []).length }))
    .sort((a, b) => b.changes - a.changes);

  for (const section of sections) {
    if (usedChars + section.content.length <= maxChars * 0.9) {
      kept.push(section.content);
      usedChars += section.content.length;
    } else {
      const lines = section.content.split('\n');
      const head = lines.slice(0, 30).join('\n');
      const truncLine = `\n... [truncated ${lines.length - 30} lines] ...\n`;
      kept.push(head + truncLine);
      usedChars += head.length + truncLine.length;
      if (usedChars > maxChars) break;
    }
  }

  let result = kept.join('');
  if (estimateTokens(result) > maxTokens) {
    result = result.slice(0, maxChars) + '\n[message truncated, see diffstat for full picture]';
  }

  return { result, truncated: true };
}

export function preprocess(raw: string, opts: { maxTokens: number }): DiffResult {
  if (!raw.trim()) {
    return { diff: '', stat: '', binaryFiles: [], truncated: false };
  }

  const { cleaned, binaryFiles } = extractBinaries(raw);
  const stat = buildStat(raw);
  const { result, truncated } = truncateDiff(cleaned, opts.maxTokens);

  return { diff: result, stat, binaryFiles, truncated };
}
