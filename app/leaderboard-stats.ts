/**
 * Stat definitions for leaders board and 1v1.
 * Keys align with Tracker.gg leaderboard slugs where applicable:
 * https://tracker.gg/division-2/leaderboards/stats/all/[slug]
 */
export type StatId =
  | 'xp_clan'
  | 'xp_weekly'
  | 'XPPve'
  | 'TimePlayed'
  | 'XPClan'
  | 'XPDZ'
  | 'KillsPvP'
  | 'RoguesKilled'
  | 'HighestPlayerLevel'
  | 'CommendationCount';

export type LeaderboardStat = {
  id: StatId;
  label: string;
  /** Sort key from our API (member field). null = we don't have this, use Tracker.gg link. */
  sortKey: keyof { xp_clan: number; xp_weekly: number; xp_pve: number; player_level: number } | null;
  /** Tracker.gg leaderboard URL for this stat (all platforms, page 1). */
  trackerUrl: string;
};

export const LEADERBOARD_STATS: LeaderboardStat[] = [
  {
    id: 'xp_clan',
    label: 'Total clan XP',
    sortKey: 'xp_clan',
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/XPClan?page=1',
  },
  {
    id: 'xp_weekly',
    label: 'XP this week',
    sortKey: 'xp_weekly',
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/XPClan?page=1',
  },
  {
    id: 'XPPve',
    label: 'PvE XP',
    sortKey: 'xp_pve',
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/XPPve?page=1',
  },
  {
    id: 'TimePlayed',
    label: 'Time played',
    sortKey: null,
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/TimePlayed?page=1',
  },
  {
    id: 'XPDZ',
    label: 'Dark Zone XP',
    sortKey: null,
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/XPDZ?page=1',
  },
  {
    id: 'KillsPvP',
    label: 'PvP kills',
    sortKey: null,
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/KillsPvP?page=1',
  },
  {
    id: 'RoguesKilled',
    label: 'Rogues killed',
    sortKey: null,
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/RoguesKilled?page=1',
  },
  {
    id: 'HighestPlayerLevel',
    label: 'Player level',
    sortKey: 'player_level',
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/HighestPlayerLevel?page=1',
  },
  {
    id: 'CommendationCount',
    label: 'Commendations',
    sortKey: null,
    trackerUrl: 'https://tracker.gg/division-2/leaderboards/stats/all/CommendationCount?page=1',
  },
];

/** Stats we can sort with our own data (have sortKey). */
export const OUR_STAT_IDS: StatId[] = ['xp_clan', 'xp_weekly', 'XPPve', 'HighestPlayerLevel'];

export function getStatById(id: StatId): LeaderboardStat | undefined {
  return LEADERBOARD_STATS.find((s) => s.id === id);
}
