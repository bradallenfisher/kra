'use client';

import { useEffect, useState, useMemo } from 'react';
import type { ClanApiResponse, ClanMember } from './types';
import {
  LEADERBOARD_STATS,
  OUR_STAT_IDS,
  getStatById,
  type StatId,
} from './leaderboard-stats';

const API_URL = '/api/clan';

function formatNum(n: number | null): string {
  if (n == null) return '–';
  return Number(n).toLocaleString();
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-division-border bg-division-card px-4 py-3 ${
        highlight ? 'border-division-orange/50 ring-1 ring-division-orange/20' : ''
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-division-muted">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-semibold tabular-nums ${
          highlight ? 'text-division-orange' : 'text-zinc-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PlayerColumn({
  member,
  isWinnerTotal,
  isWinnerWeekly,
  isWinnerPve,
  isWinnerLevel,
}: {
  member: ClanMember;
  isWinnerTotal: boolean;
  isWinnerWeekly: boolean;
  isWinnerPve: boolean;
  isWinnerLevel: boolean;
  side: 'left' | 'right';
}) {
  const name = member.name || member.pid;
  const trackerSlug = encodeURIComponent(String(name).toLowerCase());
  const platform = 'xbl';
  const trackerUrl = `https://tracker.gg/division-2/profile/${platform}/${trackerSlug}/overview`;
  const wins = [isWinnerTotal, isWinnerWeekly, isWinnerPve, isWinnerLevel].filter(Boolean);

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-division-border bg-division-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">{name}</h3>
        <a
          href={trackerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-division-orange hover:underline"
        >
          View on Tracker →
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total clan XP"
          value={formatNum(member.xp_clan)}
          highlight={isWinnerTotal}
        />
        <StatCard
          label="XP this week"
          value={formatNum(member.xp_weekly)}
          highlight={isWinnerWeekly}
        />
        <StatCard
          label="PvE XP"
          value={formatNum(member.xp_pve ?? null)}
          highlight={isWinnerPve}
        />
        <StatCard
          label="Player level"
          value={member.player_level != null ? member.player_level : '–'}
          highlight={isWinnerLevel}
        />
      </div>
      {wins.length > 0 && (
        <div className="mt-4 rounded-lg bg-division-orange/10 px-3 py-2 text-center text-sm font-medium text-division-orange">
          {wins.length >= 4 ? 'Wins all' : wins.length >= 2 ? 'Wins multiple' : 'Wins one'}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<ClanApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<StatId>('xp_clan');
  const [playerA, setPlayerA] = useState<ClanMember | null>(null);
  const [playerB, setPlayerB] = useState<ClanMember | null>(null);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}?debug=1`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const members = data?.members ?? [];
  const currentStat = getStatById(statFilter);
  const weHaveThisStat = currentStat?.sortKey != null;

  const leaders = useMemo(() => {
    if (!currentStat) return [...members];
    const key = currentStat.sortKey ?? 'xp_clan';
    return [...members].sort((a, b) => {
      const va = a[key] ?? 0;
      const vb = b[key] ?? 0;
      return vb - va;
    });
  }, [members, currentStat]);

  useEffect(() => {
    if (leaders.length >= 2 && weHaveThisStat) {
      setPlayerA(leaders[0]);
      setPlayerB(leaders[1]);
    }
  }, [statFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data && leaders.length >= 2 && weHaveThisStat && !playerA && !playerB) {
      setPlayerA(leaders[0]);
      setPlayerB(leaders[1]);
    }
  }, [data, leaders, weHaveThisStat]); // eslint-disable-line react-hooks/exhaustive-deps

  const canCompare = playerA && playerB && playerA.pid !== playerB.pid;
  const winnerTotal =
    canCompare && playerA && playerB
      ? (playerA.xp_clan ?? 0) >= (playerB.xp_clan ?? 0)
        ? playerA
        : playerB
      : null;
  const winnerWeekly =
    canCompare && playerA && playerB
      ? (playerA.xp_weekly ?? 0) >= (playerB.xp_weekly ?? 0)
        ? playerA
        : playerB
      : null;
  const winnerPve =
    canCompare && playerA && playerB
      ? (playerA.xp_pve ?? 0) >= (playerB.xp_pve ?? 0)
        ? playerA
        : playerB
      : null;
  const winnerLevel =
    canCompare && playerA && playerB
      ? (playerA.player_level ?? 0) >= (playerB.player_level ?? 0)
        ? playerA
        : playerB
      : null;

  const setTopTwo1v1 = () => {
    if (leaders.length >= 2) {
      setPlayerA(leaders[0]);
      setPlayerB(leaders[1]);
    }
  };

  const hasMembers = members.length > 0;
  const hasAnyStat = hasMembers && members.some((m) =>
    (m.xp_clan ?? 0) > 0 || (m.xp_weekly ?? 0) > 0 || (m.xp_pve ?? 0) > 0 || (m.player_level ?? 0) > 0
  );

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?refresh=1&debug=1`);
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  const debugInfo = data && '_debug' in data ? (data as ClanApiResponse & { _debug?: Record<string, unknown> })._debug : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 border-b border-division-border pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Division 2 – Clan Leaderboard
            </h1>
            <p className="mt-1 text-sm text-division-muted">
              Filter by stat and compare your team. Like{' '}
              <a
                href="https://tracker.gg/division-2/leaderboards/stats/all/Kills?page=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-division-orange hover:underline"
              >
                Tracker.gg
              </a>
              , but for your clan only.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="rounded-lg border border-division-border bg-division-card px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-division-border disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh from API'}
          </button>
        </div>
      </header>

      {loading && !data && (
        <div className="rounded-xl border border-division-border bg-division-card p-8 text-center text-division-muted">
          Loading clan data…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          Could not load clan data. Ensure the API is running (e.g. <code className="rounded bg-division-card px-1">npm run dev</code> locally)
          and <code className="rounded bg-division-card px-1">config/clan-members.json</code> exists. Set{' '}
          <code className="rounded bg-division-card px-1">TRN_API_KEY</code> in Vercel for API refresh.
        </div>
      )}

      {!loading && !error && data && (
        <>
          {!hasMembers && (
            <div className="mb-8 rounded-xl border border-division-border bg-division-card p-6 text-center">
              <p className="text-division-muted">
                No clan members yet. Add members in <code className="rounded bg-division-dark px-1">config/clan-members.json</code> and redeploy.
              </p>
            </div>
          )}

          {hasMembers && !hasAnyStat && (
            <div className="mb-6 rounded-lg border border-division-orange/30 bg-division-orange/10 px-4 py-3 text-sm text-division-orange">
              No stats yet. Click <strong>Refresh from API</strong> to pull from Tracker.gg (set <code className="rounded bg-division-dark px-1">TRN_API_KEY</code> in Vercel), or use the options below to test.
            </div>
          )}

          {hasMembers && (
            <section className="mb-8 rounded-xl border border-division-border bg-division-card px-4 py-3">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-division-muted">
                Test without API
              </h2>
              <p className="mb-3 text-sm text-zinc-400">
                Load sample stats so you can try the leaderboard and 1v1. Data is saved to your local snapshot file.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const form = new FormData();
                  members.forEach((_, i) => {
                    const xp = [50000, 30000][i] ?? 0;
                    const pve = [100000, 80000][i] ?? 0;
                    const level = [40, 35][i] ?? 40;
                    form.set(`xp_${i}`, String(xp));
                    form.set(`pve_${i}`, String(pve));
                    form.set(`level_${i}`, String(level));
                  });
                  await fetch('/api/manual', { method: 'POST', body: form, redirect: 'manual' });
                  const res = await fetch(`${API_URL}?debug=1`);
                  if (res.ok) setData(await res.json());
                }}
                className="rounded-lg border border-division-border bg-division-dark px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-division-border"
              >
                Load sample data
              </button>
            </section>
          )}

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              Clan leaderboard
            </h2>
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-division-border bg-division-card px-4 py-3">
              <span className="text-sm font-medium text-division-muted">Clan members only</span>
              <span className="text-division-border">|</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-division-muted">Stat</label>
                <select
                  value={statFilter}
                  onChange={(e) => setStatFilter(e.target.value as StatId)}
                  className="rounded border border-division-border bg-division-dark px-3 py-2 text-sm text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
                >
                  {LEADERBOARD_STATS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                      {s.sortKey ? '' : ' (Tracker.gg)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!weHaveThisStat && currentStat && (
              <p className="mb-4 rounded-lg border border-division-border bg-division-card/50 px-4 py-3 text-sm text-division-muted">
                We only have clan XP data here. For global {currentStat.label.toLowerCase()} leaders, see{' '}
                <a
                  href={currentStat.trackerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-division-orange hover:underline"
                >
                  Tracker.gg →
                </a>
                {' '}Below: our clan sorted by total clan XP.
              </p>
            )}

            <div className="overflow-hidden rounded-xl border border-division-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-division-border bg-division-card">
                    <th className="w-16 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                      Player
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-division-muted">
                      {currentStat?.label ?? 'Value'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((m, i) => {
                    const key = currentStat?.sortKey ?? 'xp_clan';
                    const value = m[key] ?? null;
                    return (
                      <tr
                        key={m.pid}
                        className={`border-b border-division-border/50 last:border-0 ${
                          i < 2 ? 'bg-division-card/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className={i < 2 ? 'font-bold text-division-orange' : 'text-zinc-400'}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-100">
                          {m.name || m.pid}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {formatNum(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-sm text-division-muted">
              More stats on Tracker.gg:{' '}
              {LEADERBOARD_STATS.filter((s) => !OUR_STAT_IDS.includes(s.id)).map((s) => (
                <a
                  key={s.id}
                  href={s.trackerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-3 text-division-orange hover:underline"
                >
                  {s.label}
                </a>
              ))}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <span className="rounded bg-division-orange/20 p-1.5">
                <svg
                  className="h-4 w-4 text-division-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              1v1 – Who has more XP?
            </h2>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={setTopTwo1v1}
                disabled={leaders.length < 2}
                className="rounded-lg border border-division-border bg-division-card px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-division-border disabled:opacity-50"
              >
                Use top 2 from leaders
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-division-muted">
                  Player A
                </label>
                <select
                  value={playerA?.pid ?? ''}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setPlayerA(members.find((m) => m.pid === pid) ?? null);
                  }}
                  className="w-full rounded-lg border border-division-border bg-division-card px-4 py-3 text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
                >
                  <option value="">Select player…</option>
                  {members.map((m) => (
                    <option key={m.pid} value={m.pid}>
                      {m.name || m.pid}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-division-muted">
                  Player B
                </label>
                <select
                  value={playerB?.pid ?? ''}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setPlayerB(members.find((m) => m.pid === pid) ?? null);
                  }}
                  className="w-full rounded-lg border border-division-border bg-division-card px-4 py-3 text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
                >
                  <option value="">Select player…</option>
                  {members.map((m) => (
                    <option key={m.pid} value={m.pid}>
                      {m.name || m.pid}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {playerA && playerB && playerA.pid === playerB.pid && (
              <p className="mb-4 text-sm text-amber-400">
                Choose two different players to compare.
              </p>
            )}

            {canCompare && playerA && playerB && (
              <div className="flex flex-col gap-4 sm:flex-row">
                <PlayerColumn
                  member={playerA}
                  isWinnerTotal={winnerTotal?.pid === playerA.pid}
                  isWinnerWeekly={winnerWeekly?.pid === playerA.pid}
                  isWinnerPve={winnerPve?.pid === playerA.pid}
                  isWinnerLevel={winnerLevel?.pid === playerA.pid}
                  side="left"
                />
                <div className="flex items-center justify-center text-2xl font-bold text-division-muted sm:px-2">
                  VS
                </div>
                <PlayerColumn
                  member={playerB}
                  isWinnerTotal={winnerTotal?.pid === playerB.pid}
                  isWinnerWeekly={winnerWeekly?.pid === playerB.pid}
                  isWinnerPve={winnerPve?.pid === playerB.pid}
                  isWinnerLevel={winnerLevel?.pid === playerB.pid}
                  side="right"
                />
              </div>
            )}
          </section>

          <section className="mb-8 rounded-xl border border-division-border bg-division-card">
            <button
              type="button"
              onClick={() => setShowDebug((d) => !d)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-division-muted hover:text-zinc-300"
            >
              Where do stats come from? (debug)
              <span className="text-division-muted">{showDebug ? '▼' : '▶'}</span>
            </button>
            {showDebug && (
              <div className="border-t border-division-border px-4 py-3 font-mono text-xs text-zinc-400">
                {debugInfo ? (
                  <>
                    <p className="mb-2 font-sans font-medium text-division-orange">
                      {(debugInfo as { whereStatsComeFrom?: string }).whereStatsComeFrom}
                    </p>
                    <dl className="space-y-1">
                      <dt className="text-division-muted">Data source</dt>
                      <dd className="ml-4">{(debugInfo as { dataSource?: string }).dataSource}</dd>
                      <dt className="text-division-muted">API source (if refresh)</dt>
                      <dd className="ml-4">{(debugInfo as { apiSource?: string }).apiSource ?? '–'}</dd>
                      <dt className="text-division-muted">Snapshot count</dt>
                      <dd className="ml-4">{(debugInfo as { snapshotCount?: number }).snapshotCount}</dd>
                      <dt className="text-division-muted">Last snapshot</dt>
                      <dd className="ml-4">{(debugInfo as { lastSnapshotAtISO?: string }).lastSnapshotAtISO ?? '–'}</dd>
                      <dt className="text-division-muted">Snapshot file</dt>
                      <dd className="ml-4 break-all">{(debugInfo as { snapshotPath?: string }).snapshotPath}</dd>
                      <dt className="text-division-muted">TRN_API_KEY set</dt>
                      <dd className="ml-4">{(debugInfo as { apiKeySet?: boolean }).apiKeySet ? 'Yes' : 'No'}</dd>
                    <dt className="text-division-muted">Environment</dt>
                    <dd className="ml-4">{(debugInfo as { environment?: string }).environment ?? '–'}</dd>
                    {(debugInfo as { trackerMemberErrors?: string[] }).trackerMemberErrors?.length ? (
                      <>
                        <dt className="text-division-muted">Tracker per-member errors</dt>
                        <dd className="ml-4 text-red-400">
                          {(debugInfo as { trackerMemberErrors?: string[] }).trackerMemberErrors?.join('; ')}
                        </dd>
                      </>
                    ) : null}
                    {(debugInfo as { trackerNoStats?: boolean }).trackerNoStats && (
                      <>
                        <dt className="text-division-muted">Tracker returned no stats</dt>
                        <dd className="ml-4 text-amber-400">Check platform (xbl/psn/ubi) and usernames in config</dd>
                      </>
                    )}
                    {(debugInfo as { apiError?: string }).apiError && (
                        <>
                          <dt className="text-division-muted">API error</dt>
                          <dd className="ml-4 text-red-400">{(debugInfo as { apiError?: string }).apiError}</dd>
                        </>
                      )}
                    </dl>
                  </>
                ) : (
                  <p className="text-amber-400">
                    No debug in response (cached?). Clear cache: run <code className="rounded bg-division-dark px-1">npm run clean</code> then <code className="rounded bg-division-dark px-1">npm run dev</code>, or hard-refresh (Cmd+Shift+R). Or open <a href="/api/clan?debug=1" target="_blank" rel="noopener noreferrer" className="text-division-orange underline">/api/clan?debug=1</a> in a new tab to verify the API returns <code className="rounded bg-division-dark px-1">_debug</code>.
                  </p>
                )}
              </div>
            )}
          </section>

          <section>
            <p className="mb-2 text-sm text-division-muted">
              Week started {data.week_start_utc.slice(0, 10)} (UTC)
            </p>
          </section>
        </>
      )}
    </main>
  );
}
