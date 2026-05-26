import * as vscode from 'vscode';
import { generate } from './command';
import { getOutputChannel } from './ui';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = getOutputChannel();
  outputChannel.appendLine('ccgit activated');

  context.subscriptions.push(
    vscode.commands.registerCommand('ccgit.generate', generate),
    vscode.commands.registerCommand('ccgit.openOutputPanel', () => {
      outputChannel.show();
    }),
    vscode.commands.registerCommand('ccgit.openConfigFile', async () => {
      const os = await import('node:os');
      const path = await import('node:path');
      const configDir = process.env['CLAUDE_CONFIG_DIR'] ?? path.join(os.homedir(), '.claude');
      const filePath = path.join(configDir, 'settings.json');
      try {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
      } catch {
        await vscode.window.showErrorMessage(
          vscode.l10n.t('Could not open {0}', filePath)
        );
      }
    }),
  );
}

export function deactivate() {}
