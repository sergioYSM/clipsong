'use client';
// One <audio> element for the whole app, mounted in the root layout so music
// never stops when the route changes. Also: Media Session (lock screen, media
// keys) and global keyboard shortcuts.
import { useEffect, useRef } from 'react';
import { usePlayer } from '@/store/player';
import { getTrack, getAlbum, artistName } from '@/lib/data';
import { useUi } from '@/store/ui';

export function AudioEngine() {
  const ref = useRef<HTMLAudioElement>(null);
  const current = usePlayer((s) => s.q.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekTo = usePlayer((s) => s.seekTo);
  const showToast = useUi((s) => s.showToast);

  // load track
  useEffect(() => {
    const a = ref.current; if (!a) return;
    const t = current ? getTrack(current) : undefined;
    if (!t) { a.removeAttribute('src'); a.load(); return; }
    if (!a.src.endsWith(t.audioUrl)) { a.src = t.audioUrl; a.load(); }
    const album = getAlbum(t.albumId);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: artistName(t), album: album?.title ?? '' });
    }
    document.title = `${t.title} · ${artistName(t)}`;
  }, [current]);

  // play / pause
  useEffect(() => {
    const a = ref.current; if (!a || !current) return;
    if (isPlaying) a.play().catch(() => usePlayer.setState({ isPlaying: false }));
    else a.pause();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, current]);

  useEffect(() => { if (ref.current) { ref.current.volume = volume; ref.current.muted = muted; } }, [volume, muted]);

  useEffect(() => {
    const a = ref.current; if (!a || seekTo === null) return;
    const apply = () => { a.currentTime = seekTo / 1000; usePlayer.setState({ seekTo: null }); };
    if (a.readyState >= 1) apply(); else a.addEventListener('loadedmetadata', apply, { once: true });
  }, [seekTo]);

  // media session actions
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const s = usePlayer.getState;
    const set = (k: MediaSessionAction, h: MediaSessionActionHandler | null) => { try { navigator.mediaSession.setActionHandler(k, h); } catch {} };
    set('play', () => s().play()); set('pause', () => s().pause());
    set('nexttrack', () => s().next()); set('previoustrack', () => s().prev());
    set('seekto', (d) => d.seekTime !== undefined && s().seek(d.seekTime * 1000));
  }, []);

  // keyboard shortcuts (not while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable=true], [role=menu], [role=slider]')) return;
      const s = usePlayer.getState();
      if (e.code === 'Space' && !el.closest('button, a, [role=row]')) { e.preventDefault(); s.toggle(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') { e.preventDefault(); s.next(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') { e.preventDefault(); s.prev(); }
      else if (e.shiftKey && e.key === 'ArrowRight') { e.preventDefault(); s.seek(Math.min(s.durationMs, s.positionMs + 5000)); }
      else if (e.shiftKey && e.key === 'ArrowLeft') { e.preventDefault(); s.seek(Math.max(0, s.positionMs - 5000)); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') { e.preventDefault(); s.setVolume(s.volume + 0.1); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') { e.preventDefault(); s.setVolume(s.volume - 0.1); }
      else if (e.key === '/') { e.preventDefault(); document.querySelector<HTMLInputElement>('#global-search')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <audio ref={ref} preload="auto"
      onTimeUpdate={(e) => usePlayer.getState()._tick(e.currentTarget.currentTime * 1000, (e.currentTarget.duration || 0) * 1000)}
      onLoadedMetadata={(e) => usePlayer.getState()._tick(e.currentTarget.currentTime * 1000, e.currentTarget.duration * 1000)}
      onWaiting={() => usePlayer.getState()._setBuffering(true)}
      onPlaying={() => usePlayer.getState()._setBuffering(false)}
      onCanPlay={() => usePlayer.getState()._setBuffering(false)}
      onEnded={() => usePlayer.getState()._ended()}
      onError={() => { if (usePlayer.getState().q.current) { showToast('No se ha podido reproducir esta canción. Pasamos a la siguiente.'); usePlayer.getState().next(true); } }}
    />
  );
}
