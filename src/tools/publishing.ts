// publishing.ts — MCP tools for article publishing workflow
// 文章发布流程 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerPublishingTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_articles_assemble",
    "组装文章（将段落合并为完整文章）",
    {
      article_no: z.string().describe("文章编号"),
    },
    async (params) => {
      const result = await client.post(`/v1/articles/${params.article_no}/assemble`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_preview",
    "生成文章预览",
    {
      article_no: z.string().describe("文章编号"),
    },
    async (params) => {
      const result = await client.post(`/v1/articles/${params.article_no}/preview`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_articles_push_wechat",
    "将文章推送到微信公众号",
    {
      article_no: z.string().describe("文章编号"),
      preview_token: z.string().describe("预览 token"),
    },
    async (params) => {
      const result = await client.post(`/v1/articles/${params.article_no}/push-wechat`, {
        previewToken: params.preview_token,
      });
      return jsonContent(result);
    }
  );
}
