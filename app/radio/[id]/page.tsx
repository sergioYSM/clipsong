'use client';
import { useTitle } from '@/lib/useTitle';
import { useParams, notFound } from 'next/navigation';
import { Radio } from 'lucide-react';
import { getTrack, radioFor, artistName } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { Hero } from '@/components/Hero';
import { TrackList } from '@/components/TrackList';
import { ContextActions } from '@/components/ContextHeaderActions';
import { MonetizeChip } from '@/components/MonetizeChip';
import { useLibrary } from '@/store/library';

export default function RadioPage() {
  const { id } = useParams<{ id: string }>();
  const seed = getTrack(id);
  const only = useLibrary((s) => s.monetizableOnly);
  useTitle(seed ? `Radio de ${seed.title}` : undefined);
  if (!seed) notFound();
  const tracks = radioFor(seed.id);
  const ctx = { type: 'radio' as const, id: seed.id, name: `Radio de ${seed.title}`, href: `/radio/${seed.id}` };
  return (
    <div>
      <Hero kind="Radio" title={`Radio de ${seed.title}`} hueBg={280}
        art={<div className="flex aspect-square w-full items-center justify-center rounded-sm bg-surface-raised text-accent shadow-card"><Radio size={72} /></div>}
        meta={<>Canciones parecidas a «{seed.title}» de {artistName(seed)}. La radio vive aquí, aparte: nunca añade nada a tus listas ni a su aleatorio.</>}>
        <ContextActions context={ctx} trackIds={tracks.filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />
        <span className="ml-auto"><MonetizeChip /></span>
      </Hero>
      <TrackList tracks={tracks} context={ctx} variant="search" emptyText="Aún no hay canciones parecidas." />
    </div>
  );
}
