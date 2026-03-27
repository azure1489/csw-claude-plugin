// prompts.ts — MCP tool for retrieving system prompts
// 获取系统提示词 MCP 工具

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CswClient } from "../client.js";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerPromptTools(server: McpServer, client: CswClient) {
  server.tool(
    "csw_prompts_get",
    "获取系统提示词配置",
    {},
    async () => {
      const result = await client.get("/v1/prompts");
      return jsonContent(result);
    }
  );
}
