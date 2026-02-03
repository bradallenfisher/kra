# Division 2 – Clan XP (Next.js)

Next.js app for **clan XP per user** (total and weekly), **leaders board** with stat filters, and **1v1** comparison. Data comes from [Tracker.gg](https://tracker.gg) (when you have an API key and use “Refresh from API”) or [TheDivisionTab](https://thedivisiontab.com); weekly XP is computed from snapshots (Monday 00:00 UTC baseline).

## Requirements

- Node 18+
- Clan members listed in `config/clan-members.json`

## Setup

1. **Tracker Network API key (optional)**

   If you have a Tracker.gg API key, add it so "Refresh from API" can pull PvE XP, player level, and clan XP from Tracker:

   - Copy `.env.example` to **`.env.local`** (or `.env`) and set `TRN_API_KEY` to your key (from [tracker.gg/developers/apps](https://tracker.gg/developers/apps)). Prefer `.env.local` for local secrets so they stay out of git.
   - On Vercel: Project → Settings → Environment Variables → add `TRN_API_KEY`

2. **Clan member list**

   Edit `config/clan-members.json`. Each entry needs at least `pid` (Ubisoft ID or display name) and optional `name`, `platform` (e.g. `xbl`, `uplay`, `psn`):

   ```json
   [
     { "pid": "LowEndTreble", "name": "LowEndTreble", "platform": "xbl" },
     { "pid": "DUSTYWETONES", "name": "DUSTYWETONES", "platform": "xbl" }
   ]
   ```

3. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   Open **http://localhost:3000**. Use **“Refresh from API”** on the home page to pull from Tracker.gg (saves a snapshot).

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

- **GET /api/clan** – JSON: `{ week_start_utc, members: [{ name, pid, xp_clan, xp_weekly, xp_pve, player_level }] }`.  
  **GET /api/clan?refresh=1** – Fetch from Tracker.gg (if `TRN_API_KEY` set) or TheDivisionTab, then save a snapshot.
- **GET /api/config** – JSON: `{ members: [{ pid, name }] }` (config order).
- **POST /api/manual** – Form body: `xp_0`, `pve_0`, `level_0`, … (optional fallback). Redirects to `/`.

### Testing without API

- **In the app:** Use the “Test without API” section and click **Load sample data** to fill the leaderboard with sample stats.
- **With curl** (2 members in config order; adjust indices if you have more):

  ```bash
  curl -X POST http://localhost:3000/api/manual \
    -F xp_0=50000 -F pve_0=100000 -F level_0=40 \
    -F xp_1=30000 -F pve_1=80000 -F level_1=35
  ```

  Then open http://localhost:3000 and refresh; the leaderboard and 1v1 will show the entered stats.

## Data and caveats

- Snapshots: `data/snapshots.json`. “Refresh from API” and the snapshot script append here.
- With `TRN_API_KEY` set, refresh uses Tracker.gg for PvE XP, player level, and clan XP.
