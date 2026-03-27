// selections.ts — MCP tools for selection session management
// 选稿会话管理 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerSelectionTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_selections_create",
    "创建新的选稿会话",
    {},
    async () => {
      const result = await client.post("/v1/selection-sessions");
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_selections_show",
    "获取选稿会话详情",
    {
      session_id: z.string().describe("选稿会话 ID"),
    },
    async (params) => {
      const result = await client.get(`/v1/selection-sessions/${params.session_id}`);
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_selections_add",
    "向选稿会话添加贴文",
    {
      session_id: z.string().describe("选稿会话 ID"),
      post_id: z.string().describe("贴文 ID"),
    },
    async (params) => {
      const result = await client.post(
        `/v1/selection-sessions/${params.session_id}/posts/${params.post_id}`
      );
      return jsonContent(result);
    }
  );

  server.tool(
    "csw_selections_remove",
    "从选稿会话移除贴文",
    {
      session_id: z.string().describe("选稿会话 ID"),
      post_id: z.string().describe("贴文 ID"),
    },
    async (params) => {
      const result = await client.del(
        `/v1/selection-sessions/${params.session_id}/posts/${params.post_id}`
      );
      return jsonContent(result);
    }
  );
}
