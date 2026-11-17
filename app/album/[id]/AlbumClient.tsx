'use client';
import Link from 'next/link';
import { useParams, notFound, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Link2, ListPlus } from 'lucide-react';
import { getAlbum, getArtist, albumTracks } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { plural, totalDuration } from '@/lib/format';
import { Hero } from '@/components/Hero';
import { Cover } from '@/components/Cover';
import { TrackList } from '@/components/TrackList';
import { ContextActions } from '@/components/ContextHeaderActions';
import { MonetizeChip } from '@/components/MonetizeChip';
import { useLibrary } from '@/store/library';
import { usePlayer } from '@/store/player';
import { useUi } from '@/store/ui';
import { useCopy } from '@/components/useCopy';

export default function AlbumClient() {
  const { id } = useParams<{ id: string }>();
  const album = getAlbum(id);
  const saved = useLibrary((s) => !!s.savedAlbums[id]);
  const only = useLibrary((s) => s.monetizableOnly);
  const toggleSave = useLibrary((s) => s.toggleSaveAlbum);
  const addToQueue = usePlayer((s) => s.addToQueue);
  const showToast = useUi((s) => s.showToast);
  const copy = useCopy();
  const linked = useSearchParams().get('t');
  useEffect(() => {
    if (!linked) return;
    const i = album ? albumTracks(album.id).findIndex((t) => t.id === linked) : -1;
    if (i >= 0) requestAnimationFrame(() => { const row = document.querySelector<HTMLElement>(`[data-row-index="${i}"]`); row?.scrollIntoView({ block: 'center' }); row?.focus(); });
  }, [linked, album]);
  if (!album) notFound();
  const artist = getArtist(album.artistId)!;
  const tracks = albumTracks(album.id);
  const ctx = { type: 'album' as const, id: album.id, name: album.title, href: `/album/${album.id}` };
  const ok = tracks.filter(isMonetizable).length;
  return (
    <div>
      <Hero kind={album.kind === 'single' ? 'Single' : album.kind === 'ep' ? 'EP' : 'Álbum'} title={album.title} hueBg={album.hue}
        art={<Cover hue={album.hue} label={album.title} src={album.coverUrl} size="fill" />}
        meta={<><Link href={`/artist/${artist.id}`} className="font-bold text-text hover:underline">{artist.name}</Link> · {album.year} · {plural(tracks.length, 'canción', 'canciones')}, {totalDuration(tracks.reduce((s, t) => s + t.durationMs, 0))} · <span className="text-success">{ok} de {tracks.length} aptas para monetizar</span></>}>
        <ContextActions context={ctx} trackIds={tracks.filter((t) => !only || isMonetizable(t)).map((t) => t.id)} saved={saved}
          onSave={() => showToast(toggleSave(album.id) ? 'Guardado en tu biblioteca' : 'Quitado de tu biblioteca')} saveLabel={['Guardar en tu biblioteca', 'Quitar de tu biblioteca']}
          menuItems={[
            { label: 'Añadir todo a la cola', icon: <ListPlus size={16} />, onSelect: () => { tracks.forEach((t) => addToQueue(t.id)); showToast(`${tracks.length} canciones añadidas a la cola`); } },
            { label: 'Copiar enlace', icon: <Link2 size={16} />, onSelect: () => copy(location.href, 'Enlace copiado') },
          ]} />
        <span className="ml-auto"><MonetizeChip /></span>
      </Hero>
      <TrackList tracks={tracks} context={ctx} variant="album" />
    </div>
  );
}
