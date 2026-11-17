'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, Trash2, Link2, Pin, Search, Plus } from 'lucide-react';
import { getTracks, search as searchCatalogue, artistName } from '@/lib/data';
import { isMonetizable } from '@/lib/licence';
import { plural, totalDuration } from '@/lib/format';
import { Hero } from '@/components/Hero';
import { Cover } from '@/components/Cover';
import { TrackList } from '@/components/TrackList';
import { ContextActions } from '@/components/ContextHeaderActions';
import { LicenceBadge } from '@/components/LicenceBadge';
import { MonetizeChip } from '@/components/MonetizeChip';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { useCopy } from '@/components/useCopy';
import { CardSkeleton } from '@/components/Card';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lib = useLibrary();
  const showToast = useUi((s) => s.showToast);
  const copy = useCopy();
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState('');
  const p = lib.playlists.find((x) => x.id === id);
  if (!lib.hydrated) return <div className="p-6"><CardSkeleton n={1} /></div>;
  if (!p) return (
    <div className="flex flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold">No encontramos esta lista</h1>
      <p className="text-text-muted">Puede que la hayas borrado.</p>
    </div>
  );
  const tracks = getTracks(p.trackIds);
  const ctx = { type: 'playlist' as const, id: p.id, name: p.name, href: `/playlist/${p.id}` };
  const hue = (p.name.length * 37) % 360;
  const del = () => {
    const removed = lib.deletePlaylist(p.id);
    router.push('/');
    if (removed) showToast(`Borrada «${removed.name}»`, { label: 'Deshacer', run: () => { lib.restorePlaylist(removed); router.push(`/playlist/${removed.id}`); } });
  };
  const results = q.trim() ? searchCatalogue(q).tracks.slice(0, 8) : [];

  return (
    <div>
      <Hero kind={p.isPublic ? 'Lista pública' : 'Lista privada'} title={p.name} hueBg={hue}
        art={<button type="button" onClick={() => setEditing(true)} aria-label="Editar detalles" className="block w-full"><Cover hue={hue} label={p.name} size="fill" /></button>}
        meta={<>{p.description && <p className="mb-2">{p.description}</p>}<span className="font-bold text-text">{lib.userName ?? 'Tú'}</span> · {plural(tracks.length, 'canción', 'canciones')}{tracks.length ? `, ${totalDuration(tracks.reduce((s, t) => s + t.durationMs, 0))}` : ''}</>}>
        <ContextActions context={ctx} trackIds={tracks.filter((t) => !lib.monetizableOnly || isMonetizable(t)).map((t) => t.id)}
          menuItems={[
            { label: 'Editar detalles', icon: <Pencil size={16} />, onSelect: () => setEditing(true) },
            { label: lib.pinned.includes(p.id) ? 'Desfijar de la biblioteca' : 'Fijar en la biblioteca', icon: <Pin size={16} />, onSelect: () => lib.togglePin(p.id) },
            { label: 'Copiar enlace', icon: <Link2 size={16} />, onSelect: () => copy(location.href, 'Enlace copiado') },
            { label: '', divider: true },
            { label: 'Borrar lista', icon: <Trash2 size={16} />, danger: true, onSelect: del },
          ]} />
        <span className="ml-auto"><MonetizeChip /></span>
      </Hero>
      <TrackList tracks={tracks} context={ctx} variant="playlist" playlistId={p.id} addedAt={() => p.updatedAt}
        onReorder={(f, t) => lib.movePlaylistItem(p.id, f, t)} emptyText="Esta lista está vacía. Busca canciones abajo para añadir." />
      <section aria-label="Añadir canciones" className="mt-6 border-t border-border px-4 pt-6 md:px-6">
        <h2 className="mb-3 text-xl font-bold">Busca canciones para tu lista</h2>
        <label className="mb-3 flex max-w-md items-center gap-2 rounded-sm bg-surface-raised px-3 py-2">
          <Search size={16} className="text-text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Canción, artista o género" aria-label="Buscar canciones para añadir" className="w-full bg-transparent placeholder:text-text-subtle focus:outline-none" />
        </label>
        <ul>
          {results.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-sm p-2 hover:bg-surface-hover">
              <div className="min-w-0 flex-1"><div className="truncate">{t.title}</div><div className="truncate text-sm text-text-muted">{artistName(t)}</div></div>
              <LicenceBadge code={t.licence} />
              <button type="button" onClick={() => { const r = lib.addToPlaylist(p.id, [t.id]); showToast(r.added ? `Añadida a ${p.name}` : `Ya estaba en ${p.name}`); }}
                className="flex items-center gap-1 rounded-full border border-text-subtle px-3 py-1 text-sm font-bold hover:border-text"><Plus size={14} /> Añadir</button>
            </li>
          ))}
          {q.trim() && !results.length && <li className="p-2 text-text-muted">Nada con «{q}».</li>}
        </ul>
      </section>
      {editing && <EditDialog name={p.name} description={p.description} isPublic={p.isPublic} onClose={() => setEditing(false)}
        onSave={(v) => { lib.updatePlaylist(p.id, v); setEditing(false); showToast('Cambios guardados'); }} />}
    </div>
  );
}

function EditDialog({ name, description, isPublic, onClose, onSave }: { name: string; description: string; isPublic: boolean; onClose: () => void; onSave: (v: { name: string; description: string; isPublic: boolean }) => void }) {
  const [n, setN] = useState(name); const [d, setD] = useState(description); const [pub, setPub] = useState(isPublic);
  const err = !n.trim() ? 'La lista necesita un nombre.' : n.length > 100 ? 'Máximo 100 caracteres.' : d.length > 300 ? 'La descripción admite 300 caracteres.' : '';
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 p-4" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={(e) => { e.preventDefault(); if (!err) onSave({ name: n.trim(), description: d.trim(), isPublic: pub }); }}
        className="w-full max-w-[524px] rounded-lg bg-surface-raised p-6 shadow-pop">
        <h2 id="edit-title" className="mb-4 text-xl font-bold">Editar detalles</h2>
        <label className="mb-1 block text-sm font-bold" htmlFor="pl-name">Nombre</label>
        <input id="pl-name" autoFocus value={n} onChange={(e) => setN(e.target.value)} maxLength={120} className="mb-3 w-full rounded-sm border border-border-input bg-surface-hover px-3 py-2 focus:border-text focus:outline-none" />
        <label className="mb-1 block text-sm font-bold" htmlFor="pl-desc">Descripción <span className="font-normal text-text-muted">(opcional)</span></label>
        <textarea id="pl-desc" value={d} onChange={(e) => setD(e.target.value)} rows={3} className="mb-3 w-full resize-none rounded-sm border border-border-input bg-surface-hover px-3 py-2 focus:border-text focus:outline-none" />
        <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" /> Lista pública (cualquiera con el enlace puede verla)</label>
        {err && <p className="mb-3 text-sm text-danger" role="alert">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2 font-bold text-text-muted hover:text-text">Cancelar</button>
          <button type="submit" disabled={!!err} className="rounded-full bg-text px-6 py-2 font-bold text-bg hover:scale-105 disabled:opacity-50">Guardar</button>
        </div>
      </form>
    </div>
  );
}
