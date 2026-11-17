// Fixed-window limiter, per server instance. Enough to stop accidental loops
// and casual abuse; put a shared store (Upstash, Vercel KV) in front for real traffic.
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
  if (h.n >= max) return false;
  h.n++; return true;
}
