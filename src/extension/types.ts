import type * as vscode from 'vscode';

export interface GitExtension {
  getAPI(version: 1): GitAPI;
}

export interface GitAPI {
  repositories: Repository[];
}

export interface Repository {
  rootUri: vscode.Uri;
  inputBox: InputBox;
  diff(cached?: boolean): Promise<string>;
  log(opts?: { maxEntries?: number }): Promise<Commit[]>;
}

export interface InputBox {
  value: string;
}

export interface Commit {
  message: string;
}
