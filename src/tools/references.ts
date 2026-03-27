// references.ts — MCP tools for reference content management
// 参考内容管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerReferenceTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_references_list",
    "获取参考内容列表",
    {
      page: z.number().optional().describe("页码"),
      size: z.number().optional().describe("每页数量"),
    },
    async (params) => {
      const result = await client.get("/v1/references", {
        page: params.page !== undefined ? String(params.page) : undefined,
        size: params.size !== undefined ? String(params.size) : undefined,
      });
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_references_get",
    "获取单条参考内容详情",
    {
      id: z.number().describe("参考内容 ID"),
    },
    async (params) => {
      const result = await client.get(`/v1/references/${params.id}`);
      return jsonContent(result);
    }
  );
}
