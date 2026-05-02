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
