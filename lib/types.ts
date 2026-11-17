export type LicenceCode = 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC' | 'CC-BY-ND';

export interface Artist { id: string; name: string; bio: string; hue: number }
export interface Album { id: string; artistId: string; title: string; year: number; kind: 'album' | 'ep' | 'single'; hue: number }
export interface Track {
  id: string; albumId: string; artistId: string; title: string; durationMs: number;
  trackNumber: number; explicit: boolean; audioUrl: string; licence: LicenceCode;
  genres: string[]; freq: number; bpm: number; order: number;
}
export interface Playlist {
  id: string; name: string; description: string; trackIds: string[];
  createdAt: number; updatedAt: number; isPublic: boolean;
}
export type ContextType = 'album' | 'playlist' | 'artist' | 'liked' | 'search' | 'radio';
export interface PlayContext { type: ContextType; id: string; name: string; href: string }
