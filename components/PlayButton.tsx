'use client';
import { Pause, Play } from 'lucide-react';

export function PlayButton({ playing, onClick, label, size = 'hero', className = '' }: { playing: boolean; onClick: () => void; label: string; size?: 'hero' | 'card' | 'sm'; className?: string }) {
  const dims = size === 'hero' ? 'h-14 w-14' : size === 'card' ? 'h-12 w-12' : 'h-8 w-8';
  const icon = size === 'sm' ? 16 : 24;
  return (
    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label={`${playing ? 'Pausar' : 'Reproducir'} ${label}`}
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-on shadow-pop transition-transform hover:scale-105 active:scale-95 ${dims} ${className}`}>
      {playing ? <Pause size={icon} fill="currentColor" /> : <Play size={icon} fill="currentColor" className="ml-0.5" />}
    </button>
  );
}
