// Row level security tests on a real Postgres (local shim for Supabase auth).
// Usage: DATABASE_URL=... node --test supabase/test/rls.test.ts
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
let A = '', B = '';

async function as<T>(uid: string | null, fn: () => Promise<T>): Promise<T> {
  await c.query('begin');
  try {
    await c.query(`set local role ${uid ? 'authenticated' : 'anon'}`);
    await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    const r = await fn();
    await c.query('commit');
    return r;
  } catch (e) { await c.query('rollback'); throw e; }
}
const rows = async (sql: string, p: unknown[] = []) => (await c.query(sql, p)).rows;

before(async () => {
  await c.connect();
  await c.query(`delete from auth.users where email like '%@test.invalid'`);
  A = (await rows(`insert into auth.users (email, raw_user_meta_data) values ('ana@test.invalid', '{"name":"Ana"}') returning id`))[0].id;
  B = (await rows(`insert into auth.users (email) values ('beto@test.invalid') returning id`))[0].id;
});
after(async () => { await c.query(`delete from auth.users where email like '%@test.invalid'`); await c.end(); });

test('sign up creates a profile with the name from the provider', async () => {
  const [a] = await rows('select display_name from profiles where id = $1', [A]);
  const [b] = await rows('select display_name from profiles where id = $1', [B]);
  assert.equal(a.display_name, 'Ana');
  assert.equal(b.display_name, 'beto');
});

test('anyone can read the catalogue, nobody but the service role writes it', async () => {
  assert.ok((await as(null, () => rows('select id from tracks'))).length > 0);
  await assert.rejects(as(A, () => rows(`update tracks set title = 'x' where id = 't01' returning id`)).then((r) => { if (!r.length) throw new Error('no rows'); }));
});

test('liked songs: owner sees them, a second user gets nothing back', async () => {
  await as(A, () => rows(`insert into saved_tracks (user_id, track_id) values ($1, 't01'), ($1, 't05')`, [A]));
  assert.equal((await as(A, () => rows('select * from saved_tracks'))).length, 2);
  assert.equal((await as(B, () => rows('select * from saved_tracks'))).length, 0);
  assert.equal((await as(null, () => rows('select * from saved_tracks'))).length, 0);
  await assert.rejects(as(B, () => rows(`insert into saved_tracks (user_id, track_id) values ($1, 't02')`, [A])), /row-level security/);
  const del = await as(B, () => rows(`delete from saved_tracks where user_id = $1 returning *`, [A]));
  assert.equal(del.length, 0);
});

test('private playlist: invisible and read-only to others; public: readable, still not editable', async () => {
  const [p] = await as(A, () => rows(`insert into playlists (owner_id, name) values ($1, 'Intro del vlog') returning id`, [A]));
  await as(A, () => rows(`insert into playlist_items (playlist_id, track_id, position, added_by) values ($1, 't11', 1, $2)`, [p.id, A]));
  assert.equal((await as(B, () => rows('select * from playlists where id = $1', [p.id]))).length, 0);
  assert.equal((await as(B, () => rows('select * from playlist_items where playlist_id = $1', [p.id]))).length, 0);
  await assert.rejects(as(B, () => rows(`insert into playlist_items (playlist_id, track_id, position, added_by) values ($1, 't01', 2, $2)`, [p.id, B])), /row-level security/);
  assert.equal((await as(B, () => rows(`update playlists set name = 'hacked' where id = $1 returning id`, [p.id]))).length, 0);

  await as(A, () => rows('update playlists set is_public = true where id = $1', [p.id]));
  assert.equal((await as(B, () => rows('select * from playlist_items where playlist_id = $1', [p.id]))).length, 1);
  assert.equal((await as(null, () => rows('select * from playlists where id = $1', [p.id]))).length, 1);
  await assert.rejects(as(B, () => rows(`insert into playlist_items (playlist_id, track_id, position, added_by) values ($1, 't01', 2, $2)`, [p.id, B])), /row-level security/);
  assert.equal((await as(B, () => rows(`delete from playlists where id = $1 returning id`, [p.id]))).length, 0);
});

test('collaborative playlist: an invited collaborator can add, an outsider cannot', async () => {
  const [p] = await as(A, () => rows(`insert into playlists (owner_id, name, is_collaborative) values ($1, 'Juntos', true) returning id`, [A]));
  await assert.rejects(as(B, () => rows(`insert into playlist_collaborators (playlist_id, user_id) values ($1, $2)`, [p.id, B])), /row-level security/);
  await as(A, () => rows(`insert into playlist_collaborators (playlist_id, user_id) values ($1, $2)`, [p.id, B]));
  await as(B, () => rows(`insert into playlist_items (playlist_id, track_id, position, added_by) values ($1, 't04', 1, $2)`, [p.id, B]));
  assert.equal((await as(A, () => rows('select * from playlist_items where playlist_id = $1', [p.id]))).length, 1);
  await assert.rejects(as(B, () => rows(`insert into playlist_items (playlist_id, track_id, position, added_by) values ($1, 't04', 2, $2)`, [p.id, A])), /row-level security/);
});

test('set_playlist_tracks: reorders and keeps added dates; others are refused', async () => {
  const [p] = await as(A, () => rows(`insert into playlists (owner_id, name) values ($1, 'Orden') returning id`, [A]));
  await as(A, () => rows(`select set_playlist_tracks($1, array['t01','t02'])`, [p.id]));
  const first = await rows(`select track_id, added_at from playlist_items where playlist_id = $1 order by position`, [p.id]);
  await new Promise((r) => setTimeout(r, 20));
  await as(A, () => rows(`select set_playlist_tracks($1, array['t03','t02','t01'])`, [p.id]));
  const after = await rows(`select track_id, added_at from playlist_items where playlist_id = $1 order by position`, [p.id]);
  assert.deepEqual(after.map((r) => r.track_id), ['t03', 't02', 't01']);
  assert.equal(after[2].added_at.getTime(), first[0].added_at.getTime(), 'kept added_at of t01');
  assert.ok(after[0].added_at > first[0].added_at, 'new track gets a new date');
  await assert.rejects(as(B, () => rows(`select set_playlist_tracks($1, array['t01'])`, [p.id])), /not allowed/);
  await assert.rejects(as(null, () => rows(`select set_playlist_tracks($1, array['t01'])`, [p.id])), /permission denied/);
  assert.equal((await rows(`select count(*)::int n from playlist_items where playlist_id = $1`, [p.id]))[0].n, 3);
});

test('subscriptions: you can read yours, never write it (webhook only)', async () => {
  await c.query(`insert into subscriptions (user_id, stripe_customer_id, plan, status) values ($1, 'cus_test_a', 'creador', 'active')`, [A]);
  assert.equal((await as(A, () => rows('select plan from subscriptions')))[0].plan, 'creador');
  assert.equal((await as(B, () => rows('select * from subscriptions'))).length, 0);
  assert.equal((await as(A, () => rows(`update subscriptions set plan = 'estudio' returning plan`))).length, 0);
  assert.equal((await as(A, () => rows('select * from stripe_events'))).length, 0);
});

test('delete my account removes the user and everything they own', async () => {
  await as(null, () => rows('select 1')).catch(() => {});
  await assert.rejects(as(null, () => rows('select public.delete_my_account()')), /permission denied/);
  await as(A, () => rows('select public.delete_my_account()'));
  for (const t of ['profiles where id', 'saved_tracks where user_id', 'playlists where owner_id', 'subscriptions where user_id']) {
    assert.equal((await rows(`select 1 from ${t} = $1`, [A])).length, 0, t);
  }
  assert.equal((await rows('select 1 from auth.users where id = $1', [A])).length, 0);
  assert.equal((await rows('select 1 from profiles where id = $1', [B])).length, 1, 'other users untouched');
});
