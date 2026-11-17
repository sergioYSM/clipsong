'use client';
import { useRef, useState } from 'react';

/** Horizontal slider: pointer drag + arrow keys. Value 0..max. */
export function Slider({ value, max, onChange, onCommit, label, valueText, step, disabled, className = '' }: {
  value: number; max: number; onChange?: (v: number) => void; onCommit: (v: number) => void;
  label: string; valueText: string; step: number; disabled?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const v = drag ?? value;
  const pct = max > 0 ? Math.min(100, (v / max) * 100) : 0;
  const at = (x: number) => { const r = ref.current!.getBoundingClientRect(); return Math.max(0, Math.min(max, ((x - r.left) / r.width) * max)); };
  return (
    <div ref={ref} role="slider" tabIndex={disabled ? -1 : 0} aria-label={label} aria-valuemin={0} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(v)} aria-valuetext={valueText} aria-disabled={disabled}
      className={`group relative flex h-4 cursor-pointer items-center ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); const n = at(e.clientX); setDrag(n); onChange?.(n); }}
      onPointerMove={(e) => { if (drag !== null) { const n = at(e.clientX); setDrag(n); onChange?.(n); } }}
      onPointerUp={(e) => { if (drag !== null) { onCommit(at(e.clientX)); setDrag(null); } }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onCommit(Math.min(max, value + step)); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onCommit(Math.max(0, value - step)); }
        if (e.key === 'Home') onCommit(0);
      }}>
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-text-subtle/40">
        <div className={`absolute inset-y-0 left-0 rounded-full ${drag !== null ? 'bg-accent' : 'bg-text group-hover:bg-accent'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`absolute h-3 w-3 -translate-x-1/2 rounded-full bg-text shadow-pop ${drag !== null ? 'block' : 'hidden group-hover:block group-focus-visible:block'}`} style={{ left: `${pct}%` }} />
    </div>
  );
}
