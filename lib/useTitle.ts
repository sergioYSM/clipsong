'use client';
import { useEffect } from 'react';
import { usePlayer } from '@/store/player';

/** Each screen names itself in the tab and for screen readers (BUG-007).
 *  While music plays, the audio engine shows the song instead. */
export function useTitle(name: string | undefined) {
  const playing = usePlayer((s) => s.isPlaying);
  useEffect(() => {
    if (!name || playing) return;
    let el = document.querySelector('title');
    if (!el) { el = document.createElement('title'); document.head.appendChild(el); }
    el.textContent = `${name} · Clipsong`;
  }, [name, playing]);
}
