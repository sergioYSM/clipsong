'use client';
import { useUi } from '@/store/ui';
export function Toast() {
  const toast = useUi((s) => s.toast);
  const hide = useUi((s) => s.hideToast);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--player-h)+72px)] z-50 flex justify-center px-4 md:bottom-[calc(var(--player-h)+24px)]">
      {toast && (
        <div key={toast.id} className="pointer-events-auto flex items-center gap-4 rounded-md bg-text px-4 py-2 text-sm font-bold text-bg shadow-pop">
          <span>{toast.text}</span>
          {toast.action && <button type="button" onClick={() => { toast.action!.run(); hide(); }} className="underline">{toast.action.label}</button>}
        </div>
      )}
    </div>
  );
}
