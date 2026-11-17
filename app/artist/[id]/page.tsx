'use client';
import { useTitle } from '@/lib/useTitle';
import { useParams, notFound } from 'next/navigation';
import { getArtist, artistTracks, artistAlbums } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { Hero } from '@/components/Hero';
import { Cover } from '@/components/Cover';
import { TrackList } from '@/components/TrackList';
import { Card, Shelf } from '@/components/Card';
import { ContextActions } from '@/components/ContextHeaderActions';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const artist = getArtist(id);
  const following = useLibrary((s) => !!s.follows[id]);
  const toggleFollow = useLibrary((s) => s.toggleFollow);
  const only = useLibrary((s) => s.monetizableOnly);
  const showToast = useUi((s) => s.showToast);
  useTitle(artist?.name);
  if (!artist) notFound();
  const tracks = artistTracks(artist.id);
  const albums = artistAlbums(artist.id);
  const ctx = { type: 'artist' as const, id: artist.id, name: artist.name, href: `/artist/${artist.id}` };
  return (
    <div>
      <Hero kind="Artista" title={artist.name} hueBg={artist.hue} art={<Cover hue={artist.hue} label={artist.name} size="fill" round />} meta={artist.bio}>
        <ContextActions context={ctx} trackIds={tracks.filter((t) => !only || isMonetizable(t)).map((t) => t.id)} />
        <button type="button" aria-pressed={following} onClick={() => showToast(toggleFollow(artist.id) ? `Sigues a ${artist.name}` : `Has dejado de seguir a ${artist.name}`)}
          className="rounded-full border border-text-subtle px-4 py-1.5 text-sm font-bold hover:scale-105 hover:border-text">{following ? 'Siguiendo' : 'Seguir'}</button>
      </Hero>
      <h2 className="mb-2 px-4 text-xl font-bold md:px-6">Populares</h2>
      <TrackList tracks={tracks} context={ctx} variant="search" />
      <div className="mt-8 px-1 md:px-3">
        <Shelf title="Discografía">
          {albums.map((a) => <Card key={a.id} href={`/album/${a.id}`} img={a.coverUrl} title={a.title} subtitle={`${a.year} · ${a.kind === 'single' ? 'Single' : a.kind === 'ep' ? 'EP' : 'Álbum'}`} hue={a.hue}
            context={{ type: 'album', id: a.id, name: a.title, href: `/album/${a.id}` }} trackIds={tracks.filter((t) => t.albumId === a.id).map((t) => t.id)} />)}
        </Shelf>
      </div>
    </div>
  );
}
