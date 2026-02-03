/**
 * Snapshot store: save/load { timestamp, members: [ { pid, name, xp_clan } ] }.
 * Weekly XP = current xp_clan - xp_clan at "start of week" (last snapshot before week start).
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const SNAPSHOTS_FILE = path.join(DATA_DIR, 'snapshots.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * @typedef { { timestamp: number, members: Array<{ pid: string, name: string|null, platform: string|null, xp_clan: number|null }> } } Snapshot
 */

/**
 * @returns {Snapshot[]}
 */
function loadSnapshots() {
  ensureDataDir();
  if (!fs.existsSync(SNAPSHOTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SNAPSHOTS_FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * @param {Snapshot} snapshot
 */
function saveSnapshot(snapshot) {
  ensureDataDir();
  const all = loadSnapshots();
  all.push(snapshot);
  fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(all, null, 2), 'utf8');
}

/**
 * Get "start of week" as Unix ms (Monday 00:00 UTC).
 * @param {number} [nowMs] - Default: Date.now()
 */
function getWeekStartMs(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + mondayOffset);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Find the most recent snapshot at or before targetMs.
 * @param {Snapshot[]} snapshots
 * @param {number} targetMs
 * @returns {Snapshot|null}
 */
function findSnapshotAtOrBefore(snapshots, targetMs) {
  const atOrBefore = snapshots.filter((s) => s.timestamp <= targetMs).sort((a, b) => b.timestamp - a.timestamp);
  return atOrBefore[0] || null;
}

/**
 * Compute weekly XP per member: current - baseline (baseline = snapshot at start of week, or earliest we have).
 * @param {Array<{ pid: string, name: string|null, platform: string|null, xp_clan: number|null }>} current
 * @param {Snapshot[]} snapshots
 * @returns {Array<{ pid: string, name: string|null, xp_clan: number|null, xp_weekly: number, baseline_xp: number|null }>}
 */
function weeklyXpFromCurrent(current, snapshots) {
  const weekStart = getWeekStartMs();
  const baselineSnapshot = findSnapshotAtOrBefore(snapshots, weekStart);
  const baselineByPid = baselineSnapshot
    ? Object.fromEntries(baselineSnapshot.members.map((m) => [m.pid, m.xp_clan]))
    : {};

  return current.map((m) => {
    const base = baselineByPid[m.pid] ?? null;
    const cur = m.xp_clan;
    const xpWeekly =
      cur != null && base != null ? Math.max(0, cur - base) : null;
    return {
      pid: m.pid,
      name: m.name,
      xp_clan: cur,
      xp_weekly: xpWeekly,
      baseline_xp: base,
    };
  });
}

module.exports = {
  loadSnapshots,
  saveSnapshot,
  getWeekStartMs,
  weeklyXpFromCurrent,
};
