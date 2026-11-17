'use client';
import { Shuffle, Heart, MoreHorizontal } from 'lucide-react';
import { PlayButton } from './PlayButton';
import { usePlayer } from '@/store/player';
import { useLibrary } from '@/store/library';
import type { PlayContext } from '@/lib/types';
import { Menu, useMenu, type MenuItem } from './Menu';

export function ContextActions({ context, trackIds, saved, onSave, saveLabel, menuItems }: {
  context: PlayContext; trackIds: string[]; saved?: boolean; onSave?: () => void; saveLabel?: [string, string]; menuItems?: MenuItem[];
}) {
  const ctx = usePlayer((s) => s.context);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const shuffle = usePlayer((s) => s.q.shuffle);
  const { playContext, toggle, setShuffle } = usePlayer();
  const pushRecent = useLibrary((s) => s.pushRecent);
  const { menu, openAt, close } = useMenu();
  const active = ctx?.type === context.type && ctx?.id === context.id;
  return (
    <>
      <PlayButton label={context.name} playing={active && isPlaying} onClick={() => {
        if (!trackIds.length) return;
        if (active) toggle(); else { playContext(trackIds, 0, context); pushRecent(context); }
      }} className={trackIds.length ? '' : 'pointer-events-none opacity-40'} />
      <button type="button" aria-pressed={shuffle} aria-label={shuffle ? 'Desactivar aleatorio' : 'Activar aleatorio'} onClick={() => setShuffle(!shuffle)}
        className={`relative ${shuffle ? 'text-accent' : 'text-text-muted hover:text-text'}`}>
        <Shuffle size={28} />{shuffle && <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />}
      </button>
      {onSave && saveLabel && (
        <button type="button" aria-pressed={saved} onClick={onSave} aria-label={saved ? saveLabel[1] : saveLabel[0]}
          className={saved ? 'text-accent' : 'text-text-muted hover:text-text'}><Heart size={30} fill={saved ? 'currentColor' : 'none'} /></button>
      )}
      {menuItems && <button type="button" onClick={openAt} aria-haspopup="menu" aria-label={`Más opciones para ${context.name}`} className="text-text-muted hover:text-text"><MoreHorizontal size={30} /></button>}
      {menu && menuItems && <Menu label={`Opciones de ${context.name}`} x={menu.x} y={menu.y} onClose={close} items={menuItems} />}
    </>
  );
}
