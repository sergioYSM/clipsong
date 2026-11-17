'use client';
import Link from 'next/link';
import { Cover } from './Cover';
import { PlayButton } from './PlayButton';
import { usePlayer } from '@/store/player';
import { useLibrary } from '@/store/library';
import type { PlayContext } from '@/lib/types';

export function Card({ href, title, subtitle, hue, round, context, trackIds }: {
  href: string; title: string; subtitle: string; hue: number; round?: boolean; context?: PlayContext; trackIds?: string[];
}) {
  const ctx = usePlayer((s) => s.context);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playContext = usePlayer((s) => s.playContext);
  const toggle = usePlayer((s) => s.toggle);
  const pushRecent = useLibrary((s) => s.pushRecent);
  const active = !!context && ctx?.type === context.type && ctx?.id === context.id;
  const canPlay = !!context && !!trackIds?.length;
  return (
    <Link href={href} className="group relative block rounded-md p-3 transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover">
      <div className="relative mb-3">
        <Cover hue={hue} label={title} size="fill" round={round} />
        {canPlay && (
          <PlayButton size="card" label={title} playing={active && isPlaying}
            onClick={() => { if (active) toggle(); else { playContext(trackIds!, 0, context!); pushRecent(context!); } }}
            className={`absolute bottom-2 right-2 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 ${active && isPlaying ? 'translate-y-0 opacity-100' : ''}`} />
        )}
      </div>
      <div className="truncate text-base font-bold" title={title}>{title}</div>
      <div className="line-clamp-2 text-sm text-text-muted">{subtitle}</div>
    </Link>
  );
}

export function Shelf({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8" aria-label={title}>
      <div className="mb-2 flex items-end justify-between px-3">
        <h2 className="text-xl font-bold">{href ? <Link href={href} className="hover:underline">{title}</Link> : title}</h2>
        {href && <Link href={href} className="text-sm font-bold text-text-muted hover:underline">Ver todo</Link>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{children}</div>
    </section>
  );
}

export function CardSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="p-3"><div className="skeleton mb-3 aspect-square w-full rounded-md" /><div className="skeleton mb-2 h-4 w-3/4 rounded-sm" /><div className="skeleton h-3 w-1/2 rounded-sm" /></div>
      ))}
    </div>
  );
}
