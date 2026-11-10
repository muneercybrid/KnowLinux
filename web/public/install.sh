#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

echo -e "${BLUE}KnowLinux Companion Installer${NC}"
echo ""

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
[ "$OS" != "linux" ] && echo -e "${RED}Linux only${NC}" && exit 1

ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
  BIN="knowlinux-agent-linux-x64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  BIN="knowlinux-agent-linux-arm64"
else
  echo -e "${RED}Unsupported: $ARCH${NC}"
  exit 1
fi

echo -e "  Platform   ${GREEN}$OS/$ARCH${NC}"

REPO="muneercybrid/KnowLinux"
URL="https://github.com/${REPO}/releases/latest/download/${BIN}"
TMP=$(mktemp)

printf "  Download   "
if ! curl -fsSL "$URL" -o "$TMP" 2>/dev/null; then
  echo -e "${RED}failed${NC}"
  echo -e "  ${DIM}Manual: https://github.com/${REPO}/releases${NC}"
  rm -f "$TMP"
  exit 1
fi
SIZE=$(du -h "$TMP" | cut -f1)
echo -e "${GREEN}$SIZE${NC}"

printf "  Install    "
chmod +x "$TMP"
mkdir -p "$HOME/.local/bin"
mv "$TMP" "$HOME/.local/bin/knowlinux-agent"
echo -e "${GREEN}~/.local/bin/knowlinux-agent${NC}"

printf "  PATH       "
PATH_LINE='export PATH="$HOME/.local/bin:$PATH"'
ADDED=0
for RC in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
  if [ -f "$RC" ] && ! grep -qF "$PATH_LINE" "$RC"; then
    echo "" >> "$RC"
    echo "# KnowLinux Companion" >> "$RC"
    echo "$PATH_LINE" >> "$RC"
    ADDED=$((ADDED+1))
  fi
done
echo -e "${GREEN}$ADDED shell config(s)${NC}"
export PATH="$HOME/.local/bin:$PATH"

printf "  Service    "
if command -v systemctl >/dev/null 2>&1 && systemctl --user status >/dev/null 2>&1; then
  mkdir -p "$HOME/.config/systemd/user"
  cat > "$HOME/.config/systemd/user/knowlinux-agent.service" << 'SERVICE'
[Unit]
Description=KnowLinux Companion Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=%h/.local/bin/knowlinux-agent daemon
Restart=always
RestartSec=10
Environment="HOME=%h"

[Install]
WantedBy=default.target
SERVICE
  systemctl --user daemon-reload
  systemctl --user enable knowlinux-agent.service 2>/dev/null
  systemctl --user start knowlinux-agent.service 2>/dev/null
  echo -e "${GREEN}systemd (running)${NC}"
else
  SUP="$HOME/.local/bin/knowlinux-supervisor.sh"
  cat > "$SUP" << 'SUP_END'
#!/bin/bash
while true; do
  "$HOME/.local/bin/knowlinux-agent" daemon
  sleep 10
done
SUP_END
  chmod +x "$SUP"
  pkill -f "knowlinux-supervisor.sh" 2>/dev/null || true
  pkill -f "knowlinux-agent daemon" 2>/dev/null || true
  nohup "$SUP" < /dev/null > /dev/null 2>&1 &
  echo -e "${GREEN}nohup (running)${NC}"
fi

echo ""
echo -e "${GREEN}✓ Installation complete${NC}"
echo ""

printf "Connect this machine to KnowLinux now? [Y/n] "
read -t 30 CONNECT < /dev/tty || CONNECT="y"
if [ "$CONNECT" = "y" ] || [ "$CONNECT" = "Y" ] || [ -z "$CONNECT" ]; then
  echo ""
  knowlinux-agent connect
  echo ""
  echo -e "${DIM}Next: knowlinux-agent toggle-auto${NC}"
else
  echo ""
  echo -e "${DIM}Next steps:${NC}"
  echo -e "${DIM}  source ~/.bashrc${NC}"
  echo -e "${DIM}  knowlinux-agent connect${NC}"
  echo -e "${DIM}  knowlinux-agent toggle-auto${NC}"
fi
