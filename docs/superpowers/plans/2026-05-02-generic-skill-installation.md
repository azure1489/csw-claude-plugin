# Generic Agent-Driven Skill Installation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert this Claude-Code-specific plugin into a generic agent-installable package: any MCP+Skills compatible agent can install everything (MCP server + skills) just from the GitHub URL `https://github.com/azure1489/csw-claude-plugin`, by reading a single `INSTALL.md`.

**Architecture:** Strip Claude-Code-specific packaging (`install.sh`, `.claude-plugin/`, `commands/setup.md`). Replace npm-registry-based MCP launch with `npx -y github:azure1489/csw-claude-plugin` (auto-build via `prepare` script). Add a single `INSTALL.md` that an agent reads and executes — collecting credentials, configuring its own MCP, and fetching SKILL.md files into its own skills directory. The agent is trusted to know its own configuration paths.

**Tech Stack:** Node.js 18+, TypeScript, MCP SDK, vitest. Skill format follows Anthropic Agent Skills (YAML frontmatter + Markdown).

**Spec:** `docs/superpowers/specs/2026-05-02-generic-skill-installation-design.md`

---

## File Structure Overview

| Action | Path | Responsibility |
|--------|------|----------------|
| Delete | `install.sh` | Old shell-based installer (replaced by INSTALL.md) |
| Delete | `.claude-plugin/plugin.json` | Claude Code plugin manifest (no longer needed) |
| Delete | `.claude-plugin/marketplace.json` | Claude Code marketplace manifest |
| Delete | `.claude-plugin/` (dir) | Empty after deletions |
| Delete | `commands/setup.md` | Claude Code slash command (replaced by INSTALL.md Step 5) |
| Delete | `commands/` (dir if empty) | |
| Modify | `package.json` | Add `prepare` script, update `files`, `version`, `description`, `keywords`, `repository` |
| Modify | `README.md` | Switch to "tell your agent" install instructions |
| Modify | `CLAUDE.md` | Update tool/file references after deletions |
| Create | `INSTALL.md` | Agent-readable installation instructions (also human-readable as checklist) |

The two `skills/` SKILL.md files and `src/` MCP server code are untouched.

---

## Task 1: Remove Claude-Code-specific packaging files

**Files:**
- Delete: `install.sh`
- Delete: `.claude-plugin/plugin.json`
- Delete: `.claude-plugin/marketplace.json`
- Delete: `.claude-plugin/` (directory)
- Delete: `commands/setup.md`
- Delete: `commands/` (directory if empty)

- [ ] **Step 1: Verify current state of files to delete**

Run: `ls -la install.sh .claude-plugin/ commands/`
Expected: All three exist; `.claude-plugin/` contains `plugin.json` and `marketplace.json`; `commands/` contains `setup.md`.

- [ ] **Step 2: Delete files via git rm**

Run:
```bash
git rm install.sh \
  .claude-plugin/plugin.json \
  .claude-plugin/marketplace.json \
  commands/setup.md
```
Expected: Output shows 4 files staged for deletion.

- [ ] **Step 3: Remove now-empty directories**

Run: `rmdir .claude-plugin commands`
Expected: No output. Both directories are removed.

- [ ] **Step 4: Verify git status**

Run: `git status`
Expected: Status shows 4 files deleted, no untracked files in those directories.

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: remove Claude-Code-specific packaging

Drop install.sh, .claude-plugin/, and commands/setup.md.
Installation logic moves to a generic agent-readable INSTALL.md
in subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: Commit succeeds.

---

## Task 2: Update package.json to support `npx -y github:...` installation

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current package.json**

Run: `cat package.json`
Expected: Current content with `prepublishOnly: npm run build`, `files` containing `commands` and `.claude-plugin`, `version: 0.2.0`.

- [ ] **Step 2: Replace package.json content**

Use the Write tool to replace `package.json` with this exact content:

```json
{
  "name": "@aworld/csw-claude-plugin",
  "version": "0.3.0",
  "description": "CSW Agent — Instagram post management and WeChat article generation. Installable by any MCP+Skills compatible agent via GitHub URL.",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/azure1489/csw-claude-plugin.git"
  },
  "bin": {
    "csw-mcp": "./bin/csw-mcp.mjs"
  },
  "files": [
    "bin",
    "dist",
    "skills",
    "INSTALL.md",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.28.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "MIT",
  "keywords": [
    "mcp",
    "agent-skills",
    "anthropic-skills",
    "csw",
    "wechat",
    "instagram"
  ]
}
```

Key changes verified:
- `version`: `0.2.0` → `0.3.0`
- `description`: drops "Claude Code plugin" wording
- `repository`: new field (canonical GitHub URL)
- `files`: drops `commands`, `.claude-plugin`, `install.sh`; adds `INSTALL.md`, `README.md`
- `scripts.prepare`: replaces `prepublishOnly` (so `npx -y github:...` triggers build)
- `keywords`: drops `claude-code`; adds `agent-skills`, `anthropic-skills`
- `publishConfig` removed (no longer publishing to npm registry)

- [ ] **Step 3: Verify package.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`
Expected: Exit code 0, no output.

- [ ] **Step 4: Verify `prepare` script triggers build**

Run:
```bash
rm -rf dist
npm run prepare
ls dist/
```
Expected: `dist/` is recreated and contains `index.js` (and other compiled files).

- [ ] **Step 5: Verify existing tests still pass**

Run: `npm test`
Expected: All vitest tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
chore: prepare package.json for npx GitHub-based install

- Add prepare script so 'npx -y github:azure1489/csw-claude-plugin'
  auto-builds dist/ on install
- Trim files[] to only what npx needs (bin, dist, skills, docs)
- Add repository field, update description, refresh keywords
- Bump to 0.3.0 (architectural change)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: Commit succeeds.

---

## Task 3: Create INSTALL.md (agent-readable installation guide)

**Files:**
- Create: `INSTALL.md`

- [ ] **Step 1: Verify INSTALL.md does not exist yet**

Run: `ls INSTALL.md 2>/dev/null && echo EXISTS || echo NOT_EXISTS`
Expected: `NOT_EXISTS`

- [ ] **Step 2: Create INSTALL.md with full content**

Use the Write tool to create `INSTALL.md` with the following content. (This file is the canonical agent-instruction document; any human can also read it as a checklist.)

````markdown
# CSW Claude Plugin — Agent Installation Guide

> 这份文档既给 agent 读，也给人类读。Agent 读了之后会按步骤自动执行；
> 人类可以把它当成 checklist，每一步手工跑一遍。

---

## 你（agent）正在执行的任务

帮用户安装 `csw-claude-plugin`。这个项目提供：

- **25 个 CSW MCP 工具**：Instagram 帖子管理 + 微信文章生成的完整 API 封装
- **2 个 Agent Skill**：
  - `csw-article-pipeline` — 端到端文章生成流水线
  - `csw-article-modify` — 修改已有文章

请按以下顺序执行所有步骤。每一步执行后，向用户给出明确反馈再进入下一步。
**不要跳步**。失败时停下来报告，请用户决策。

---

## Step 1 — 收集用户输入

向用户询问以下两项配置：

1. **`CSW_API_KEY`**
   - 必须以 `sk-csw-` 开头
   - 如果用户输入的不符合此前缀，提示并重新询问
2. **`CSW_API_URL`**
   - 默认值：`https://dev-agent.aworld.ltd`
   - 如果用户直接回车 / 表示用默认，使用默认值

⛔ **GATE：复述确认**

向用户复述你收到的两个值（KEY 可只显示前后几位脱敏，URL 完整显示），
等待用户确认无误再继续。如用户说有错，回到本 Step 重新询问。

---

## Step 2 — 测试连通性

执行：

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer <CSW_API_KEY>" \
  "<CSW_API_URL>/api/v1/accounts"
```

根据返回的 HTTP 状态码：

| 状态码 | 处理 |
|--------|------|
| 2xx | 通过，进入 Step 3 |
| 401 / 403 | 报告"鉴权失败"，建议用户检查 API_KEY 是否正确，可回 Step 1 重试 |
| 000 | 报告"无法访问 URL"，让用户判断网络/URL；用户允许才继续 |
| 其他 | 报告状态码，让用户决定是否继续 |

---

## Step 3 — 配置 MCP server

把以下 JSON 节点合并到当前 agent 的 MCP 配置中（server name 用 `csw`）：

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

**重要约束**：

- 这份文档**不告诉你具体的 MCP 配置文件路径**（例如 `~/.claude.json`、`~/.openclaw/openclaw.json`、`~/.cursor/mcp.json` 等）。你应该自己知道。
- 如果你不知道怎么配置自己的 MCP，**回退方案**：把上述 JSON 完整展示给用户，请用户手工添加到他们 agent 的 MCP 配置文件中。

**首次启动说明**：`npx -y github:azure1489/csw-claude-plugin` 第一次会拉取 git
repo + 安装依赖 + 运行 `prepare` 脚本（即 `tsc` 编译）。这一步可能耗时
30-60 秒。后续启动会走 npx 缓存，迅速。

---

## Step 4 — 安装 skill 文件

把以下文件 fetch 到当前 agent 的 skills 目录（具体目录路径由你自己决定）：

| 源 URL（main 分支 raw） | 目标位置 |
|-------------------------|---------|
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/SKILL.md` | `<skills>/csw-article-pipeline/SKILL.md` |
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/references/section-types.md` | `<skills>/csw-article-pipeline/references/section-types.md` |
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/references/prompt-templates.md` | `<skills>/csw-article-pipeline/references/prompt-templates.md` |
| `https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-modify/SKILL.md` | `<skills>/csw-article-modify/SKILL.md` |

实现方式：用你习惯的方式 fetch（`curl`、`WebFetch`、原生 fetch 等），按上表逐个落盘。
确保创建必要的中间目录（如 `csw-article-pipeline/references/`）。

---

## Step 5 — 验证 + 重启提示

1. 提示用户：

   > 多数 agent 需要重启才能加载新装的 MCP server。请重启你的 agent 后回来。

2. 重启后引导用户做两个验证：

   - **MCP 工具验证**：让用户输入 "列出 CSW 账号" 或类似词。Agent 应该调用
     `csw_accounts_list` 工具，返回账号列表（即便为空也算成功）。
   - **Skill 验证**：让用户输入 "营事编集室" 或 "生成微信文章"。Agent 应能识别并触发
     `csw-article-pipeline` skill。

3. 安装完成。告知用户两个 skill 都已可用。

---

## Uninstall — 卸载流程

向 agent 发出"卸载 csw-claude-plugin"的请求时，按以下步骤执行：

1. 从当前 agent 的 MCP 配置中删除 `csw` 节点
2. 从当前 agent 的 skills 目录中删除：
   - `<skills>/csw-article-pipeline/`（整个目录，含 references）
   - `<skills>/csw-article-modify/`（整个目录）
3. 提示用户重启 agent 让卸载生效

同样：本文档不指定具体路径，由 agent 自行处理。

---

## 故障排查

| 问题 | 排查 |
|------|------|
| `npx` 启动 MCP 失败：`Cannot find module '../dist/index.js'` | `prepare` 脚本未执行成功。检查机器是否有完整 Node.js 18+ 和 `npm`；删除 npx 缓存（`npm cache clean --force`）重试 |
| MCP 工具调用全部 401/403 | API_KEY 错误。重新走 Step 1-2 |
| MCP 工具调用全部超时 / 连接失败 | URL 错误或网络不通。检查 `CSW_API_URL` |
| Skill 触发不了 | 重启 agent；确认 SKILL.md 在正确的 skills 目录里；确认 frontmatter 完整 |
````

- [ ] **Step 3: Verify INSTALL.md was created and contains expected sections**

Run: `grep -E "^## " INSTALL.md`
Expected output (in this order):
```
## 你（agent）正在执行的任务
## Step 1 — 收集用户输入
## Step 2 — 测试连通性
## Step 3 — 配置 MCP server
## Step 4 — 安装 skill 文件
## Step 5 — 验证 + 重启提示
## Uninstall — 卸载流程
## 故障排查
```

- [ ] **Step 4: Verify all four raw URLs are present**

Run: `grep -c "raw.githubusercontent.com/azure1489/csw-claude-plugin/main" INSTALL.md`
Expected: At least `4` (one per skill file in Step 4 table).

- [ ] **Step 5: Commit**

```bash
git add INSTALL.md
git commit -m "$(cat <<'EOF'
docs: add agent-readable INSTALL.md

INSTALL.md replaces install.sh as the canonical install entry point.
Any MCP+Skills compatible agent can read it and execute the 5-step
flow: collect credentials, test connectivity, configure MCP, fetch
skill files, verify.

Includes uninstall flow and troubleshooting notes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: Commit succeeds.

---

## Task 4: Rewrite README.md for agent-driven installation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Verify current README still references install.sh**

Run: `grep -c "install.sh" README.md`
Expected: ≥ 2 (current README references it in Quick Install and Uninstall sections).

- [ ] **Step 2: Replace README.md with new content**

Use the Write tool to replace `README.md` with this exact content:

````markdown
# csw-claude-plugin

CSW Agent — Instagram 帖子管理 + 微信公众号文章生成。
提供 25 个 MCP 工具 + 2 个 Agent Skill。

## Quick Install

对你的 agent（Claude Code、OpenClaw、Cursor、Cline、Gemini CLI 等任何兼容 MCP +
Anthropic Agent Skills 格式的 agent）说：

> 帮我安装 https://github.com/azure1489/csw-claude-plugin

Agent 会读取 [`INSTALL.md`](./INSTALL.md)，问你要 `CSW_API_KEY` 和
`CSW_API_URL`，自动配置 MCP server 并 fetch skill 文件到对应目录。

## What's Included

### MCP Tools (25 total)

| Category | Count | Tools |
|----------|-------|-------|
| Accounts | 1 | `csw_accounts_list` |
| Posts | 7 | `csw_posts_search`, `csw_posts_get`, `csw_posts_hide`, `csw_posts_select`, `csw_posts_deselect`, `csw_posts_favorite`, `csw_posts_unfavorite` |
| User Selections | 2 | `csw_user_selections_list`, `csw_user_selections_count` |
| Articles | 5 | `csw_articles_list`, `csw_articles_get`, `csw_articles_create`, `csw_articles_create_direct`, `csw_articles_update` |
| Sections | 4 | `csw_sections_list`, `csw_sections_create`, `csw_sections_update`, `csw_sections_delete` |
| Publishing | 3 | `csw_articles_assemble`, `csw_articles_preview`, `csw_articles_push_wechat` |
| References | 2 | `csw_references_list`, `csw_references_get` |
| Prompts | 1 | `csw_prompts_get` |

### Skills

| Skill | Description |
|-------|-------------|
| `csw-article-pipeline` | 5 步流程：确认选帖 → 创建文章 → 生成内容（含多个 GATE 确认点）→ 组装预览 → 发布微信 |
| `csw-article-modify` | 修改已有文章的分段、标题、摘要等，无需重新生成全文 |

## Manual Install

不想用 agent 自助安装？把 [`INSTALL.md`](./INSTALL.md) 当成 checklist，
里面的每一步手工执行即可（自己输入凭据、把 MCP JSON 复制到自己 agent 的配置文件、
手工 curl 下载 SKILL.md 到对应目录）。INSTALL.md 既是给 agent 看的指令，
也是给人类看的 checklist。

## Uninstall

对你的 agent 说"卸载 csw-claude-plugin"，agent 会按 `INSTALL.md` 末尾的
卸载流程操作。或者参考 INSTALL.md 的 Uninstall 章节手工清理。

## Development

```bash
npm install        # 安装依赖
npm run dev        # tsx 直接运行 MCP server（无需构建）
npm run build      # 编译 TypeScript 到 dist/
npm run test       # 跑测试
npm run test:watch # 测试 watch 模式
```

## License

MIT — Copyright (c) CSW Team
````

- [ ] **Step 3: Verify README has no remaining `install.sh` references**

Run: `grep -c "install.sh" README.md`
Expected: `0`

- [ ] **Step 4: Verify README's Quick Install section now points to GitHub URL via agent**

Run: `grep -A1 "Quick Install" README.md | head -20`
Expected: Output contains the phrase `帮我安装 https://github.com/azure1489/csw-claude-plugin`.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: rewrite README around agent-driven installation

Replace 'curl install.sh | bash' Quick Install with the
'tell your agent' instruction pointing at INSTALL.md.
Manual install path now also references INSTALL.md as checklist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: Commit succeeds.

---

## Task 5: Update CLAUDE.md to reflect new project structure

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read current CLAUDE.md**

Run: `cat CLAUDE.md`
Expected: Current content references `commands/setup.md` in the Architecture section and describes the project as a "Claude Code MCP server plugin".

- [ ] **Step 2: Update CLAUDE.md content**

Use the Edit tool to make these targeted changes to `CLAUDE.md`:

**Edit A** — Update project overview line. Find:

```
`@aworld/csw-claude-plugin` — A Claude Code MCP server plugin that bridges Instagram post management with WeChat article generation. It exposes 25 MCP tools for the CSW (营事编集室) backend API and includes two Claude Code skills for end-to-end article workflows.
```

Replace with:

```
`@aworld/csw-claude-plugin` — A generic, agent-installable MCP + Skills package that bridges Instagram post management with WeChat article generation. It exposes 25 MCP tools for the CSW (营事编集室) backend API and includes two Agent Skills for end-to-end article workflows. Installable by any agent supporting MCP and the Anthropic Agent Skills format via a single GitHub URL (see `INSTALL.md`).
```

**Edit B** — Update the Architecture file map. Find:

```
src/index.ts          # MCP server entry — creates McpServer, registers all tool modules, connects StdioServerTransport
src/client.ts         # CswClient — single HTTP client class wrapping all REST calls to CSW backend
src/tools/*.ts        # 8 tool modules, each exports registerXxxTools(server, client)
skills/               # Two Claude Code skills (article-pipeline, article-modify) with SKILL.md files
commands/setup.md     # Plugin setup command — verifies MCP connection
```

Replace with:

```
src/index.ts          # MCP server entry — creates McpServer, registers all tool modules, connects StdioServerTransport
src/client.ts         # CswClient — single HTTP client class wrapping all REST calls to CSW backend
src/tools/*.ts        # 8 tool modules, each exports registerXxxTools(server, client)
skills/               # Two Agent Skills (article-pipeline, article-modify) with SKILL.md files
INSTALL.md            # Agent-readable installation guide — agents read this and execute the 5-step install flow
```

- [ ] **Step 3: Verify CLAUDE.md no longer references commands/setup.md**

Run: `grep -c "commands/setup.md\|Plugin setup command" CLAUDE.md`
Expected: `0`

- [ ] **Step 4: Verify CLAUDE.md mentions INSTALL.md**

Run: `grep -c "INSTALL.md" CLAUDE.md`
Expected: ≥ 2 (one in overview, one in file map).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md for generic agent-installable architecture

Reflect removal of commands/setup.md and addition of INSTALL.md.
Reframe project description from 'Claude Code plugin' to
'generic agent-installable MCP + Skills package'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: Commit succeeds.

---

## Task 6: End-to-end local verification of `npx -y github:...` flow

**Files:** None modified. This task validates that the previous tasks compose correctly.

- [ ] **Step 1: Verify `npm test` still passes**

Run: `npm test`
Expected: All vitest tests pass.

- [ ] **Step 2: Simulate `npx` install from a clean state using local pack**

Run:
```bash
rm -rf dist node_modules
npm install
ls dist/
```
Expected: `npm install` runs `prepare` automatically, producing `dist/index.js` (and other compiled files).

- [ ] **Step 3: Verify the bin entry actually starts the MCP server**

Run:
```bash
timeout 2 node bin/csw-mcp.mjs 2>&1 | head -20 || true
```
Expected: Either:
- The server prints startup messages and exits when timeout fires (acceptable; means it started)
- The server runs silently waiting for stdio input (also acceptable; that's how MCP servers work — `timeout` will kill it after 2s)

In either case, **no `Error: Cannot find module` errors should appear**. If they do, `prepare` did not build correctly — go back and check Task 2.

- [ ] **Step 4: Verify INSTALL.md raw URLs are reachable (smoke test, optional but recommended)**

Run:
```bash
for url in \
  "https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/SKILL.md" \
  "https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/references/section-types.md" \
  "https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-pipeline/references/prompt-templates.md" \
  "https://raw.githubusercontent.com/azure1489/csw-claude-plugin/main/skills/article-modify/SKILL.md"; do
  echo -n "$url: "
  curl -s -o /dev/null -w "%{http_code}\n" "$url"
done
```
Expected: All four URLs return `200` once this branch is pushed to `main`. Before push, they may 404 — that's expected; re-run after push.

- [ ] **Step 5: Push to main**

```bash
git log --oneline -10
git push origin main
```
Expected: Push succeeds. After push, re-run Step 4 — all 4 URLs should now return 200.

- [ ] **Step 6: Final manual verification (do once after push)**

Manually verify in a real agent (e.g., Claude Code):

1. Open a fresh agent session
2. Tell agent: `帮我安装 https://github.com/azure1489/csw-claude-plugin`
3. Agent should fetch INSTALL.md and walk through Steps 1–5
4. Provide a real `CSW_API_KEY` and accept the default URL
5. After restart, run `csw_accounts_list` — verify it returns data
6. Type "营事编集室" — verify `csw-article-pipeline` skill triggers

If any of these fail, file an issue and iterate. This step is **not committable** but is the only true validation.

---

## Self-review checklist (run after writing the plan)

- ✅ **Spec coverage:**
  - 删 install.sh + .claude-plugin/ + commands/setup.md → Task 1
  - package.json 调整（prepare、files、version、description、keywords、repository）→ Task 2
  - 写 INSTALL.md（Header + 5 Step + Uninstall + 故障排查）→ Task 3
  - 改写 README.md → Task 4
  - 更新 CLAUDE.md（spec 中提到的"配套调整"，自补）→ Task 5
  - 测试方案（人工 + 现有 unit test）→ Task 6
- ✅ **No placeholders:** Every step has exact commands or full file content. No "TBD" / "similar to above".
- ✅ **Type/path consistency:** Skill names (`csw-article-pipeline`, `csw-article-modify`) consistent everywhere; raw URLs identical in INSTALL.md and Task 6 verification.
- ✅ **Frequent commits:** One commit per task (5 functional commits + 1 verification task that pushes them).
