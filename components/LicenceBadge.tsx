import { licences } from '@/lib/licence';
import type { LicenceCode } from '@/lib/types';
import { BadgeCheck, Ban, Lock } from 'lucide-react';

export function LicenceBadge({ code, compact = false }: { code: LicenceCode; compact?: boolean }) {
  const l = licences[code];
  const Icon = l.kind === 'ok' ? BadgeCheck : l.kind === 'nc' ? Ban : Lock;
  const tone = l.kind === 'ok' ? 'text-success border-success/50' : l.kind === 'nd' ? 'text-warning border-warning/40' : 'text-text-muted border-border';
  return (
    <span title={`${l.name}: ${l.explain}`} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-bold ${tone}`}>
      <Icon size={12} aria-hidden />
      {compact ? <span className="sr-only">{l.label}</span> : l.label}
    </span>
  );
}
