/**
 * TheDivisionTab unofficial API client.
 * Docs: https://github.com/salikx/TheDivisionTab-API
 * - search.php: search by name + platform
 * - player.php: get player by pid (returns xp_clan = lifetime clan XP)
 * No clan endpoint; "weekly" XP = we snapshot xp_clan and diff.
 */

const BASE = 'https://thedivisiontab.com/api';

const PLATFORMS = ['uplay', 'psn', 'xbl'];

const FETCH_OPTS = {
  headers: { 'User-Agent': 'DivisionClanXP/1.0 (Node.js)' },
};

function wrapFetchError(e, context) {
  const msg = e.cause ? (e.cause.message || String(e.cause)) : e.message;
  const err = new Error(context + ': ' + msg);
  err.cause = e.cause || e;
  return err;
}

/**
 * Search for players by name.
 * @param {string} name - Player name (will be used in URL as-is; caller can encode)
 * @param {'uplay'|'psn'|'xbl'} platform
 * @returns {Promise<{ results: Array<{ pid: string, name: string, platform: string }>, totalresults: number }>}
 */
async function search(name, platform = 'uplay') {
  if (!PLATFORMS.includes(platform)) throw new Error(`Invalid platform: ${platform}`);
  const url = `${BASE}/search.php?name=${encodeURIComponent(name)}&platform=${platform}`;
  let res;
  try {
    res = await fetch(url, FETCH_OPTS);
  } catch (e) {
    throw wrapFetchError(e, 'Network error (check internet, firewall, or try again)');
  }
  if (!res.ok) throw new Error(`Search failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Get player stats by Ubisoft PID.
 * @param {string} pid - Ubisoft player ID (UUID)
 * @returns {Promise<{ pid: string, name: string, platform: string, xp_clan: number, ... }>}
 */
async function getPlayer(pid) {
  const url = `${BASE}/player.php?pid=${encodeURIComponent(pid)}`;
  let res;
  try {
    res = await fetch(url, FETCH_OPTS);
  } catch (e) {
    throw wrapFetchError(e, 'Network error');
  }
  if (!res.ok) throw new Error(`Player fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data.playerfound) throw new Error(`Player not found: ${pid}`);
  return data;
}

/**
 * Fetch current xp_clan for multiple PIDs (rate-friendly: sequential with small delay).
 * @param {string[]} pids
 * @param {number} delayMs - Delay between requests
 */
async function getClanXpForPids(pids, delayMs = 300) {
  const out = [];
  for (const pid of pids) {
    try {
      const p = await getPlayer(pid);
      out.push({ pid: p.pid, name: p.name, platform: p.platform, xp_clan: Number(p.xp_clan) || 0 });
    } catch (e) {
      out.push({ pid, name: null, platform: null, xp_clan: null, error: e.message });
    }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}

module.exports = { search, getPlayer, getClanXpForPids, PLATFORMS };
