import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('ccgit');
  outputChannel.appendLine('ccgit activated');
}

export function deactivate() {}
