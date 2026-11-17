// Demo catalogue. Fictional artists and tracks, generated audio (scripts/make-audio.mjs).
// Swapped for Jamendo + uploads by /replica-backend; shapes match schema.sql.
import type { Album, Artist, Track, LicenceCode } from './types';

export const artists: Artist[] = [
  { id: 'ar1', name: 'Marea Baja', bio: 'Lo-fi desde un piso con vistas al puerto.', hue: 255 },
  { id: 'ar2', name: 'Los Faros', bio: 'Guitarras limpias y tardes largas.', hue: 190 },
  { id: 'ar3', name: 'Nube Ocho', bio: 'Electrónica tranquila para trabajar.', hue: 300 },
  { id: 'ar4', name: 'Calle Norte', bio: 'Ritmos urbanos con licencia abierta.', hue: 25 },
  { id: 'ar5', name: 'Hilo Fino', bio: 'Piano y cuerdas para documentales.', hue: 150 },
  { id: 'ar6', name: 'Tormenta Seca', bio: 'Energía para intros y deportes.', hue: 0 },
];

export const albums: Album[] = [
  { id: 'al1', artistId: 'ar1', title: 'Horas Lentas', year: 2025, kind: 'album', hue: 255 },
  { id: 'al2', artistId: 'ar2', title: 'Costa Clara', year: 2024, kind: 'ep', hue: 190 },
  { id: 'al3', artistId: 'ar3', title: 'Modo Foco', year: 2026, kind: 'album', hue: 300 },
  { id: 'al4', artistId: 'ar4', title: 'Asfalto', year: 2025, kind: 'ep', hue: 25 },
  { id: 'al5', artistId: 'ar5', title: 'Paisajes', year: 2023, kind: 'album', hue: 150 },
  { id: 'al6', artistId: 'ar6', title: 'Arranque', year: 2026, kind: 'single', hue: 0 },
];

type Row = [id: string, albumId: string, title: string, sec: number, lic: LicenceCode, genres: string[], freq: number, bpm: number];
const rows: Row[] = [
  ['t01', 'al1', 'Café a las siete', 42, 'CC-BY', ['lo-fi', 'tranquila'], 220, 72],
  ['t02', 'al1', 'Persiana a medias', 38, 'CC-BY', ['lo-fi', 'tranquila'], 247, 70],
  ['t03', 'al1', 'Domingo sin prisa', 45, 'CC-BY-NC', ['lo-fi'], 196, 68],
  ['t04', 'al2', 'Muelle cuatro', 40, 'CC-BY-SA', ['acústica', 'tranquila'], 262, 90],
  ['t05', 'al2', 'Sal en la piel', 36, 'CC-BY', ['acústica', 'alegre'], 294, 100],
  ['t06', 'al3', 'Pantalla en blanco', 48, 'CC-BY', ['electrónica', 'concentración'], 174, 110],
  ['t07', 'al3', 'Bucle infinito', 44, 'CC-BY-ND', ['electrónica', 'concentración'], 165, 120],
  ['t08', 'al3', 'Notas al margen', 41, 'CC-BY', ['electrónica', 'tranquila'], 185, 104],
  ['t09', 'al4', 'Semáforo en ámbar', 35, 'CC-BY', ['hip-hop', 'urbana'], 147, 92],
  ['t10', 'al4', 'Esquina con eco', 39, 'CC-BY-NC', ['hip-hop', 'urbana'], 139, 88],
  ['t11', 'al5', 'Valle abierto', 50, 'CC-BY', ['cinemática', 'piano'], 330, 60],
  ['t12', 'al5', 'Río de fondo', 46, 'CC-BY-SA', ['cinemática', 'piano'], 349, 64],
  ['t13', 'al5', 'Última luz del día con una melodía que no termina nunca de acabar', 43, 'CC-BY', ['cinemática'], 311, 58],
  ['t14', 'al6', 'Arranque', 34, 'CC-BY', ['rock', 'energía'], 110, 140],
];

export const tracks: Track[] = rows.map(([id, albumId, title, sec, licence, genres, freq, bpm], i) => {
  const album = albums.find((a) => a.id === albumId)!;
  return {
    id, albumId, artistId: album.artistId, title, durationMs: sec * 1000,
    trackNumber: rows.filter((r) => r[1] === albumId).findIndex((r) => r[0] === id) + 1,
    explicit: false, audioUrl: `/audio/${id}.mp3`, licence, genres, freq, bpm, order: i,
  };
});

export const genres = ['lo-fi', 'tranquila', 'acústica', 'alegre', 'electrónica', 'concentración', 'hip-hop', 'urbana', 'cinemática', 'piano', 'rock', 'energía'];
