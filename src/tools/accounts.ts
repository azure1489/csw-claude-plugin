// accounts.ts — MCP tool for account management
// 账号管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerAccountTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_accounts_list",
    "获取 Instagram 账号列表，支持按平台和关键词过滤",
    {
      platform: z.string().optional().describe("平台过滤"),
      keyword: z.string().optional().describe("关键词搜索"),
    },
    async (params) => {
      const result = await client.get("/v1/accounts", {
        platform: params.platform,
        keyword: params.keyword,
      });
      return jsonContent(result);
    }
  );
}
