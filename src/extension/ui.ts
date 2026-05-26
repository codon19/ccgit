import * as vscode from 'vscode';
import type { CcgitError } from '../core/errors';
import { redactToken } from '../core/errors';

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('ccgit');
  }
  return outputChannel;
}

export function log(message: string, token?: string): void {
  const channel = getOutputChannel();
  const safe = redactToken(message, token);
  channel.appendLine(`[${new Date().toISOString()}] ${safe}`);
}

export async function showError(error: CcgitError, token?: string): Promise<void> {
  const channel = getOutputChannel();

  switch (error.kind) {
    case 'config-missing':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('Claude Code config not found. Configure via ccswitch or run `claude setup-token`.'),
        vscode.l10n.t('Help')
      );
      break;
    case 'config-parse-failed':
      const openFile = await vscode.window.showErrorMessage(
        vscode.l10n.t('Failed to parse config: {0}', error.reason),
        vscode.l10n.t('Open File')
      );
      if (openFile) {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(error.path));
        await vscode.window.showTextDocument(doc);
      }
      break;
    case 'config-token-missing':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('ANTHROPIC_AUTH_TOKEN not found in Claude Code config.')
      );
      break;
    case 'config-baseurl-invalid':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('ANTHROPIC_BASE_URL is not a valid URL: {0}', error.value)
      );
      break;
    case 'no-repo':
      await vscode.window.showWarningMessage(
        vscode.l10n.t('Current workspace is not a Git repository.')
      );
      break;
    case 'no-changes':
      await vscode.window.showInformationMessage(
        vscode.l10n.t('No changes to summarize (staged and unstaged are both empty).')
      );
      break;
    case 'git-extension-unavailable':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('VSCode built-in Git extension not available. Make sure it is enabled.')
      );
      break;
    case 'auth-failed':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('Authentication failed (HTTP {0}). Token may be expired.', String(error.status))
      );
      break;
    case 'rate-limited':
      await vscode.window.showWarningMessage(
        vscode.l10n.t('Rate limited. Retry in {0}s.', String(error.retryAfter ?? '?'))
      );
      break;
    case 'network-error':
      log(error.reason, token);
      const openPanel = await vscode.window.showErrorMessage(
        vscode.l10n.t('Network error: {0}', error.reason),
        vscode.l10n.t('Open Output')
      );
      if (openPanel) channel.show();
      break;
    case 'timeout':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('Request timed out (30s). Relay may be unstable.')
      );
      break;
    case 'model-refused':
      await vscode.window.showErrorMessage(
        vscode.l10n.t('Model returned no valid commit message.')
      );
      break;
    case 'unknown':
      log(String(error.cause), token);
      const showPanel = await vscode.window.showErrorMessage(
        vscode.l10n.t('Unexpected error. See output panel.'),
        vscode.l10n.t('Open Output')
      );
      if (showPanel) channel.show();
      break;
  }
}
