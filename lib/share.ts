import type { Metadata } from 'next';
import { getAlbum, getArtist, getTrack, albumTracks, artistTracks, artistName } from './data';
import { isMonetizable, licences, licenceName } from './licence';
import { plural } from './format';

// Link previews (Open Graph / Twitter) for shared albums, songs and artists.
const og = (title: string, description: string, image: string): Metadata => ({
  title: `${title} · Clipsong`,
  description,
  openGraph: { title, description, siteName: 'Clipsong', type: 'music.album', images: [{ url: image, width: 1200, height: 630, alt: title }] },
  twitter: { card: 'summary_large_image', title, description, images: [image] },
});

export function albumMetadata(id: string, trackId?: string | null): Metadata {
  const album = getAlbum(id);
  if (!album) return { title: 'No encontrado · Clipsong' };
  const t = trackId ? getTrack(trackId) : undefined;
  if (t && t.albumId === id) {
    const l = licences[t.licence];
    return og(`${t.title} · ${artistName(t)}`, `${l.label}. ${licenceName(t)}. ${l.explain}`, `/og?type=track&id=${t.id}`);
  }
  const tracks = albumTracks(id);
  const ok = tracks.filter(isMonetizable).length;
  return og(`${album.title} · ${getArtist(album.artistId)?.name ?? ''}`, `${plural(tracks.length, 'canción', 'canciones')}, ${ok} aptas para vídeos monetizados. Música con licencia Creative Commons.`, `/og?type=album&id=${id}`);
}

export function artistMetadata(id: string): Metadata {
  const a = getArtist(id);
  if (!a) return { title: 'No encontrado · Clipsong' };
  const n = artistTracks(id).length;
  return og(a.name, `${a.bio ? a.bio + ' ' : ''}${plural(n, 'canción', 'canciones')} con licencia abierta en Clipsong.`, `/og?type=artist&id=${id}`);
}
