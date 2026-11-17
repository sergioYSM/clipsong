'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  submenu?: MenuItem[];
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

/** Accessible popover menu at a point. Arrow keys, Enter, Escape; submenus open in place. */
export function Menu({ items, x, y, onClose, label }: { items: MenuItem[]; x: number; y: number; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stack, setStack] = useState<{ title: string; items: MenuItem[] }[]>([]);
  const [pos, setPos] = useState({ left: x, top: y });
  const current = stack.length ? stack[stack.length - 1].items : items;

  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(x, innerWidth - r.width - 8)), top: Math.max(8, Math.min(y, innerHeight - r.height - 8)) });
  }, [x, y, stack]);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[role=menuitem]:not([disabled])')?.focus();
  }, [stack]);

  useEffect(() => {
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const scroll = () => onClose();
    document.addEventListener('mousedown', down);
    window.addEventListener('resize', scroll);
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('resize', scroll); };
  }, [onClose]);

  const onKey = (e: React.KeyboardEvent) => {
    const btns = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not([disabled])') ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') { e.preventDefault(); stack.length ? setStack(stack.slice(0, -1)) : onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); btns[(i + 1) % btns.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length]?.focus(); }
    else if (e.key === 'ArrowLeft' && stack.length) { e.preventDefault(); setStack(stack.slice(0, -1)); }
    else if (e.key === 'Tab') { e.preventDefault(); onClose(); }
  };

  return createPortal(
    <div ref={ref} role="menu" aria-label={label} onKeyDown={onKey} onContextMenu={(e) => e.preventDefault()}
      className="scroll-thin fixed z-50 max-h-[70vh] min-w-[220px] max-w-[320px] overflow-y-auto rounded-md bg-surface-raised p-1 shadow-pop"
      style={{ left: pos.left, top: pos.top }}>
      {stack.length > 0 && (
        <button role="menuitem" onClick={() => setStack(stack.slice(0, -1))} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-hover focus:bg-surface-hover focus:outline-none">
          <ChevronLeft size={16} /> {stack[stack.length - 1].title}
        </button>
      )}
      {current.map((it, i) => it.divider ? <div key={i} className="my-1 h-px bg-border" role="separator" /> : (
        <button key={i} role="menuitem" disabled={it.disabled}
          aria-haspopup={it.submenu ? 'menu' : undefined}
          onClick={() => { if (it.submenu) setStack([...stack, { title: it.label, items: it.submenu }]); else { it.onSelect?.(); onClose(); } }}
          onKeyDown={(e) => { if (e.key === 'ArrowRight' && it.submenu) { e.preventDefault(); setStack([...stack, { title: it.label, items: it.submenu }]); } }}
          className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-surface-hover focus:bg-surface-hover focus:outline-none disabled:opacity-40 ${it.danger ? 'text-danger' : 'text-text'}`}>
          {it.icon && <span className="text-text-muted" aria-hidden>{it.icon}</span>}
          <span className="flex-1 truncate">{it.label}</span>
          {it.submenu && <ChevronRight size={16} className="text-text-muted" aria-hidden />}
        </button>
      ))}
    </div>,
    document.body,
  );
}

export function useMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return {
    menu,
    openAt: (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      if ('clientX' in e && e.clientX) setMenu({ x: e.clientX, y: e.clientY });
      else { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.left, y: r.bottom }); }
    },
    close: () => setMenu(null),
  };
}
