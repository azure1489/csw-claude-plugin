#!/usr/bin/env bash
# install.sh — CSW Claude Plugin installer/uninstaller
# 安装/卸载脚本
#
# Usage:
#   curl -sSL <url>/install.sh | bash
#   curl -sSL <url>/install.sh | bash -s -- --api-key sk-csw-xxx --api-url https://...
#   curl -sSL <url>/install.sh | bash -s -- --uninstall

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }

CONFIG_FILE="${HOME}/.claude.json"
NPM_PACKAGE="@aworld/csw-claude-plugin@latest"
MCP_NAME="csw"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
ARG_UNINSTALL=false
ARG_API_KEY=""
ARG_API_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --uninstall)  ARG_UNINSTALL=true; shift ;;
    --api-key)    ARG_API_KEY="$2"; shift 2 ;;
    --api-url)    ARG_API_URL="$2"; shift 2 ;;
    *)            shift ;;
  esac
done

# ---------------------------------------------------------------------------
# Uninstall
# ---------------------------------------------------------------------------
uninstall() {
  info "Removing ${MCP_NAME} MCP server from ${CONFIG_FILE} ..."

  if [[ ! -f "${CONFIG_FILE}" ]]; then
    warn "${CONFIG_FILE} not found — nothing to remove."
    exit 0
  fi

  node -e "
    const fs = require('fs');
    const f = '${CONFIG_FILE}';
    const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (cfg.mcpServers && cfg.mcpServers['${MCP_NAME}']) {
      delete cfg.mcpServers['${MCP_NAME}'];
      fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
      console.log('Removed mcpServers.${MCP_NAME}');
    } else {
      console.log('mcpServers.${MCP_NAME} not found — nothing to remove');
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

  # 2. Get CSW_API_KEY (from arg or prompt)
  CSW_API_KEY="${ARG_API_KEY}"
  if [[ -z "${CSW_API_KEY}" ]]; then
    echo ""
    while true; do
      read -rp "Enter CSW_API_KEY (must start with sk-csw-): " CSW_API_KEY
      if [[ "${CSW_API_KEY}" == sk-csw-* ]]; then
        break
      fi
      warn "API key must start with 'sk-csw-'. Please try again."
    done
  fi

  # 3. Get CSW_API_URL (from arg or prompt)
  CSW_API_URL="${ARG_API_URL}"
  if [[ -z "${CSW_API_URL}" ]]; then
    DEFAULT_URL="https://csw.example.com"
    read -rp "Enter CSW_API_URL [${DEFAULT_URL}]: " CSW_API_URL
    CSW_API_URL="${CSW_API_URL:-${DEFAULT_URL}}"
  fi

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

  # 5. Write MCP config to ~/.claude.json
  info "Writing MCP config to ${CONFIG_FILE} ..."

  node -e "
    const fs = require('fs');
    const f = '${CONFIG_FILE}';
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) {}
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers['${MCP_NAME}'] = {
      command: 'npx',
      args: ['-y', '${NPM_PACKAGE}'],
      env: {
        CSW_API_KEY: '${CSW_API_KEY}',
        CSW_API_URL: '${CSW_API_URL}'
      }
    };
    fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
    console.log('Written: ' + f);
  "

  ok "CSW Claude Plugin installed successfully!"
  echo ""
  echo -e "${GREEN}Available MCP Tools (27 total):${NC}"
  echo "  Accounts (1)    Posts (7)       Selections (4)"
  echo "  Articles (5)    Sections (4)    Publishing (3)"
  echo "  References (2)  Prompts (1)"
  echo ""
  info "Restart Claude Code to activate the plugin."
}

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if [[ "${ARG_UNINSTALL}" == "true" ]]; then
  uninstall
else
  install
fi
