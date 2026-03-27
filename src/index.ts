// index.ts — MCP server entry point for csw-claude-plugin
// CSW Claude 插件 MCP 服务入口

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CswClient } from "./client.js";
import { registerPostTools } from "./tools/posts.js";
import { registerSelectionTools } from "./tools/selections.js";
import { registerArticleTools } from "./tools/articles.js";
import { registerSectionTools } from "./tools/sections.js";
import { registerPublishingTools } from "./tools/publishing.js";
import { registerPromptTools } from "./tools/prompts.js";
import { registerReferenceTools } from "./tools/references.js";
import { registerAccountTools } from "./tools/accounts.js";

const server = new McpServer({
  name: "csw-claude-plugin",
  version: "0.1.0",
});

const client = new CswClient();

registerPostTools(server, client);
registerSelectionTools(server, client);
registerArticleTools(server, client);
registerSectionTools(server, client);
registerPublishingTools(server, client);
registerPromptTools(server, client);
registerReferenceTools(server, client);
registerAccountTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
