// articles.ts — MCP tools for article management
// 文章管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerArticleTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_articles_list",
    "获取文章列表，支持关键词、时间范围和状态过滤",
    {
      keyword: z.string().optional().describe("关键词搜索"),
      page: z.number().optional().describe("页码"),
      size: z.number().optional().describe("每页数量"),
      start: z.string().optional().describe("开始日期 (ISO 8601)"),
      end: z.string().optional().describe("结束日期 (ISO 8601)"),
      status: z.number().optional().describe("文章状态"),
    },
    async (params) => {
      const result = await client.get("/v1/articles", {
        keyword: params.keyword,
        page: params.page !== undefined ? String(params.page) : undefined,
        size: params.size !== undefined ? String(params.size) : undefined,
        start: params.start,
        end: params.end,
        status: params.status !== undefined ? String(params.status) : undefined,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_get",
    "获取单篇文章详情",
    {
      article_no: z.string().describe("文章编号"),
      include_selections: z.boolean().optional().describe("是否包含关联选稿"),
    },
    async (params) => {
      const result = await client.get(`/v1/articles/${params.article_no}`, {
        "include-selections": params.include_selections,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_create",
    "基于选稿会话创建文章",
    {
      selection_session_id: z.string().describe("选稿会话 ID"),
    },
    async (params) => {
      const result = await client.post("/v1/articles", {
        selectionSessionId: params.selection_session_id,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_create_direct",
    "直接创建文章（指定标题、摘要和内容）",
    {
      title: z.string().describe("文章标题"),
      summary: z.string().describe("文章摘要"),
      content: z.string().describe("文章正文内容"),
    },
    async (params) => {
      const result = await client.post("/v1/articles/direct", {
        title: params.title,
        summary: params.summary,
        content: params.content,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_update",
    "更新文章内容（标题、摘要、正文或标签）",
    {
      article_no: z.string().describe("文章编号"),
      title: z.string().optional().describe("文章标题"),
      summary: z.string().optional().describe("文章摘要"),
      content: z.string().optional().describe("文章正文内容"),
      tags: z.array(z.string()).optional().describe("文章标签列表"),
    },
    async (params) => {
      const result = await client.put(`/v1/articles/${params.article_no}`, {
        title: params.title,
        summary: params.summary,
        content: params.content,
        tags: params.tags,
      });
      return jsonContent(result);
    }
  );
}
