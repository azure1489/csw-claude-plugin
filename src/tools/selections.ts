// selections.ts — MCP tools for user post selections
// 用户选帖管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerSelectionTools(server: McpServer, client: CswClient) {
  // User selections (from web UI, not session-based)
  server.tool(
    "csw_user_selections_list",
    "列出用户在前端勾选的贴文（非会话模式）",
    {
      page: z.number().optional().describe("页码，默认 1"),
      size: z.number().optional().describe("每页数量，默认 20"),
    },
    async (params) => {
      const query: Record<string, string> = {};
      if (params.page !== undefined) query.page = String(params.page);
      if (params.size !== undefined) query.size = String(params.size);
      const result = await client.get("/v1/selections", query);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_user_selections_count",
    "获取用户已勾选贴文的数量",
    {},
    async () => {
      const result = await client.get("/v1/selections/count");
      return jsonContent(result);
    }
  );

}
