# CSW 帖子搜索 MCP — Codex 安装指南

> 这份文档既给 agent 读，也给人类读。Agent 读了之后会按步骤自动执行；
> 人类可以把它当成 checklist，每一步手工跑一遍。
>
> 需要完整功能（全部 26 个工具 + 文章生成 Skill）请看 [`INSTALL.md`](./INSTALL.md)。

适用于只需要搜索 CSW 帖子的 Codex 用户：只装 `csw_posts_search`、`csw_posts_window`、`csw_posts_get` 三个只读工具，**不装任何 Skill**。

Agent 按以下步骤执行，每步完成后向用户反馈结果；任何一步失败就停下来说明原因，等用户决定。

## S1 — 检查环境

- `node --version` 需 ≥ v18；`git --version` 需已安装。缺哪个就告诉用户怎么装，先不继续。
- 运行 `codex --version` 并记下版本。

## S2 — 收集 API Key

- 向用户要 `CSW_API_KEY`，必须以 `sk-csw-` 开头，否则让用户重新输入。没有 Key 的话，让用户到 https://agent.campsomewhere.com/api-keys 创建（建议每台机器单独建一个）。
- 复述时只显示前 10 位和后 4 位，中间打码，等用户确认。
- `CSW_API_URL` 固定为 `https://agent-api.campsomewhere.com`（正式环境），不用问。

## S3 — 测试连通性

```bash
curl -s -w '\n[%{http_code}]\n' -H "Authorization: Bearer <KEY>" \
  "https://agent-api.campsomewhere.com/api/v1/posts/search?query=camping&limit=2"
```

- 200 且带帖子数据：通过。
- 401 / 403：Key 不对，回到 S2。
- 000 或超时：网络不通，停下来报告。

## S4 — 写入 Codex 配置

1. 备份：`cp ~/.codex/config.toml ~/.codex/config.toml.bak.$(date +%Y%m%d%H%M%S)`。文件不存在就新建，不用备份。
2. 如果已经有 `[mcp_servers.csw]`，把现有内容给用户看，问是否替换，不要直接覆盖。
3. 在文件**末尾追加**下面这段，不改动其他内容（`<KEY>` 换成用户的 Key）：

```toml
[mcp_servers.csw]
command = "npx"
args = ["-y", "github:azure1489/csw-claude-plugin"]
startup_timeout_sec = 90
enabled_tools = ["csw_posts_search", "csw_posts_window", "csw_posts_get"]

[mcp_servers.csw.env]
CSW_API_KEY = "<KEY>"
CSW_API_URL = "https://agent-api.campsomewhere.com"

[mcp_servers.csw.tools.csw_posts_search]
approval_mode = "approve"

[mcp_servers.csw.tools.csw_posts_window]
approval_mode = "approve"

[mcp_servers.csw.tools.csw_posts_get]
approval_mode = "approve"
```

4. `chmod 600 ~/.codex/config.toml`，因为文件里有 Key。

## S5 — 预热并检查启动

1. 清掉可能存在的旧版本缓存：`rm -rf ~/.npm/_npx`
2. 预先拉取并编译，避免 Codex 首次启动超时（约 30–60 秒）：

   ```bash
   CSW_API_KEY=<KEY> CSW_API_URL=https://agent-api.campsomewhere.com \
     timeout 120 npx -y github:azure1489/csw-claude-plugin < /dev/null
   ```

   这是 stdio 服务器：没报错、挂着不动或超时退出都算正常；报 `Cannot find module` 或 npm 错误就把错误给用户看。macOS 没有 `timeout` 命令时，去掉 `timeout 120`，确认启动没报错后按 Ctrl+C 结束。
3. `codex mcp list` 中应能看到 `csw`。

## S6 — 重启并验证

告诉用户「请退出并重新打开 Codex」，重启后让用户输入以下两句验证：

- 「用 csw 搜一下关于帐篷搭建的帖子，给我前 5 条」：应调用 `csw_posts_search`，并返回帖子列表。
- 「用 csw 列出昨天到今天的帖子数量」：应调用 `csw_posts_window`。

最后把下面的「工具说明」告诉用户。

## 工具说明

- `csw_posts_search`：语义搜索，`query` 是自然语言，按相似度排序，最多返回 100 条；可以加 `account`、`tags`（逗号分隔的标签 ID）、`start`、`end` 来筛选。传 `order=popular` 会改成按点赞数排序，搜索词基本就不起作用了。
- `csw_posts_window`：取一段时间内的全部帖子，不做语义匹配，单次最多 2000 条，`has_more` 为 true 时用 `offset` 翻页。
- `csw_posts_get`：用 `post_id` 查单个帖子的详情，`include_media=true` 时会带上媒体。

## 故障排查与卸载

- 重启后看不到 csw 工具或提示配置错误：先删掉 `enabled_tools` 这一行，再重启试一次（不同版本的 Codex 对这个字段的支持可能不一样）。
- MCP 启动超时：把 `startup_timeout_sec` 调到 180，或重新执行 S5 的预热。
- 工具调用全部 401：Key 错误或已被吊销，到 https://agent.campsomewhere.com/api-keys 重新创建。
- 卸载：从 `~/.codex/config.toml` 中删除 `[mcp_servers.csw]` 及其下所有 `[mcp_servers.csw.*]` 小节，然后重启 Codex。
