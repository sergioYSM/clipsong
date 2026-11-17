// Generated cover art: a gradient from the item's hue (stand-in until real
// artwork is uploaded). The hue is data, like a colour sampled from artwork.
export function Cover({ hue, label, size = 48, round = false, className = '' }: { hue: number; label: string; size?: number | 'fill'; round?: boolean; className?: string }) {
  const style: React.CSSProperties = {
    background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 55% 22%))`,
    ...(size === 'fill' ? {} : { width: size, height: size }),
  };
  const fs = size === 'fill' ? 48 : Math.max(12, Math.round(size / 2.6));
  return (
    <div aria-hidden className={`relative flex shrink-0 select-none items-center justify-center overflow-hidden font-bold text-text shadow-card ${round ? 'rounded-full' : 'rounded-sm'} ${size === 'fill' ? 'aspect-square w-full' : ''} ${className}`} style={style}>
      <span style={{ fontSize: fs, opacity: 0.85 }}>{label.trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}
