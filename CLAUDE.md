# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@aworld/csw-claude-plugin` — A generic, agent-installable MCP + Skills package that bridges Instagram post management with WeChat article generation. It exposes 26 MCP tools for the CSW (营事编集室) backend API and includes two Agent Skills for end-to-end article workflows. Installable by any agent supporting MCP and the Anthropic Agent Skills format via a single GitHub URL (see `INSTALL.md`).

## Commands

```bash
npm run build        # Compile TypeScript → dist/
npm run dev          # Run MCP server directly via tsx (no build needed)
npm test             # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
```

## Architecture

```
src/index.ts          # MCP server entry — creates McpServer, registers all tool modules, connects StdioServerTransport
src/client.ts         # CswClient — single HTTP client class wrapping all REST calls to CSW backend
src/tools/*.ts        # 8 tool modules, each exports registerXxxTools(server, client)
skills/               # Two Agent Skills (article-pipeline, article-modify) with SKILL.md files
INSTALL.md            # Agent-readable installation guide — agents read this and execute the 5-step install flow
```

**Tool registration pattern**: Every tool module exports a `registerXxxTools(server: McpServer, client: CswClient)` function. Inside, each tool uses `server.tool(name, description, zodSchema, handler)`. Handlers call `client.get/post/put/del()` and return via the `jsonContent()` helper.

**API communication**: `CswClient` reads `CSW_API_KEY` and `CSW_API_URL` from environment variables. Base URL is `{CSW_API_URL}/api`. All requests use Bearer token auth.

## Tool Modules (26 tools across 8 files)

| Module | Tools | Domain |
|--------|-------|--------|
| accounts.ts | 1 | Instagram 账号列表 |
| posts.ts | 8 | 帖子搜索/选稿/收藏/隐藏 |
| selections.ts | 2 | 用户选稿列表与计数 |
| articles.ts | 5 | 文章 CRUD + 直接创建 |
| sections.ts | 4 | 文章分段 CRUD |
| publishing.ts | 3 | 组装/预览/推送微信 |
| references.ts | 2 | 参考资料列表与详情 |
| prompts.ts | 1 | 获取 prompt 模板 |

## Skills

- **article-pipeline** (`skills/article-pipeline/SKILL.md`): 5-step flow — 确认选帖 → 创建文章 → 生成内容(含多个 GATE 确认点) → 组装预览 → 发布微信。也支持 `csw_articles_create_direct` 一键简化流程。
- **article-modify** (`skills/article-modify/SKILL.md`): 修改已有文章的分段内容，5 步流程。

## Conventions

- All tool names use `csw_` prefix with snake_case
- Tool descriptions and error messages are in Chinese
- Zod schemas define all tool parameters inline (no shared schema files)
- Each `jsonContent()` wraps response data as `{ content: [{ type: "text", text: JSON.stringify(data) }] }`
- ESM throughout (`"type": "module"` in package.json, `.js` extensions in imports)
- Tests live in `test/` and use Vitest
