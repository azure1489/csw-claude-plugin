---
name: csw-setup
description: Configure CSW Claude Plugin — check MCP server connection and show available tools
---

Run `csw_accounts_list` to verify the MCP server connection.

If the call succeeds, report:

**CSW Claude Plugin is connected.**

Show the following tool categories and their tools:

| Category | Tools |
|----------|-------|
| Accounts (1) | `csw_accounts_list` |
| Posts (7) | `csw_posts_search`, `csw_posts_get`, `csw_posts_hide`, `csw_posts_select`, `csw_posts_deselect`, `csw_posts_favorite`, `csw_posts_unfavorite` |
| Selections (4) | `csw_selections_create`, `csw_selections_show`, `csw_selections_add`, `csw_selections_remove` |
| Articles (5) | `csw_articles_list`, `csw_articles_get`, `csw_articles_create`, `csw_articles_create_direct`, `csw_articles_update` |
| Sections (4) | `csw_sections_list`, `csw_sections_create`, `csw_sections_update`, `csw_sections_delete` |
| Publishing (3) | `csw_articles_assemble`, `csw_articles_preview`, `csw_articles_push_wechat` |
| References (2) | `csw_references_list`, `csw_references_get` |
| Prompts (1) | `csw_prompts_get` |

Then show the available skills:

- **`/article-pipeline`** — End-to-end CSW WeChat article generation from Instagram posts (confirm selections, create article, generate sections, assemble, preview, push to WeChat)
- **`/article-modify`** — Targeted article editing: modify title, summary, individual sections, or tags without regenerating the whole article

---

If the call fails (error or no response), guide the user to reconfigure:

**CSW Claude Plugin connection failed.**

Possible causes and fixes:

1. **MCP server not running** — Restart Claude Code so it picks up the MCP configuration.
2. **Invalid API key** — Re-run the installer to update your key:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/csw-team/csw-claude-plugin/main/install.sh | bash
   ```
3. **Wrong API URL** — Check that `CSW_API_URL` in `~/.claude/settings.json` points to your CSW instance.
4. **Network issue** — Verify you can reach the CSW API:
   ```bash
   curl -H "Authorization: Bearer $CSW_API_KEY" "$CSW_API_URL/api/v1/accounts"
   ```
