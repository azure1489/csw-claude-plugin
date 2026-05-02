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
