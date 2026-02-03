'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ClanApiResponse, ClanMember } from '../types';

const API_URL = '/api/clan';

function formatNum(n: number | null): string {
  if (n == null) return '–';
  return Number(n).toLocaleString();
}

export default function EntryPage() {
  const [data, setData] = useState<ClanApiResponse | null>(null);
  const [config, setConfig] = useState<Array<{ pid: string; name?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(API_URL).then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText)))),
      fetch('/api/config').then((res) => (res.ok ? res.json() : Promise.resolve({ members: [] }))),
    ])
      .then(([clanData, configData]: [ClanApiResponse, { members: Array<{ pid: string; name?: string }> }]) => {
        setData(clanData);
        setConfig(configData.members ?? []);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const members = data?.members ?? [];
  const sorted = [...members].sort((a, b) => (b.xp_weekly ?? 0) - (a.xp_weekly ?? 0));

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-8 border-b border-division-border pb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Clan XP – Manual entry</h1>
        <p className="mt-1 text-division-muted">
          Enter total clan XP from the in-game clan screen. Weekly XP is computed from a baseline (e.g. Monday).
        </p>
        <p className="mt-2">
          <Link href="/" className="text-sm text-division-orange hover:underline">
            ← Back to Leaders & 1v1
          </Link>
        </p>
      </header>

      {loading && (
        <div className="rounded-xl border border-division-border bg-division-card p-8 text-center text-division-muted">
          Loading…
        </div>
      )}

      {!loading && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">Current snapshot</h2>
            <p className="mb-4 text-sm text-division-muted">
              {data ? `Week started ${data.week_start_utc.slice(0, 10)} (UTC)` : 'No data yet. Add entries below.'}
            </p>
            <div className="overflow-hidden rounded-xl border border-division-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-division-border bg-division-card">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                      Member
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-division-muted">
                      Clan XP
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-division-muted">
                      XP this week
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-division-muted">
                      PvE XP
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-division-muted">
                      Player level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-division-muted">
                        No data. Add PIDs in config/clan-members.json and save a snapshot below.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((m) => (
                      <tr key={m.pid} className="border-b border-division-border/50 last:border-0">
                        <td className="px-4 py-3 font-medium text-zinc-100">{m.name || m.pid}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {formatNum(m.xp_clan)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-division-orange">
                          {formatNum(m.xp_weekly)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {formatNum(m.xp_pve ?? null)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {m.player_level != null ? m.player_level : '–'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">Enter stats manually</h2>
            <p className="mb-4 text-sm text-division-muted">
              Clan XP from in-game; <strong>PvE XP</strong> and <strong>Player level</strong> from{' '}
              <a
                  href="https://tracker.gg/division-2/leaderboards/stats/all/XPPve?page=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-division-orange hover:underline"
                >
                  Tracker.gg
                </a>
              .
            </p>
            {config.length > 0 ? (
              <form action="/api/manual" method="post" className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-division-border">
                  <table className="w-full min-w-[32rem]">
                    <thead>
                      <tr className="border-b border-division-border bg-division-card">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                          Member
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                          Clan XP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                          PvE XP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-division-muted">
                          Level
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.map((m, i) => (
                        <tr key={m.pid} className="border-b border-division-border/50 last:border-0">
                          <td className="px-4 py-3 font-medium text-zinc-100">{m.name || m.pid}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name={`xp_${i}`}
                              min={0}
                              step={1}
                              placeholder="Clan XP"
                              className="w-full max-w-[8rem] rounded border border-division-border bg-division-card px-3 py-2 text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
                              aria-label={`Clan XP for ${m.name || m.pid}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name={`pve_${i}`}
                              min={0}
                              step={1}
                              placeholder="PvE XP"
                              className="w-full max-w-[8rem] rounded border border-division-border bg-division-card px-3 py-2 text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
                              aria-label={`PvE XP for ${m.name || m.pid}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name={`level_${i}`}
                              min={1}
                              max={40}
                              step={1}
                              placeholder="1–40"
                              className="w-full max-w-[5rem] rounded border border-division-border bg-division-card px-3 py-2 text-zinc-100 focus:border-division-orange focus:outline-none focus:ring-1 focus:ring-division-orange"
                              aria-label={`Player level for ${m.name || m.pid}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="submit"
                  className="rounded-lg border border-division-border bg-division-card px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-division-border"
                >
                  Save snapshot
                </button>
              </form>
            ) : (
              <p className="text-division-muted">
                Add clan members in <code className="rounded bg-division-card px-1">config/clan-members.json</code> and
                restart the app.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
