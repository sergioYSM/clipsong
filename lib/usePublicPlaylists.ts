'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from './supabase/browser';

export interface PublicPlaylist { id: string; name: string; description: string; owner: string }

/** Public playlists from other people matching q (live mode only; RLS returns public ones). */
export function usePublicPlaylists(q: string): PublicPlaylist[] {
  const [rows, setRows] = useState<PublicPlaylist[]>([]);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || q.trim().length < 2) { setRows([]); return; }
    let live = true;
    const pattern = `%${q.trim().replace(/[%_\\,()]/g, ' ')}%`;
    sb.from('playlists').select('id, name, description, profiles(display_name)').eq('is_public', true).ilike('name', pattern).limit(12)
      .then(({ data }) => { if (live) setRows((data ?? []).map((p: any) => ({ id: p.id, name: p.name, description: p.description, owner: p.profiles?.display_name ?? '' }))); });
    return () => { live = false; };
  }, [q]);
  return rows;
}
