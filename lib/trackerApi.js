/**
 * Tracker Network (Tracker.gg) Division 2 API client.
 * Docs: https://tracker.gg/developers/docs/titles/division-2
 * Auth: TRN-Api-Key header (set TRN_API_KEY in .env).
 *
 * Profile: GET https://public-api.tracker.gg/v2/division-2/standard/profile/{platform}/{platformUserIdentifier}
 * Platform: ubi (Ubisoft/PC), psn, xbl
 */

const TRACKER_BASE = 'https://public-api.tracker.gg/v2/division-2/standard/profile';
const PLATFORM_MAP = { uplay: 'ubi', ubi: 'ubi', psn: 'psn', xbl: 'xbl' };

function getApiKey() {
  return process.env.TRN_API_KEY || process.env.TRACKER_NETWORK_API_KEY || '';
}

function getHeaders() {
  const key = getApiKey();
  if (!key) return null;
  return {
    'TRN-Api-Key': key,
    'Accept': 'application/json',
  };
}

/**
 * Fetch Division 2 profile from Tracker Network.
 * @param {string} platformUserIdentifier - Username (e.g. LowEndTreble)
 * @param {string} [platform='xbl'] - ubi, psn, xbl
 * @returns {Promise<{ platformUserIdentifier: string, platformId: string, segments: Array }>}
 */
async function getProfile(platformUserIdentifier, platform = 'xbl') {
  const headers = getHeaders();
  if (!headers) throw new Error('TRN_API_KEY (or TRACKER_NETWORK_API_KEY) not set');
  const plat = PLATFORM_MAP[platform] || platform;
  const url = `${TRACKER_BASE}/${plat}/${encodeURIComponent(platformUserIdentifier)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tracker API: ${res.status} ${res.statusText}${text ? ' ' + text.slice(0, 200) : ''}`);
  }
  return res.json();
}

/**
 * Extract PvE XP, Player Level, Clan XP from Tracker profile segments.
 * Tracker uses segments with stats: { displayName, value } or { key, value }.
 */
function parseStatsFromProfile(data) {
  const segments = data?.data?.segments || [];
  let xpPve = null;
  let playerLevel = null;
  let xpClan = null;
  for (const seg of segments) {
    const stats = seg.stats || {};
    for (const [key, obj] of Object.entries(stats)) {
      const val = obj?.value != null ? Number(obj.value) : NaN;
      if (Number.isNaN(val)) continue;
      const k = (key || obj?.displayName || '').toLowerCase();
      if ((k.includes('pve') && k.includes('xp') || k === 'pvexp') && xpPve == null) xpPve = val;
      if ((k.includes('player') && k.includes('level') || k === 'playerlevel' || k === 'level') && playerLevel == null) playerLevel = val;
      if ((k.includes('clan') && k.includes('xp') || k === 'clanxp') && xpClan == null) xpClan = val;
    }
    if (stats.pveXp?.value != null) xpPve = Number(stats.pveXp.value);
    if (stats.playerLevel?.value != null) playerLevel = Number(stats.playerLevel.value);
    if (stats.clanXp?.value != null) xpClan = Number(stats.clanXp.value);
  }
  return { xpPve, playerLevel, xpClan };
}

/**
 * Fetch Tracker profile and return normalized member stats for our app.
 * @param {{ pid: string, name?: string, platform?: string }} member - Config member (pid = username for Tracker)
 * @returns {Promise<{ pid: string, name: string|null, platform: string|null, xp_clan: number|null, xp_pve: number|null, player_level: number|null }>}
 */
async function getMemberFromTracker(member, delayMs = 200) {
  const platform = member.platform || 'xbl';
  const identifier = String(member.pid || member.name || '').trim();
  if (!identifier) throw new Error('Member has no pid/name for Tracker lookup');
  const data = await getProfile(identifier, platform);
  const { xpPve, playerLevel, xpClan } = parseStatsFromProfile(data);
  const platformId = data?.data?.platformInfo?.platformUserIdentifier ?? identifier;
  const name = data?.data?.platformInfo?.platformUserHandle ?? member.name ?? platformId;
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  return {
    pid: member.pid || platformId,
    name: name || null,
    platform,
    xp_clan: xpClan ?? null,
    xp_pve: xpPve ?? null,
    player_level: playerLevel ?? null,
  };
}

/**
 * Fetch current stats for all config members from Tracker (when key is set).
 * @param {Array<{ pid: string, name?: string, platform?: string }>} config
 * @returns {Promise<Array<{ pid, name, platform, xp_clan, xp_pve, player_level, error? }>>}
 */
async function getMembersFromTracker(config, delayMs = 200) {
  if (!getApiKey()) return [];
  const out = [];
  for (const m of config) {
    try {
      const member = await getMemberFromTracker(m, delayMs);
      out.push(member);
    } catch (e) {
      out.push({
        pid: m.pid,
        name: m.name ?? null,
        platform: m.platform ?? null,
        xp_clan: null,
        xp_pve: null,
        player_level: null,
        error: e.message,
      });
    }
  }
  return out;
}

module.exports = {
  getApiKey,
  getProfile,
  parseStatsFromProfile,
  getMemberFromTracker,
  getMembersFromTracker,
};
