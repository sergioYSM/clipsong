// Imports a curated slice of Jamendo's Creative Commons catalogue:
//  - into the database (artists, albums, tracks + a licence snapshot per track)
//  - into lib/catalogue.generated.json, which the app reads (rebuild after running)
// Usage: JAMENDO_CLIENT_ID=... DATABASE_URL=... node scripts/import-jamendo.ts [tags...]
import { writeFileSync } from 'node:fs';
import pg from 'pg';
import { searchJamendoTracks, mapJamendo, type JamendoTrack } from '../lib/jamendo.ts';

const clientId = process.env.JAMENDO_CLIENT_ID;
if (!clientId) { console.error('JAMENDO_CLIENT_ID is not set'); process.exit(1); }
const tags = process.argv.slice(2).length ? process.argv.slice(2) : ['lounge', 'ambient', 'acoustic', 'electronic', 'hiphop', 'cinematic', 'piano', 'rock', 'chillout', 'pop'];

const raw: JamendoTrack[] = [];
for (const tag of tags) {
  const res = await searchJamendoTracks(tag, clientId, 50);
  console.log(`${tag}: ${res.length}`);
  raw.push(...res);
  await new Promise((r) => setTimeout(r, 300));   // be gentle with the API
}
const seen = new Set<string>();
const { artists, albums, tracks, skipped } = mapJamendo(raw.filter((t) => !seen.has(t.id) && seen.add(t.id)));
console.log(`mapped ${tracks.length} tracks (${skipped} skipped: no CC licence or no audio)`);

if (process.env.DATABASE_URL) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect(); await c.query('begin');
  for (const a of artists) await c.query(`insert into artists (id, source, name, hue) values ($1,'jamendo',$2,$3) on conflict (id) do update set name = excluded.name, updated_at = now()`, [a.id, a.name, a.hue]);
  for (const a of albums) await c.query(`insert into albums (id, source, artist_id, title, cover_url, year, hue) values ($1,'jamendo',$2,$3,$4,$5,$6) on conflict (id) do update set title = excluded.title, cover_url = excluded.cover_url, updated_at = now()`, [a.id, a.artistId, a.title, a.coverUrl ?? null, a.year, a.hue]);
  for (const t of tracks) {
    const prev = await c.query('select licence from tracks where id = $1', [t.id]);
    await c.query(`insert into tracks (id, source, album_id, artist_id, title, duration_ms, track_number, audio_url, licence, licence_url, genres)
      values ($1,'jamendo',$2,$3,$4,$5,$6,$7,$8,$9,$10)
      on conflict (id) do update set title = excluded.title, audio_url = excluded.audio_url, licence = excluded.licence, licence_url = excluded.licence_url, genres = excluded.genres, playable = true, licence_checked_at = now(), updated_at = now()`,
      [t.id, t.albumId, t.artistId, t.title, t.durationMs, t.trackNumber, t.audioUrl, t.licence, t.licenceUrl, t.genres]);
    if (prev.rows[0]?.licence !== t.licence) await c.query('insert into licence_snapshots (track_id, licence, licence_url) values ($1,$2,$3)', [t.id, t.licence, t.licenceUrl]);
  }
  await c.query('commit'); await c.end();
  console.log('database updated');
}
writeFileSync('lib/catalogue.generated.json', JSON.stringify({ artists, albums, tracks }));
console.log('wrote lib/catalogue.generated.json — rebuild the app to use it');
