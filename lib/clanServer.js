/**
 * Shared logic for clan data: config, current members, weekly XP.
 * Used by Next.js API routes and (optionally) snapshot script.
 */

const path = require('path');
const fs = require('fs');
const { loadSnapshots, saveSnapshot, weeklyXpFromCurrent, getWeekStartMs } = require('./store');
const { getClanXpForPids } = require('./api');
const { getApiKey: getTrackerKey, getMembersFromTracker } = require('./trackerApi');

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
 * Returns debug info for ?debug=1: dataSource, snapshotCount, lastSnapshotAt, apiKeySet, apiError.
 */
async function getCurrentMembers(refresh = false) {
  const config = await getClanMembersConfig();
  const pids = config.map((m) => m.pid).filter(Boolean);
  const snapshots = loadSnapshots();
  const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;
  const debugBase = {
    dataSource: null,
    snapshotCount: snapshots.length,
    lastSnapshotAt: latest ? latest.timestamp : null,
    snapshotPath: path.join(process.cwd(), 'data', 'snapshots.json'),
    apiKeySet: !!getTrackerKey(),
    apiError: null,
  };

  if (pids.length === 0) {
    return { members: [], apiOk: false, ...debugBase, dataSource: 'config' };
  }

  if (refresh) {
    if (getTrackerKey()) {
      try {
        const current = await getMembersFromTracker(config);
        const hasAnyStat = current.some((m) => m.xp_clan != null || m.xp_pve != null || m.player_level != null);
        const trackerMemberErrors = current.map((m) => (m.error ? `${m.pid}: ${m.error}` : null)).filter(Boolean);
        if (current.length > 0) {
          saveSnapshot({ timestamp: Date.now(), members: current });
          return {
            members: current,
            apiOk: hasAnyStat,
            ...debugBase,
            dataSource: 'api',
            apiSource: 'tracker',
            trackerMemberErrors: trackerMemberErrors.length ? trackerMemberErrors : null,
            trackerNoStats: !hasAnyStat && current.length > 0,
          };
        }
      } catch (e) {
        debugBase.apiError = `Tracker: ${e.message}`;
      }
    }
    try {
      const current = await getClanXpForPids(pids);
      saveSnapshot({ timestamp: Date.now(), members: current });
      return { members: current, apiOk: true, ...debugBase, dataSource: 'api', apiSource: 'thedivisiontab' };
    } catch (e) {
      return {
        members: latest ? latest.members : config.map((m) => ({ pid: m.pid, name: m.name, platform: null, xp_clan: null })),
        apiOk: false,
        ...debugBase,
        dataSource: latest ? 'snapshot' : 'config',
        apiError: e.message,
      };
    }
  }
  if (latest) {
    return { members: latest.members, apiOk: true, ...debugBase, dataSource: 'snapshot' };
  }
  return {
    members: config.map((m) => ({ pid: m.pid, name: m.name, platform: null, xp_clan: null })),
    apiOk: false,
    ...debugBase,
    dataSource: 'config',
  };
}

/**
 * Build clan API response: week_start_utc + members with xp_clan, xp_weekly.
 * If includeDebug, adds _debug: { dataSource, snapshotCount, lastSnapshotAt, apiKeySet, apiError, ... }.
 */
async function getClanApiResponse(refresh = false, includeDebug = false) {
  const result = await getCurrentMembers(refresh);
  const { members: current, dataSource, snapshotCount, lastSnapshotAt, snapshotPath, apiKeySet, apiError, apiSource, trackerMemberErrors, trackerNoStats } = result;
  const snapshots = loadSnapshots();
  const weekStart = getWeekStartMs();
  const rows = weeklyXpFromCurrent(current, snapshots);
  const sorted = rows.sort((a, b) => (b.xp_weekly ?? 0) - (a.xp_weekly ?? 0));
  const currentByPid = Object.fromEntries(current.map((m) => [m.pid, m]));
  const response = {
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
  if (includeDebug) {
    const isVercel = !!process.env.VERCEL;
    let whereStatsComeFrom =
      dataSource === 'api'
        ? (apiSource === 'tracker'
          ? (trackerNoStats
            ? 'Tracker.gg returned no stats (check platform/identifiers below)'
            : 'Tracker.gg (refresh just ran)')
          : 'TheDivisionTab (refresh just ran)')
        : dataSource === 'snapshot'
          ? `Saved snapshot (${snapshotCount} total) – click "Refresh from API" to fetch new stats`
          : 'Config only – no snapshot file. Click "Refresh from API" or add data/snapshots.json';
    response._debug = {
      dataSource: dataSource ?? 'unknown',
      apiSource: apiSource ?? null,
      snapshotCount: snapshotCount ?? 0,
      lastSnapshotAt: lastSnapshotAt ?? null,
      lastSnapshotAtISO: lastSnapshotAt ? new Date(lastSnapshotAt).toISOString() : null,
      snapshotPath,
      apiKeySet: apiKeySet ?? false,
      apiError: apiError ?? null,
      trackerMemberErrors: trackerMemberErrors ?? null,
      trackerNoStats: trackerNoStats ?? false,
      environment: isVercel ? 'Vercel (snapshot file is ephemeral)' : 'local (snapshot file persists)',
      whereStatsComeFrom,
    };
  }
  return response;
}

module.exports = {
  getClanMembersConfig,
  getCurrentMembers,
  getClanApiResponse,
  saveSnapshot,
};
