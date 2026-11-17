'use client';
import { useTitle } from '@/lib/useTitle';
import { Heart } from 'lucide-react';
import { useLibrary } from '@/store/library';
import { getTracks } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { plural } from '@/lib/format';
import { Hero } from '@/components/Hero';
import { TrackList } from '@/components/TrackList';
import { ContextActions } from '@/components/ContextHeaderActions';
import { MonetizeChip } from '@/components/MonetizeChip';
import { CardSkeleton } from '@/components/Card';

export default function Liked() {
  const lib = useLibrary();
  useTitle('Me gustan');
  const ids = Object.entries(lib.liked).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const tracks = getTracks(ids);
  const ctx = { type: 'liked' as const, id: 'liked', name: 'Me gustan', href: '/collection/tracks' };
  return (
    <div>
      <Hero kind="Lista" title="Me gustan" hueBg={255}
        art={<div className="flex aspect-square w-full items-center justify-center rounded-sm bg-accent text-accent-on shadow-card"><Heart size={72} fill="currentColor" /></div>}
        meta={<><span className="font-bold text-text">{lib.userName ?? 'Tú'}</span> · {plural(tracks.length, 'canción', 'canciones')}</>}>
        <ContextActions context={ctx} trackIds={tracks.filter((t) => !lib.monetizableOnly || isMonetizable(t)).map((t) => t.id)} />
        <span className="ml-auto"><MonetizeChip /></span>
      </Hero>
      {!lib.hydrated ? <div className="p-6"><CardSkeleton n={1} /></div> :
        <TrackList tracks={tracks} context={ctx} variant="liked" addedAt={(t) => lib.liked[t.id]}
          emptyText="Las canciones que guardes aparecerán aquí. Pulsa ♡ en cualquiera." />}
    </div>
  );
}
