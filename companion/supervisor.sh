#!/bin/bash
# KnowLinux Companion Supervisor

BUN="/home/codespace/.bun/bin/bun"
AGENT="/workspaces/KnowLinux/companion/index.ts"
LOG="/home/codespace/.knowlinux/daemon.log"

mkdir -p "$(dirname "$LOG")"

echo "[$(date)] Supervisor started (PID $$)" >> "$LOG"

while true; do
  echo "[$(date)] Starting daemon..." >> "$LOG"
  "$BUN" run "$AGENT" daemon < /dev/null >> "$LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Daemon exited with code $EXIT_CODE. Restarting in 5s..." >> "$LOG"
  sleep 5
done
