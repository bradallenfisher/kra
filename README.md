# Division 2 – Clan XP (Next.js)

Next.js app for **clan XP per user** (total and weekly), **leaders board** with stat filters, and **1v1** comparison. Data comes from manual entry or (when reachable) [TheDivisionTab](https://thedivisiontab.com); weekly XP is computed from snapshots (Monday 00:00 UTC baseline).

## Requirements

- Node 18+
- Clan members listed in `config/clan-members.json`

## Setup

1. **Tracker Network API key (optional)**

   If you have a Tracker.gg API key, add it so "Refresh from API" can pull PvE XP, player level, and clan XP from Tracker:

   - Copy `.env.example` to `.env`
   - Set `TRN_API_KEY` to your key (from [tracker.gg/developers/apps](https://tracker.gg/developers/apps))
   - On Vercel: Project → Settings → Environment Variables → add `TRN_API_KEY`

2. **Clan member list**

   Edit `config/clan-members.json`. Each entry needs at least `pid` (Ubisoft ID or display name) and optional `name`, `platform` (e.g. `xbl`, `uplay`, `psn`):

   ```json
   [
     { "pid": "LowEndTreble", "name": "LowEndTreble", "platform": "xbl" },
     { "pid": "DUSTYWETONES", "name": "DUSTYWETONES", "platform": "xbl" }
   ]
   ```

2. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   Open **http://localhost:3000**.

3. **Pages**

   - **/** – Leaders board (filter by stat), 1v1 picker (defaults to #1 vs #2), links to Tracker.gg leaderboards.
   - **/entry** – Manual entry: enter total clan XP per member from the in-game clan screen and save a snapshot.

4. **Snapshot script (optional)**

   To pull clan XP from TheDivisionTab (when reachable):

   ```bash
   npm run snapshot
   ```

   Writes to `data/snapshots.json`. Search for players by name:

   ```bash
   npm run search -- "PlayerName" [uplay|psn|xbl]
   ```

## How “weekly” works

- **Week** = Monday 00:00 UTC → next Monday.
- **Baseline** = latest snapshot at or before week start.
- **XP this week** = current total clan XP − baseline total clan XP.

## API

- **GET /api/clan** – JSON: `{ week_start_utc, members: [{ name, pid, xp_clan, xp_weekly }] }`.  
  **GET /api/clan?refresh=1** – Refetch from TheDivisionTab (if reachable).
- **GET /api/config** – JSON: `{ members: [{ pid, name }] }` (config order).
- **POST /api/manual** – Form body: `xp_0`, `xp_1`, … (total clan XP per member in config order). Redirects to `/entry`.

## Data and caveats

- Snapshots: `data/snapshots.json`. Manual entries and snapshot script both append here.
- TheDivisionTab is unofficial; when unreachable (e.g. DNS), use the manual entry page.
- Tracker.gg links (leaderboards, profiles) are for reference; we don’t fetch their data.
