'use client';
import { useLibrary } from '@/store/library';
export default function Settings() {
  const { monetizableOnly, setMonetizableOnly } = useLibrary();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Ajustes</h1>
      <label className="flex items-center justify-between gap-4 rounded-lg bg-surface-raised p-5">
        <span><span className="block font-bold">Mostrar solo canciones aptas para monetizar</span><span className="text-sm text-text-muted">Se aplica en todas partes hasta que lo quites.</span></span>
        <input type="checkbox" checked={monetizableOnly} onChange={(e) => setMonetizableOnly(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
      </label>
      <p className="mt-6 text-sm text-text-muted">El aleatorio solo mezcla tus canciones. Esto no es un ajuste: es siempre así.</p>
    </div>
  );
}
