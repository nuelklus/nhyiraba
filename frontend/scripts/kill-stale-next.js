const { execSync } = require('child_process');

const PORT = 3000;

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    return '';
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseWindowsPids() {
  const output = run('netstat -ano -p tcp');
  if (!output) return [];

  const pids = [];
  const lines = output.split(/\r?\n/);

  for (const line of lines) {
    if (!line.includes(':3000') || !line.toLowerCase().includes('listening')) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) {
      pids.push(Number(pid));
    }
  }

  return unique(pids).filter((pid) => pid !== 0);
}

function parseUnixPids() {
  const outputs = [
    run(`lsof -ti tcp:${PORT}`),
    run(`fuser -n tcp ${PORT} 2>/dev/null`),
  ];

  const pids = [];
  for (const output of outputs) {
    for (const value of output.split(/\s+/)) {
      const pid = Number(value.trim());
      if (Number.isInteger(pid) && pid > 0) {
        pids.push(pid);
      }
    }
  }

  return unique(pids);
}

function killPids(pids) {
  if (!pids.length) {
    return;
  }

  const platform = process.platform;
  for (const pid of pids) {
    try {
      if (platform === 'win32') {
        execSync(`taskkill /PID ${pid} /F`);
      } else {
        process.kill(pid, 'SIGKILL');
      }
      console.log(`[cleanup] Stopped stale process on port ${PORT} (PID ${pid})`);
    } catch (error) {
      console.warn(`[cleanup] Could not stop PID ${pid}: ${error.message}`);
    }
  }
}

function main() {
  const pids = process.platform === 'win32' ? parseWindowsPids() : parseUnixPids();

  if (!pids.length) {
    console.log(`[cleanup] No stale Next dev process found on port ${PORT}.`);
    process.exit(0);
  }

  console.log(`[cleanup] Found stale process(es) on port ${PORT}: ${pids.join(', ')}`);
  killPids(pids);
  process.exit(0);
}

main();
