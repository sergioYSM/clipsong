'use client';
import { useUi } from '@/store/ui';

export function useCopy() {
  const showToast = useUi((s) => s.showToast);
  return async (text: string, done: string) => {
    try { await navigator.clipboard.writeText(text); showToast(done); }
    catch { showToast('No se ha podido copiar. Selecciona el texto y cópialo a mano.'); }
  };
}
