'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
          value={formatNum(member.xp_pve)}
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
  const [error, setError] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<StatId>('xp_clan');
  const [playerA, setPlayerA] = useState<ClanMember | null>(null);
  const [playerB, setPlayerB] = useState<ClanMember | null>(null);

  useEffect(() => {
    fetch(API_URL)
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

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-10 border-b border-division-border pb-6">
        <h1 className="text-2xl font-bold text-zinc-100">
          Division 2 – Leaders & 1v1
        </h1>
        <p className="mt-1 text-division-muted">
          Leaders by stat, then pit #1 vs #2 (or pick anyone). Enter data on the{' '}
          <Link href="/entry" className="text-division-orange hover:underline">
            clan entry page
          </Link>
          ; more stats on Tracker.gg below.
        </p>
      </header>

      {loading && (
        <div className="rounded-xl border border-division-border bg-division-card p-8 text-center text-division-muted">
          Loading clan data…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          Could not load clan data. Run <code className="rounded bg-division-card px-1">npm run dev</code> and
          ensure <code className="rounded bg-division-card px-1">config/clan-members.json</code> exists.
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="mb-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 00-4.438 0 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </span>
                Leaders
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-division-muted">Stat:</label>
                <select
                  value={statFilter}
                  onChange={(e) => setStatFilter(e.target.value as StatId)}
                  className="rounded-lg border border-division-border bg-division-card px-3 py-2 text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
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
              More leaderboards:{' '}
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
