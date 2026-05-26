# ccgit

Zero-config AI commit message generator for **Claude Code CLI** users.

> Whatever provider ccswitch is pointing at, ccgit uses. No separate API key needed.

## Quick Start

1. Install [ccswitch](https://github.com/farion1231/cc-switch) and configure at least one Claude provider
2. Install ccgit from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=songguanghui.ccgit)
3. Stage your changes in VS Code
4. Click the ✨ icon at the top of the Source Control panel
5. Review and commit

## How It Works

ccgit reads `~/.claude/settings.json` (the same file ccswitch writes) and uses the `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` to call the Anthropic API directly. No extra configuration needed.

## Features

- **Zero config** — reads your existing Claude Code CLI setup
- **Relay/proxy support** — works with any `ANTHROPIC_BASE_URL` (the gap ai-commit doesn't fill)
- **Smart style** — auto-detects commit language and format from your recent history
- **Long diff handling** — intelligently truncates with diffstat for context
- **i18n** — English + Simplified Chinese UI

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `ccgit.model` | (from config) | Override model |
| `ccgit.style.language` | `auto` | Message language |
| `ccgit.style.format` | `auto` | Format: conventional, plain, gitmoji |
| `ccgit.diff.maxTokens` | `12000` | Max token budget for diff |
| `ccgit.customSystemPrompt` | (empty) | Custom rules appended to prompt |
| `ccgit.recentCommitsForStyle` | `20` | Commits to analyze for style |

## Privacy & Security

- **Your API token never leaves your machine** — it is sent only to the `ANTHROPIC_BASE_URL` you configured
- **No telemetry.** ccgit does not collect or transmit any data
- **No third-party services.** Only contacts the server you configured
- Tokens are automatically redacted in all log output

## vs ai-commit

[ai-commit](https://github.com/Sitoi/ai-commit) is great if you configure API keys directly in VS Code. ccgit is for Claude Code users on **ccswitch + relay setups** where ai-commit's Claude path (no `CLAUDE_BASE_URL` setting) doesn't work.

## Troubleshooting

**"Claude Code config not found"** — Install ccswitch and configure a provider, or run `claude setup-token` in your terminal.

**"Authentication failed"** — Your token may be expired. Switch to a valid provider in ccswitch.

**"Network error"** — Check that your relay station is running and reachable.

## License

MIT
