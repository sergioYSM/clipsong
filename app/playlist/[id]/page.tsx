import type { Metadata } from 'next';
import { SUPABASE_URL, SUPABASE_ANON_KEY, backendEnabled } from '@/lib/config';
import PlaylistClient from './PlaylistClient';

// Link preview for a public playlist (live mode). RLS only returns public
// ones to the anonymous key; private playlists get a generic preview.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const generic: Metadata = { title: 'Lista · Clipsong' };
  if (!backendEnabled || !/^[0-9a-f-]{36}$/i.test(id)) return generic;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/playlists?id=eq.${id}&select=name,description,profiles(display_name),playlist_items(count)`,
      { headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` }, next: { revalidate: 300 } });
    const [p] = res.ok ? await res.json() : [];
    if (!p) return generic;
    const by = p.profiles?.display_name ?? '';
    const n = p.playlist_items?.[0]?.count ?? 0;
    const description = p.description || `${n} ${n === 1 ? 'canción' : 'canciones'} con licencia abierta${by ? `, por ${by}` : ''}.`;
    const image = `/og?type=playlist&name=${encodeURIComponent(p.name)}&by=${encodeURIComponent(by)}`;
    return { title: `${p.name} · Clipsong`, description, openGraph: { title: p.name, description, siteName: 'Clipsong', images: [{ url: image, width: 1200, height: 630 }] }, twitter: { card: 'summary_large_image', title: p.name, description, images: [image] } };
  } catch { return generic; }
}
export default function Page() { return <PlaylistClient />; }
