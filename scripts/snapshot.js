#!/usr/bin/env node
/**
 * Fetch current clan XP for all configured members and append a snapshot.
 * Run daily (cron) or manually. Weekly XP is computed from snapshots (start of week baseline).
 */

const path = require('path');
const configPath = path.join(process.cwd(), 'config', 'clan-members.json');
const { getClanXpForPids } = require('../lib/api');
const { loadSnapshots, saveSnapshot, getWeekStartMs } = require('../lib/store');

async function main() {
  let members;
  try {
    members = require(configPath);
  } catch (e) {
    console.error('Missing or invalid config/clan-members.json. Use config/clan-members.json with [{ "pid": "uuid", "name": "..." }]');
    process.exit(1);
  }

  const pids = members.map((m) => m.pid).filter(Boolean);
  if (pids.length === 0) {
    console.error('No PIDs in clan-members.json. Add entries with "pid" (Ubisoft UUID).');
    process.exit(1);
  }

  console.log('Fetching clan XP for', pids.length, 'members...');
  const current = await getClanXpForPids(pids);
  const snapshot = { timestamp: Date.now(), members: current };
  saveSnapshot(snapshot);
  console.log('Saved snapshot at', new Date(snapshot.timestamp).toISOString());
  const weekStart = getWeekStartMs();
  console.log('Week start (Monday 00:00 UTC):', new Date(weekStart).toISOString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
