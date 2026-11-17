'use client';
import { useParams } from 'next/navigation';
import { genreTracks } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { plural } from '@/lib/format';
import { Hero } from '@/components/Hero';
import { TrackList } from '@/components/TrackList';
import { ContextActions } from '@/components/ContextHeaderActions';
import { MonetizeChip } from '@/components/MonetizeChip';
import { useLibrary } from '@/store/library';

export default function GenrePage() {
  const g = decodeURIComponent(useParams<{ g: string }>().g);
  const only = useLibrary((s) => s.monetizableOnly);
  const tracks = genreTracks(g);
  const title = g.charAt(0).toUpperCase() + g.slice(1);
  const ctx = { type: 'search' as const, id: `genre-${g}`, name: title, href: `/genre/${encodeURIComponent(g)}` };
  return (
    <div>
      <Hero kind="Género" title={title} hueBg={200} art={<div className="flex aspect-square w-full items-center justify-center rounded-sm bg-surface-raised text-2xl font-extrabold capitalize shadow-card">{g}</div>}
        meta={plural(tracks.length, 'canción', 'canciones')}>
        <ContextActions context={ctx} trackIds={tracks.filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />
        <span className="ml-auto"><MonetizeChip /></span>
      </Hero>
      <TrackList tracks={tracks} context={ctx} variant="search" emptyText="Aún no hay canciones de este género." />
    </div>
  );
}
