export type ClanMember = {
  name: string | null;
  pid: string;
  xp_clan: number | null;
  xp_weekly: number | null;
  /** PvE XP (from Tracker.gg / manual entry). */
  xp_pve?: number | null;
  /** Player level 1–40 (from Tracker.gg / manual entry). */
  player_level?: number | null;
};

export type ClanApiResponse = {
  week_start_utc: string;
  members: ClanMember[];
};
