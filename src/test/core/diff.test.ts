import { describe, it, expect } from 'vitest';
import { preprocess } from '../../core/diff';

describe('preprocess', () => {
  const smallDiff = `diff --git a/src/main.ts b/src/main.ts
index 1234567..abcdefg 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,3 +1,4 @@
 import { foo } from './foo';
+import { bar } from './bar';

 export function main() {
`;

  it('passes through a small diff unchanged', () => {
    const result = preprocess(smallDiff, { maxTokens: 12000 });
    expect(result.diff).toContain("import { bar } from './bar'");
    expect(result.truncated).toBe(false);
  });

  it('extracts diffstat', () => {
    const result = preprocess(smallDiff, { maxTokens: 12000 });
    expect(result.stat).toContain('src/main.ts');
  });

  it('detects and strips binary files', () => {
    const binaryDiff = `diff --git a/logo.png b/logo.png
Binary files /dev/null and b/logo.png differ
diff --git a/src/main.ts b/src/main.ts
--- a/src/main.ts
+++ b/src/main.ts
@@ -1 +1,2 @@
 hello
+world`;
    const result = preprocess(binaryDiff, { maxTokens: 12000 });
    expect(result.binaryFiles).toEqual(['logo.png']);
    expect(result.diff).not.toContain('Binary files');
    expect(result.diff).toContain('+world');
  });

  it('truncates when exceeding maxTokens', () => {
    const longLine = '+' + 'x'.repeat(200) + '\n';
    const hugeDiff = `diff --git a/big.ts b/big.ts
--- a/big.ts
+++ b/big.ts
@@ -1,1 +1,5000 @@
` + longLine.repeat(5000);

    const result = preprocess(hugeDiff, { maxTokens: 500 });
    expect(result.truncated).toBe(true);
    expect(result.diff).toMatch(/\[truncated|\[message truncated/);
    expect(result.diff.length / 4).toBeLessThan(600);
  });

  it('handles empty diff', () => {
    const result = preprocess('', { maxTokens: 12000 });
    expect(result.diff).toBe('');
    expect(result.stat).toBe('');
    expect(result.binaryFiles).toEqual([]);
    expect(result.truncated).toBe(false);
  });
});
