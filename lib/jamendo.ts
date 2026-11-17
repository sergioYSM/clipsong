// Jamendo API v3 adapter (https://developer.jamendo.com/v3.0/docs), server side
// only, with the user's own client_id. Maps Jamendo objects to our catalogue types.
// NOTE: field names below follow the public v3.0 docs; they were not checked
// against a live response from this environment (network blocked).
import { licenceFromUrl } from './licence.ts';
import type { Album, Artist, LicenceCode, Track } from './types.ts';

const API = 'https://api.jamendo.com/v3.0';

export interface JamendoTrack {
  id: string; name: string; duration: number; position?: number;
  artist_id: string; artist_name: string; album_id: string; album_name: string; album_image?: string;
  releasedate?: string; audio: string; license_ccurl: string;
  musicinfo?: { tags?: { genres?: string[]; vartags?: string[] } };
}

const hueOf = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

export function mapJamendo(tracks: JamendoTrack[]): { artists: Artist[]; albums: Album[]; tracks: Track[]; skipped: number } {
  const artists = new Map<string, Artist>(), albums = new Map<string, Album>(), out: Track[] = [];
  let skipped = 0;
  for (const j of tracks) {
    const licence = licenceFromUrl(j.license_ccurl);
    if (!licence || !j.audio || !j.duration) { skipped++; continue; }
    const artistId = `jm-ar${j.artist_id}`, albumId = `jm-al${j.album_id}`;
    if (!artists.has(artistId)) artists.set(artistId, { id: artistId, name: j.artist_name, bio: '', hue: hueOf(j.artist_name) });
    if (!albums.has(albumId)) albums.set(albumId, { id: albumId, artistId, title: j.album_name || j.name, year: Number(j.releasedate?.slice(0, 4)) || new Date().getFullYear(), kind: 'album', hue: hueOf(j.album_name || j.name), coverUrl: j.album_image || undefined });
    out.push({
      id: `jm-${j.id}`, albumId, artistId, title: j.name, durationMs: Math.round(j.duration * 1000), trackNumber: j.position ?? 1,
      explicit: false, audioUrl: j.audio, licence: licence as LicenceCode, licenceUrl: j.license_ccurl.replace(/^http:/, 'https:'),
      genres: [...(j.musicinfo?.tags?.genres ?? []), ...(j.musicinfo?.tags?.vartags ?? [])].slice(0, 6), order: out.length,
    });
  }
  return { artists: [...artists.values()], albums: [...albums.values()], tracks: out, skipped };
}

async function get(path: string, params: Record<string, string>, clientId: string) {
  const qs = new URLSearchParams({ client_id: clientId, format: 'json', ...params });
  const res = await fetch(`${API}/${path}/?${qs}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jamendo ${path} HTTP ${res.status}`);
  const body = await res.json();
  if (body.headers?.status !== 'success') throw new Error(`Jamendo ${path}: ${body.headers?.error_message ?? 'error'}`);
  return body.results as JamendoTrack[];
}

export function searchJamendoTracks(tag: string, clientId: string, limit = 50) {
  return get('tracks', { tags: tag, limit: String(limit), include: 'musicinfo licenses', audioformat: 'mp32', order: 'popularity_total', boost: 'popularity_total' }, clientId);
}

/** id -> {licence, licenceUrl} for up to 200 Jamendo ids (without the jm- prefix). */
export async function fetchJamendoTracksByIds(ids: string[], clientId: string) {
  const out = new Map<string, { licence: LicenceCode; licenceUrl: string }>();
  for (let i = 0; i < ids.length; i += 100) {
    const res = await get('tracks', { id: ids.slice(i, i + 100).join('+'), limit: '100', include: 'licenses' }, clientId);
    for (const j of res) { const l = licenceFromUrl(j.license_ccurl); if (l) out.set(`jm-${j.id}`, { licence: l, licenceUrl: j.license_ccurl.replace(/^http:/, 'https:') }); }
  }
  return out;
}
