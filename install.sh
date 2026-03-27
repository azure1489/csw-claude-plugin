#!/usr/bin/env bash
# install.sh — CSW Claude Plugin installer/uninstaller
# 安装/卸载脚本

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }

SETTINGS_FILE="${HOME}/.claude/settings.json"

# ---------------------------------------------------------------------------
# Uninstall
# ---------------------------------------------------------------------------
uninstall() {
  info "Removing csw MCP server from ${SETTINGS_FILE} ..."

  if [[ ! -f "${SETTINGS_FILE}" ]]; then
    warn "settings.json not found — nothing to remove."
    exit 0
  fi

  node -e "
    const fs = require('fs');
    const path = '${SETTINGS_FILE}';
    const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (cfg.mcpServers && cfg.mcpServers.csw) {
      delete cfg.mcpServers.csw;
      fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
      console.log('Removed mcpServers.csw');
    } else {
      console.log('mcpServers.csw not found — nothing to remove');
    }
  "

  ok "CSW Claude Plugin uninstalled."
}

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------
install() {
  # 1. Check Node.js >= 18
  info "Checking Node.js version..."
  if ! command -v node &>/dev/null; then
    error "Node.js is not installed. Please install Node.js >= 18 from https://nodejs.org"
    exit 1
  fi

  NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
  if (( NODE_MAJOR < 18 )); then
    error "Node.js ${NODE_MAJOR} detected. Node.js >= 18 is required."
    exit 1
  fi
  ok "Node.js $(node --version) detected."

  # 2. Prompt for CSW_API_KEY
  echo ""
  while true; do
    read -rp "Enter CSW_API_KEY (must start with sk-csw-): " CSW_API_KEY
    if [[ "${CSW_API_KEY}" == sk-csw-* ]]; then
      break
    fi
    warn "API key must start with 'sk-csw-'. Please try again."
  done

  # 3. Prompt for CSW_API_URL
  DEFAULT_URL="https://csw.example.com"
  read -rp "Enter CSW_API_URL [${DEFAULT_URL}]: " CSW_API_URL
  CSW_API_URL="${CSW_API_URL:-${DEFAULT_URL}}"

  # 4. Test connectivity
  info "Testing connectivity to ${CSW_API_URL}/api/v1/accounts ..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${CSW_API_KEY}" \
    "${CSW_API_URL}/api/v1/accounts" || echo "000")

  if [[ "${HTTP_STATUS}" == "000" ]]; then
    warn "Could not reach ${CSW_API_URL} — check the URL and network connectivity."
    warn "Proceeding with installation anyway."
  elif [[ "${HTTP_STATUS}" == "401" || "${HTTP_STATUS}" == "403" ]]; then
    warn "Authentication failed (HTTP ${HTTP_STATUS}) — verify your CSW_API_KEY."
    warn "Proceeding with installation anyway."
  elif [[ "${HTTP_STATUS}" =~ ^2 ]]; then
    ok "Connection successful (HTTP ${HTTP_STATUS})."
  else
    warn "Unexpected HTTP status ${HTTP_STATUS} — proceeding anyway."
  fi

  # 5. Write MCP config to ~/.claude/settings.json
  info "Writing MCP config to ${SETTINGS_FILE} ..."
  mkdir -p "$(dirname "${SETTINGS_FILE}")"

  node -e "
    const fs = require('fs');
    const path = '${SETTINGS_FILE}';
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (_) {}
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers.csw = {
      command: 'npx',
      args: ['-y', 'csw-claude-plugin@latest'],
      env: {
        CSW_API_KEY: '${CSW_API_KEY}',
        CSW_API_URL: '${CSW_API_URL}'
      }
    };
    fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
    console.log('Written: ' + path);
  "

  ok "CSW Claude Plugin installed successfully!"
  echo ""
  echo -e "${GREEN}Available Skills:${NC}"
  echo "  /article-pipeline  — End-to-end WeChat article generation from Instagram posts"
  echo "  /article-modify    — Targeted article editing (title, summary, sections, tags)"
  echo ""
  echo -e "${GREEN}Available MCP Tools (27 total):${NC}"
  echo "  Accounts (1):    csw_accounts_list"
  echo "  Posts (7):       csw_posts_search, csw_posts_get, csw_posts_hide,"
  echo "                   csw_posts_select, csw_posts_deselect,"
  echo "                   csw_posts_favorite, csw_posts_unfavorite"
  echo "  Selections (4):  csw_selections_create, csw_selections_show,"
  echo "                   csw_selections_add, csw_selections_remove"
  echo "  Articles (5):    csw_articles_list, csw_articles_get,"
  echo "                   csw_articles_create, csw_articles_create_direct,"
  echo "                   csw_articles_update"
  echo "  Sections (4):    csw_sections_list, csw_sections_create,"
  echo "                   csw_sections_update, csw_sections_delete"
  echo "  Publishing (3):  csw_articles_assemble, csw_articles_preview,"
  echo "                   csw_articles_push_wechat"
  echo "  References (2):  csw_references_list, csw_references_get"
  echo "  Prompts (1):     csw_prompts_get"
  echo ""
  info "Restart Claude Code to activate the plugin."
  info "Run '/csw-setup' to verify the connection."
}

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--uninstall" ]]; then
  uninstall
else
  install
fi
