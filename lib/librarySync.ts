'use client';
// Mirrors library changes to Supabase when the user is signed in. The store
// stays the source of truth for the UI (optimistic); a failed write shows a
// toast and the next load corrects the state. RLS guards every row.
import { supabaseBrowser } from './supabase/browser';
import type { Playlist, PlayContext } from './types';

let userId: string | null = null;
export const setSyncUser = (id: string | null) => { userId = id; };
export const syncUser = () => userId;

type OnError = (msg: string) => void;
let onError: OnError = () => {};
export const setSyncErrorHandler = (fn: OnError) => { onError = fn; };

function run(label: string, fn: (sb: NonNullable<ReturnType<typeof supabaseBrowser>>, uid: string) => PromiseLike<{ error: unknown }>) {
  const sb = supabaseBrowser();
  if (!sb || !userId) return;
  Promise.resolve(fn(sb, userId)).then(({ error }) => { if (error) { console.warn('sync failed:', label); onError('No se ha podido guardar el cambio. Revisa tu conexión.'); } });
}

export const sync = {
  like: (trackId: string, on: boolean) => run('like', (sb, uid) => on
    ? sb.from('saved_tracks').upsert({ user_id: uid, track_id: trackId })
    : sb.from('saved_tracks').delete().match({ user_id: uid, track_id: trackId })),
  saveAlbum: (albumId: string, on: boolean) => run('album', (sb, uid) => on
    ? sb.from('saved_albums').upsert({ user_id: uid, album_id: albumId })
    : sb.from('saved_albums').delete().match({ user_id: uid, album_id: albumId })),
  follow: (artistId: string, on: boolean) => run('follow', (sb, uid) => on
    ? sb.from('follows').upsert({ user_id: uid, artist_id: artistId })
    : sb.from('follows').delete().match({ user_id: uid, artist_id: artistId })),
  pin: (itemId: string, on: boolean) => run('pin', (sb, uid) => on
    ? sb.from('library_pins').upsert({ user_id: uid, item_id: itemId })
    : sb.from('library_pins').delete().match({ user_id: uid, item_id: itemId })),
  createPlaylist: (p: Playlist) => run('create playlist', async (sb, uid) => {
    const r = await sb.from('playlists').insert({ id: p.id, owner_id: uid, name: p.name, description: p.description, is_public: p.isPublic });
    if (r.error || !p.trackIds.length) return r;
    return sb.rpc('set_playlist_tracks', { pid: p.id, track_ids: p.trackIds });
  }),
  updatePlaylist: (id: string, patch: Partial<Pick<Playlist, 'name' | 'description' | 'isPublic'>>) => run('update playlist', (sb) =>
    sb.from('playlists').update({ ...(patch.name !== undefined && { name: patch.name }), ...(patch.description !== undefined && { description: patch.description }), ...(patch.isPublic !== undefined && { is_public: patch.isPublic }) }).eq('id', id)),
  deletePlaylist: (id: string) => run('delete playlist', (sb) => sb.from('playlists').delete().eq('id', id)),
  setPlaylistTracks: (id: string, trackIds: string[]) => run('playlist tracks', (sb) => sb.rpc('set_playlist_tracks', { pid: id, track_ids: trackIds })),
  played: (trackId: string, ctx: PlayContext | null, msPlayed: number) => run('history', (sb, uid) =>
    sb.from('play_history').insert({ user_id: uid, track_id: trackId, context_type: ctx?.type ?? null, context_id: ctx?.id ?? null, context_name: ctx?.name ?? null, ms_played: Math.round(msPlayed) })),
  setMonetizableOnly: (v: boolean) => run('settings', (sb, uid) => sb.from('profiles').update({ monetizable_only: v }).eq('id', uid)),
};

export interface RemoteLibrary {
  userName: string; liked: Record<string, number>; savedAlbums: Record<string, number>; follows: Record<string, number>;
  playlists: Playlist[]; pinned: string[]; monetizableOnly: boolean; recent: (PlayContext & { at: number })[];
}

const ts = (s: string) => new Date(s).getTime();
const hrefFor = (type: string, id: string) =>
  type === 'album' ? `/album/${id}` : type === 'artist' ? `/artist/${id}` : type === 'playlist' ? `/playlist/${id}` : type === 'liked' ? '/collection/tracks' : type === 'radio' ? `/radio/${id}` : '/';

export async function loadRemoteLibrary(): Promise<RemoteLibrary | null> {
  const sb = supabaseBrowser();
  if (!sb || !userId) return null;
  const uid = userId;
  const [profile, liked, albums, follows, pls, pins, hist] = await Promise.all([
    sb.from('profiles').select('display_name, monetizable_only').eq('id', uid).single(),
    sb.from('saved_tracks').select('track_id, saved_at').eq('user_id', uid),
    sb.from('saved_albums').select('album_id, saved_at').eq('user_id', uid),
    sb.from('follows').select('artist_id, followed_at').eq('user_id', uid),
    sb.from('playlists').select('id, name, description, is_public, created_at, updated_at, playlist_items(track_id, position, added_at)').eq('owner_id', uid).order('updated_at', { ascending: false }),
    sb.from('library_pins').select('item_id').eq('user_id', uid),
    sb.from('play_history').select('context_type, context_id, context_name, played_at').eq('user_id', uid).not('context_id', 'is', null).order('played_at', { ascending: false }).limit(100),
  ]);
  const err = [profile, liked, albums, follows, pls, pins, hist].find((r) => r.error);
  if (err) throw new Error('could not load library');
  const recent: RemoteLibrary['recent'] = [];
  for (const h of hist.data ?? []) {
    if (recent.length >= 12 || recent.some((r) => r.type === h.context_type && r.id === h.context_id)) continue;
    recent.push({ type: h.context_type, id: h.context_id, name: h.context_name ?? '', href: hrefFor(h.context_type, h.context_id), at: ts(h.played_at) });
  }
  return {
    userName: profile.data!.display_name,
    monetizableOnly: profile.data!.monetizable_only,
    liked: Object.fromEntries((liked.data ?? []).map((r) => [r.track_id, ts(r.saved_at)])),
    savedAlbums: Object.fromEntries((albums.data ?? []).map((r) => [r.album_id, ts(r.saved_at)])),
    follows: Object.fromEntries((follows.data ?? []).map((r) => [r.artist_id, ts(r.followed_at)])),
    pinned: (pins.data ?? []).map((r) => r.item_id),
    playlists: (pls.data ?? []).map((p: any) => {
      const items = [...(p.playlist_items ?? [])].sort((a, b) => a.position - b.position);
      return { id: p.id, name: p.name, description: p.description, isPublic: p.is_public, createdAt: ts(p.created_at), updatedAt: ts(p.updated_at),
        trackIds: items.map((i) => i.track_id), addedAt: Object.fromEntries(items.map((i) => [i.track_id, ts(i.added_at)])) };
    }),
    recent,
  };
}
