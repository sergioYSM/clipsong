'use client';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Home, Search, X } from 'lucide-react';
import { useLibrary } from '@/store/library';

function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  // Sync from the URL only when the user is not typing (back/forward, links).
  useEffect(() => {
    if (pathname !== '/search') { setQ(''); return; }
    if (document.activeElement?.id !== 'global-search') setQ(params.get('q') ?? '');
  }, [pathname, params]);
  useEffect(() => {
    if (pathname !== '/search' && !q) return;
    const id = setTimeout(() => router.replace(q ? `/search?q=${encodeURIComponent(q)}` : '/search'), 250);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(q)}`); }} className="flex h-12 w-full max-w-[480px] items-center gap-2 rounded-full bg-surface-raised px-4 hover:bg-surface-hover focus-within:ring-2 focus-within:ring-text">
      <Search size={20} className="text-text-muted" aria-hidden />
      <input id="global-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => pathname !== '/search' && !q && router.push('/search')}
        placeholder="¿Qué quieres escuchar?" aria-label="Buscar canciones, artistas o álbumes" autoComplete="off"
        className="w-full bg-transparent text-base placeholder:text-text-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
      {q && <button type="button" onClick={() => setQ('')} aria-label="Borrar búsqueda" className="text-text-muted hover:text-text"><X size={18} /></button>}
    </form>
  );
}

export function TopBar() {
  const router = useRouter();
  const userName = useLibrary((s) => s.userName);
  return (
    <header className="flex h-topbar items-center gap-2 px-2">
      <div className="hidden gap-2 md:flex">
        <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-muted hover:text-text"><ChevronLeft size={20} /></button>
        <button type="button" onClick={() => router.forward()} aria-label="Adelante" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-muted hover:text-text"><ChevronRight size={20} /></button>
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        <Link href="/" aria-label="Inicio" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-muted hover:scale-105 hover:text-text md:flex"><Home size={22} /></Link>
        <Suspense fallback={<div className="h-12 w-full max-w-[480px] rounded-full bg-surface-raised" />}><SearchBox /></Suspense>
      </div>
      <Link href={userName ? '/account' : '/login'} className={userName ? 'flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-on' : 'rounded-full bg-text px-4 py-2 text-sm font-bold text-bg hover:scale-105'} aria-label={userName ? `Tu cuenta, ${userName}` : undefined}>
        {userName ? userName.charAt(0).toUpperCase() : 'Entrar'}
      </Link>
    </header>
  );
}
