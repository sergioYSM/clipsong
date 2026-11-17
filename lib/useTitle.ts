'use client';
import { useEffect } from 'react';
import { usePlayer } from '@/store/player';

/** Each client-rendered screen names itself in the tab and for screen readers
 *  (BUG-007). Next streams the default metadata <title> after hydration, so the
 *  name is re-applied if it gets overwritten. While music plays, the audio
 *  engine shows the song instead. Album and artist pages get their title from
 *  server metadata and do not use this. */
export function useTitle(name: string | undefined) {
  const playing = usePlayer((s) => s.isPlaying);
  useEffect(() => {
    if (!name || playing) return;
    const want = `${name} · Clipsong`;
    const apply = () => { if (document.title !== want) document.title = want; };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [name, playing]);
}
