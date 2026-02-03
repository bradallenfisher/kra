#!/usr/bin/env node
/**
 * Search for a player by name and print their PID (for config/clan-members.json).
 * Usage: node scripts/search.js "PlayerName" [platform]
 *        npm run search -- "PlayerName" [platform]
 * Platform: uplay (PC), psn (PlayStation), xbl (Xbox). Default: uplay.
 */

const { search } = require('../lib/api');

const name = process.argv[2];
const platform = (process.argv[3] || 'uplay').toLowerCase();

if (!name) {
  console.log('Usage: npm run search -- "PlayerName" [uplay|psn|xbl]');
  process.exit(1);
}

async function main() {
  const data = await search(name, platform);
  if (!data.results || data.results.length === 0) {
    console.log('No players found. Try a different name or platform (uplay, psn, xbl).');
    return;
  }
  console.log('Copy the "pid" into config/clan-members.json:\n');
  data.results.forEach((r) => {
    console.log(`  { "pid": "${r.pid}", "name": "${r.name || r.pid}" },`);
  });
}

main().catch((e) => {
  console.error(e.message);
  if (e.cause) console.error('Detail:', e.cause.message || e.cause);
  process.exit(1);
});
