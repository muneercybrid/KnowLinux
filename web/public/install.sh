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

# Ensure PATH includes ~/.local/bin
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  echo "Note: Add this to your ~/.bashrc or ~/.zshrc:"
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo ""
fi

echo "Installation complete."
echo ""
echo "Next step - connect this machine to KnowLinux:"
echo ""
echo "  knowlinux-agent connect"
echo ""
echo "This will show a 6-digit code. Go to:"
echo "  https://knowlinux.tech/activate"
echo "and paste the code to authorize this machine."
echo ""
echo "After connecting, enable auto-execute for headless operation:"
echo "  knowlinux-agent toggle-auto"
echo ""
echo "View service logs:"
if [ "$USE_SYSTEMD" = true ]; then
  echo "  journalctl --user -u knowlinux-agent -f"
else
  echo "  tail -f ~/.knowlinux/daemon.log"
fi
echo ""
