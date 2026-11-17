'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, ListMusic } from 'lucide-react';
const items = [
  { href: '/', label: 'Inicio', Icon: Home },
  { href: '/search', label: 'Buscar', Icon: Search },
  { href: '/collection', label: 'Biblioteca', Icon: Library },
  { href: '/queue', label: 'Cola', Icon: ListMusic },
];
export function MobileNav() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="grid grid-cols-4 bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(({ href, label, Icon }) => {
        const on = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center gap-1 py-2 text-xs ${on ? 'text-text' : 'text-text-muted'}`}>
            <Icon size={22} aria-hidden />{label}
          </Link>
        );
      })}
    </nav>
  );
}
