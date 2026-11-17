'use client';
import Link from 'next/link';
import { Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX, PanelRight, Loader2, Quote } from 'lucide-react';
import { usePlayer } from '@/store/player';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { getAlbum, getTrack, artistName } from '@/lib/data';
import { duration } from '@/lib/format';
import { creditText } from '@/lib/licence';
import { Cover } from './Cover';
import { Slider } from './Slider';
import { LicenceBadge } from './LicenceBadge';
import { useCopy } from './useCopy';

function Toggle({ on, label, onClick, children, dot = true }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode; dot?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label} title={label}
      className={`relative flex h-8 w-8 items-center justify-center ${on ? 'text-accent' : 'text-text-muted hover:text-text'}`}>
      {children}
      {on && dot && <span className="absolute bottom-0 h-1 w-1 rounded-full bg-accent" aria-hidden />}
    </button>
  );
}

export function PlayerBar() {
  const p = usePlayer();
  const t = p.q.current ? getTrack(p.q.current) : undefined;
  const album = t ? getAlbum(t.albumId) : undefined;
  const liked = useLibrary((s) => (t ? !!s.liked[t.id] : false));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const { panel, togglePanel, showToast } = useUi();
  const copy = useCopy();
  const disabled = !t;
  const repeatLabel = p.q.repeat === 'off' ? 'Repetir: desactivado' : p.q.repeat === 'all' ? 'Repetir: todo' : 'Repetir: una canción';
  const VolIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;
  const dur = p.durationMs || t?.durationMs || 0;

  return (
    <section aria-label="Reproductor" className="grid h-player grid-cols-[1fr_auto] items-center gap-2 bg-bg px-2 md:grid-cols-[minmax(180px,1fr)_minmax(320px,2fr)_minmax(180px,1fr)] md:px-4">
      {/* now playing */}
      <div className="flex min-w-0 items-center gap-3">
        {t && album ? (
          <>
            <Link href={`/album/${album.id}`} aria-label={`Ir al álbum ${album.title}`}><Cover hue={album.hue} label={album.title} src={album.coverUrl} size={56} /></Link>
            <div className="min-w-0">
              <Link href={`/album/${album.id}`} className="block truncate text-sm font-bold hover:underline" title={t.title}>{t.title}</Link>
              <Link href={`/artist/${t.artistId}`} className="block truncate text-xs text-text-muted hover:text-text hover:underline">{artistName(t)}</Link>
            </div>
            <button type="button" aria-pressed={liked} aria-label={liked ? 'Quitar de Me gustan' : 'Guardar en Me gustan'}
              onClick={() => showToast(toggleLike(t.id) ? 'Guardada en Me gustan' : 'Quitada de Me gustan')}
              className={`hidden shrink-0 md:block ${liked ? 'text-accent' : 'text-text-muted hover:text-text'}`}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button>
            <span className="hidden shrink-0 xl:inline-flex"><LicenceBadge code={t.licence} compact /></span>
          </>
        ) : <span className="text-sm text-text-subtle">Elige algo para escuchar</span>}
      </div>

      {/* controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="hidden md:block"><Toggle on={p.q.shuffle} label={p.q.shuffle ? 'Desactivar aleatorio' : 'Activar aleatorio (solo mezcla esta lista)'} onClick={() => p.setShuffle(!p.q.shuffle)}><Shuffle size={16} /></Toggle></span>
          <button type="button" disabled={disabled} onClick={p.prev} aria-label="Anterior" className="hidden text-text-muted hover:text-text disabled:opacity-40 md:block"><SkipBack size={18} fill="currentColor" /></button>
          <button type="button" disabled={disabled} onClick={p.toggle} aria-label={p.isPlaying ? 'Pausar' : 'Reproducir'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-text text-bg transition-transform hover:scale-105 disabled:opacity-40">
            {p.buffering && p.isPlaying ? <Loader2 size={18} className="animate-spin" /> : p.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button type="button" disabled={disabled} onClick={() => p.next()} aria-label="Siguiente" className="text-text-muted hover:text-text disabled:opacity-40"><SkipForward size={18} fill="currentColor" /></button>
          <span className="hidden md:block"><Toggle on={p.q.repeat !== 'off'} label={repeatLabel} onClick={p.cycleRepeat}>{p.q.repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}</Toggle></span>
        </div>
        <div className="hidden w-full max-w-[600px] items-center gap-2 text-xs tabular-nums text-text-muted md:flex">
          <span className="w-10 text-right">{duration(p.positionMs)}</span>
          <Slider className="flex-1" value={p.positionMs} max={dur} step={5000} disabled={disabled} label="Posición de la canción"
            valueText={`${duration(p.positionMs)} de ${duration(dur)}`} onCommit={(v) => p.seek(v)} />
          <span className="w-10">{duration(dur)}</span>
        </div>
      </div>

      {/* extras */}
      <div className="hidden items-center justify-end gap-1 md:flex">
        <button type="button" disabled={disabled} title="Copiar crédito" aria-label="Copiar crédito de la canción"
          onClick={() => t && copy(creditText(t, artistName(t)), 'Crédito copiado. Pégalo en la descripción de tu vídeo.')}
          className="flex h-8 w-8 items-center justify-center text-text-muted hover:text-text disabled:opacity-40"><Quote size={16} /></button>
        <Toggle on={panel === 'now'} label="Panel de lo que suena" onClick={() => togglePanel('now')}><PanelRight size={16} /></Toggle>
        <Toggle on={panel === 'queue'} label="Cola" onClick={() => togglePanel('queue')}><ListMusic size={16} /></Toggle>
        <button type="button" onClick={p.toggleMute} aria-label={p.muted ? 'Activar sonido' : 'Silenciar'} className="flex h-8 w-8 items-center justify-center text-text-muted hover:text-text"><VolIcon size={16} /></button>
        <Slider className="w-24" value={p.muted ? 0 : p.volume * 100} max={100} step={10} label="Volumen" valueText={`${Math.round((p.muted ? 0 : p.volume) * 100)} %`} onChange={(v) => p.setVolume(v / 100)} onCommit={(v) => p.setVolume(v / 100)} />
      </div>

      {/* mobile progress line */}
      <div className="col-span-2 -mt-2 h-0.5 w-full bg-surface-hover md:hidden" aria-hidden>
        <div className="h-full bg-text" style={{ width: `${dur ? (p.positionMs / dur) * 100 : 0}%` }} />
      </div>
    </section>
  );
}
