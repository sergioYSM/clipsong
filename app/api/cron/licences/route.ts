import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';
import { db } from '@/lib/db.server';
import { fetchJamendoTracksByIds } from '@/lib/jamendo';

// Nightly: re-check the licence of every Jamendo track (oldest checked first).
// A changed licence gets a new snapshot; a track that disappeared is marked unplayable.
// Vercel Cron calls this with Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'cron not configured' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const env = serverEnv();
  if (!env.JAMENDO_CLIENT_ID) return NextResponse.json({ skipped: 'JAMENDO_CLIENT_ID not set' });
  const due = await db().query(`select id, licence from tracks where source = 'jamendo' order by licence_checked_at asc limit 200`);
  const ids = due.rows.map((r) => (r.id as string).replace(/^jm-/, ''));
  const fresh = await fetchJamendoTracksByIds(ids, env.JAMENDO_CLIENT_ID);
  let changed = 0, gone = 0;
  for (const row of due.rows) {
    const t = fresh.get(row.id);
    if (!t) { gone++; await db().query(`update tracks set playable = false, licence_checked_at = now() where id = $1`, [row.id]); continue; }
    if (t.licence !== row.licence) {
      changed++;
      await db().query(`update tracks set licence = $2, licence_url = $3, licence_checked_at = now() where id = $1`, [row.id, t.licence, t.licenceUrl]);
      await db().query(`insert into licence_snapshots (track_id, licence, licence_url) values ($1, $2, $3)`, [row.id, t.licence, t.licenceUrl]);
    } else await db().query(`update tracks set licence_checked_at = now(), playable = true where id = $1`, [row.id]);
  }
  return NextResponse.json({ checked: due.rows.length, changed, gone });
}
