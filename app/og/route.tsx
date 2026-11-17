import { ImageResponse } from 'next/og';
import { getAlbum, getArtist, getTrack, artistName } from '@/lib/data';
import { licences, licenceName } from '@/lib/licence';

// 1200x630 link-preview image. Colours are the design tokens' values
// (ImageResponse cannot read CSS variables).
const C = { bg: '#121212', text: '#ffffff', muted: '#b3b3b3', accent: '#9b8cff', onAccent: '#0b0b14', success: '#4cc38a' };

export async function GET(req: Request) {
  const u = new URL(req.url);
  const type = u.searchParams.get('type'), id = u.searchParams.get('id') ?? '';
  let title = 'Clipsong', sub = 'Música que puedes usar en tus vídeos', hue = 255, badge = '', ok = false, round = false;
  if (type === 'track') {
    const t = getTrack(id); const a = t && getAlbum(t.albumId);
    if (t && a) { title = t.title; sub = artistName(t); hue = a.hue; badge = `${licences[t.licence].label} · ${licenceName(t)}`; ok = licences[t.licence].kind === 'ok'; }
  } else if (type === 'album') {
    const a = getAlbum(id);
    if (a) { title = a.title; sub = `${getArtist(a.artistId)?.name ?? ''} · ${a.year}`; hue = a.hue; badge = 'Licencias Creative Commons'; }
  } else if (type === 'playlist') {
    title = u.searchParams.get('name')?.slice(0, 100) || 'Lista'; sub = u.searchParams.get('by')?.slice(0, 60) ? `Lista de ${u.searchParams.get('by')!.slice(0, 60)}` : 'Lista'; hue = (title.length * 37) % 360; badge = 'Licencias Creative Commons';
  } else if (type === 'artist') {
    const a = getArtist(id);
    if (a) { title = a.name; sub = 'Artista independiente'; hue = a.hue; round = true; badge = 'Licencias Creative Commons'; }
  }
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 56, padding: 72, background: C.bg, color: C.text }}>
        <div style={{ width: 420, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 180, fontWeight: 700, borderRadius: round ? 999 : 16,
          background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 55% 22%))` }}>{title.charAt(0).toUpperCase()}</div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>
          <div style={{ fontSize: title.length > 28 ? 52 : 72, fontWeight: 700, lineHeight: 1.05 }}>{title.length > 70 ? title.slice(0, 67) + '…' : title}</div>
          <div style={{ fontSize: 36, color: C.muted }}>{sub}</div>
          {badge && <div style={{ display: 'flex', alignSelf: 'flex-start', fontSize: 28, fontWeight: 700, padding: '8px 20px', borderRadius: 999, border: `3px solid ${ok ? C.success : C.muted}`, color: ok ? C.success : C.muted }}>{badge}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, fontSize: 32, fontWeight: 700 }}>
            <svg width="40" height="40" viewBox="0 0 32 32"><path d="M7 4.5v23a1.5 1.5 0 0 0 2.3 1.3L20 22 26 12 9.3 3.2A1.5 1.5 0 0 0 7 4.5Z" fill={C.accent} /></svg>clipsong
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'cache-control': 'public, max-age=86400' } },
  );
}
