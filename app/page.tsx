'use client';
import Link from 'next/link';
import { useLibrary } from '@/store/library';
import { allAlbums, allArtists, albumTracks, allGenres, genreTracks, getArtist, artistTracks, getTracks } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { plural } from '@/lib/format';
import { getAlbum } from '@/lib/data';
import type { PlayContext } from '@/lib/types';

const hueFor = (r: PlayContext) => r.type === 'album' ? getAlbum(r.id)?.hue ?? 0 : r.type === 'artist' ? getArtist(r.id)?.hue ?? 0 : (r.name.length * 37) % 360;
import { Card, Shelf, CardSkeleton } from '@/components/Card';
import { Cover } from '@/components/Cover';
import { MonetizeChip } from '@/components/MonetizeChip';
import { Heart } from 'lucide-react';

function greeting() { const h = new Date().getHours(); return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; }

export default function Home() {
  const lib = useLibrary();
  const only = lib.monetizableOnly;
  const albums = allAlbums().filter((a) => !only || albumTracks(a.id).some(isMonetizable));
  const quick = [
    { key: 'liked', href: '/collection/tracks', title: 'Me gustan', liked: true, hue: 255 },
    ...lib.recent.slice(0, 7).map((r) => ({ key: `${r.type}-${r.id}`, href: r.href, title: r.name, liked: r.type === 'liked', hue: hueFor(r), round: r.type === 'artist' })),
  ].filter((x, i, a) => a.findIndex((y) => y.href === x.href) === i).slice(0, 8);

  return (
    <div className="px-2 py-4 md:px-4">
      <div className="mb-6 flex flex-wrap items-center gap-2 px-3"><MonetizeChip /></div>
      <h1 className="mb-4 px-3 text-2xl font-extrabold">{greeting()}{lib.userName ? `, ${lib.userName}` : ''}</h1>
      {!lib.hydrated ? <CardSkeleton /> : (
        <>
          {lib.recent.length === 0 ? (
            <div className="mx-3 mb-8 rounded-lg bg-surface-raised p-6">
              <p className="mb-1 text-lg font-bold">Aún no has escuchado nada.</p>
              <p className="mb-4 text-text-muted">Prueba con un género o un estado de ánimo, o dale al play en cualquier álbum.</p>
              <div className="flex flex-wrap gap-2">{allGenres().slice(0, 6).map((g) => <Link key={g} href={`/genre/${encodeURIComponent(g)}`} className="rounded-full bg-surface-hover px-3 py-1 text-sm capitalize hover:bg-border">{g}</Link>)}</div>
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-1 gap-2 px-3 sm:grid-cols-2 xl:grid-cols-4">
              {quick.map((q) => (
                <Link key={q.key} href={q.href} className="flex items-center gap-3 overflow-hidden rounded-sm bg-surface-raised pr-3 hover:bg-surface-hover">
                  {q.liked ? <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-accent text-accent-on"><Heart size={22} fill="currentColor" /></div> : <Cover hue={q.hue} label={q.title} size={56} round={'round' in q && !!q.round} className={'round' in q && q.round ? '' : 'rounded-none'} />}
                  <span className="truncate font-bold">{q.title}</span>
                </Link>
              ))}
            </div>
          )}
          {lib.playlists.length > 0 && (
            <Shelf title="Tus listas" href="/collection">
              {lib.playlists.slice(0, 6).map((p) => <Card key={p.id} href={`/playlist/${p.id}`} title={p.name} subtitle={plural(p.trackIds.length, 'canción', 'canciones')} hue={(p.name.length * 37) % 360}
                context={{ type: 'playlist', id: p.id, name: p.name, href: `/playlist/${p.id}` }} trackIds={getTracks(p.trackIds).filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />)}
            </Shelf>
          )}
          <Shelf title={only ? 'Álbumes con canciones aptas para monetizar' : 'Novedades con licencia abierta'}>
            {albums.map((a) => <Card key={a.id} href={`/album/${a.id}`} title={a.title} subtitle={`${a.year} · ${getArtist(a.artistId)?.name}`} hue={a.hue}
              context={{ type: 'album', id: a.id, name: a.title, href: `/album/${a.id}` }} trackIds={albumTracks(a.id).filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />)}
          </Shelf>
          <Shelf title="Artistas independientes">
            {allArtists().map((a) => <Card key={a.id} href={`/artist/${a.id}`} title={a.name} subtitle="Artista" hue={a.hue} round
              context={{ type: 'artist', id: a.id, name: a.name, href: `/artist/${a.id}` }} trackIds={artistTracks(a.id).filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />)}
          </Shelf>
          <Shelf title="Para tu próximo vídeo">
            {['tranquila', 'concentración', 'cinemática', 'energía', 'urbana', 'acústica'].map((g, i) => (
              <Card key={g} href={`/genre/${encodeURIComponent(g)}`} title={g.charAt(0).toUpperCase() + g.slice(1)} subtitle={plural(genreTracks(g).length, 'canción', 'canciones')} hue={(i * 57 + 200) % 360}
                context={{ type: 'search', id: `genre-${g}`, name: g, href: `/genre/${encodeURIComponent(g)}` }} trackIds={genreTracks(g).filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />
            ))}
          </Shelf>
        </>
      )}
    </div>
  );
}
