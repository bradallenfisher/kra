import { NextResponse } from 'next/server';
import { getClanMembersConfig, saveSnapshot } from '../../../lib/clanServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const config = await getClanMembersConfig();
    const formData = await request.formData();
    // Form sends xp_0, pve_0, level_0, ... in config order
    const members = config.map((m, i) => {
      const xpClan = Math.max(0, parseInt(String(formData.get(`xp_${i}`)), 10) || 0);
      const pveRaw = formData.get(`pve_${i}`);
      const levelRaw = formData.get(`level_${i}`);
      const xpPve = pveRaw !== null && pveRaw !== '' ? Math.max(0, parseInt(String(pveRaw), 10) || 0) : null;
      const playerLevel = levelRaw !== null && levelRaw !== '' ? Math.min(40, Math.max(1, parseInt(String(levelRaw), 10) || 1)) : null;
      return {
        pid: m.pid,
        name: m.name,
        platform: null,
        xp_clan: xpClan,
        xp_pve: xpPve,
        player_level: playerLevel,
      };
    });
    saveSnapshot({ timestamp: Date.now(), members });
    return NextResponse.redirect(new URL('/entry', request.url));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
