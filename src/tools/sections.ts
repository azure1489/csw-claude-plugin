// sections.ts — MCP tools for article section management
// 文章段落管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerSectionTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_sections_list",
    "获取文章的所有段落",
    {
      article_no: z.string().describe("文章编号"),
    },
    async (params) => {
      const result = await client.get(`/v1/articles/${params.article_no}/sections`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_sections_create",
    "在文章中创建新段落",
    {
      article_no: z.string().describe("文章编号"),
      section_type: z.string().describe("段落类型"),
      section_order: z.number().describe("段落排序序号"),
      content: z.string().describe("段落内容"),
      post_id: z.string().optional().describe("关联的贴文 ID"),
    },
    async (params) => {
      const result = await client.post(`/v1/articles/${params.article_no}/sections`, {
        sectionType: params.section_type,
        sectionOrder: params.section_order,
        content: params.content,
        postId: params.post_id,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_sections_update",
    "更新文章段落内容",
    {
      article_no: z.string().describe("文章编号"),
      section_id: z.string().describe("段落 ID"),
      content: z.string().describe("新的段落内容"),
    },
    async (params) => {
      const result = await client.put(
        `/v1/articles/${params.article_no}/sections/${params.section_id}`,
        { content: params.content }
      );
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_sections_delete",
    "删除文章段落",
    {
      article_no: z.string().describe("文章编号"),
      section_id: z.string().describe("段落 ID"),
    },
    async (params) => {
      const result = await client.del(
        `/v1/articles/${params.article_no}/sections/${params.section_id}`
      );
      return jsonContent(result);
    }
  );
}
