'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { loadRemoteLibrary, setSyncErrorHandler, setSyncUser, sync, syncUser } from '@/lib/librarySync';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Loads the signed-in user's library from the database. The first time, it
 *  uploads what they saved in this browser before having an account. */
export function AuthSync() {
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    setSyncErrorHandler((m) => useUi.getState().showToast(m));

    const start = async (uid: string) => {
      if (syncUser() === uid) return;
      setSyncUser(uid);
      try {
        const remote = await loadRemoteLibrary();
        if (!remote) return;
        const local = useLibrary.getState();
        for (const id of Object.keys(local.liked)) if (!remote.liked[id]) { sync.like(id, true); remote.liked[id] = local.liked[id]; }
        for (const id of Object.keys(local.savedAlbums)) if (!remote.savedAlbums[id]) { sync.saveAlbum(id, true); remote.savedAlbums[id] = local.savedAlbums[id]; }
        for (const id of Object.keys(local.follows)) if (!remote.follows[id]) { sync.follow(id, true); remote.follows[id] = local.follows[id]; }
        for (const p of local.playlists) {
          if (remote.playlists.some((r) => r.id === p.id)) continue;
          const up = isUuid(p.id) ? p : { ...p, id: crypto.randomUUID() };
          sync.createPlaylist(up); remote.playlists.unshift(up);
        }
        if (local.monetizableOnly && !remote.monetizableOnly) { sync.setMonetizableOnly(true); remote.monetizableOnly = true; }
        useLibrary.getState().replaceAll(remote);
      } catch {
        useUi.getState().showToast('No hemos podido cargar tu biblioteca. Recarga la página.');
      }
    };

    sb.auth.getUser().then(({ data }) => { if (data.user) start(data.user.id); });
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) start(session.user.id);
      if (event === 'SIGNED_OUT') { setSyncUser(null); useLibrary.getState().clear(); }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}
