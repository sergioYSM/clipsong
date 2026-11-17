'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Q from '@/lib/queue';
import type { PlayContext } from '@/lib/types';

interface PlayerState {
  q: Q.QueueState;
  context: PlayContext | null;
  isPlaying: boolean;
  buffering: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;            // 0..1
  muted: boolean;
  seekTo: number | null;     // request for the audio engine
  playContext: (ids: string[], start: number, ctx: PlayContext, shuffle?: boolean) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (ms: number) => void;
  setShuffle: (on: boolean) => void;
  cycleRepeat: () => void;
  addToQueue: (id: string) => void;
  removeFromQueue: (i: number) => void;
  moveInQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  _tick: (pos: number, dur: number) => void;
  _setBuffering: (b: boolean) => void;
  _ended: () => void;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      q: Q.emptyQueue, context: null, isPlaying: false, buffering: false,
      positionMs: 0, durationMs: 0, volume: 0.8, muted: false, seekTo: null,
      playContext: (ids, start, ctx, shuffle) => {
        let q = get().q;
        if (shuffle !== undefined) q = { ...q, shuffle };
        q = Q.playContext(q, ids, start);
        set({ q, context: ctx, isPlaying: true, positionMs: 0, seekTo: 0 });
      },
      toggle: () => { if (get().q.current) set({ isPlaying: !get().isPlaying }); },
      play: () => { if (get().q.current) set({ isPlaying: true }); },
      pause: () => set({ isPlaying: false }),
      next: (auto = false) => {
        const q = Q.next(get().q, auto);
        if (!q.current) return set({ q, isPlaying: false, positionMs: 0, seekTo: 0 });
        set({ q, positionMs: 0, seekTo: 0, isPlaying: true });
      },
      prev: () => {
        if (get().positionMs > 3000) return set({ seekTo: 0, positionMs: 0 });
        set({ q: Q.prev(get().q), positionMs: 0, seekTo: 0 });
      },
      seek: (ms) => set({ seekTo: ms, positionMs: ms }),
      setShuffle: (on) => set({ q: Q.setShuffle(get().q, on) }),
      cycleRepeat: () => set({ q: { ...get().q, repeat: Q.cycleRepeat(get().q.repeat) } }),
      addToQueue: (id) => set({ q: Q.addToQueue(get().q, id) }),
      removeFromQueue: (i) => set({ q: Q.removeFromQueue(get().q, i) }),
      moveInQueue: (f, t) => set({ q: Q.moveInQueue(get().q, f, t) }),
      clearQueue: () => set({ q: Q.clearQueue(get().q) }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), muted: false }),
      toggleMute: () => set({ muted: !get().muted }),
      _tick: (pos, dur) => set({ positionMs: pos, durationMs: dur }),
      _setBuffering: (b) => set({ buffering: b }),
      _ended: () => {
        if (get().q.repeat === 'one') return set({ seekTo: 0, positionMs: 0, isPlaying: true });
        get().next(true);
      },
    }),
    {
      name: 'clipsong-player',
      // Restore where you were, paused (browsers block autoplay without a gesture).
      partialize: (s) => ({ q: s.q, context: s.context, volume: s.volume, muted: s.muted, positionMs: s.positionMs }),
      onRehydrateStorage: () => (s) => { if (s) setTimeout(() => usePlayer.setState({ seekTo: s.positionMs, isPlaying: false }), 0); },
    },
  ),
);
