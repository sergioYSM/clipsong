'use client';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { allGenres, search, getArtist, getAlbum, albumTracks, artistTracks, getTrack } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { TrackList } from '@/components/TrackList';
import { Card, Shelf } from '@/components/Card';
import { Cover } from '@/components/Cover';
import { PlayButton } from '@/components/PlayButton';
import { MonetizeChip } from '@/components/MonetizeChip';
import { usePlayer } from '@/store/player';
import { useLibrary } from '@/store/library';
import type { PlayContext } from '@/lib/types';

function Browse() {
  return (
    <div className="px-4 py-4 md:px-6">
      <h1 className="mb-4 text-xl font-bold">Explorar por género y ánimo</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {allGenres().map((g, i) => (
          <Link key={g} href={`/genre/${encodeURIComponent(g)}`} className="relative aspect-[16/10] overflow-hidden rounded-md p-4 text-lg font-bold capitalize hover:brightness-110"
            style={{ background: `hsl(${(i * 47 + 180) % 360} 55% 38%)` }}>{g}</Link>
        ))}
      </div>
    </div>
  );
}

function Results({ q }: { q: string }) {
  const r = search(q);
  const only = useLibrary((s) => s.monetizableOnly);
  const playContext = usePlayer((s) => s.playContext);
  const pushRecent = useLibrary((s) => s.pushRecent);
  const ctx: PlayContext = { type: 'search', id: `q-${q}`, name: `«${q}»`, href: `/search?q=${encodeURIComponent(q)}` };
  const songs = r.tracks.filter((t) => !only || isMonetizable(t));
  if (!r.tracks.length && !r.artists.length && !r.albums.length) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Nada con «{q}»</h1>
        <p className="text-text-muted">Revisa cómo está escrito o prueba con otra palabra o un género.</p>
      </div>
    );
  }
  let top: React.ReactNode = null;
  if (r.top?.type === 'track') {
    const t = getTrack(r.top.id)!; const a = getAlbum(t.albumId)!;
    top = <TopCard title={t.title} sub={`Canción · ${getArtist(t.artistId)?.name}`} hue={a.hue} href={`/album/${a.id}`} onPlay={() => { playContext(songs.map((x) => x.id), Math.max(0, songs.findIndex((x) => x.id === t.id)), ctx); pushRecent(ctx); }} />;
  } else if (r.top?.type === 'artist') {
    const a = getArtist(r.top.id)!; const ids = artistTracks(a.id).filter((t) => !only || isMonetizable(t)).map((t) => t.id);
    top = <TopCard title={a.name} sub="Artista" hue={a.hue} round href={`/artist/${a.id}`} onPlay={() => { const c = { type: 'artist' as const, id: a.id, name: a.name, href: `/artist/${a.id}` }; playContext(ids, 0, c); pushRecent(c); }} />;
  } else if (r.top?.type === 'album') {
    const a = getAlbum(r.top.id)!; const ids = albumTracks(a.id).filter((t) => !only || isMonetizable(t)).map((t) => t.id);
    top = <TopCard title={a.title} sub={`Álbum · ${getArtist(a.artistId)?.name}`} hue={a.hue} href={`/album/${a.id}`} onPlay={() => { const c = { type: 'album' as const, id: a.id, name: a.title, href: `/album/${a.id}` }; playContext(ids, 0, c); pushRecent(c); }} />;
  }
  return (
    <div className="py-4">
      <h1 className="sr-only">Resultados para «{q}»</h1>
      <div className="grid gap-6 px-4 md:px-6 xl:grid-cols-[2fr_3fr]">
        <section aria-label="Mejor resultado"><h2 className="mb-3 text-xl font-bold">Mejor resultado</h2>{top}</section>
        <section aria-label="Canciones" className="min-w-0"><h2 className="mb-3 text-xl font-bold">Canciones</h2>
          <div className="-mx-4 md:-mx-6"><TrackList tracks={r.tracks.slice(0, 5)} context={ctx} variant="search" emptyText="Ninguna canción coincide." /></div>
        </section>
      </div>
      <div className="mt-6 px-1 md:px-3">
        {r.artists.length > 0 && <Shelf title="Artistas">{r.artists.map((a) => <Card key={a.id} href={`/artist/${a.id}`} title={a.name} subtitle="Artista" hue={a.hue} round />)}</Shelf>}
        {r.albums.length > 0 && <Shelf title="Álbumes">{r.albums.map((a) => <Card key={a.id} href={`/album/${a.id}`} title={a.title} subtitle={`${a.year} · ${getArtist(a.artistId)?.name}`} hue={a.hue}
          context={{ type: 'album', id: a.id, name: a.title, href: `/album/${a.id}` }} trackIds={albumTracks(a.id).map((t) => t.id)} />)}</Shelf>}
      </div>
    </div>
  );
}

function TopCard({ title, sub, hue, href, round, onPlay }: { title: string; sub: string; hue: number; href: string; round?: boolean; onPlay: () => void }) {
  return (
    <Link href={href} className="group relative block rounded-lg bg-surface-raised p-5 hover:bg-surface-hover">
      <Cover hue={hue} label={title} size={92} round={round} />
      <div className="mt-4 truncate text-2xl font-extrabold" title={title}>{title}</div>
      <div className="text-sm text-text-muted">{sub}</div>
      <PlayButton size="card" label={title} playing={false} onClick={onPlay} className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" />
    </Link>
  );
}

function SearchPage() {
  const q = (useSearchParams().get('q') ?? '').trim();
  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-2 md:px-6"><MonetizeChip /></div>
      {q ? <Results q={q} /> : <Browse />}
    </>
  );
}

export default function Page() { return <Suspense><SearchPage /></Suspense>; }
