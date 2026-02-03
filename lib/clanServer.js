/**
 * Shared logic for clan data: config, current members, weekly XP.
 * Used by Next.js API routes and (optionally) snapshot script.
 */

const path = require('path');
const fs = require('fs');
const { loadSnapshots, saveSnapshot, weeklyXpFromCurrent, getWeekStartMs } = require('./store');
const { getClanXpForPids } = require('./api');

const configPath = path.join(process.cwd(), 'config', 'clan-members.json');

async function getClanMembersConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Get current member stats: from latest snapshot, or API if refresh=true.
 */
async function getCurrentMembers(refresh = false) {
  const config = await getClanMembersConfig();
  const pids = config.map((m) => m.pid).filter(Boolean);
  if (pids.length === 0) return { members: [], apiOk: false };

  const snapshots = loadSnapshots();
  const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;

  if (refresh) {
    try {
      const current = await getClanXpForPids(pids);
      return { members: current, apiOk: true };
    } catch (e) {
      return {
        members: latest ? latest.members : config.map((m) => ({ pid: m.pid, name: m.name, platform: null, xp_clan: null })),
        apiOk: false,
        apiError: e.message,
      };
    }
  }
  if (latest) return { members: latest.members, apiOk: true };
  return {
    members: config.map((m) => ({ pid: m.pid, name: m.name, platform: null, xp_clan: null })),
    apiOk: false,
  };
}

/**
 * Build clan API response: week_start_utc + members with xp_clan, xp_weekly.
 */
async function getClanApiResponse(refresh = false) {
  const result = await getCurrentMembers(refresh);
  const { members: current } = result;
  const snapshots = loadSnapshots();
  const weekStart = getWeekStartMs();
  const rows = weeklyXpFromCurrent(current, snapshots);
  const sorted = rows.sort((a, b) => (b.xp_weekly ?? 0) - (a.xp_weekly ?? 0));
  const currentByPid = Object.fromEntries(current.map((m) => [m.pid, m]));
  return {
    week_start_utc: new Date(weekStart).toISOString(),
    members: sorted.map((r) => {
      const cur = currentByPid[r.pid];
      return {
        name: r.name,
        pid: r.pid,
        xp_clan: r.xp_clan,
        xp_weekly: r.xp_weekly,
        xp_pve: cur?.xp_pve ?? null,
        player_level: cur?.player_level ?? null,
      };
    }),
  };
}

module.exports = {
  getClanMembersConfig,
  getCurrentMembers,
  getClanApiResponse,
  saveSnapshot,
};
