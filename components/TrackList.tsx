'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Clock3, Heart, MoreHorizontal, Play, GripVertical } from 'lucide-react';
import type { PlayContext, Track } from '@/lib/types';
import { getAlbum, getArtist } from '@/lib/data';
import { duration, relDate } from '@/lib/format';
import { isMonetizable } from '@/lib/licence';
import { usePlayer } from '@/store/player';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { Cover } from './Cover';
import { LicenceBadge } from './LicenceBadge';
import { Menu, useMenu } from './Menu';
import { useTrackMenu } from './trackMenu';

type Variant = 'album' | 'playlist' | 'search' | 'liked';

export function TrackList({ tracks, context, variant, playlistId, addedAt, onReorder, emptyText }: {
  tracks: Track[]; context: PlayContext; variant: Variant; playlistId?: string;
  addedAt?: (t: Track, i: number) => number | undefined; onReorder?: (from: number, to: number) => void; emptyText?: string;
}) {
  const monetizableOnly = useLibrary((s) => s.monetizableOnly);
  const visible = tracks.map((t, i) => ({ t, i })).filter(({ t }) => !monetizableOnly || isMonetizable(t));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const showAlbum = variant === 'playlist' || variant === 'liked';
  const showCover = variant !== 'album';
  const cols = `grid-cols-[24px_minmax(0,1fr)_auto_40px] ${showAlbum ? 'md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_auto_40px]' : ''} ${addedAt ? 'lg:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_auto_40px]' : ''}`;

  if (!tracks.length) return <p className="px-4 py-8 text-text-muted">{emptyText ?? 'No hay canciones.'}</p>;
  if (!visible.length) return (
    <p className="px-4 py-8 text-text-muted">Ninguna canción de aquí es apta para monetizar. Quita el filtro «Apta para monetizar» para verlas todas.</p>
  );

  return (
    <div role="table" aria-label={`Canciones de ${context.name}`} className="px-2 md:px-4">
      <div role="row" className={`grid ${cols} items-center gap-4 border-b border-border px-4 pb-2 text-sm text-text-muted`}>
        <span role="columnheader" className="text-right">#</span>
        <span role="columnheader">Título</span>
        {showAlbum && <span role="columnheader" className="hidden md:block">Álbum</span>}
        {addedAt && <span role="columnheader" className="hidden lg:block">Añadida</span>}
        <span role="columnheader" className="hidden sm:block">Licencia</span>
        <span role="columnheader" className="flex justify-end"><Clock3 size={16} aria-label="Duración" /></span>
      </div>
      <div role="rowgroup" className="pt-2">
        {visible.map(({ t, i }, n) => (
          <Row key={t.id} t={t} n={n + 1} index={i} ids={visible.map((v) => v.t.id)} pos={n} context={context}
            cols={cols} compactBadge={variant === 'search'} showAlbum={showAlbum} showCover={showCover} playlistId={playlistId} added={addedAt?.(t, i)} hasAdded={!!addedAt}
            draggable={!!onReorder && !monetizableOnly}
            move={onReorder && !monetizableOnly ? (dir: -1 | 1) => {
              const to = i + dir;
              if (to < 0 || to >= tracks.length) return;
              onReorder(i, to);
              useUi.getState().showToast(`Movida a la posición ${to + 1}`);
              // keep keyboard focus on the row that moved
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-row-index="${to}"]`)?.focus());
            } : undefined}
            onDragStart={() => setDragFrom(i)} onDrop={() => { if (dragFrom !== null && onReorder && dragFrom !== i) onReorder(dragFrom, i); setDragFrom(null); }} />
        ))}
      </div>
    </div>
  );
}

function Row({ t, n, index, ids, pos, context, cols, compactBadge, showAlbum, showCover, playlistId, added, hasAdded, draggable, onDragStart, onDrop, move }: {
  t: Track; n: number; index: number; ids: string[]; pos: number; context: PlayContext; cols: string; compactBadge: boolean; showAlbum: boolean; showCover: boolean;
  playlistId?: string; added?: number; hasAdded: boolean; draggable: boolean; onDragStart: () => void; onDrop: () => void; move?: (dir: -1 | 1) => void;
}) {
  const current = usePlayer((s) => s.q.current);
  const ctx = usePlayer((s) => s.context);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playContext = usePlayer((s) => s.playContext);
  const toggle = usePlayer((s) => s.toggle);
  const liked = useLibrary((s) => !!s.liked[t.id]);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const pushRecent = useLibrary((s) => s.pushRecent);
  const showToast = useUi((s) => s.showToast);
  const buildMenu = useTrackMenu();
  const { menu, openAt, close } = useMenu();
  const artist = getArtist(t.artistId);
  const album = getAlbum(t.albumId);
  const active = current === t.id && ctx?.type === context.type && ctx?.id === context.id;
  const playThis = () => { if (active) toggle(); else { playContext(ids, pos, context); pushRecent(context); } };

  return (
    <div role="row" tabIndex={0} aria-current={active ? 'true' : undefined}
      onDoubleClick={playThis}
      data-row-index={index}
      aria-keyshortcuts={move ? 'Alt+ArrowUp Alt+ArrowDown' : undefined}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter') playThis();
        else if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') openAt(e);
        else if (move && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); move(e.key === 'ArrowUp' ? -1 : 1); }
        else if (!e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault();
          const rows = Array.from(e.currentTarget.parentElement!.querySelectorAll<HTMLElement>('[role=row]'));
          rows[rows.indexOf(e.currentTarget) + (e.key === 'ArrowDown' ? 1 : -1)]?.focus();
        }
      }}
      onContextMenu={openAt}
      draggable={draggable} onDragStart={onDragStart} onDragOver={(e) => draggable && e.preventDefault()} onDrop={onDrop}
      className={`group grid ${cols} items-center gap-4 rounded-sm px-4 py-2 hover:bg-surface-hover focus-visible:bg-surface-hover ${menu ? 'bg-surface-hover' : ''}`}>
      <div role="cell" className="relative flex h-4 items-center justify-end text-text-muted tabular-nums">
        {draggable && <GripVertical size={14} className="absolute -left-4 hidden cursor-grab text-text-subtle group-hover:block" aria-hidden />}
        <span className={`group-hover:hidden ${active ? 'hidden' : ''}`}>{n}</span>
        {active && isPlaying && <span className="eq group-hover:hidden" role="img" aria-label="Sonando"><span /><span /><span /></span>}
        {active && !isPlaying && <span className="text-accent group-hover:hidden">{n}</span>}
        <button type="button" onClick={playThis} aria-label={`${active && isPlaying ? 'Pausar' : 'Reproducir'} ${t.title}`} className="hidden text-text group-hover:block group-focus-within:block">
          <Play size={14} fill="currentColor" />
        </button>
      </div>
      <div role="cell" className="flex min-w-0 items-center gap-3">
        {showCover && album && <Cover hue={album.hue} label={album.title} src={album.coverUrl} size={40} />}
        <div className="min-w-0">
          <div className={`truncate text-base ${active ? 'text-accent' : 'text-text'}`} title={t.title}>{t.title}</div>
          <Link href={`/artist/${t.artistId}`} className="truncate text-sm text-text-muted hover:text-text hover:underline">{artist?.name}</Link>
        </div>
      </div>
      {showAlbum && <Link role="cell" href={`/album/${t.albumId}`} className="hidden truncate text-sm text-text-muted hover:text-text hover:underline md:block">{album?.title}</Link>}
      {hasAdded && <span role="cell" className="hidden text-sm text-text-muted lg:block">{added ? relDate(added) : ''}</span>}
      <div role="cell" className="flex items-center gap-3">
        {compactBadge ? <LicenceBadge code={t.licence} compact /> : (<>
          <span className="hidden sm:inline-flex"><LicenceBadge code={t.licence} /></span>
          <span className="sm:hidden"><LicenceBadge code={t.licence} compact /></span>
        </>)}
        <button type="button" onClick={() => showToast(toggleLike(t.id) ? 'Guardada en Me gustan' : 'Quitada de Me gustan')}
          aria-pressed={liked} aria-label={liked ? `Quitar ${t.title} de Me gustan` : `Guardar ${t.title} en Me gustan`}
          className={`${liked ? 'text-accent' : 'text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100'} hover:text-text`}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div role="cell" className="flex items-center justify-end gap-2 text-sm tabular-nums text-text-muted">
        <span>{duration(t.durationMs)}</span>
        <button type="button" onClick={openAt} aria-haspopup="menu" aria-label={`Más opciones para ${t.title}`} className="opacity-0 hover:text-text focus:opacity-100 group-hover:opacity-100">
          <MoreHorizontal size={16} />
        </button>
      </div>
      {menu && <Menu label={`Opciones de ${t.title}`} x={menu.x} y={menu.y} onClose={close} items={buildMenu(t, playlistId ? { playlistId, index, move } : {})} />}
    </div>
  );
}
