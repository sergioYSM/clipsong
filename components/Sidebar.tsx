'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Library, Plus, Search, Heart, Pin, Volume2, ArrowUpDown, X } from 'lucide-react';
import { useLibrary } from '@/store/library';
import { usePlayer } from '@/store/player';
import { useUi } from '@/store/ui';
import { getAlbum, getArtist } from '@/lib/data';
import { Cover } from './Cover';
import { plural } from '@/lib/format';
import { Menu, useMenu } from './Menu';

type Filter = 'all' | 'playlist' | 'album' | 'artist';
type Sort = 'recent' | 'added' | 'az';
interface Item { key: string; kind: 'liked' | 'playlist' | 'album' | 'artist'; id: string; href: string; title: string; sub: string; hue: number; at: number }

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const lib = useLibrary();
  const ctx = usePlayer((s) => s.context);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const { toggleSidebar, showToast } = useUi();
  const pathname = usePathname();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const sortMenu = useMenu();

  const items = useMemo<Item[]>(() => {
    const lastPlayed = (type: string, id: string) => lib.recent.find((r) => r.type === type && r.id === id)?.at ?? 0;
    const list: Item[] = [
      { key: 'liked', kind: 'liked', id: 'liked', href: '/collection/tracks', title: 'Me gustan', sub: `Lista · ${plural(Object.keys(lib.liked).length, 'canción', 'canciones')}`, hue: 255, at: Math.max(lastPlayed('liked', 'liked'), Date.now()) },
      ...lib.playlists.map((p) => ({ key: p.id, kind: 'playlist' as const, id: p.id, href: `/playlist/${p.id}`, title: p.name, sub: `Lista · ${lib.userName ?? 'Tú'}`, hue: (p.name.length * 37) % 360, at: Math.max(lastPlayed('playlist', p.id), p.createdAt) })),
      ...Object.entries(lib.savedAlbums).map(([id, at]) => { const a = getAlbum(id)!; return { key: id, kind: 'album' as const, id, href: `/album/${id}`, title: a.title, sub: `Álbum · ${getArtist(a.artistId)?.name}`, hue: a.hue, at: Math.max(lastPlayed('album', id), at) }; }),
      ...Object.entries(lib.follows).map(([id, at]) => { const a = getArtist(id)!; return { key: id, kind: 'artist' as const, id, href: `/artist/${id}`, title: a.name, sub: 'Artista', hue: a.hue, at: Math.max(lastPlayed('artist', id), at) }; }),
    ];
    const f = list.filter((i) => (filter === 'all' || i.kind === filter || (filter === 'playlist' && i.kind === 'liked')) && i.title.toLowerCase().includes(q.toLowerCase()));
    const pinned = (i: Item) => lib.pinned.includes(i.id);
    return f.sort((a, b) => Number(pinned(b)) - Number(pinned(a)) || (sort === 'az' ? a.title.localeCompare(b.title, 'es') : b.at - a.at));
  }, [lib.liked, lib.playlists, lib.savedAlbums, lib.follows, lib.recent, lib.pinned, lib.userName, filter, sort, q]);

  const create = () => { const p = lib.createPlaylist(); router.push(`/playlist/${p.id}`); showToast(`Creada «${p.name}»`); };

  if (collapsed) return (
    <nav aria-label="Tu biblioteca" className="flex h-full flex-col items-center gap-2 overflow-y-auto rounded-lg bg-surface py-3">
      <button type="button" onClick={toggleSidebar} aria-label="Expandir biblioteca" className="p-2 text-text-muted hover:text-text"><Library size={24} /></button>
      <button type="button" onClick={create} aria-label="Crear lista" className="p-2 text-text-muted hover:text-text"><Plus size={20} /></button>
      {items.map((i) => <Link key={i.key} href={i.href} aria-label={i.title} title={i.title} className="rounded-md p-1 hover:bg-surface-hover"><Cover hue={i.hue} label={i.title} size={48} round={i.kind === 'artist'} /></Link>)}
    </nav>
  );

  return (
    <nav aria-label="Tu biblioteca" className="flex h-full min-h-0 flex-col rounded-lg bg-surface">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <button type="button" onClick={toggleSidebar} aria-label="Contraer biblioteca" className="flex items-center gap-3 font-bold text-text-muted hover:text-text"><Library size={24} /> Tu biblioteca</button>
        <button type="button" onClick={create} aria-label="Crear lista" title="Crear lista" className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text"><Plus size={18} /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2" role="group" aria-label="Filtrar biblioteca">
        {([['playlist', 'Listas'], ['album', 'Álbumes'], ['artist', 'Artistas']] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(filter === k ? 'all' : k)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${filter === k ? 'bg-text text-bg' : 'bg-surface-raised text-text hover:bg-surface-hover'}`}>{l}</button>
        ))}
      </div>
      <div className="flex items-center justify-between px-2">
        {searching ? (
          <label className="flex flex-1 items-center gap-2 rounded-sm bg-surface-raised px-2 py-1">
            <Search size={16} className="text-text-muted" aria-hidden />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en tu biblioteca" aria-label="Buscar en tu biblioteca" className="w-full bg-transparent text-sm placeholder:text-text-subtle focus:outline-none" />
            <button type="button" onClick={() => { setQ(''); setSearching(false); }} aria-label="Cerrar búsqueda"><X size={14} /></button>
          </label>
        ) : <button type="button" onClick={() => setSearching(true)} aria-label="Buscar en tu biblioteca" className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text"><Search size={16} /></button>}
        <button type="button" onClick={sortMenu.openAt} aria-haspopup="menu" className="ml-2 flex items-center gap-1 px-2 text-sm text-text-muted hover:text-text">
          {sort === 'recent' ? 'Recientes' : sort === 'added' ? 'Añadido' : 'A-Z'} <ArrowUpDown size={14} />
        </button>
        {sortMenu.menu && <Menu label="Ordenar" x={sortMenu.menu.x} y={sortMenu.menu.y} onClose={sortMenu.close}
          items={[{ label: 'Recientes', onSelect: () => setSort('recent') }, { label: 'Añadido recientemente', onSelect: () => setSort('added') }, { label: 'Alfabético', onSelect: () => setSort('az') }]} />}
      </div>
      <ul className="scroll-thin mt-1 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {items.map((i) => {
          const playing = ctx && ctx.id === i.id && isPlaying;
          const active = pathname === i.href;
          return (
            <li key={i.key}>
              <Link href={i.href} className={`group flex items-center gap-3 rounded-md p-2 hover:bg-surface-hover ${active ? 'bg-surface-hover' : ''}`}>
                {i.kind === 'liked' ? <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-accent text-accent-on"><Heart size={20} fill="currentColor" /></div>
                  : <Cover hue={i.hue} label={i.title} size={48} round={i.kind === 'artist'} />}
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-base ${playing ? 'text-accent' : ''}`}>{i.title}</div>
                  <div className="flex items-center gap-1 truncate text-sm text-text-muted">{lib.pinned.includes(i.id) && <Pin size={12} className="text-accent" aria-label="Fijada" />}{i.sub}</div>
                </div>
                {playing && <Volume2 size={16} className="text-accent" aria-label="Sonando" />}
              </Link>
            </li>
          );
        })}
        {lib.hydrated && items.length === 1 && filter === 'all' && !q && (
          <li className="m-2 rounded-md bg-surface-raised p-4">
            <p className="mb-1 font-bold">Crea tu primera lista</p>
            <p className="mb-4 text-sm text-text-muted">Junta las canciones para tu próximo vídeo.</p>
            <button type="button" onClick={create} className="rounded-full bg-text px-4 py-1.5 text-sm font-bold text-bg hover:scale-105">Crear lista</button>
          </li>
        )}
        {items.length === 0 && <li className="p-4 text-sm text-text-muted">Nada con «{q}».</li>}
      </ul>
    </nav>
  );
}
