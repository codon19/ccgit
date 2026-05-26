import * as vscode from 'vscode';
import { readClaudeConfig } from '../core/config';
import { preprocess } from '../core/diff';
import { detectStyle, type StyleSettings } from '../core/style';
import { buildPrompt } from '../core/prompt';
import { generateMessage, classifyError } from '../core/llm';
import type { CcgitError } from '../core/errors';
import { getRepository, getDiffPreferStaged, getRecentSubjects, writeInputBox } from './git';
import { showError, log } from './ui';

export async function generate(sc?: vscode.SourceControl): Promise<void> {
  const config = vscode.workspace.getConfiguration('ccgit');

  try {
    const rootUri = (sc as unknown as { rootUri?: vscode.Uri })?.rootUri;
    const repo = getRepository(rootUri);

    const diff = await getDiffPreferStaged(repo);

    const recentCount = config.get<number>('recentCommitsForStyle', 20);
    const recentSubjects = await getRecentSubjects(repo, recentCount);

    const configResult = readClaudeConfig({
      workspaceRoot: repo.rootUri.fsPath,
    });
    if (!configResult.ok) {
      await showError(configResult.error);
      return;
    }
    const claudeConfig = configResult.config;

    const modelOverride = config.get<string>('model', '');
    if (modelOverride) {
      claudeConfig.model = modelOverride;
    }

    const maxTokens = config.get<number>('diff.maxTokens', 12000);
    const diffResult = preprocess(diff, { maxTokens });

    const styleSettings: StyleSettings = {
      language: config.get('style.language', 'auto') as StyleSettings['language'],
      format: config.get('style.format', 'auto') as StyleSettings['format'],
    };
    const style = detectStyle(recentSubjects, styleSettings);

    const customSystemPrompt = config.get<string>('customSystemPrompt', '');
    const prompt = buildPrompt({
      diff: diffResult.diff,
      stat: diffResult.stat,
      binaryFiles: diffResult.binaryFiles,
      recentSubjects: recentSubjects.slice(0, 5),
      style,
      customSystemPrompt,
    });

    log(`Generating commit message (model: ${claudeConfig.model ?? 'claude-sonnet-4-6'}, baseURL host: ${new URL(claudeConfig.baseUrl).host})`, claudeConfig.authToken);
    if (diffResult.truncated) {
      log(`Diff truncated. Stat:\n${diffResult.stat}`, claudeConfig.authToken);
    }

    const message = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.SourceControl,
        title: vscode.l10n.t('Generating commit message...'),
      },
      () => generateMessage(claudeConfig, prompt)
    );

    writeInputBox(repo, message);
    log('Commit message generated successfully.', claudeConfig.authToken);
  } catch (err: unknown) {
    const classified = isCcgitError(err) ? err : classifyError(err);
    await showError(classified, undefined);
  }
}

function isCcgitError(err: unknown): err is CcgitError {
  return err !== null && typeof err === 'object' && 'kind' in err;
}
