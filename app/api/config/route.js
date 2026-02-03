import { getClanMembersConfig } from '../../../lib/clanServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getClanMembersConfig();
    return Response.json({ members: config.map((m) => ({ pid: m.pid, name: m.name })) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
