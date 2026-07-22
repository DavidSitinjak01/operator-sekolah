#!/bin/bash
# Cron helper: starts Next.js if not already running
# Runs every minute via crontab

PORT=3000
PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/dev.log"
LOCK_FILE="$PROJECT_DIR/.server-running"

# Check if server is healthy
if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://127.0.0.1:${PORT}/" 2>/dev/null)
  if [ "$CODE" = "200" ]; then
    exit 0  # Healthy, do nothing
  fi
fi

# Server is down — restart
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cron: Server down, restarting..." >> "$LOG_FILE"

# Kill leftovers
ps aux | grep -E "next-server|next dev" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
sleep 1

# Start
cd "$PROJECT_DIR" && nohup npx next dev -p "$PORT" >> "$LOG_FILE" 2>&1 &
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cron: Started (PID=$!)" >> "$LOG_FILE"