'use client';
import { BadgeCheck } from 'lucide-react';
import { useLibrary } from '@/store/library';
export function MonetizeChip() {
  const on = useLibrary((s) => s.monetizableOnly);
  const set = useLibrary((s) => s.setMonetizableOnly);
  return (
    <button type="button" aria-pressed={on} onClick={() => set(!on)}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${on ? 'bg-success text-bg' : 'bg-surface-raised text-text hover:bg-surface-hover'}`}>
      <BadgeCheck size={16} aria-hidden /> Apta para monetizar
    </button>
  );
}
