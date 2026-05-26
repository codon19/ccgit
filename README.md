# ccgit

为 **Claude Code CLI** 用户打造的零配置 AI 提交信息生成器。

> ccswitch 指向哪个 provider，ccgit 就用哪个。无需单独配置 API Key。

## 快速开始

1. 安装 [ccswitch](https://github.com/farion1231/cc-switch) 并配置至少一个 Claude provider
2. 从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=codon19.ccgit) 安装 ccgit
3. 在 VS Code 中暂存（Stage）你的变更
4. 点击 Source Control 面板顶部的 ✨ 图标
5. 检查生成的提交信息，确认后提交

## 工作原理

ccgit 读取 `~/.claude/settings.json`（ccswitch 写入的同一个文件），使用其中的 `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` 直接调用 Anthropic 兼容接口。无需额外配置。

## 特性

- **零配置** — 直接复用你现有的 Claude Code CLI 设置
- **中转站/代理支持** — 兼容任何 `ANTHROPIC_BASE_URL`（ai-commit 填不了的坑）
- **智能风格** — 自动检测你近期 commit 的语言和格式（Conventional Commits / 纯文本 / Gitmoji）
- **长 diff 处理** — 智能截断，保留 diffstat 让模型仍能看到全貌
- **国际化** — 界面支持英文 + 简体中文

## 配置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `ccgit.model` | （从 Claude 配置读取） | 覆盖生成 commit 所用的模型 |
| `ccgit.style.language` | `auto` | 生成信息的语言 |
| `ccgit.style.format` | `auto` | 格式：conventional、plain、gitmoji |
| `ccgit.diff.maxTokens` | `12000` | 发送给模型的 diff 最大 token 量 |
| `ccgit.customSystemPrompt` | （空） | 追加到 system prompt 的自定义规则 |
| `ccgit.recentCommitsForStyle` | `20` | 用于风格检测的近期 commit 数量 |

## 隐私与安全

- **你的 API Token 永远不会离开本机** — 它只会发往你自己配置的 `ANTHROPIC_BASE_URL`
- **无遥测。** ccgit 不收集、不传输任何数据
- **无第三方服务。** 只连接你配置的服务器
- 所有日志输出中的 Token 会被自动脱敏

## 与 ai-commit 的区别

[ai-commit](https://github.com/Sitoi/ai-commit) 适合在 VS Code 里直接配置 API Key 的用户。ccgit 面向使用 **ccswitch + 中转站** 的 Claude Code 用户 —— ai-commit 的 Claude 路径缺少 `CLAUDE_BASE_URL` 设置，无法走中转站。

## 常见问题

**"未找到 Claude Code 配置文件"** — 安装 ccswitch 并配置一个 provider，或在终端运行 `claude setup-token`。

**"鉴权失败"** — Token 可能已过期，在 ccswitch 中切换到有效的配置。

**"网络错误"** — 检查你的中转站是否正常运行且可达。

## 许可

MIT
