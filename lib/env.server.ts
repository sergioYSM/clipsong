import 'server-only';
import { z } from 'zod';

// Server secrets, validated on first use. Never imported by client code
// ('server-only' makes the build fail if it is).
const schema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_CREADOR_MONTHLY: z.string().startsWith('price_'),
  STRIPE_PRICE_CREADOR_YEARLY: z.string().startsWith('price_'),
  STRIPE_PRICE_ESTUDIO_MONTHLY: z.string().startsWith('price_'),
  STRIPE_PRICE_ESTUDIO_YEARLY: z.string().startsWith('price_'),
  JAMENDO_CLIENT_ID: z.string().min(4).optional(),
  CRON_SECRET: z.string().min(24),
});
export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const r = schema.safeParse(process.env);
  if (!r.success) throw new Error(`Missing or invalid server env: ${r.error.issues.map((i) => i.path.join('.')).join(', ')}`);
  return (cached = r.data);
}
