---
title: 通用 Skill 安装方案设计
date: 2026-05-02
status: approved
---

# 通用 Skill 安装方案设计

## 背景

当前 `csw-claude-plugin` 是 Claude Code 专属插件：

- 安装通过 `install.sh` 脚本，硬编码检测 `~/.claude/` 与 `~/.openclaw/` 两种平台路径
- 项目根含 `.claude-plugin/plugin.json` 与 `marketplace.json`（Claude Code plugin marketplace 标准）
- MCP server 通过 `npx -y @aworld/csw-claude-plugin@latest` 启动，依赖 npm registry 发布
- 内置 `commands/setup.md` 提供 `/csw-setup` slash command（仅 Claude Code）

随着越来越多 agent 支持 MCP + Anthropic Agent Skills 格式（OpenClaw、Cursor、Cline、Gemini CLI 等），上述包装把项目限制在 Claude Code 生态中。

## 目标

让任何兼容 MCP + Anthropic Agent Skills 格式的 agent，仅通过项目的 GitHub 仓库 URL 就能完成完整安装：

1. 用户对 agent 说 "帮我安装 https://github.com/azure1489/csw-claude-plugin"
2. Agent 自动 fetch 安装指令、询问用户输入凭据、配置 MCP、放置 skill 文件
3. 整个过程不依赖任何平台专属脚本或 marketplace 机制

## 非目标

- **不**改变 SKILL.md 的核心内容（`csw_xxx` MCP 工具调用、领域语义保持原样）
- **不**支持完全无 MCP server 的 skill（skill 仍依赖 CSW MCP server 提供的工具）
- **不**实现自动多平台二进制分发（保留对 Node.js 的依赖）
- **不**为不支持 MCP 或 Agent Skills 格式的 agent 提供兼容垫片

## 整体架构

agent-driven 安装流程：

```
User → Agent: "Install https://github.com/azure1489/csw-claude-plugin"
        ↓
Agent fetch raw INSTALL.md
        ↓
Agent reads instructions, executes step-by-step:
  1. Ask user for CSW_API_KEY + CSW_API_URL
  2. curl test connectivity
  3. Write MCP config (npx -y github:azure1489/csw-claude-plugin) to its own MCP config location
  4. Fetch SKILL.md files to its own skills directory
  5. Prompt user to restart agent + verify
```

关键原则：**INSTALL.md 不告诉 agent 配置文件路径或 skills 目录在哪**。agent 自己知道（"完全信任 agent 自知"）。

## 项目结构变化

### 删除

| 路径 | 理由 |
|------|------|
| `install.sh` | 平台检测逻辑迁移到 INSTALL.md，由 agent 执行 |
| `.claude-plugin/plugin.json` | Claude Code plugin marketplace 专属 |
| `.claude-plugin/marketplace.json` | 同上 |
| `.claude-plugin/`（空目录） | 上述两文件删除后清理 |
| `commands/setup.md` | `/csw-setup` 是 Claude Code 专属 slash command，验证逻辑迁移到 INSTALL.md Step 5 |
| `commands/`（如清空） | 清理 |

### 新增

| 路径 | 用途 |
|------|------|
| `INSTALL.md` | Agent 可读的安装指令（包含卸载流程） |
| `docs/superpowers/specs/2026-05-02-generic-skill-installation-design.md` | 本设计文档 |

### 修改

| 路径 | 调整内容 |
|------|---------|
| `package.json` | 加 `prepare: npm run build` 脚本；从 `files` 移除 `commands` 和 `.claude-plugin`；不再 `npm publish`（但保留 `name` 字段） |
| `README.md` | 替换 "curl install.sh" 为 "对你的 agent 说"；删除"manual install"老路径；保留 What's Included / Development 两节 |
| `skills/article-pipeline/SKILL.md` | **不动**（领域语义保持原样） |
| `skills/article-pipeline/references/*` | **不动** |
| `skills/article-modify/SKILL.md` | **不动** |

## INSTALL.md 内容规范

### Header

```markdown
# CSW Claude Plugin — Agent Installation

你（agent）正在帮用户安装 `csw-claude-plugin`。这个项目提供：
- 25 个 CSW MCP 工具（Instagram 帖子管理 + 微信文章生成）
- 2 个 Agent Skill：`csw-article-pipeline`、`csw-article-modify`

请按以下顺序执行所有步骤。每一步执行后，向用户给出明确反馈再继续。
不要跳步。失败时停下来报告并请用户决策。
```

### Step 1 — 收集用户输入（含 GATE）

- 询问 `CSW_API_KEY`，**校验前缀必须是 `sk-csw-`**，校验失败重新询问
- 询问 `CSW_API_URL`，提供默认值 **`https://dev-agent.aworld.ltd`**（用户直接回车则使用默认值）
- ⛔ **GATE：复述确认** — 把两个值复述给用户，等待用户确认正确再进入下一步

### Step 2 — 测试连通性

执行：

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer <CSW_API_KEY>" \
  "<CSW_API_URL>/api/v1/accounts"
```

- HTTP 2xx：继续
- HTTP 401/403：报告"鉴权失败"，让用户检查 API_KEY，可选回到 Step 1 重新输入
- HTTP 000（网络不通）：报告 URL 无法访问，让用户决定是否继续（可能是用户的网络问题）
- 其他状态码：报告并询问用户是否继续

### Step 3 — 配置 MCP server

把以下 JSON 加到当前 agent 的 MCP 配置（server name 为 `csw`）：

```json
{
  "csw": {
    "command": "npx",
    "args": ["-y", "github:azure1489/csw-claude-plugin"],
    "env": {
      "CSW_API_KEY": "<用户输入的 KEY>",
      "CSW_API_URL": "<用户输入的 URL>"
    }
  }
}
```

**重要**：
- INSTALL.md 不指定 agent 的 MCP 配置文件具体路径（如 `~/.claude.json`、`~/.openclaw/openclaw.json`）。Agent 自己知道。
- 如果 agent 不知道怎么配置自己的 MCP，回退方案：把上述 JSON 展示给用户，让用户手工添加

### Step 4 — 安装 skill 文件

让 agent 把以下文件 fetch 到自己的 skills 目录（具体目录路径由 agent 自己决定）：

| 源 URL（main 分支 raw） | 目标位置 |
|-------------------------|---------|
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/SKILL.md` | `<skills>/csw-article-pipeline/SKILL.md` |
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/references/section-types.md` | `<skills>/csw-article-pipeline/references/section-types.md` |
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/references/prompt-templates.md` | `<skills>/csw-article-pipeline/references/prompt-templates.md` |
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-modify/SKILL.md` | `<skills>/csw-article-modify/SKILL.md` |

**实现方式**：agent 用自己习惯的方式 fetch（curl、WebFetch、原生 fetch 等），按上表逐个落盘。

**说明**：未来增加新 skill 时，需要同步更新此清单（不走 GitHub Tree API 自动探测，避免 agent 出错面）。

### Step 5 — 验证 + 重启

1. 提示用户："多数 agent 需要重启才能加载新的 MCP server。请重启 agent 后回来。"
2. 重启后引导用户：
   - 输入"列出 CSW 账号"或类似词，验证 MCP 工具 `csw_accounts_list` 可调用
   - 输入"营事编集室"或类似词，验证 `csw-article-pipeline` skill 能被触发

### Uninstall（同一份文档末尾）

反向操作：

1. 从 agent 的 MCP 配置中删除 `csw` 节点
2. 从 agent 的 skills 目录删除：
   - `<skills>/csw-article-pipeline/`
   - `<skills>/csw-article-modify/`
3. 提示用户重启 agent

同样不指定具体路径。

## package.json 调整细节

当前问题：

- 只有 `prepublishOnly: npm run build`，对 `npx -y github:...` 无效
- `bin/csw-mcp.mjs` 加载 `../dist/index.js`，但 `dist/` 不在 git 中
- `files` 字段含 `commands` 和 `.claude-plugin`，删除后这两项也要移除

调整后：

```json
{
  "name": "@aworld/csw-claude-plugin",
  "version": "0.3.0",
  "description": "CSW Agent — Instagram post management and WeChat article generation via MCP, installable by any agent",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/azure1489/csw-claude-plugin.git"
  },
  "bin": {
    "csw-mcp": "./bin/csw-mcp.mjs"
  },
  "files": ["bin", "dist", "skills"],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "npm run build"
  },
  ...
}
```

关键变化：
- 新增 `repository` 字段（如未配置）
- `prepublishOnly` → `prepare`（让 `npx -y github:...` 在拉取后自动构建）
- `files` 移除 `commands` 和 `.claude-plugin`、`install.sh`
- `version` 升至 `0.3.0`（重大架构变更）
- `description` 更新去掉 "Claude Code plugin"
- `keywords` 移除 `claude-code`，加入 `agent-skills`、`anthropic-skills`

## README.md 改造细节

新结构：

```markdown
# csw-claude-plugin

CSW Agent — Instagram 帖子管理 + 微信公众号文章生成。
提供 25 个 MCP 工具 + 2 个 Agent Skill。

## Quick Install

对你的 agent 说：

> 帮我安装 https://github.com/azure1489/csw-claude-plugin

Agent 会读取 [INSTALL.md](./INSTALL.md)，问你要 `CSW_API_KEY` 和 `CSW_API_URL`，
自动配置 MCP server 并安装 skill。

支持任何兼容 MCP + Anthropic Agent Skills 格式的 agent
（Claude Code、OpenClaw、Gemini CLI 等）。

## What's Included

[保留现有 MCP 工具表 + skill 表，删除 Claude Code 专属字眼]

## Manual Install

不想用 agent 自助安装？把 [INSTALL.md](./INSTALL.md) 当成 checklist，
里面的每一步手工执行即可（自己输入凭据、把 MCP JSON 复制到配置文件、
手工 curl 下载 SKILL.md 到对应目录）。INSTALL.md 既是给 agent 看的指令，
也是给人类看的 checklist。

## Development

[保留现有 npm dev/build/test 命令]

## License

MIT
```

## 测试方案

完整 agent-driven 安装难自动化测试，采用"人工 + 现有 unit test"组合：

1. **现有测试**保持不变（`npm test` 跑 vitest）
2. **人工验证**（必须）：
   - 在 Claude Code 里说 "帮我安装 https://github.com/azure1489/csw-claude-plugin"，跑通完整流程
   - 验证 `csw_accounts_list` 可调用
   - 验证 `csw-article-pipeline` skill 能被触发
   - 反向验证 uninstall 流程
3. **smoke test**（不阻塞，可后续加）：
   - `npm run smoke` 起 MCP server 自检（不调外部 API）

## 风险与权衡

| 风险 | 应对 |
|------|------|
| `npx -y github:...` 首次启动慢（要 git clone + npm install + tsc） | 接受。npx 有缓存，后续启动只读缓存。文档里说明首次会慢 |
| `prepare` 脚本依赖 `typescript`（devDep）。如果用户/CI 用 `--production` 装依赖，prepare 会跳过 | npx 不传 `--production`，正常情况下不影响。Doc 一行说明即可 |
| `main` 分支 raw URL 可能拉到不稳定版本 | 接受。后续如有需要可改用 release tag |
| Agent 不知道自己的 MCP 配置或 skills 目录 | INSTALL.md 提供回退："如不知如何配置，把这段 JSON 展示给用户手工添加" |
| 用户 API_KEY 错误，npx 启动后 MCP 工具调用全失败 | Step 2 的连通性测试拦截大部分情况 |
| 删 npm registry 后，已通过 `@aworld/csw-claude-plugin` 安装的旧用户升级路径中断 | 在 README 顶部加迁移说明（一句话）；旧用户用 INSTALL.md 重装 |

## 未涉及但可能后续要处理的

- 多语言文档（INSTALL.md 当前中文为主，未来可能要英文版）
- INSTALL.md 国际化 / 多语言 agent 提示
- skill 自动更新机制（用户已装 skill 后 main 有更新，agent 怎么知道）
- 标签发布流程（如果未来想用 release tag 而非 main）

这些超出当前 spec 范围。
