#!/bin/bash
set -e

echo "Installing KnowLinux Companion..."
echo ""

# Detect OS and architecture
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

if [ "$OS" != "linux" ]; then
  echo "Error: This installer only supports Linux (detected: $OS)"
  exit 1
fi

if [ "$ARCH" = "x86_64" ]; then
  BIN_NAME="knowlinux-agent-linux-x64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  BIN_NAME="knowlinux-agent-linux-arm64"
else
  echo "Error: Unsupported architecture: $ARCH"
  exit 1
fi

echo "Detected: $OS / $ARCH"
echo "Binary: $BIN_NAME"
echo ""
# Download the binary
DOWNLOAD_URL="https://github.com/muneercybrid/KnowLinux/releases/latest/download/${BIN_NAME}"
echo "Downloading from: $DOWNLOAD_URL"
TMP_FILE=$(mktemp)
if ! curl -fsSL "$DOWNLOAD_URL" -o "$TMP_FILE"; then
  echo "Error: Download failed."
  echo ""
  echo "This can happen if:"
  echo "  1. No release has been published yet"
  echo "  2. Your network blocks github.com"
  echo "  3. The binary for your architecture hasn't been built"
  rm -f "$TMP_FILE"
  exit 1
fi

chmod +x "$TMP_FILE"
echo "Downloaded: $(du -h "$TMP_FILE" | cut -f1)"
echo ""

# Install to ~/.local/bin
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"
mv "$TMP_FILE" "$INSTALL_DIR/knowlinux-agent"
echo "Installed to: $INSTALL_DIR/knowlinux-agent"

# Detect init system
if command -v systemctl &> /dev/null && systemctl --user status &> /dev/null; then
  USE_SYSTEMD=true
else
  USE_SYSTEMD=false
fi

if [ "$USE_SYSTEMD" = true ]; then
  echo "Setting up systemd user service..."
  mkdir -p "$HOME/.config/systemd/user"
  cat > "$HOME/.config/systemd/user/knowlinux-agent.service" << 'SERVICE_END'
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
SERVICE_END
  systemctl --user daemon-reload
  systemctl --user enable knowlinux-agent.service
  systemctl --user start knowlinux-agent.service
  echo "Service status:"
  systemctl --user status knowlinux-agent.service --no-pager | head -5
else
  echo "systemd not available, using nohup fallback..."
  SUPERVISOR="$HOME/.local/bin/knowlinux-supervisor.sh"
  cat > "$SUPERVISOR" << 'SUP_END'
#!/bin/bash
while true; do
  "$HOME/.local/bin/knowlinux-agent" daemon
  sleep 10
done
SUP_END
  chmod +x "$SUPERVISOR"
  pkill -f "knowlinux-supervisor.sh" 2>/dev/null || true
  pkill -f "knowlinux-agent daemon" 2>/dev/null || true
  nohup "$SUPERVISOR" < /dev/null > /dev/null 2>&1 &
  echo "Supervisor started with PID: $!"
fi
echo ""

# Auto-add PATH to shell rc files
PATH_LINE='export PATH="$HOME/.local/bin:$PATH"'
for RC in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
  if [ -f "$RC" ] && ! grep -qF "$PATH_LINE" "$RC"; then
    echo "" >> "$RC"
    echo "# KnowLinux Companion" >> "$RC"
    echo "$PATH_LINE" >> "$RC"
    echo "Added PATH to $RC"
  fi
done

# Apply PATH for this session
export PATH="$HOME/.local/bin:$PATH"

echo ""
echo "Installation complete."
echo ""

# Ask if user wants to connect now
echo "Connect this machine to KnowLinux now? [y/N]"
read -t 30 CONNECT_NOW || CONNECT_NOW="n"

if [ "$CONNECT_NOW" = "y" ] || [ "$CONNECT_NOW" = "Y" ]; then
  echo ""
  "$HOME/.local/bin/knowlinux-agent" connect
  echo ""
  echo "Now enable auto-execute for headless operation:"
  echo "  knowlinux-agent toggle-auto"
else
  echo ""
  echo "To connect later, run:"
  echo "  source ~/.bashrc  # or ~/.zshrc"
  echo "  knowlinux-agent connect"
  echo ""
  echo "Then enable auto-execute:"
  echo "  knowlinux-agent toggle-auto"
fi

echo ""
echo "View service logs:"
if [ "$USE_SYSTEMD" = true ]; then
  echo "  journalctl --user -u knowlinux-agent -f"
else
  echo "  tail -f ~/.knowlinux/daemon.log"
fi
echo ""
