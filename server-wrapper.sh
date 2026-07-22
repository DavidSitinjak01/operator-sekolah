#!/bin/bash
# Self-restarting server wrapper.
# If next dev crashes, this script immediately restarts it.
# To stop: kill this script's PID (stored in .server-wrapper.pid)

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/dev.log"

echo $$ > "$PROJECT_DIR/.server-wrapper.pid"

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Starting Next.js dev server ===" >> "$LOG_FILE"
  cd "$PROJECT_DIR" && npx next dev -p 3000 >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server exited (code=$EXIT_CODE), restarting in 2s..." >> "$LOG_FILE"
  sleep 2
done