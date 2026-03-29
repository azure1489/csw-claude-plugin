# csw-claude-plugin

Claude Code plugin for CSW Agent — Instagram post management and CSW WeChat article generation via MCP tools and skills.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/csw-team/csw-claude-plugin/main/install.sh | bash
```

The installer will:
1. Check Node.js >= 18
2. Prompt for your `CSW_API_KEY` and `CSW_API_URL`
3. Test connectivity to the CSW API
4. Write the MCP server config to `~/.claude/settings.json`

After installation, restart Claude Code and run `/csw-setup` to verify.

## What's Included

### MCP Tools (25 total)

| Category | Count | Tools |
|----------|-------|-------|
| Accounts | 1 | `csw_accounts_list` |
| Posts | 7 | `csw_posts_search`, `csw_posts_get`, `csw_posts_hide`, `csw_posts_select`, `csw_posts_deselect`, `csw_posts_favorite`, `csw_posts_unfavorite` |
| User Selections | 2 | `csw_user_selections_list`, `csw_user_selections_count` |
| Articles | 5 | `csw_articles_list`, `csw_articles_get`, `csw_articles_create`, `csw_articles_create_direct`, `csw_articles_update` |
| Sections | 4 | `csw_sections_list`, `csw_sections_create`, `csw_sections_update`, `csw_sections_delete` |
| Publishing | 3 | `csw_articles_assemble`, `csw_articles_preview`, `csw_articles_push_wechat` |
| References | 2 | `csw_references_list`, `csw_references_get` |
| Prompts | 1 | `csw_prompts_get` |

### Skills

| Skill | Description |
|-------|-------------|
| `/article-pipeline` | End-to-end CSW WeChat article generation from Instagram posts — confirm selections, create article, generate sections, assemble, preview, and push to WeChat |
| `/article-modify` | Targeted article editing — modify title, summary, individual sections, or tags without regenerating the full article |

## Manual Configuration

Add the following to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "csw": {
      "command": "npx",
      "args": ["-y", "csw-claude-plugin@latest"],
      "env": {
        "CSW_API_KEY": "sk-csw-your-key-here",
        "CSW_API_URL": "https://your-csw-instance.com"
      }
    }
  }
}
```

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/csw-team/csw-claude-plugin/main/install.sh | bash -s -- --uninstall
```

Or run the local script:

```bash
./install.sh --uninstall
```

## Development

```bash
npm install        # Install dependencies
npm run dev        # Run MCP server with tsx (no build step)
npm run build      # Compile TypeScript to dist/
npm run test       # Run test suite (Vitest)
npm run test:watch # Run tests in watch mode
```

## License

MIT — Copyright (c) CSW Team
