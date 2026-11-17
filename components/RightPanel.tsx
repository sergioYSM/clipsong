'use client';
import Link from 'next/link';
import { X, Trash2, GripVertical, Quote, Radio } from 'lucide-react';
import { useState } from 'react';
import { usePlayer } from '@/store/player';
import { useUi } from '@/store/ui';
import { getTrack, getAlbum, getArtist, artistName } from '@/lib/data';
import { upNextFromContext } from '@/lib/queue';
import { creditText, licences } from '@/lib/licence';
import { duration } from '@/lib/format';
import { Cover } from './Cover';
import { LicenceBadge } from './LicenceBadge';
import { useCopy } from './useCopy';
import type { Track } from '@/lib/types';

function MiniRow({ t, active, onPlay, children, drag }: { t: Track; active?: boolean; onPlay?: () => void; children?: React.ReactNode; drag?: { onDragStart: () => void; onDrop: () => void } }) {
  const album = getAlbum(t.albumId)!;
  return (
    <li draggable={!!drag} onDragStart={drag?.onDragStart} onDragOver={(e) => drag && e.preventDefault()} onDrop={drag?.onDrop}
      className="group flex items-center gap-3 rounded-md p-2 hover:bg-surface-hover">
      {drag && <GripVertical size={14} className="-mr-1 cursor-grab text-text-subtle" aria-hidden />}
      <button type="button" onClick={onPlay} aria-label={`Reproducir ${t.title}`} className="shrink-0"><Cover hue={album.hue} label={album.title} src={album.coverUrl} size={40} /></button>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm ${active ? 'text-accent' : ''}`}>{t.title}</div>
        <div className="truncate text-xs text-text-muted">{artistName(t)}</div>
      </div>
      {children}
    </li>
  );
}

export function QueueView({ standalone = false }: { standalone?: boolean }) {
  const p = usePlayer();
  const [from, setFrom] = useState<number | null>(null);
  const cur = p.q.current ? getTrack(p.q.current) : undefined;
  const upNext = upNextFromContext(p.q).map(getTrack).filter(Boolean) as Track[];
  return (
    <div className={standalone ? '' : 'p-2'}>
      {!cur && <p className="p-4 text-sm text-text-muted">La cola está vacía. Añade canciones desde el menú «…» de cualquier canción.</p>}
      {cur && (<>
        <h3 className="px-2 pb-1 pt-2 font-bold">Sonando ahora</h3>
        <ul><MiniRow t={cur} active /></ul>
      </>)}
      {p.q.userQueue.length > 0 && (<>
        <div className="flex items-center justify-between px-2 pb-1 pt-4">
          <h3 className="font-bold">A continuación en tu cola</h3>
          <button type="button" onClick={p.clearQueue} className="text-sm font-bold text-text-muted hover:text-text">Vaciar</button>
        </div>
        <ul>
          {p.q.userQueue.map((id, i) => { const t = getTrack(id); return t && (
            <MiniRow key={`${id}-${i}`} t={t} drag={{ onDragStart: () => setFrom(i), onDrop: () => { if (from !== null) p.moveInQueue(from, i); setFrom(null); } }}>
              <button type="button" onClick={() => p.removeFromQueue(i)} aria-label={`Quitar ${t.title} de la cola`} className="text-text-muted opacity-0 hover:text-text focus:opacity-100 group-hover:opacity-100"><Trash2 size={16} /></button>
            </MiniRow>); })}
        </ul>
      </>)}
      {upNext.length > 0 && p.context && (<>
        <h3 className="px-2 pb-1 pt-4 font-bold">Después, de <Link href={p.context.href} className="hover:underline">{p.context.name}</Link></h3>
        <ul>{upNext.map((t) => <MiniRow key={t.id} t={t} onPlay={() => { const i = p.q.contextIds.indexOf(t.id); p.playContext(p.q.contextIds, i, p.context!); }} />)}</ul>
      </>)}
      {cur && !upNext.length && !p.q.userQueue.length && <p className="p-4 text-sm text-text-muted">No hay nada más en la cola{p.q.repeat === 'one' ? ' (repetir una canción está activado)' : ''}.</p>}
    </div>
  );
}

function NowPlaying() {
  const id = usePlayer((s) => s.q.current);
  const copy = useCopy();
  const t = id ? getTrack(id) : undefined;
  if (!t) return <p className="p-4 text-sm text-text-muted">Cuando reproduzcas algo, aquí verás su licencia y el crédito listo para copiar.</p>;
  const album = getAlbum(t.albumId)!; const artist = getArtist(t.artistId)!; const l = licences[t.licence];
  return (
    <div className="space-y-4 p-4">
      <Cover hue={album.hue} label={album.title} src={album.coverUrl} size="fill" />
      <div>
        <Link href={`/album/${album.id}`} className="block text-xl font-bold hover:underline">{t.title}</Link>
        <Link href={`/artist/${artist.id}`} className="text-text-muted hover:text-text hover:underline">{artist.name}</Link>
      </div>
      <section aria-label="Licencia" className="rounded-lg bg-surface-raised p-4">
        <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-bold">Licencia</h3><LicenceBadge code={t.licence} /></div>
        <p className="mb-3 text-sm text-text-muted">{l.explain}</p>
        <a href={l.url} target="_blank" rel="noopener noreferrer" className="mb-3 block text-sm text-text-muted underline hover:text-text">{l.name}</a>
        <button type="button" onClick={() => copy(creditText(t, artist.name), 'Crédito copiado. Pégalo en la descripción de tu vídeo.')}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2 text-sm font-bold text-accent-on hover:scale-[1.02]"><Quote size={16} /> Copiar crédito</button>
      </section>
      <Link href={`/radio/${t.id}`} className="flex items-center gap-2 rounded-lg bg-surface-raised p-4 text-sm hover:bg-surface-hover"><Radio size={16} className="text-accent" /> Abrir su radio: canciones parecidas, aparte de tus listas</Link>
      <section aria-label="Sobre el artista" className="rounded-lg bg-surface-raised p-4">
        <h3 className="mb-1 font-bold">{artist.name}</h3><p className="text-sm text-text-muted">{artist.bio}</p>
      </section>
      <p className="text-xs text-text-subtle">Duración {duration(t.durationMs)} · {album.title} ({album.year})</p>
    </div>
  );
}

export function RightPanel() {
  const { panel, setPanel } = useUi();
  if (panel === 'none') return null;
  return (
    <aside aria-label={panel === 'queue' ? 'Cola' : 'Sonando ahora'} className="scroll-thin hidden h-full w-panel shrink-0 overflow-y-auto rounded-lg bg-surface lg:block">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-4 py-3">
        <h2 className="font-bold">{panel === 'queue' ? 'Cola' : 'Sonando ahora'}</h2>
        <button type="button" onClick={() => setPanel('none')} aria-label="Cerrar panel" className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text"><X size={18} /></button>
      </div>
      {panel === 'queue' ? <QueueView /> : <NowPlaying />}
    </aside>
  );
}
