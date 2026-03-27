// posts.ts — MCP tools for Instagram post management
// Instagram 贴文管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerPostTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_posts_search",
    "搜索 Instagram 贴文，支持语义搜索和结构化过滤",
    {
      query: z.string().optional().describe("语义搜索关键词"),
      account: z.string().optional().describe("按账号过滤"),
      tags: z.string().optional().describe("按标签过滤"),
      start: z.string().optional().describe("开始日期 (ISO 8601)"),
      end: z.string().optional().describe("结束日期 (ISO 8601)"),
      order: z.enum(["latest", "popular", "similarity"]).optional().describe("排序方式"),
      limit: z.number().optional().describe("返回数量上限"),
    },
    async (params) => {
      const result = await client.get("/v1/posts/search", {
        query: params.query,
        account: params.account,
        tags: params.tags,
        start: params.start,
        end: params.end,
        order: params.order,
        limit: params.limit !== undefined ? String(params.limit) : undefined,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_get",
    "获取单篇 Instagram 贴文详情",
    {
      post_id: z.string().describe("贴文 ID"),
      include_media: z.boolean().optional().describe("是否包含媒体内容"),
    },
    async (params) => {
      const result = await client.get(`/v1/posts/${params.post_id}`, {
        "include-media": params.include_media,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_hide",
    "隐藏或取消隐藏贴文",
    {
      post_id: z.string().describe("贴文 ID"),
      hidden: z.boolean().describe("true 为隐藏，false 为取消隐藏"),
    },
    async (params) => {
      const result = await client.post(`/v1/posts/${params.post_id}/hide`, {
        hidden: params.hidden,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_select",
    "选中贴文（加入选稿）",
    {
      post_id: z.string().describe("贴文 ID"),
    },
    async (params) => {
      const result = await client.post(`/v1/posts/${params.post_id}/select`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_deselect",
    "取消选中贴文",
    {
      post_id: z.string().describe("贴文 ID"),
    },
    async (params) => {
      const result = await client.del(`/v1/posts/${params.post_id}/select`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_favorite",
    "收藏贴文",
    {
      post_id: z.string().describe("贴文 ID"),
    },
    async (params) => {
      const result = await client.post(`/v1/posts/${params.post_id}/favorite`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_unfavorite",
    "取消收藏贴文",
    {
      post_id: z.string().describe("贴文 ID"),
    },
    async (params) => {
      const result = await client.del(`/v1/posts/${params.post_id}/favorite`);
      return jsonContent(result);
    }
  );
}
