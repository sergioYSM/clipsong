'use client';
// The user's library. Persisted in localStorage for now; /replica-backend moves
// it to Postgres (saved_tracks, playlists, playlist_items, follows...).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist, PlayContext } from '@/lib/types';
import { sync, type RemoteLibrary } from '@/lib/librarySync';

interface LibraryState {
  hydrated: boolean;
  userName: string | null;
  liked: Record<string, number>;          // trackId -> savedAt
  savedAlbums: Record<string, number>;
  follows: Record<string, number>;        // artistId -> followedAt
  playlists: Playlist[];
  recent: (PlayContext & { at: number })[];
  pinned: string[];                        // 'liked' | playlist ids
  monetizableOnly: boolean;                // remembered filter
  signIn: (name: string) => void;
  signOut: () => void;
  toggleLike: (id: string) => boolean;
  toggleSaveAlbum: (id: string) => boolean;
  toggleFollow: (id: string) => boolean;
  createPlaylist: (name?: string, trackIds?: string[]) => Playlist;
  updatePlaylist: (id: string, patch: Partial<Pick<Playlist, 'name' | 'description' | 'isPublic'>>) => void;
  deletePlaylist: (id: string) => Playlist | undefined;
  restorePlaylist: (p: Playlist) => void;
  addToPlaylist: (id: string, trackIds: string[]) => { added: number; dupes: number };
  removeFromPlaylist: (id: string, index: number) => void;
  movePlaylistItem: (id: string, from: number, to: number) => void;
  pushRecent: (c: PlayContext) => void;
  togglePin: (id: string) => void;
  setMonetizableOnly: (v: boolean) => void;
  replaceAll: (r: RemoteLibrary) => void;
  clear: () => void;
}

const uid = () => crypto.randomUUID();
const empty = { userName: null, liked: {}, savedAlbums: {}, follows: {}, playlists: [], recent: [], pinned: ['liked'], monetizableOnly: false };

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      userName: null,
      liked: {}, savedAlbums: {}, follows: {}, playlists: [], recent: [], pinned: ['liked'], monetizableOnly: false,
      signIn: (name) => set({ userName: name.trim() || 'Creador' }),
      signOut: () => set({ userName: null }),
      toggleLike: (id) => {
        const liked = { ...get().liked };
        const on = !liked[id];
        if (on) liked[id] = Date.now(); else delete liked[id];
        set({ liked });
        sync.like(id, on);
        return on;
      },
      toggleSaveAlbum: (id) => {
        const s = { ...get().savedAlbums }; const on = !s[id];
        if (on) s[id] = Date.now(); else delete s[id];
        set({ savedAlbums: s }); sync.saveAlbum(id, on); return on;
      },
      toggleFollow: (id) => {
        const s = { ...get().follows }; const on = !s[id];
        if (on) s[id] = Date.now(); else delete s[id];
        set({ follows: s }); sync.follow(id, on); return on;
      },
      createPlaylist: (name, trackIds = []) => {
        const n = get().playlists.length + 1;
        const now = Date.now();
        const p: Playlist = { id: uid(), name: name?.trim() || `Mi lista n.º ${n}`, description: '', trackIds, createdAt: now, updatedAt: now, isPublic: false, addedAt: Object.fromEntries(trackIds.map((t) => [t, now])) };
        set({ playlists: [p, ...get().playlists] });
        sync.createPlaylist(p);
        return p;
      },
      updatePlaylist: (id, patch) => { set({ playlists: get().playlists.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)) }); sync.updatePlaylist(id, patch); },
      deletePlaylist: (id) => {
        const p = get().playlists.find((x) => x.id === id);
        set({ playlists: get().playlists.filter((x) => x.id !== id), pinned: get().pinned.filter((x) => x !== id) });
        sync.deletePlaylist(id);
        return p;
      },
      restorePlaylist: (p) => { set({ playlists: [p, ...get().playlists] }); sync.createPlaylist(p); },
      addToPlaylist: (id, trackIds) => {
        let added = 0, dupes = 0;
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== id) return p;
            const ids = [...p.trackIds];
            const addedAt = { ...(p.addedAt ?? {}) };
            for (const t of trackIds) { if (ids.includes(t)) dupes++; else { ids.push(t); addedAt[t] = Date.now(); added++; } }
            if (added) sync.setPlaylistTracks(id, ids);
            return { ...p, trackIds: ids, addedAt, updatedAt: Date.now() };
          }),
        });
        return { added, dupes };
      },
      removeFromPlaylist: (id, index) => set({ playlists: get().playlists.map((p) => {
        if (p.id !== id) return p;
        const ids = p.trackIds.filter((_, i) => i !== index);
        sync.setPlaylistTracks(id, ids);
        return { ...p, trackIds: ids, updatedAt: Date.now() };
      }) }),
      movePlaylistItem: (id, from, to) => set({
        playlists: get().playlists.map((p) => {
          if (p.id !== id) return p;
          const ids = [...p.trackIds]; const [x] = ids.splice(from, 1); ids.splice(to, 0, x);
          sync.setPlaylistTracks(id, ids);
          return { ...p, trackIds: ids, updatedAt: Date.now() };
        }),
      }),
      pushRecent: (c) => set({ recent: [{ ...c, at: Date.now() }, ...get().recent.filter((r) => !(r.type === c.type && r.id === c.id))].slice(0, 12) }),
      togglePin: (id) => { const on = !get().pinned.includes(id); set({ pinned: on ? [...get().pinned, id] : get().pinned.filter((x) => x !== id) }); sync.pin(id, on); },
      setMonetizableOnly: (v) => { set({ monetizableOnly: v }); sync.setMonetizableOnly(v); },
      replaceAll: (r) => set({ ...r, pinned: r.pinned.length ? r.pinned : ['liked'] }),
      clear: () => set({ ...empty }),
    }),
    {
      name: 'clipsong-library',
      partialize: ({ hydrated, ...rest }) => rest,
    },
  ),
);
