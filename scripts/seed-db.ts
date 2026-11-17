// Loads the demo catalogue into the database (artists, albums, tracks).
// Usage: DATABASE_URL=... node scripts/seed-db.ts
import pg from 'pg';
import { artists, albums, tracks } from '../lib/seed.ts';
import { licences } from '../lib/licence.ts';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query('begin');
for (const a of artists) await c.query(
  `insert into artists (id, source, name, bio, hue) values ($1,'demo',$2,$3,$4)
   on conflict (id) do update set name = excluded.name, bio = excluded.bio, hue = excluded.hue, updated_at = now()`, [a.id, a.name, a.bio, a.hue]);
for (const a of albums) await c.query(
  `insert into albums (id, source, artist_id, title, year, kind, hue) values ($1,'demo',$2,$3,$4,$5,$6)
   on conflict (id) do update set title = excluded.title, year = excluded.year, kind = excluded.kind, hue = excluded.hue, updated_at = now()`, [a.id, a.artistId, a.title, a.year, a.kind, a.hue]);
for (const t of tracks) await c.query(
  `insert into tracks (id, source, album_id, artist_id, title, duration_ms, track_number, audio_url, licence, licence_url, genres)
   values ($1,'demo',$2,$3,$4,$5,$6,$7,$8,$9,$10)
   on conflict (id) do update set title = excluded.title, licence = excluded.licence, licence_url = excluded.licence_url, genres = excluded.genres, updated_at = now()`,
  [t.id, t.albumId, t.artistId, t.title, t.durationMs, t.trackNumber, t.audioUrl, t.licence, licences[t.licence].url, t.genres]);
await c.query('commit');
console.log(`seeded ${artists.length} artists, ${albums.length} albums, ${tracks.length} tracks`);
await c.end();
