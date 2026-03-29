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
      include_selections: z.string().optional().describe("是否包含关联选稿，传 'true' 或 'false'"),
    },
    async (params) => {
      const result = await client.get(`/v1/articles/${params.article_no}`, {
        "include-selections": params.include_selections === "true" ? "true" : undefined,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_create",
    "创建文章，可选传入贴文 ID 关联并标记为已发布，不传则创建空文章",
    {
      post_ids: z.string().optional().describe("贴文 ID，逗号分隔。不传则创建空文章"),
    },
    async (params) => {
      const body: Record<string, unknown> = {};
      if (params.post_ids) {
        body.postIds = params.post_ids.split(",").map((id: string) => id.trim());
      }
      const result = await client.post("/v1/articles", body);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_create_direct",
    "直接创建文章（指定标题、摘要和内容）",
    {
      title: z.string().describe("文章标题"),
      summary: z.string().optional().describe("文章摘要"),
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
      const body: Record<string, unknown> = {};
      if (params.title !== undefined) body.title = params.title;
      if (params.summary !== undefined) body.summary = params.summary;
      if (params.content !== undefined) body.content = params.content;
      if (params.tags !== undefined) body.tags = params.tags;
      const result = await client.put(`/v1/articles/${params.article_no}`, body);
      return jsonContent(result);
    }
  );
}
