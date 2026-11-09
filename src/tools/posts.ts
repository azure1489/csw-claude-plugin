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
    "csw_posts_window",
    "取时间窗内的全部贴文数据（含媒体列表），按时间倒序。不走语义搜索，没有 csw_posts_search 的 100 条上限；不传 start/end 时默认「前一天到当天」（UTC）。采集全量用这个，不要用 csw_posts_search",
    {
      start: z.string().optional().describe("开始日期 YYYY-MM-DD 或 ISO 8601 时间（含）；缺省为前一天 00:00 UTC"),
      end: z.string().optional().describe("结束日期 YYYY-MM-DD（含当天整日）或 ISO 8601 时间（不含）；缺省为当天"),
      include_hidden: z.string().optional().describe("传 'true' 时包含已隐藏的贴文"),
      include_media: z.string().optional().describe("传 'false' 时不带媒体列表；默认带"),
      limit: z.number().optional().describe("单次上限，最大 2000，默认 2000"),
      offset: z.number().optional().describe("偏移量；返回里 has_more 为 true 时再按 offset 取余下部分"),
    },
    async (params) => {
      const result = await client.get("/v1/posts/window", {
        start: params.start,
        end: params.end,
        include_hidden: params.include_hidden,
        include_media: params.include_media,
        limit: params.limit !== undefined ? String(params.limit) : undefined,
        offset: params.offset !== undefined ? String(params.offset) : undefined,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_get",
    "获取单篇 Instagram 贴文详情",
    {
      post_id: z.string().describe("贴文 ID"),
      include_media: z.string().optional().describe("是否包含媒体内容，传 'true' 或 'false'"),
    },
    async (params) => {
      const result = await client.get(`/v1/posts/${params.post_id}`, {
        "include-media": params.include_media === "true" ? "true" : undefined,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_posts_hide",
    "隐藏或取消隐藏贴文",
    {
      post_id: z.string().describe("贴文 ID"),
      hidden: z.string().describe("'true' 为隐藏，'false' 为取消隐藏"),
    },
    async (params) => {
      const result = await client.post(`/v1/posts/${params.post_id}/hide`, {
        hidden: params.hidden === "true",
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
