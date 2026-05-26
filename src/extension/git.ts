import * as vscode from 'vscode';
import type { GitExtension, GitAPI, Repository } from './types';

function getGitAPI(): GitAPI {
  const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExt) {
    throw { kind: 'git-extension-unavailable' as const };
  }
  const exports = gitExt.exports;
  if (!exports) {
    throw { kind: 'git-extension-unavailable' as const };
  }
  return exports.getAPI(1);
}

export function getRepository(rootUri?: vscode.Uri): Repository {
  const api = getGitAPI();
  if (api.repositories.length === 0) {
    throw { kind: 'no-repo' as const };
  }
  if (rootUri) {
    const repo = api.repositories.find(r => r.rootUri.fsPath === rootUri.fsPath);
    if (repo) return repo;
  }
  return api.repositories[0];
}

export async function getDiffPreferStaged(repo: Repository): Promise<string> {
  let diff = await repo.diff(true);
  if (!diff.trim()) {
    diff = await repo.diff(false);
  }
  if (!diff.trim()) {
    throw { kind: 'no-changes' as const };
  }
  return diff;
}

export async function getRecentSubjects(repo: Repository, count: number): Promise<string[]> {
  try {
    const commits = await repo.log({ maxEntries: count });
    return commits.map(c => c.message.split('\n')[0]);
  } catch {
    return [];
  }
}

export function writeInputBox(repo: Repository, message: string): void {
  repo.inputBox.value = message;
}
