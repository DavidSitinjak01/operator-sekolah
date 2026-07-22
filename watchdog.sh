#!/bin/bash
# Watchdog: keeps Next.js dev server ALWAYS alive on port 3000
# Usage: setsid nohup /home/z/my-project/watchdog.sh &

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/dev.log"
PID_FILE="$PROJECT_DIR/.watchdog.pid"
PORT=3000
CHECK_INTERVAL=5

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG_FILE"
}

# Save own PID
echo $$ > "$PID_FILE"

is_server_healthy() {
  # Check port is listening
  if ! ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
    return 1
  fi
  # Check it actually responds
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://127.0.0.1:${PORT}/" 2>/dev/null)
  [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]
}

start_server() {
  log "START: Killing leftover processes..."
  # Kill only the next-server and its parent, NOT this watchdog
  local server_pids
  server_pids=$(ps aux | grep -E "next-server|next dev" | grep -v grep | awk '{print $2}')
  if [ -n "$server_pids" ]; then
    echo "$server_pids" | xargs kill -9 2>/dev/null
    sleep 1
  fi

  log "START: Launching npx next dev -p $PORT..."
  cd "$PROJECT_DIR" && nohup npx next dev -p "$PORT" >> "$LOG_FILE" 2>&1 &
  local child_pid=$!

  # Wait up to 30s
  local i
  for i in $(seq 1 30); do
    if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
      log "START: Server ready (${i}s)"
      return 0
    fi
    # Check if child died immediately
    if ! kill -0 "$child_pid" 2>/dev/null; then
      log "START: Process exited early, retrying..."
      sleep 1
      cd "$PROJECT_DIR" && nohup npx next dev -p "$PORT" >> "$LOG_FILE" 2>&1 &
      child_pid=$!
    fi
    sleep 1
  done

  log "START: FAILED - server did not start"
  return 1
}

# ── Main ──
log "═══════ WATCHDOG STARTED (PID=$$, interval=${CHECK_INTERVAL}s) ═══════"

start_server

while true; do
  sleep "$CHECK_INTERVAL"
  
  if ! is_server_healthy; then
    log "ALERT: Server is down! Restarting..."
    start_server
  fi
done