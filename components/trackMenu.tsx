'use client';
import { useRouter } from 'next/navigation';
import { ListPlus, Heart, Plus, User, Disc3, Link2, Quote, Trash2, Radio, Scale } from 'lucide-react';
import type { MenuItem } from './Menu';
import type { Track } from '@/lib/types';
import { artistName } from '@/lib/data';
import { creditText, licences } from '@/lib/licence';
import { useLibrary } from '@/store/library';
import { usePlayer } from '@/store/player';
import { useUi } from '@/store/ui';
import { useCopy } from './useCopy';

export function useTrackMenu() {
  const router = useRouter();
  const lib = useLibrary();
  const addToQueue = usePlayer((s) => s.addToQueue);
  const showToast = useUi((s) => s.showToast);
  const copy = useCopy();

  return (t: Track, opts: { playlistId?: string; index?: number } = {}): MenuItem[] => {
    const liked = !!lib.liked[t.id];
    const ownPlaylists = lib.playlists;
    const addTo = (pid: string, name: string) => {
      const r = lib.addToPlaylist(pid, [t.id]);
      showToast(r.added ? `Añadida a ${name}` : `Ya estaba en ${name}`);
    };
    const items: MenuItem[] = [
      { label: 'Añadir a una lista', icon: <Plus size={16} />, submenu: [
        { label: 'Nueva lista', icon: <Plus size={16} />, onSelect: () => { const p = lib.createPlaylist(undefined, [t.id]); showToast(`Añadida a ${p.name}`); } },
        ...(ownPlaylists.length ? [{ label: '', divider: true }] : []),
        ...ownPlaylists.map((p) => ({ label: p.name, onSelect: () => addTo(p.id, p.name) })),
      ] },
      { label: liked ? 'Quitar de Me gustan' : 'Guardar en Me gustan', icon: <Heart size={16} />, onSelect: () => showToast(lib.toggleLike(t.id) ? 'Guardada en Me gustan' : 'Quitada de Me gustan') },
      { label: 'Añadir a la cola', icon: <ListPlus size={16} />, onSelect: () => { addToQueue(t.id); showToast('Añadida a la cola'); } },
      { label: 'Abrir su radio', icon: <Radio size={16} />, onSelect: () => router.push(`/radio/${t.id}`) },
      { label: '', divider: true },
      { label: 'Copiar crédito', icon: <Quote size={16} />, onSelect: () => copy(creditText(t, artistName(t)), 'Crédito copiado. Pégalo en la descripción de tu vídeo.') },
      { label: `Ver licencia (${licences[t.licence].name})`, icon: <Scale size={16} />, onSelect: () => window.open(licences[t.licence].url, '_blank', 'noopener') },
      { label: 'Copiar enlace', icon: <Link2 size={16} />, onSelect: () => copy(`${location.origin}/album/${t.albumId}?t=${t.id}`, 'Enlace copiado') },
      { label: '', divider: true },
      { label: 'Ir al artista', icon: <User size={16} />, onSelect: () => router.push(`/artist/${t.artistId}`) },
      { label: 'Ir al álbum', icon: <Disc3 size={16} />, onSelect: () => router.push(`/album/${t.albumId}`) },
    ];
    if (opts.playlistId !== undefined && opts.index !== undefined) {
      const pid = opts.playlistId, idx = opts.index;
      items.push({ label: '', divider: true }, { label: 'Quitar de esta lista', icon: <Trash2 size={16} />, danger: true, onSelect: () => { lib.removeFromPlaylist(pid, idx); showToast('Quitada de la lista'); } });
    }
    return items;
  };
}
