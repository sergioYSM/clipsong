export function Hero({ kind, title, hueBg, art, meta, children }: { kind: string; title: string; hueBg: number; art: React.ReactNode; meta: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div style={{ background: `linear-gradient(180deg, hsl(${hueBg} 45% 30%) 0%, var(--color-surface) 100%)` }}>
      <div className="flex flex-col items-center gap-6 px-4 pb-6 pt-10 md:flex-row md:items-end md:px-6">
        <div className="w-48 shrink-0 md:w-56">{art}</div>
        <div className="min-w-0 self-stretch md:self-auto">
          <p className="text-sm font-bold">{kind}</p>
          <h1 className="my-2 break-words text-2xl font-extrabold md:text-display" style={{ fontSize: title.length > 24 ? 'clamp(28px,4vw,48px)' : undefined, lineHeight: 1.05 }}>{title}</h1>
          <div className="text-sm text-text-muted">{meta}</div>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-4 pb-6 md:px-6">{children}</div>}
    </div>
  );
}
