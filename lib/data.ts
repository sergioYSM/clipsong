// Fake data layer over the seed catalogue. Same signatures the real API will
// have (architecture.md): swapping in fetch() calls changes no screen code.
import * as demo from './seed';
import generated from './catalogue.generated.json';

// The imported Jamendo catalogue when there is one (scripts/import-jamendo.ts), else the demo seed.
const real = (generated as unknown as { artists: Artist[]; albums: Album[]; tracks: Track[] });
const useReal = real.tracks.length > 0;
export const catalogueSource: 'jamendo' | 'demo' = useReal ? 'jamendo' : 'demo';
const artists: Artist[] = useReal ? real.artists : demo.artists;
const albums: Album[] = useReal ? real.albums : demo.albums;
const tracks: Track[] = useReal ? real.tracks : demo.tracks;
const genres: string[] = useReal ? [...new Set(tracks.flatMap((t) => t.genres))].slice(0, 24) : demo.genres;
import type { Album, Artist, Track } from './types';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function getTrack(id: string): Track | undefined { return tracks.find((t) => t.id === id); }
export function getTracks(ids: string[]): Track[] { return ids.map(getTrack).filter(Boolean) as Track[]; }
export function getArtist(id: string): Artist | undefined { return artists.find((a) => a.id === id); }
export function getAlbum(id: string): Album | undefined { return albums.find((a) => a.id === id); }
export function albumTracks(albumId: string): Track[] {
  return tracks.filter((t) => t.albumId === albumId).sort((a, b) => a.trackNumber - b.trackNumber);
}
export function artistTracks(artistId: string): Track[] { return tracks.filter((t) => t.artistId === artistId); }
export function artistAlbums(artistId: string): Album[] { return albums.filter((a) => a.artistId === artistId); }
export function allAlbums(): Album[] { return [...albums].sort((a, b) => b.year - a.year); }
export function allArtists(): Artist[] { return artists; }
export function allGenres(): string[] { return genres; }
export function genreTracks(g: string): Track[] { return tracks.filter((t) => t.genres.includes(g)); }
export function artistName(t: Track): string { return getArtist(t.artistId)?.name ?? 'Artista desconocido'; }

/** "Radio": similar tracks by shared genres. Lives behind its own button, never mixed into a playlist. */
export function radioFor(trackId: string): Track[] {
  const seed = getTrack(trackId);
  if (!seed) return [];
  const scored = tracks
    .filter((t) => t.id !== seed.id)
    .map((t) => ({ t, s: t.genres.filter((g) => seed.genres.includes(g)).length + (t.artistId === seed.artistId ? 0.5 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return [seed, ...scored.map((x) => x.t)];
}

/** Typo-tolerant-ish search: substring, then words, then 1-edit distance on words. */
function score(hay: string, q: string): number {
  const h = norm(hay), n = norm(q).trim();
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(n)) return 60;
  const words = h.split(/\s+/);
  const qs = n.split(/\s+/);
  let hits = 0;
  for (const w of qs) if (words.some((x) => x.startsWith(w) || (w.length > 3 && editLe1(x, w)))) hits++;
  return hits === qs.length ? 40 : 0;
}
function editLe1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++e > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return e + (a.length - i) + (b.length - j) <= 1;
}

export interface SearchResults { tracks: Track[]; artists: Artist[]; albums: Album[]; top: { type: 'track' | 'artist' | 'album'; id: string } | null }

export function search(q: string): SearchResults {
  const ts = tracks.map((t) => ({ t, s: Math.max(score(t.title, q), score(artistName(t), q) - 10, ...t.genres.map((g) => score(g, q) - 20)) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const ar = artists.map((a) => ({ a, s: score(a.name, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const al = albums.map((a) => ({ a, s: score(a.title, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const best = [
    ts[0] && { type: 'track' as const, id: ts[0].t.id, s: ts[0].s },
    ar[0] && { type: 'artist' as const, id: ar[0].a.id, s: ar[0].s + 1 },
    al[0] && { type: 'album' as const, id: al[0].a.id, s: al[0].s },
  ].filter(Boolean).sort((a, b) => b!.s - a!.s)[0];
  return { tracks: ts.map((x) => x.t), artists: ar.map((x) => x.a), albums: al.map((x) => x.a), top: best ? { type: best.type, id: best.id } : null };
}
