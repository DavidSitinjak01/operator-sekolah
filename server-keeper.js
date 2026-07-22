// server-keeper.js — Keeps Next.js dev server alive, auto-restarts on crash

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = '/home/z/my-project';
const LOG_FILE = path.join(PROJECT_DIR, 'dev.log');
const PORT = 3000;
const PID_FILE = path.join(PROJECT_DIR, '.server-keeper.pid');

fs.writeFileSync(PID_FILE, String(process.pid));

function log(msg) {
  const line = `[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

function startServer() {
  return new Promise((resolve, reject) => {
    log('STARTING Next.js dev server...');

    // Kill leftovers
    try {
      execSync("ps aux | grep -E 'next-server|next dev' | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null", { stdio: 'ignore' });
    } catch {}

    const child = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
      cwd: PROJECT_DIR,
      stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')],
      detached: false,
    });

    child.on('exit', (code) => {
      log(`Server exited (code=${code}). Will restart in 3s...`);
      setTimeout(() => startServer().then(() => {}).catch(() => {}), 3000);
    });

    child.on('error', (err) => {
      log(`Server error: ${err.message}. Will restart in 3s...`);
      setTimeout(() => startServer().then(() => {}).catch(() => {}), 3000);
    });

    // Give it time to start
    let attempts = 0;
    const checker = setInterval(() => {
      attempts++;
      if (attempts > 60) {
        clearInterval(checker);
        log('Server failed to start within 60s');
        reject(new Error('timeout'));
        return;
      }
      http.get(`http://127.0.0.1:${PORT}/`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(checker);
          log(`Server ready (took ${attempts}s)`);
          resolve(child);
        }
      }).on('error', () => {}).setTimeout(2000, function() { this.destroy(); });
    }, 1000);
  });
}

async function main() {
  log('════════ SERVER KEEPER STARTED ════════');
  await startServer();
  // Keep the process alive by setting an interval
  setInterval(() => {
    // Heartbeat — keep event loop alive
  }, 60000);
}

main().catch((err) => {
  log(`Fatal: ${err.message}`);
  // Don't exit — keep trying
  setTimeout(() => main().catch(() => {}), 5000);
});
